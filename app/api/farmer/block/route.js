import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
export async function PUT(req) {
  try {
    const u = requireRole(req, 'farmer');
    const { block_id } = await req.json();
    if (!block_id) return NextResponse.json({ error: 'block_id is required' }, { status: 400 });
    const b = await query('SELECT 1 FROM blocks WHERE id=$1', [block_id]);
    if (b.rowCount===0) return NextResponse.json({ error: 'Invalid block' }, { status: 400 });
    const r = await query('UPDATE users SET block_id=$1,updated_at=now() WHERE id=$2 RETURNING id,block_id', [block_id, u.id]);
    return NextResponse.json({ message: 'Block updated', profile: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
