import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';

// Distributor sets its own per-product price (optional) and min order qty
// (applied to each farmer's line). Upserts into distributor_pricing.
export async function PUT(req) {
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    const { product_id, price, min_qty } = await req.json();
    if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

    // Must be a product from one of this distributor's partner manufacturers.
    const ok = await query(
      `SELECT 1 FROM products p
         JOIN distributor_manufacturer dm ON dm.manufacturer_id = p.manufacturer_id
        WHERE p.id=$1 AND dm.distributor_id=$2`, [product_id, orgId]);
    if (ok.rowCount === 0) return NextResponse.json({ error: 'Product not available to you' }, { status: 403 });

    const priceVal = (price === '' || price == null) ? null : Number(price);
    const minVal = (min_qty === '' || min_qty == null) ? 0 : Number(min_qty);
    await query(
      `INSERT INTO distributor_pricing (product_id, distributor_id, price, min_qty, updated_at)
       VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (product_id, distributor_id)
       DO UPDATE SET price=EXCLUDED.price, min_qty=EXCLUDED.min_qty, updated_at=now()`,
      [product_id, orgId, priceVal, minVal]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
