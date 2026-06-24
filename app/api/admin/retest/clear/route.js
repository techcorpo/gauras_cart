import { NextResponse } from 'next/server';
import { getClient } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';

export async function POST(req) {
  const client = await getClient();
  try {
    requireRole(req, 'admin');
    await client.query('BEGIN');
    await client.query('DELETE FROM commission_ledger');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM order_item_allocations');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM consignment_orders');
    await client.query('DELETE FROM consignments');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM refresh_tokens');
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, message: 'Transaction data cleared' });
  } catch (e) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: e.error || e.message || 'Failed' }, { status: e.status || 500 });
  } finally {
    client.release();
  }
}
