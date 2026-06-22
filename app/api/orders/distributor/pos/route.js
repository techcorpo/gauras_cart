import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
export async function GET(req) {
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    const r = await query(`SELECT o.id,o.order_number,o.status,o.payment_status,o.season,o.total_amount,o.created_at,
      m.name AS manufacturer_name FROM orders o JOIN organizations m ON m.id=o.seller_id
      WHERE o.buyer_org_id=$1 ORDER BY o.created_at DESC`, [orgId]);
    return NextResponse.json({ pos: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
