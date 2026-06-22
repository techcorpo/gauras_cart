import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
export async function GET(req) {
  try {
    requireRole(req, 'admin');
    const status = new URL(req.url).searchParams.get('status');
    const r = status
      ? await query(`SELECT pc.*, o.name AS requested_by_name FROM product_catalog pc LEFT JOIN organizations o ON o.id=pc.requested_by WHERE pc.status=$1 ORDER BY pc.created_at DESC`, [status])
      : await query(`SELECT pc.*, o.name AS requested_by_name FROM product_catalog pc LEFT JOIN organizations o ON o.id=pc.requested_by ORDER BY pc.status, pc.canonical_name`);
    return NextResponse.json({ items: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
