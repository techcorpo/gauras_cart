import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '../../../../lib/db';
import { signAccessToken, generateRefreshToken } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) return NextResponse.json({ error: 'phone and password are required' }, { status: 400 });

    const r = await query(
      `SELECT id, role, full_name, phone, email, status, org_id, block_id, password_hash
       FROM users WHERE phone = $1`, [phone]
    );
    if (r.rowCount === 0) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    if (user.status === 'pending') return NextResponse.json({ error: 'Account pending admin approval' }, { status: 403 });
    if (user.status === 'suspended') return NextResponse.json({ error: 'Account suspended. Contact admin.' }, { status: 403 });

    const accessToken = signAccessToken(user);
    const { raw, hash, expiresAt } = generateRefreshToken();
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
      [user.id, hash, expiresAt]
    );
    const { password_hash, ...pub } = user;
    return NextResponse.json({ accessToken, refreshToken: raw, user: pub });
  } catch (e) {
    console.error('login', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
