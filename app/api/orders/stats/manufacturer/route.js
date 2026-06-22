import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
export async function GET(req) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const r = await query(`SELECT COUNT(*)::int AS distributor_orders, COUNT(*) FILTER (WHERE status='placed')::int AS pending,
      COALESCE(SUM(total_amount) FILTER (WHERE payment_status<>'paid'),0) AS receivables, COALESCE(SUM(total_amount),0) AS total_value
      FROM orders WHERE seller_id=$1 AND buyer_org_id IS NOT NULL`, [orgId]);
    const prod = await query('SELECT COUNT(*)::int AS products FROM products WHERE manufacturer_id=$1', [orgId]);
    return NextResponse.json({ stats: { ...r.rows[0], products: prod.rows[0].products } });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
