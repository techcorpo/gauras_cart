import { NextResponse } from 'next/server';
import { getClient } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { exclusivityWhereSQL } from '../../../../lib/exclusivity';
export async function POST(req) {
  const client = await getClient();
  try {
    const u = requireRole(req, 'farmer');
    const { distributor_id, season, items } = await req.json();
    if (!distributor_id || !Array.isArray(items) || items.length===0)
      return NextResponse.json({ error: 'distributor_id and items are required' }, { status: 400 });
    const ub = await client.query('SELECT block_id FROM users WHERE id=$1', [u.id]);
    const blockId = ub.rows[0] && ub.rows[0].block_id;
    await client.query('BEGIN');
    const ord = await client.query(`INSERT INTO orders (buyer_user_id,seller_id,placed_by,block_id,season,status,total_amount)
      VALUES ($1,$2,$1,$3,$4,'placed',0) RETURNING id,order_number`, [u.id, distributor_id, blockId, season||null]);
    const orderId = ord.rows[0].id; let total=0;
    for (const it of items) {
      if (!it.product_id || !(Number(it.quantity)>0)) continue;
      // Validate the product is actually sold by this distributor AND allowed under
      // society-exclusivity rules (prevents ordering an excluded manufacturer's product).
      const p = await client.query(`
        SELECT p.base_price
          FROM products p
          JOIN distributor_manufacturer dm ON dm.manufacturer_id = p.manufacturer_id
          JOIN organizations dist ON dist.id = dm.distributor_id
          JOIN organizations m ON m.id = p.manufacturer_id
         WHERE p.id=$1 AND p.is_active=true
           AND dm.distributor_id=$2
           AND ${exclusivityWhereSQL('dist', 'm')}`,
        [it.product_id, distributor_id]);
      if (p.rowCount===0) throw new Error('Invalid or unavailable product for this distributor');
      const price = Number(p.rows[0].base_price);
      await client.query(`INSERT INTO order_items (order_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4)`, [orderId, it.product_id, Number(it.quantity), price]);
      total += price*Number(it.quantity);
    }
    await client.query('UPDATE orders SET total_amount=$1 WHERE id=$2', [total, orderId]);
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Order placed', order_id: orderId, order_number: ord.rows[0].order_number, total }, { status: 201 });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||e.message||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
