import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';

// Admin list of manufacturers | distributors | farmers with filters:
//   q (partial name), district_id, block_id.
// Rules: if q given, show matches even without district. Else require district.
//   - manufacturer: filter by org.district_id (block ignored).
//   - distributor: filter by the blocks it serves (distributor_blocks) for district/block.
//   - farmer: filter by the farmer's block -> district.
export async function GET(req, { params }) {
  try {
    requireRole(req, 'admin');
    const role = params.role;
    if (!['manufacturer','distributor','farmer'].includes(role))
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const districtId = url.searchParams.get('district_id') || null;
    const blockId = url.searchParams.get('block_id') || null;

    if (!q && !districtId) return NextResponse.json({ rows: [] });

    let rows;
    if (role === 'farmer') {
      const cond = []; const args = [];
      if (q) { args.push('%'+q+'%'); cond.push(`u.full_name ILIKE $${args.length}`); }
      if (blockId) { args.push(blockId); cond.push(`u.block_id = $${args.length}`); }
      else if (districtId) { args.push(districtId); cond.push(`b.district_id = $${args.length}`); }
      rows = await query(
        `SELECT u.id, u.full_name AS name, u.phone, u.allow_merchant_buying,
                b.name AS block_name, d.name AS district_name
           FROM users u
           LEFT JOIN blocks b ON b.id=u.block_id
           LEFT JOIN districts d ON d.id=b.district_id
          WHERE u.role='farmer' AND (${cond.join(' AND ') || 'true'})
          ORDER BY u.full_name`, args);
    } else if (role === 'manufacturer') {
      const cond = ["o.type='manufacturer'"]; const args = [];
      if (q) { args.push('%'+q+'%'); cond.push(`o.name ILIKE $${args.length}`); }
      if (districtId) { args.push(districtId); cond.push(`o.district_id = $${args.length}`); }
      rows = await query(
        `SELECT o.id, o.name, d.name AS district_name,
                ct.kind AS commission_kind, ct.value AS commission_value
           FROM organizations o
           LEFT JOIN districts d ON d.id=o.district_id
           LEFT JOIN commission_terms ct ON ct.org_id=o.id
          WHERE ${cond.join(' AND ')}
          ORDER BY o.name`, args);
    } else { // distributor
      const cond = ["o.type='distributor'"]; const args = [];
      if (q) { args.push('%'+q+'%'); cond.push(`o.name ILIKE $${args.length}`); }
      if (blockId) { args.push(blockId); cond.push(`EXISTS (SELECT 1 FROM distributor_blocks db WHERE db.distributor_id=o.id AND db.block_id=$${args.length})`); }
      else if (districtId) { args.push(districtId); cond.push(`EXISTS (SELECT 1 FROM distributor_blocks db JOIN blocks b ON b.id=db.block_id WHERE db.distributor_id=o.id AND b.district_id=$${args.length})`); }
      rows = await query(
        `SELECT o.id, o.name, d.name AS district_name,
                ct.kind AS commission_kind, ct.value AS commission_value
           FROM organizations o
           LEFT JOIN districts d ON d.id=o.district_id
           LEFT JOIN commission_terms ct ON ct.org_id=o.id
          WHERE ${cond.join(' AND ')}
          ORDER BY o.name`, args);
    }
    return NextResponse.json({ rows: rows.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
