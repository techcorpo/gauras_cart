import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
export async function GET(req) {
  try {
    const u = requireRole(req, 'farmer');
    const r = await query(`SELECT u.id,u.full_name,u.phone,u.email,u.address,u.block_id,
       b.name AS block_name, d.id AS district_id, d.name AS district_name
       FROM users u LEFT JOIN blocks b ON b.id=u.block_id LEFT JOIN districts d ON d.id=b.district_id
       WHERE u.id=$1`, [u.id]);
    if (r.rowCount===0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ profile: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
