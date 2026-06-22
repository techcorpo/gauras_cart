import { NextResponse } from 'next/server';
import { getClient } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
export async function PUT(req) {
  const client = await getClient();
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const { blockIds = [] } = await req.json();
    await client.query('BEGIN');
    await client.query('DELETE FROM manufacturer_blocks WHERE manufacturer_id=$1', [orgId]);
    for (const b of blockIds) await client.query(`INSERT INTO manufacturer_blocks (manufacturer_id,block_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [orgId, b]);
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Saved', count: blockIds.length });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
