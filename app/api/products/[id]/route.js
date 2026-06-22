import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
export async function PUT(req, { params }) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const b = await req.json();
    const r = await query(`UPDATE products SET
      sku=COALESCE($1,sku), name=COALESCE($2,name), category=$3, description=$4,
      unit=COALESCE($5,unit), base_price=COALESCE($6,base_price),
      is_active=COALESCE($7,is_active), catalog_product_id=$8,
      min_order_qty=COALESCE($9,min_order_qty)
      WHERE id=$10 AND manufacturer_id=$11
      RETURNING id,sku,name,category,description,unit,base_price,min_order_qty,is_active,created_at,catalog_product_id`,
      [b.sku||null,b.name||null,b.category||null,b.description||null,b.unit||null,
       b.base_price!=null?Number(b.base_price):null, typeof b.is_active==='boolean'?b.is_active:null,
       b.catalog_product_id||null, b.min_order_qty!=null?Number(b.min_order_qty):null, params.id, orgId]);
    if (r.rowCount===0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ message: 'Product updated', product: r.rows[0] });
  } catch (e) {
    if (e.code === '23505') return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 });
  }
}
export async function DELETE(req, { params }) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const r = await query('DELETE FROM products WHERE id=$1 AND manufacturer_id=$2 RETURNING id', [params.id, orgId]);
    if (r.rowCount===0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ message: 'Product deleted' });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
