import { NextResponse } from 'next/server';
import { query } from '../../../../../../lib/db';
import { requireRole } from '../../../../../../lib/auth';
export async function POST(req, { params }) {
  try {
    requireRole(req, 'admin');
    const r = await query(`UPDATE product_catalog SET status='active' WHERE id=$1 RETURNING id,canonical_name,status`, [params.id]);
    if (r.rowCount===0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Approved', item: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
