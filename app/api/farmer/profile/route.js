import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
export async function PUT(req) {
  try {
    const u = requireRole(req, 'farmer');
    const { full_name, email, address } = await req.json();
    if (!full_name || !String(full_name).trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const r = await query(`UPDATE users SET full_name=$1,email=$2,address=$3,updated_at=now() WHERE id=$4 RETURNING id,full_name,email,address`,
      [full_name.trim(), (email&&email.trim())||null, (address&&address.trim())||null, u.id]);
    return NextResponse.json({ message: 'Profile updated', profile: r.rows[0] });
  } catch (e) {
    if (e.code === '23505') return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 });
  }
}
