import { NextResponse } from 'next/server';
import { getClient } from '../../../../../../lib/db';
import { getAuthUser } from '../../../../../../lib/auth';
import { getOrgId } from '../../../../../../lib/orgs';

export async function PUT(req, { params }) {
  const client = await getClient();
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { quantity } = await req.json();
    const qty = Number(quantity);
    if (!qty || qty <= 0) return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    const orgId = await getOrgId(user.id);

    const ord = await client.query('SELECT id,seller_id,buyer_user_id,buyer_org_id FROM orders WHERE id=$1', [params.id]);
    if (ord.rowCount === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (ord.rows[0].seller_id !== orgId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const item = await client.query('SELECT id,product_id,quantity,unit_price FROM order_items WHERE id=$1 AND order_id=$2', [params.itemId, params.id]);
    if (item.rowCount === 0) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const seller = await client.query('SELECT type FROM organizations WHERE id=$1', [orgId]);
    const sellerType = seller.rows[0]?.type;
    const productId = item.rows[0].product_id;

    if (sellerType === 'distributor') {
      const dp = await client.query('SELECT min_qty FROM distributor_pricing WHERE distributor_id=$1 AND product_id=$2', [orgId, productId]);
      const minQty = dp.rowCount > 0 ? Number(dp.rows[0].min_qty) || 0 : 0;
      if (minQty > 0 && qty < minQty) return NextResponse.json({ error: `Minimum quantity is ${minQty}` }, { status: 400 });
    } else {
      const p = await client.query('SELECT min_order_qty FROM products WHERE id=$1', [productId]);
      const minQty = p.rowCount > 0 ? Number(p.rows[0].min_order_qty) || 0 : 0;
      if (minQty > 0) {
        const sumRes = await client.query('SELECT COALESCE(SUM(quantity),0)::numeric AS total FROM order_items WHERE order_id=$1 AND product_id=$2 AND id<>$3', [params.id, productId, params.itemId]);
        const total = Number(sumRes.rows[0].total) + qty;
        if (total < minQty) return NextResponse.json({ error: `Minimum order quantity for this product is ${minQty}` }, { status: 400 });
      }
    }

    await client.query('BEGIN');
    const lineTotal = qty * Number(item.rows[0].unit_price);
    await client.query('UPDATE order_items SET quantity=$1, line_total=$2, updated_at=now() WHERE id=$3', [qty, lineTotal, params.itemId]);
    await client.query('UPDATE orders SET total_amount=(SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id=$1), updated_at=now() WHERE id=$1', [params.id]);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: e.error || e.message || 'Failed' }, { status: e.status || 500 });
  } finally { client.release(); }
}
