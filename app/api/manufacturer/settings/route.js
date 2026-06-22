import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
const SEASONS = ['kharif','rabi','zaid','annual'];
export async function GET(req) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
    const year = parseInt(new URL(req.url).searchParams.get('year'),10) || new Date().getFullYear();
    const cap = await query(`SELECT season, tonnes FROM manufacturer_capacity WHERE manufacturer_id=$1 AND cycle_year=$2`, [orgId, year]);
    const capacity = {}; SEASONS.forEach(s=>capacity[s]=0); cap.rows.forEach(r=>capacity[r.season]=Number(r.tonnes));
    const blk = await query(`SELECT block_id FROM manufacturer_blocks WHERE manufacturer_id=$1`, [orgId]);
    const org = await query(`SELECT society_code, is_exclusive FROM organizations WHERE id=$1`, [orgId]);
    const society = org.rows[0] || { society_code: null, is_exclusive: false };
    return NextResponse.json({
      year, capacity, blockIds: blk.rows.map(r=>r.block_id),
      society_code: society.society_code || '',
      is_exclusive: !!society.is_exclusive,
    });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}

// Save the society fields (society_code: up to 10 chars or null; is_exclusive: boolean).
export async function PUT(req) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
    const body = await req.json();
    const societyCode = body.society_code ? String(body.society_code).trim().slice(0, 10) : null;
    const isExclusive = !!body.is_exclusive;
    await query(`UPDATE organizations SET society_code=$1, is_exclusive=$2 WHERE id=$3`,
      [societyCode, isExclusive, orgId]);
    return NextResponse.json({ ok: true, society_code: societyCode || '', is_exclusive: isExclusive });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
