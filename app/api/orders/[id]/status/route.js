import { NextResponse } from 'next/server';
import { getClient } from '../../../../../lib/db';
import { getAuthUser } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
const ALLOWED = ['confirmed','shipped','delivered','cancelled'];
export async function PATCH(req, { params }) {
  const client = await getClient();
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { status } = await req.json();
    if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    const orgId = await getOrgId(user.id);
    const ord = await client.query('SELECT id,seller_id,buyer_org_id FROM orders WHERE id=$1', [params.id]);
    if (ord.rowCount===0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (ord.rows[0].seller_id !== orgId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    await client.query('BEGIN');
    await client.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2', [status, params.id]);
    if (ord.rows[0].buyer_org_id) {
      await client.query(`UPDATE order_item_allocations SET status=$1 WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id=$2)`, [status, params.id]);
    }
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Status updated', status });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
