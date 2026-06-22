import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';

export async function GET(req) {
  try {
    requireRole(req, 'admin');
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('district_id');
    const sql = districtId
      ? `SELECT b.id, b.name, b.district_id, d.name AS district_name, s.name AS state_name,
          (SELECT COUNT(*)::int FROM users WHERE block_id=b.id) AS user_count
         FROM blocks b JOIN districts d ON d.id=b.district_id JOIN states s ON s.id=d.state_id
         WHERE b.district_id=$1 ORDER BY b.name`
      : `SELECT b.id, b.name, b.district_id, d.name AS district_name, s.name AS state_name,
          (SELECT COUNT(*)::int FROM users WHERE block_id=b.id) AS user_count
         FROM blocks b JOIN districts d ON d.id=b.district_id JOIN states s ON s.id=d.state_id
         ORDER BY s.name, d.name, b.name`;
    const r = await query(sql, districtId ? [districtId] : []);
    return NextResponse.json({ blocks: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}

export async function POST(req) {
  try {
    requireRole(req, 'admin');
    const { name, district_id } = await req.json();
    if (!name?.trim() || !district_id) throw { status: 400, error: 'Name and district are required' };
    const r = await query(
      'INSERT INTO blocks (name, district_id) VALUES ($1, $2) RETURNING id, name, district_id',
      [name.trim(), district_id]
    );
    return NextResponse.json({ block: r.rows[0] });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}

export async function PUT(req) {
  try {
    requireRole(req, 'admin');
    const { id, name, district_id } = await req.json();
    if (!id || !name?.trim() || !district_id) throw { status: 400, error: 'Name, district and ID are required' };
    const r = await query(
      'UPDATE blocks SET name=$1, district_id=$2 WHERE id=$3 RETURNING id, name, district_id',
      [name.trim(), district_id, id]
    );
    if (r.rowCount === 0) throw { status: 404, error: 'Not found' };
    return NextResponse.json({ block: r.rows[0] });
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
        (SELECT COUNT(*) FROM users WHERE block_id=$1) AS user_count,
        (SELECT COUNT(*) FROM distributor_blocks WHERE block_id=$1) AS dist_block_count,
        (SELECT COUNT(*) FROM manufacturer_blocks WHERE block_id=$1) AS mfr_block_count`,
      [id]
    );
    const { user_count, dist_block_count, mfr_block_count } = refs.rows[0];
    if (user_count > 0 || dist_block_count > 0 || mfr_block_count > 0) {
      throw { status: 409, error: `Cannot delete: referenced by ${user_count} users, ${dist_block_count} distributor territories, ${mfr_block_count} manufacturer territories` };
    }
    await query('DELETE FROM blocks WHERE id=$1', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}
