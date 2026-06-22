import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
export async function PUT(req, { params }) {
  try {
    requireRole(req, 'admin');
    const b = await req.json();
    const r = await query(`UPDATE product_catalog SET canonical_name=COALESCE($1,canonical_name),
      category=COALESCE($2,category), default_unit=COALESCE($3,default_unit), synonyms=$4, status=COALESCE($5,status)
      WHERE id=$6 RETURNING *`,
      [b.canonical_name||null,b.category||null,b.default_unit||null,(b.synonyms&&b.synonyms.trim())||null,b.status||null,params.id]);
    if (r.rowCount===0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Updated', item: r.rows[0] });
  } catch (e) {
    if (e.code === '23505') return NextResponse.json({ error: 'Already exists' }, { status: 409 });
    return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 });
  }
}
export async function DELETE(req, { params }) {
  try {
    requireRole(req, 'admin');
    const r = await query('DELETE FROM product_catalog WHERE id=$1 RETURNING id', [params.id]);
    if (r.rowCount===0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
