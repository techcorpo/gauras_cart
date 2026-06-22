import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
export async function GET(req) {
  try {
    requireRole(req, 'admin');
    const r = await query(`SELECT status, COUNT(*)::int AS count FROM users WHERE role<>'admin' GROUP BY status`);
    const stats = { pending:0, active:0, suspended:0 };
    r.rows.forEach(x => stats[x.status]=x.count);
    return NextResponse.json({ stats });
  } catch (e) { return NextResponse.json({ error: e.error || 'Failed' }, { status: e.status || 500 }); }
}
