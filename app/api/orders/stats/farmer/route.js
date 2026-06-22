import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
export async function GET(req) {
  try {
    const u = requireRole(req, 'farmer');
    const r = await query(`SELECT COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled'))::int AS active_orders,
      COALESCE(SUM(total_amount),0) AS total_value,
      COALESCE(SUM(total_amount) FILTER (WHERE payment_status<>'paid'),0) AS due
      FROM orders WHERE buyer_user_id=$1`, [u.id]);
    const q = await query(`SELECT COALESCE(SUM(oi.quantity),0) AS qty FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.buyer_user_id=$1`, [u.id]);
    return NextResponse.json({ stats: { ...r.rows[0], quantity: Number(q.rows[0].qty) } });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
