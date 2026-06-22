import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';

export async function GET(req) {
  const u = getAuthUser(req);
  if (!u) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const r = await query(
      `SELECT u.id, u.role, u.full_name, u.phone, u.email, u.status, u.org_id, u.block_id,
              u.allow_merchant_buying,
              o.name AS org_name,
              d.id AS district_id, d.name AS district_name, s.name AS state_name, b.name AS block_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.org_id
       LEFT JOIN blocks b ON b.id = u.block_id
       LEFT JOIN districts d ON d.id = COALESCE(b.district_id, o.district_id)
       LEFT JOIN states s ON s.id = COALESCE(o.state_id, d.state_id)
       WHERE u.id = $1`, [u.id]
    );
    if (r.rowCount === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: r.rows[0] });
  } catch (e) {
    console.error('me', e);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
