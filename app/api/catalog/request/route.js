import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { requireRole } from '../../../../lib/auth';
import { getOrgId } from '../../../../lib/orgs';
export async function POST(req) {
  try {
    const u = requireRole(req, 'manufacturer');
    const orgId = await getOrgId(u.id);
    const { canonical_name, category, default_unit, synonyms } = await req.json();
    if (!canonical_name || !category) return NextResponse.json({ error: 'canonical_name and category are required' }, { status: 400 });
    const r = await query(`INSERT INTO product_catalog (canonical_name,category,default_unit,synonyms,status,requested_by)
      VALUES ($1,$2,$3,$4,'pending',$5) RETURNING id,canonical_name,category,default_unit,status`,
      [canonical_name.trim(), category.trim(), (default_unit&&default_unit.trim())||'unit', (synonyms&&synonyms.trim())||null, orgId]);
    return NextResponse.json({ message: 'Requested (pending approval)', item: r.rows[0] }, { status: 201 });
  } catch (e) {
    if (e.code === '23505') return NextResponse.json({ error: 'Already exists' }, { status: 409 });
    return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 });
  }
}
