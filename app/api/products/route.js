import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { requireRole } from '../../../lib/auth';
import { getOrgId } from '../../../lib/orgs';
export async function POST(req) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const b = await req.json();
    if (!b.sku || !b.name || b.base_price == null) return NextResponse.json({ error: 'sku, name and base_price are required' }, { status: 400 });
    if (Number(b.base_price) < 0) return NextResponse.json({ error: 'base_price must be >= 0' }, { status: 400 });
    const r = await query(`INSERT INTO products (manufacturer_id,catalog_product_id,sku,name,category,description,unit,base_price,is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id,sku,name,category,description,unit,base_price,is_active,created_at,catalog_product_id`,
      [orgId, b.catalog_product_id||null, b.sku.trim(), b.name.trim(), b.category||null, b.description||null, (b.unit&&b.unit.trim())||'unit', Number(b.base_price), b.is_active!==false]);
    return NextResponse.json({ message: 'Product created', product: r.rows[0] }, { status: 201 });
  } catch (e) {
    if (e.code === '23505') return NextResponse.json({ error: 'A product with this SKU already exists' }, { status: 409 });
    return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 });
  }
}
