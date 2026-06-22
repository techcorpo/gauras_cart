import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';

export async function GET(req) {
  try {
    requireRole(req, 'admin');
    const r = await query(`
      SELECT s.id, s.name, s.code,
        (SELECT COUNT(*)::int FROM districts WHERE state_id=s.id) AS district_count,
        (SELECT COUNT(*)::int FROM organizations WHERE state_id=s.id) AS org_count
      FROM states s ORDER BY s.name
    `);
    return NextResponse.json({ states: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}

export async function POST(req) {
  try {
    requireRole(req, 'admin');
    const { name, code } = await req.json();
    if (!name?.trim()) throw { status: 400, error: 'Name is required' };
    const r = await query(
      'INSERT INTO states (name, code) VALUES ($1, $2) RETURNING id, name, code',
      [name.trim(), code?.trim() || null]
    );
    return NextResponse.json({ state: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}

export async function PUT(req) {
  try {
    requireRole(req, 'admin');
    const { id, name, code } = await req.json();
    if (!id) throw { status: 400, error: 'ID required' };
    if (!name?.trim()) throw { status: 400, error: 'Name is required' };
    const r = await query(
      'UPDATE states SET name=$1, code=$2 WHERE id=$3 RETURNING id, name, code',
      [name.trim(), code?.trim() || null, id]
    );
    if (r.rowCount === 0) throw { status: 404, error: 'Not found' };
    return NextResponse.json({ state: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}

export async function DELETE(req) {
  try {
    requireRole(req, 'admin');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw { status: 400, error: 'ID required' };
    const refs = await query(
      `SELECT
        (SELECT COUNT(*) FROM districts WHERE state_id=$1) AS district_count,
        (SELECT COUNT(*) FROM organizations WHERE state_id=$1) AS org_count`,
      [id]
    );
    const { district_count, org_count } = refs.rows[0];
    if (district_count > 0 || org_count > 0) {
      throw { status: 409, error: `Cannot delete: referenced by ${district_count} districts and ${org_count} organizations` };
    }
    await query('DELETE FROM states WHERE id=$1', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}
