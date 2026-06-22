import { NextResponse } from 'next/server';
import { getClient } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { exclusivityWhereSQL } from '../../../../lib/exclusivity';

// Place a farmer order with a single seller (a distributor OR, for direct buying,
// a manufacturer). `source` = 'distributor' | 'manufacturer'.
// Minimums:
//   - distributor sale: each line qty >= distributor_pricing.min_qty (0 = no limit)
//   - manufacturer direct: summed order qty >= product.min_order_qty is checked per
//     product line (manufacturer min is on the product; for a single farmer the
//     line qty is the order qty for that product).
export async function POST(req) {
  const client = await getClient();
  try {
    const u = requireRole(req, 'farmer');
    const body = await req.json();
    const seller_id = body.seller_id || body.distributor_id; // back-compat
    const source = body.source || 'distributor';
    const { season, items } = body;
    if (!seller_id || !Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: 'seller_id and items are required' }, { status: 400 });

    if (source === 'manufacturer') {
      const me = await client.query(`SELECT allow_merchant_buying FROM users WHERE id=$1`, [u.id]);
      if (me.rows[0]?.allow_merchant_buying !== true)
        return NextResponse.json({ error: 'Direct manufacturer buying is not enabled for your account' }, { status: 403 });
    }

    const ub = await client.query('SELECT block_id FROM users WHERE id=$1', [u.id]);
    const blockId = ub.rows[0] && ub.rows[0].block_id;
    await client.query('BEGIN');
    const ord = await client.query(
      `INSERT INTO orders (buyer_user_id,seller_id,placed_by,block_id,season,status,total_amount)
       VALUES ($1,$2,$1,$3,$4,'placed',0) RETURNING id,order_number`,
      [u.id, seller_id, blockId, season || null]);
    const orderId = ord.rows[0].id; let total = 0;

    for (const it of items) {
      if (!it.product_id || !(Number(it.quantity) > 0)) continue;
      let row;
      if (source === 'manufacturer') {
        row = await client.query(
          `SELECT p.base_price AS price, p.min_order_qty, p.name
             FROM products p
            WHERE p.id=$1 AND p.is_active=true AND p.manufacturer_id=$2`,
          [it.product_id, seller_id]);
        if (row.rowCount === 0) throw new Error('Invalid or unavailable product for this seller');
        const minq = Number(row.rows[0].min_order_qty || 0);
        if (minq > 0 && Number(it.quantity) < minq)
          throw new Error(`Minimum order quantity is ${minq} for ${row.rows[0].name}`);
      } else {
        row = await client.query(
          `SELECT COALESCE(dp.price, p.base_price) AS price, COALESCE(dp.min_qty,0) AS min_qty, p.name
             FROM products p
             JOIN distributor_manufacturer dm ON dm.manufacturer_id = p.manufacturer_id
             JOIN organizations dist ON dist.id = dm.distributor_id
             JOIN organizations m ON m.id = p.manufacturer_id
             LEFT JOIN distributor_pricing dp ON dp.product_id = p.id AND dp.distributor_id = dm.distributor_id
            WHERE p.id=$1 AND p.is_active=true AND dm.distributor_id=$2
              AND ${exclusivityWhereSQL('dist', 'm')}`,
          [it.product_id, seller_id]);
        if (row.rowCount === 0) throw new Error('Invalid or unavailable product for this seller');
        const minq = Number(row.rows[0].min_qty || 0);
        if (minq > 0 && Number(it.quantity) < minq)
          throw new Error(`Minimum quantity is ${minq} for ${row.rows[0].name}`);
      }
      const price = Number(row.rows[0].price);
      await client.query(
        `INSERT INTO order_items (order_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4)`,
        [orderId, it.product_id, Number(it.quantity), price]);
      total += price * Number(it.quantity);
    }
    await client.query('UPDATE orders SET total_amount=$1 WHERE id=$2', [total, orderId]);
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Order placed', order_id: orderId, order_number: ord.rows[0].order_number, total }, { status: 201 });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||e.message||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
