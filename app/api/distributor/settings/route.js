import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
import { distributorScope } from '../../../../lib/exclusivity';
export async function GET(req) {
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
    const blk = await query('SELECT block_id FROM distributor_blocks WHERE distributor_id=$1', [orgId]);
    const sel = await query('SELECT manufacturer_id FROM distributor_manufacturer WHERE distributor_id=$1', [orgId]);
    const scope = await distributorScope(orgId);
    // When the distributor is locked to an exclusive society, only that society's
    // manufacturers may be partnered with (so only show those as options).
    const all = scope.exclusive
      ? await query(`SELECT o.id,o.name,d.name AS district_name FROM organizations o
           LEFT JOIN districts d ON d.id=o.district_id
           WHERE o.type='manufacturer' AND o.society_code=$1 ORDER BY o.name`, [scope.society_code])
      : await query(`SELECT o.id,o.name,d.name AS district_name FROM organizations o
           LEFT JOIN districts d ON d.id=o.district_id WHERE o.type='manufacturer' ORDER BY o.name`);
    return NextResponse.json({
      blockIds: blk.rows.map(r=>r.block_id),
      manufacturerIds: sel.rows.map(r=>r.manufacturer_id),
      manufacturers: all.rows,
      society_code: scope.society_code,
      exclusive: scope.exclusive,
    });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
