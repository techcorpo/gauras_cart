import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
import { exclusivityWhereSQL } from '../../../../lib/exclusivity';
export async function GET(req) {
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    const r = await query(`SELECT p.id,p.sku,p.name,p.category,p.unit,p.base_price,
      COALESCE(dp.price,p.base_price) AS your_price, o.id AS manufacturer_id, o.name AS manufacturer_name,
      p.catalog_product_id, pc.canonical_name AS catalog_name
      FROM distributor_manufacturer dm
      JOIN products p ON p.manufacturer_id=dm.manufacturer_id AND p.is_active=true
      JOIN organizations o ON o.id=dm.manufacturer_id
      JOIN organizations dist ON dist.id=dm.distributor_id
      LEFT JOIN product_catalog pc ON pc.id=p.catalog_product_id
      LEFT JOIN distributor_pricing dp ON dp.product_id=p.id AND dp.distributor_id=$1
      WHERE dm.distributor_id=$1
        AND ${exclusivityWhereSQL('dist', 'o')}
      ORDER BY o.name, p.name`, [orgId]);
    return NextResponse.json({ products: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
