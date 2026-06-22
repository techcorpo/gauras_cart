import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
export async function GET(req) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const pos = await query(`SELECT o.id,o.order_number,o.status,o.payment_status,o.season,o.total_amount,o.created_at,
      d.name AS distributor_name FROM orders o JOIN organizations d ON d.id=o.buyer_org_id
      WHERE o.seller_id=$1 ORDER BY o.created_at DESC`, [orgId]);
    const ids = pos.rows.map(p=>p.id); let byOrder={};
    if (ids.length) {
      const items = await query(`SELECT oi.order_id,oi.quantity,oi.unit_price,oi.line_total,p.name AS product_name,p.unit
        FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id = ANY($1)`, [ids]);
      items.rows.forEach(r=>{(byOrder[r.order_id]=byOrder[r.order_id]||[]).push(r);});
    }
    return NextResponse.json({ pos: pos.rows.map(p=>({ ...p, items: byOrder[p.id]||[] })) });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
