import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { exclusivityWhereSQL } from '../../../../../lib/exclusivity';
export async function GET(req) {
  try {
    requireRole(req, 'farmer');
    const did = new URL(req.url).searchParams.get('distributor_id');
    if (!did) return NextResponse.json({ error: 'distributor_id required' }, { status: 400 });
    const r = await query(`SELECT p.id,p.name,p.category,p.unit,p.base_price,
      o.id AS manufacturer_id,o.name AS manufacturer_name, pc.canonical_name AS catalog_name
      FROM distributor_manufacturer dm
      JOIN products p ON p.manufacturer_id=dm.manufacturer_id AND p.is_active=true
      JOIN organizations o ON o.id=dm.manufacturer_id
      JOIN organizations dist ON dist.id=dm.distributor_id
      LEFT JOIN product_catalog pc ON pc.id=p.catalog_product_id
      WHERE dm.distributor_id=$1
        AND ${exclusivityWhereSQL('dist', 'o')}
      ORDER BY o.name,p.name`, [did]);
    return NextResponse.json({ products: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
