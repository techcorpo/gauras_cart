import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
export async function GET(req) {
  const sid = new URL(req.url).searchParams.get('state_id');
  try {
    const r = sid ? await query('SELECT id,name,state_id FROM districts WHERE state_id=$1 ORDER BY name',[sid])
                  : await query('SELECT id,name,state_id FROM districts ORDER BY name');
    return NextResponse.json({ districts: r.rows });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
