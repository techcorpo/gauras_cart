import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';

export async function GET(req, { params }) {
  try {
    requireRole(req, 'admin');
    const r = await query('SELECT org_id, kind, value FROM commission_terms WHERE org_id=$1', [params.orgId]);
    return NextResponse.json({ term: r.rows[0] || { org_id: params.orgId, kind: 'pct', value: 0 } });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}

export async function PUT(req, { params }) {
  try {
    requireRole(req, 'admin');
    const { kind, value } = await req.json();
    if (!['pct','fixed'].includes(kind)) return NextResponse.json({ error: 'kind must be pct or fixed' }, { status: 400 });
    await query(
      `INSERT INTO commission_terms (org_id, kind, value, updated_at) VALUES ($1,$2,$3,now())
       ON CONFLICT (org_id) DO UPDATE SET kind=EXCLUDED.kind, value=EXCLUDED.value, updated_at=now()`,
      [params.orgId, kind, Number(value)||0]);
    return NextResponse.json({ ok: true, kind, value: Number(value)||0 });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
