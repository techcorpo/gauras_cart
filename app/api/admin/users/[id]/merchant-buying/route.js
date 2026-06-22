import { NextResponse } from 'next/server';
import { query } from '../../../../../../lib/db';
import { requireRole } from '../../../../../../lib/auth';

// Admin toggles a farmer's ability to buy directly from manufacturers.
export async function POST(req, { params }) {
  try {
    requireRole(req, 'admin');
    const { allow } = await req.json();
    const r = await query(
      `UPDATE users SET allow_merchant_buying=$1, updated_at=now()
        WHERE id=$2 AND role='farmer' RETURNING id, allow_merchant_buying`,
      [!!allow, params.id]);
    if (r.rowCount === 0) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    return NextResponse.json({ ok: true, allow_merchant_buying: r.rows[0].allow_merchant_buying });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
