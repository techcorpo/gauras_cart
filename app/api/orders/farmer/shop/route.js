import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { exclusivityWhereSQL } from '../../../../../lib/exclusivity';

// All products available to this farmer = products from every distributor that
// serves the farmer's block (each row tagged with its distributor for the cart).
// Exclusivity: if a distributor belongs to a society that has an exclusive
// manufacturer, only that society's products are shown for that distributor.
export async function GET(req) {
  try {
    const u = requireRole(req, 'farmer');
    const ub = await query('SELECT block_id FROM users WHERE id=$1', [u.id]);
    const blockId = ub.rows[0] && ub.rows[0].block_id;
    if (!blockId) return NextResponse.json({ products: [] });
    const r = await query(`
      SELECT DISTINCT ON (dist.id, p.id)
             p.id, p.name, p.category, p.unit, p.base_price,
             m.id AS manufacturer_id, m.name AS manufacturer_name,
             pc.canonical_name AS catalog_name,
             dist.id AS distributor_id, dist.name AS distributor_name
      FROM distributor_blocks db
      JOIN organizations dist ON dist.id = db.distributor_id
      JOIN distributor_manufacturer dm ON dm.distributor_id = dist.id
      JOIN products p ON p.manufacturer_id = dm.manufacturer_id AND p.is_active = true
      JOIN organizations m ON m.id = p.manufacturer_id
      LEFT JOIN product_catalog pc ON pc.id = p.catalog_product_id
      WHERE db.block_id = $1
        AND ${exclusivityWhereSQL('dist', 'm')}
      ORDER BY dist.id, p.id, p.name`, [blockId]);
    return NextResponse.json({ products: r.rows });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
