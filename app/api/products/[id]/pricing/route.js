import { NextResponse } from 'next/server';
import { query, getClient } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { getOrgId } from '../../../../../lib/orgs';
export async function GET(req, { params }) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const p = await query('SELECT id,name,base_price FROM products WHERE id=$1 AND manufacturer_id=$2', [params.id, orgId]);
    if (p.rowCount===0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const rows = await query(`SELECT o.id AS distributor_id,o.name AS distributor_name, dp.price
      FROM distributor_manufacturer dm JOIN organizations o ON o.id=dm.distributor_id
      LEFT JOIN distributor_pricing dp ON dp.distributor_id=o.id AND dp.product_id=$1
      WHERE dm.manufacturer_id=$2 ORDER BY o.name`, [params.id, orgId]);
    return NextResponse.json({ product: p.rows[0], pricing: rows.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
export async function PUT(req, { params }) {
  const client = await getClient();
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const { prices = [] } = await req.json();
    const p = await client.query('SELECT 1 FROM products WHERE id=$1 AND manufacturer_id=$2', [params.id, orgId]);
    if (p.rowCount===0) { client.release(); return NextResponse.json({ error: 'Product not found' }, { status: 404 }); }
    await client.query('BEGIN');
    for (const row of prices) {
      if (!row.distributor_id) continue;
      const partner = await client.query('SELECT 1 FROM distributor_manufacturer WHERE manufacturer_id=$1 AND distributor_id=$2', [orgId, row.distributor_id]);
      if (partner.rowCount===0) continue;
      if (row.price==null || row.price==='') {
        await client.query('DELETE FROM distributor_pricing WHERE product_id=$1 AND distributor_id=$2', [params.id, row.distributor_id]);
      } else {
        await client.query(`INSERT INTO distributor_pricing (product_id,distributor_id,price,updated_at)
          VALUES ($1,$2,$3,now()) ON CONFLICT (product_id,distributor_id)
          DO UPDATE SET price=EXCLUDED.price, updated_at=now()`, [params.id, row.distributor_id, Number(row.price)]);
      }
    }
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Pricing saved' });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
