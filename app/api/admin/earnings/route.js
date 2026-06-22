import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';

// Commission earnings report.
// Params: from, to (YYYY-MM-DD, on commission receipt date), kind = both|merchant|distributor.
// Columns: name, type (M/D), order_date, order_amount, commission, receipt_date.
export async function GET(req) {
  try {
    requireRole(req, 'admin');
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const kind = url.searchParams.get('kind') || 'both';

    const cond = []; const args = [];
    if (from) { args.push(from); cond.push(`cl.created_at >= $${args.length}::date`); }
    if (to) { args.push(to); cond.push(`cl.created_at < ($${args.length}::date + INTERVAL '1 day')`); }
    if (kind === 'merchant') cond.push(`o.type='manufacturer'`);
    else if (kind === 'distributor') cond.push(`o.type='distributor'`);

    const rows = await query(
      `SELECT o.name AS name,
              CASE WHEN o.type='manufacturer' THEN 'M' ELSE 'D' END AS type,
              ord.created_at AS order_date,
              cl.base_amount AS order_amount,
              cl.amount AS commission,
              cl.created_at AS receipt_date
         FROM commission_ledger cl
         JOIN organizations o ON o.id=cl.org_id
         JOIN orders ord ON ord.id=cl.order_id
         ${cond.length ? 'WHERE '+cond.join(' AND ') : ''}
         ORDER BY cl.created_at DESC`, args);

    const total = rows.rows.reduce((s,r)=>s+Number(r.commission||0),0);
    return NextResponse.json({ rows: rows.rows, total });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
