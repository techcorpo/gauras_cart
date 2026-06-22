import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

// Public list of distinct society codes defined by manufacturers.
// Used by the distributor registration page ("Is member of" dropdown).
export async function GET() {
  try {
    const r = await query(
      `SELECT society_code,
              bool_or(is_exclusive) AS is_exclusive
         FROM organizations
        WHERE type = 'manufacturer'
          AND society_code IS NOT NULL
          AND society_code <> ''
        GROUP BY society_code
        ORDER BY society_code`
    );
    return NextResponse.json({ societies: r.rows });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
