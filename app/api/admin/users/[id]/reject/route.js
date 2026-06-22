import { NextResponse } from 'next/server';
import { query } from '../../../../../../lib/db';
import { requireRole } from '../../../../../../lib/auth';
export async function POST(req, { params }) {
  try {
    requireRole(req, 'admin');
    const r = await query(`UPDATE users SET status='suspended', updated_at=now() WHERE id=$1 AND role<>'admin' RETURNING id, full_name, status`, [params.id]);
    if (r.rowCount === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ message: 'User rejected', user: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}
