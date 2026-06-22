import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
export async function GET(req) {
  try {
    const u = requireRole(req, 'farmer');
    const orders = await query(`SELECT o.id,o.order_number,o.status,o.payment_status,o.season,o.total_amount,o.created_at,
      s.name AS distributor_name FROM orders o JOIN organizations s ON s.id=o.seller_id
      WHERE o.buyer_user_id=$1 ORDER BY o.created_at DESC`, [u.id]);
    const ids = orders.rows.map(o=>o.id); let byOrder={};
    if (ids.length) {
      const items = await query(`SELECT oi.id AS order_item_id,oi.order_id,oi.quantity,oi.unit_price,oi.line_total,
        p.name AS product_name,p.unit, a.status AS alloc_status, a.payment_status AS alloc_payment
        FROM order_items oi JOIN products p ON p.id=oi.product_id
        LEFT JOIN order_item_allocations a ON a.order_item_id=oi.aggregated_into AND a.farmer_order_id=oi.order_id
        WHERE oi.order_id = ANY($1)`, [ids]);
      items.rows.forEach(r=>{(byOrder[r.order_id]=byOrder[r.order_id]||[]).push(r);});
    }
    return NextResponse.json({ orders: orders.rows.map(o=>({ ...o, items: byOrder[o.id]||[] })) });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
