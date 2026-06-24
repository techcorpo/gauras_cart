import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
import { exclusivityWhereSQL } from '../../../../../lib/exclusivity';
export async function GET(req) {
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    const r = await query(`SELECT oi.id AS order_item_id,oi.quantity,oi.unit_price,oi.line_total,oi.aggregated_into,
      o.id AS order_id,o.order_number,o.season,o.created_at,o.payment_status AS order_payment,
      u.id AS farmer_id,u.full_name AS farmer_name,b.name AS block_name,
      p.id AS product_id,p.name AS product_name,p.unit,p.manufacturer_id,mo.name AS manufacturer_name
      FROM orders o JOIN order_items oi ON oi.order_id=o.id
      JOIN users u ON u.id=o.buyer_user_id LEFT JOIN blocks b ON b.id=o.block_id
      JOIN products p ON p.id=oi.product_id JOIN organizations mo ON mo.id=p.manufacturer_id
      JOIN organizations dist ON dist.id=$1
      WHERE o.seller_id=$1 AND ${exclusivityWhereSQL('dist', 'mo')}
      ORDER BY o.created_at DESC`, [orgId]);
    return NextResponse.json({ items: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
