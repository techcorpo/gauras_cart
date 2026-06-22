import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { getAuthUser } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
const PAY = ['pending','paid','partial','failed'];
export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { payment_status } = await req.json();
    if (!PAY.includes(payment_status)) return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    const orgId = await getOrgId(user.id);
    const ord = await query('SELECT id,seller_id FROM orders WHERE id=$1', [params.id]);
    if (ord.rowCount===0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (ord.rows[0].seller_id !== orgId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    await query('UPDATE orders SET payment_status=$1,updated_at=now() WHERE id=$2', [payment_status, params.id]);
    return NextResponse.json({ message: 'Payment updated', payment_status });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
