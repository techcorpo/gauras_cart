import { NextResponse } from 'next/server';
import { getClient } from '../../../../../lib/db';
import { getAuthUser } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
const PAY = ['pending','paid','partial','failed'];

// When a seller marks an order 'paid', record a commission_ledger row for that
// seller org (type derived from org.type: manufacturer='M', distributor='D').
// Idempotent via UNIQUE(org_id, order_id).
export async function PATCH(req, { params }) {
  const client = await getClient();
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { payment_status } = await req.json();
    if (!PAY.includes(payment_status)) return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    const orgId = await getOrgId(user.id);
    const ord = await client.query('SELECT id,seller_id,total_amount FROM orders WHERE id=$1', [params.id]);
    if (ord.rowCount===0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (ord.rows[0].seller_id !== orgId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    await client.query('BEGIN');
    await client.query('UPDATE orders SET payment_status=$1,updated_at=now() WHERE id=$2', [payment_status, params.id]);

    if (payment_status === 'paid') {
      const term = await client.query('SELECT kind, value FROM commission_terms WHERE org_id=$1', [orgId]);
      if (term.rowCount > 0) {
        const kind = term.rows[0].kind;
        const rate = Number(term.rows[0].value) || 0;
        const base = Number(ord.rows[0].total_amount) || 0;
        const amount = kind === 'pct' ? (base * rate) / 100 : rate;
        await client.query(
          `INSERT INTO commission_ledger (org_id, order_id, base_amount, kind, rate, amount)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (org_id, order_id) DO NOTHING`,
          [orgId, params.id, base, kind, rate, amount]);
      }
    }
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Payment updated', payment_status });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
