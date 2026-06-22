import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
export async function GET(req) {
  try {
    const u = requireRole(req, 'farmer');
    const ub = await query('SELECT block_id FROM users WHERE id=$1', [u.id]);
    const blockId = ub.rows[0] && ub.rows[0].block_id;
    if (!blockId) return NextResponse.json({ distributors: [] });
    const r = await query(`SELECT DISTINCT o.id,o.name,d.name AS district_name
      FROM distributor_blocks db JOIN organizations o ON o.id=db.distributor_id
      LEFT JOIN districts d ON d.id=o.district_id WHERE db.block_id=$1 ORDER BY o.name`, [blockId]);
    return NextResponse.json({ distributors: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
