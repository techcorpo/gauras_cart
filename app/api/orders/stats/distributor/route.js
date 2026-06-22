import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
export async function GET(req) {
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    const farmer = await query(`SELECT COUNT(*)::int AS farmer_orders,
      COUNT(*) FILTER (WHERE aggregated_into IS NULL)::int AS pending_items
      FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.seller_id=$1 AND o.buyer_user_id IS NOT NULL`, [orgId]);
    const pos = await query(`SELECT COUNT(*)::int AS pos, COUNT(*) FILTER (WHERE status='placed')::int AS pending_pos,
      COALESCE(SUM(total_amount) FILTER (WHERE payment_status<>'paid'),0) AS payable FROM orders WHERE buyer_org_id=$1`, [orgId]);
    const col = await query(`SELECT COALESCE(SUM(total_amount) FILTER (WHERE payment_status<>'paid'),0) AS receivable FROM orders WHERE seller_id=$1 AND buyer_user_id IS NOT NULL`, [orgId]);
    return NextResponse.json({ stats: { ...farmer.rows[0], ...pos.rows[0], receivable: Number(col.rows[0].receivable) } });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
