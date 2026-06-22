import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
export async function GET(req) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const r = await query(`SELECT p.id,p.sku,p.name,p.category,p.description,p.unit,p.base_price,p.is_active,p.created_at,
      p.catalog_product_id, pc.canonical_name AS catalog_name
      FROM products p LEFT JOIN product_catalog pc ON pc.id=p.catalog_product_id
      WHERE p.manufacturer_id=$1 ORDER BY p.created_at DESC`, [orgId]);
    return NextResponse.json({ products: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
