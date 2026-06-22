import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
export async function GET() {
  try { const r = await query('SELECT id, name, code FROM states ORDER BY name'); return NextResponse.json({ states: r.rows }); }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
