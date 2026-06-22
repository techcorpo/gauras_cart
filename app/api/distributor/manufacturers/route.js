import { NextResponse } from 'next/server';
import { getClient } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
import { distributorScope } from '../../../../lib/exclusivity';
export async function PUT(req) {
  const client = await getClient();
  try {
    const u = requireRole(req, 'distributor');
    const orgId = await getOrgId(u.id);
    const { manufacturerIds = [] } = await req.json();

    // Exclusivity guard: if this distributor is locked to an exclusive society,
    // every chosen manufacturer must belong to that same society.
    const scope = await distributorScope(orgId);
    if (scope.exclusive && manufacturerIds.length > 0) {
      const chk = await client.query(
        `SELECT COUNT(*)::int AS bad FROM organizations
          WHERE id = ANY($1) AND (society_code IS DISTINCT FROM $2)`,
        [manufacturerIds, scope.society_code]);
      if (chk.rows[0].bad > 0) {
        return NextResponse.json(
          { error: `As a member of ${scope.society_code}, you can only partner with ${scope.society_code} manufacturers.` },
          { status: 400 });
      }
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM distributor_manufacturer WHERE distributor_id=$1', [orgId]);
    for (const m of manufacturerIds) await client.query(`INSERT INTO distributor_manufacturer (distributor_id,manufacturer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [orgId, m]);
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Saved', count: manufacturerIds.length });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
