import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
export async function GET(req) {
  const did = new URL(req.url).searchParams.get('district_id');
  try {
    const r = did ? await query('SELECT id,name,district_id FROM blocks WHERE district_id=$1 ORDER BY name',[did])
                  : await query('SELECT id,name,district_id FROM blocks ORDER BY name');
    return NextResponse.json({ blocks: r.rows });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
