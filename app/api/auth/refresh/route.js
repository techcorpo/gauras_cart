import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { signAccessToken, generateRefreshToken, hashToken } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) return NextResponse.json({ error: 'refreshToken required' }, { status: 400 });
    const hash = hashToken(refreshToken);
    const r = await query(
      `SELECT rt.id, rt.expires_at, rt.revoked,
              u.id AS uid, u.role, u.full_name, u.phone, u.email, u.status, u.org_id, u.block_id
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`, [hash]
    );
    if (r.rowCount === 0) return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    const row = r.rows[0];
    if (row.revoked) return NextResponse.json({ error: 'Refresh token revoked' }, { status: 401 });
    if (new Date(row.expires_at) < new Date()) return NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });

    await query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [row.id]);
    const user = { id: row.uid, role: row.role, full_name: row.full_name, phone: row.phone, email: row.email, status: row.status, org_id: row.org_id, block_id: row.block_id };
    const accessToken = signAccessToken(user);
    const { raw, hash: nh, expiresAt } = generateRefreshToken();
    await query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`, [user.id, nh, expiresAt]);
    return NextResponse.json({ accessToken, refreshToken: raw, user });
  } catch (e) {
    console.error('refresh', e);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
