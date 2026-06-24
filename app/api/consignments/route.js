import { NextResponse } from 'next/server';
import { getClient } from '../../../lib/db';
import { getAuthUser } from '../../../lib/auth';
import { getOrgId } from '../../../lib/orgs';

function generateConsignmentNo() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BILTY-${ymd}-${rand}`;
}

// POST: manufacturer creates a consignment and ships selected orders.
export async function POST(req) {
  const client = await getClient();
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const orgId = await getOrgId(user.id);
    const org = await client.query('SELECT type FROM organizations WHERE id=$1', [orgId]);
    if (org.rowCount === 0 || org.rows[0].type !== 'manufacturer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { order_ids, driver_name, vehicle_no, notes } = await req.json();
    if (!Array.isArray(order_ids) || order_ids.length === 0) return NextResponse.json({ error: 'No orders selected' }, { status: 400 });

    const orders = await client.query('SELECT id,status FROM orders WHERE id = ANY($1) AND seller_id=$2 AND status=$3', [order_ids, orgId, 'confirmed']);
    if (orders.rowCount !== order_ids.length) return NextResponse.json({ error: 'Invalid or non-confirmed orders selected' }, { status: 400 });

    await client.query('BEGIN');
    const consignmentNo = generateConsignmentNo();
    const c = await client.query(
      'INSERT INTO consignments (consignment_no, manufacturer_id, driver_name, vehicle_no, notes, shipped_on) VALUES ($1,$2,$3,$4,$5,CURRENT_DATE) RETURNING id, consignment_no',
      [consignmentNo, orgId, driver_name || null, vehicle_no || null, notes || null]
    );
    const consignmentId = c.rows[0].id;
    for (const id of order_ids) {
      await client.query('INSERT INTO consignment_orders (consignment_id, order_id) VALUES ($1,$2)', [consignmentId, id]);
      await client.query("UPDATE orders SET status='shipped', consignment_id=$1, updated_at=now() WHERE id=$2", [consignmentId, id]);
    }
    await client.query('COMMIT');
    return NextResponse.json({ consignment: c.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: e.error || e.message || 'Failed' }, { status: e.status || 500 });
  } finally { client.release(); }
}

// GET: list consignments for the current manufacturer or distributor.
export async function GET(req) {
  const client = await getClient();
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const orgId = await getOrgId(user.id);
    const org = await client.query('SELECT type FROM organizations WHERE id=$1', [orgId]);
    if (org.rowCount === 0) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

    let sql;
    if (org.rows[0].type === 'manufacturer') {
      sql = `SELECT c.id, c.consignment_no, c.driver_name, c.vehicle_no, c.notes, c.shipped_on,
                (SELECT COUNT(*)::int FROM consignment_orders co WHERE co.consignment_id=c.id) AS order_count
             FROM consignments c WHERE c.manufacturer_id=$1 ORDER BY c.shipped_on DESC, c.created_at DESC`;
    } else {
      sql = `SELECT DISTINCT c.id, c.consignment_no, c.driver_name, c.vehicle_no, c.notes, c.shipped_on,
                (SELECT COUNT(*)::int FROM consignment_orders co2 WHERE co2.consignment_id=c.id) AS order_count
             FROM consignments c
             JOIN consignment_orders co ON co.consignment_id=c.id
             JOIN orders o ON o.id=co.order_id
             WHERE o.buyer_org_id=$1
             ORDER BY c.shipped_on DESC, c.created_at DESC`;
    }
    const r = await client.query(sql, [orgId]);
    return NextResponse.json({ consignments: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error || e.message || 'Failed' }, { status: e.status || 500 }); }
  finally { client.release(); }
}
