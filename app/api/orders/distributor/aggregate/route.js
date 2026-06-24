import { NextResponse } from 'next/server';
import { getClient } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
import { distributorScope } from '../../../../../lib/exclusivity';
export async function POST(req) {
  const client = await getClient();
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    const { manufacturer_id, season, notes, order_item_ids } = await req.json();
    if (!manufacturer_id || !Array.isArray(order_item_ids) || order_item_ids.length===0)
      return NextResponse.json({ error: 'manufacturer_id and order_item_ids are required' }, { status: 400 });

    const scope = await distributorScope(orgId);
    if (scope.exclusive) {
      const mfr = await client.query('SELECT society_code FROM organizations WHERE id=$1 AND type=$2', [manufacturer_id, 'manufacturer']);
      if (mfr.rowCount === 0 || mfr.rows[0].society_code !== scope.society_code) {
        return NextResponse.json({ error: 'Society exclusivity: you can only partner with manufacturers in your society' }, { status: 403 });
      }
    }

    await client.query('BEGIN');
    const sel = await client.query(`SELECT oi.id,oi.product_id,oi.quantity,oi.unit_price,o.buyer_user_id,o.id AS farmer_order_id,
      p.manufacturer_id,p.base_price,p.min_order_qty,p.name AS product_name FROM order_items oi JOIN orders o ON o.id=oi.order_id JOIN products p ON p.id=oi.product_id
      WHERE oi.id = ANY($1) AND o.seller_id=$2 AND oi.aggregated_into IS NULL`, [order_item_ids, orgId]);
    if (sel.rowCount===0) throw new Error('No valid, un-aggregated items selected');
    if (sel.rows.find(r=>r.manufacturer_id!==manufacturer_id)) throw new Error('All items must belong to the chosen manufacturer');
    const po = await client.query(`INSERT INTO orders (buyer_org_id,seller_id,placed_by,season,status,payment_status,total_amount,notes)
      VALUES ($1,$2,$3,$4,'placed','pending',0,$5) RETURNING id,order_number`, [orgId, manufacturer_id, u.id, season||null, notes||null]);
    const poId = po.rows[0].id;
    const byProduct = {};
    sel.rows.forEach(r=>{ const k=r.product_id; byProduct[k]=byProduct[k]||{product_id:k,base_price:Number(r.base_price),qty:0,rows:[]}; byProduct[k].qty+=Number(r.quantity); byProduct[k].rows.push(r); });
    let total=0;
    for (const k of Object.keys(byProduct)) {
      const g=byProduct[k];
      const minq=Number(g.rows[0].min_order_qty||0);
      if (minq>0 && g.qty<minq) throw new Error(`Manufacturer minimum is ${minq} for ${g.rows[0].product_name} (selected total ${g.qty})`);
      const li = await client.query(`INSERT INTO order_items (order_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4) RETURNING id`, [poId, g.product_id, g.qty, g.base_price]);
      const poItemId = li.rows[0].id; total += g.base_price*g.qty;
      for (const fr of g.rows) {
        await client.query(`INSERT INTO order_item_allocations (order_item_id,farmer_id,farmer_order_id,quantity,unit_price,status,payment_status)
          VALUES ($1,$2,$3,$4,$5,'placed','pending')`, [poItemId, fr.buyer_user_id, fr.farmer_order_id, Number(fr.quantity), Number(fr.unit_price)]);
        await client.query('UPDATE order_items SET aggregated_into=$1 WHERE id=$2', [poItemId, fr.id]);
      }
    }
    await client.query('UPDATE orders SET total_amount=$1 WHERE id=$2', [total, poId]);
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Purchase order created', po_id: poId, order_number: po.rows[0].order_number, total }, { status: 201 });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||e.message||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
