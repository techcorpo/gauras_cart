import { NextResponse } from 'next/server';
import { getClient } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
const SEASONS = ['kharif','rabi','zaid','annual'];
export async function PUT(req) {
  const client = await getClient();
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const body = await req.json();
    const year = parseInt(body.year,10) || new Date().getFullYear();
    const cap = body.capacity || {};
    await client.query('BEGIN');
    for (const s of SEASONS) {
      const t = Number(cap[s]); if (Number.isNaN(t) || t<0) continue;
      await client.query(`INSERT INTO manufacturer_capacity (manufacturer_id,season,cycle_year,tonnes,updated_at)
        VALUES ($1,$2,$3,$4,now()) ON CONFLICT (manufacturer_id,season,cycle_year)
        DO UPDATE SET tonnes=EXCLUDED.tonnes, updated_at=now()`, [orgId, s, year, t]);
    }
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Saved', year });
  } catch (e) { await client.query('ROLLBACK'); return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
  finally { client.release(); }
}
