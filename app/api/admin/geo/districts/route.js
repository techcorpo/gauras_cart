import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';

export async function GET(req) {
  try {
    requireRole(req, 'admin');
    const { searchParams } = new URL(req.url);
    const stateId = searchParams.get('state_id');
    const sql = stateId
      ? `SELECT d.id, d.name, d.state_id, s.name AS state_name,
          (SELECT COUNT(*)::int FROM blocks WHERE district_id=d.id) AS block_count,
          (SELECT COUNT(*)::int FROM organizations WHERE district_id=d.id) AS org_count
         FROM districts d JOIN states s ON s.id=d.state_id WHERE d.state_id=$1 ORDER BY d.name`
      : `SELECT d.id, d.name, d.state_id, s.name AS state_name,
          (SELECT COUNT(*)::int FROM blocks WHERE district_id=d.id) AS block_count,
          (SELECT COUNT(*)::int FROM organizations WHERE district_id=d.id) AS org_count
         FROM districts d JOIN states s ON s.id=d.state_id ORDER BY s.name, d.name`;
    const r = await query(sql, stateId ? [stateId] : []);
    return NextResponse.json({ districts: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}

export async function POST(req) {
  try {
    requireRole(req, 'admin');
    const { name, state_id } = await req.json();
    if (!name?.trim() || !state_id) throw { status: 400, error: 'Name and state are required' };
    const r = await query(
      'INSERT INTO districts (name, state_id) VALUES ($1, $2) RETURNING id, name, state_id',
      [name.trim(), state_id]
    );
    return NextResponse.json({ district: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}

export async function PUT(req) {
  try {
    requireRole(req, 'admin');
    const { id, name, state_id } = await req.json();
    if (!id || !name?.trim() || !state_id) throw { status: 400, error: 'Name, state and ID are required' };
    const r = await query(
      'UPDATE districts SET name=$1, state_id=$2 WHERE id=$3 RETURNING id, name, state_id',
      [name.trim(), state_id, id]
    );
    if (r.rowCount === 0) throw { status: 404, error: 'Not found' };
    return NextResponse.json({ district: r.rows[0] });
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
        (SELECT COUNT(*) FROM blocks WHERE district_id=$1) AS block_count,
        (SELECT COUNT(*) FROM organizations WHERE district_id=$1) AS org_count`,
      [id]
    );
    const { block_count, org_count } = refs.rows[0];
    if (block_count > 0 || org_count > 0) {
      throw { status: 409, error: `Cannot delete: referenced by ${block_count} blocks and ${org_count} organizations` };
    }
    await query('DELETE FROM districts WHERE id=$1', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}
