import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { getAuthUser } from '../../../lib/auth';
export async function GET(req) {
  if (!getAuthUser(req)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const q = (sp.get('q')||'').trim(); const category = (sp.get('category')||'').trim();
  try {
    const params = []; let where = "status='active'";
    if (category) { params.push(category); where += ` AND category=$${params.length}`; }
    let sql;
    if (q) {
      params.push(q); const qi = params.length;
      params.push('%'+q+'%'); const li = params.length;
      sql = `SELECT id,canonical_name,category,default_unit,synonyms,
        GREATEST(similarity(canonical_name,$${qi}),similarity(COALESCE(synonyms,''),$${qi})) AS score
        FROM product_catalog WHERE ${where}
        AND (canonical_name ILIKE $${li} OR COALESCE(synonyms,'') ILIKE $${li}
             OR canonical_name % $${qi} OR COALESCE(synonyms,'') % $${qi})
        ORDER BY score DESC, canonical_name LIMIT 50`;
    } else {
      sql = `SELECT id,canonical_name,category,default_unit,synonyms FROM product_catalog WHERE ${where} ORDER BY category,canonical_name LIMIT 200`;
    }
    const r = await query(sql, params);
    return NextResponse.json({ items: r.rows });
  } catch (e) { console.error('catalog search', e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
