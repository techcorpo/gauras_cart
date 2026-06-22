import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
export async function GET(req) {
  try {
    requireRole(req, 'admin');
    const status = new URL(req.url).searchParams.get('status') || 'pending';
    const r = await query(
      `SELECT u.id,u.role,u.full_name,u.phone,u.email,u.status,u.created_at,u.allow_merchant_buying,
              o.name AS org_name, o.registration_number, o.chairperson_name,
              b.name AS block_name, d.name AS district_name
       FROM users u
       LEFT JOIN organizations o ON o.id=u.org_id
       LEFT JOIN blocks b ON b.id=u.block_id
       LEFT JOIN districts d ON d.id=COALESCE(b.district_id,o.district_id)
       WHERE u.status=$1 AND u.role<>'admin' ORDER BY u.created_at DESC`, [status]);
    return NextResponse.json({ users: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}
