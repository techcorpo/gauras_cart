import { NextResponse } from 'next/server';
import { getClient } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';

export async function GET(req, { params }) {
  const client = await getClient();
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const orgId = await getOrgId(user.id);
    const org = await client.query('SELECT type FROM organizations WHERE id=$1', [orgId]);
    if (org.rowCount === 0) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

    const consignment = await client.query(
      `SELECT c.*, m.name AS manufacturer_name FROM consignments c
       JOIN organizations m ON m.id=c.manufacturer_id WHERE c.id=$1`,
      [params.id]
    );
    if (consignment.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const c = consignment.rows[0];
    if (org.rows[0].type === 'manufacturer' && c.manufacturer_id !== orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let orderFilter = '';
    if (org.rows[0].type === 'distributor') orderFilter = 'AND o.buyer_org_id=$2';

    const orders = await client.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.total_amount, o.season, o.created_at,
              COALESCE(b.name, fu.full_name) AS buyer_name,
              CASE WHEN o.buyer_org_id IS NOT NULL THEN 'distributor' ELSE 'farmer' END AS buyer_kind
       FROM orders o
       JOIN consignment_orders co ON co.order_id=o.id
       LEFT JOIN organizations b ON b.id=o.buyer_org_id
       LEFT JOIN users fu ON fu.id=o.buyer_user_id
       WHERE co.consignment_id=$1 ${orderFilter}
       ORDER BY o.created_at DESC`,
      org.rows[0].type === 'distributor' ? [params.id, orgId] : [params.id]
    );

    const ids = orders.rows.map(o => o.id); let byOrder = {};
    if (ids.length) {
      const items = await client.query(
        `SELECT oi.id, oi.order_id, oi.quantity, oi.unit_price, oi.line_total, p.name AS product_name, p.unit
         FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id = ANY($1)`,
        [ids]
      );
      items.rows.forEach(r => { (byOrder[r.order_id] = byOrder[r.order_id] || []).push(r); });
    }

    return NextResponse.json({ consignment: c, orders: orders.rows.map(o => ({ ...o, items: byOrder[o.id] || [] })) });
  } catch (e) { return NextResponse.json({ error: e.error || e.message || 'Failed' }, { status: e.status || 500 }); }
  finally { client.release(); }
}
