import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { hashToken } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const { refreshToken } = await req.json();
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hashToken(refreshToken)]).catch(() => {});
    }
  } catch {}
  return NextResponse.json({ message: 'Logged out' });
}
