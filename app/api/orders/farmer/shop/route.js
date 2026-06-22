import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { requireRole } from '../../../../../lib/auth';
import { exclusivityWhereSQL } from '../../../../../lib/exclusivity';

// Products available to a farmer for a chosen district.
//  - Always: products from distributors that serve a block in that district
//    (price = distributor_pricing if set, else base_price). source='distributor'.
//  - If the farmer has allow_merchant_buying: ALSO manufacturer-direct products
//    for manufacturers serving that district. source='manufacturer'.
// Each row carries source + seller info so the cart can place the right order.
export async function GET(req) {
  try {
    const u = requireRole(req, 'farmer');
    const url = new URL(req.url);
    let districtId = url.searchParams.get('district_id');

    const me = await query(
      `SELECT u.allow_merchant_buying, b.district_id
         FROM users u LEFT JOIN blocks b ON b.id=u.block_id WHERE u.id=$1`, [u.id]);
    const allowDirect = me.rows[0]?.allow_merchant_buying === true;
    if (!districtId) districtId = me.rows[0]?.district_id || null;
    if (!districtId) return NextResponse.json({ products: [], allow_merchant_buying: allowDirect });

    // Distributor products in the selected district.
    const dist = await query(`
      SELECT DISTINCT ON (dist.id, p.id)
             p.id, p.name, p.category, p.unit, p.base_price, p.min_order_qty,
             COALESCE(dp.price, p.base_price) AS price,
             m.id AS manufacturer_id, m.name AS manufacturer_name,
             pc.canonical_name AS catalog_name,
             dist.id AS seller_id, dist.name AS seller_name,
             'distributor' AS source
      FROM distributor_blocks db
      JOIN blocks bl ON bl.id = db.block_id
      JOIN organizations dist ON dist.id = db.distributor_id
      JOIN distributor_manufacturer dm ON dm.distributor_id = dist.id
      JOIN products p ON p.manufacturer_id = dm.manufacturer_id AND p.is_active = true
      JOIN organizations m ON m.id = p.manufacturer_id
      LEFT JOIN product_catalog pc ON pc.id = p.catalog_product_id
      LEFT JOIN distributor_pricing dp ON dp.product_id = p.id AND dp.distributor_id = dist.id
      WHERE bl.district_id = $1
        AND ${exclusivityWhereSQL('dist', 'm')}
      ORDER BY dist.id, p.id, p.name`, [districtId]);

    let direct = { rows: [] };
    if (allowDirect) {
      // Manufacturer-direct products for manufacturers serving the district
      // (via manufacturer_blocks). Seller = manufacturer org.
      direct = await query(`
        SELECT DISTINCT ON (m.id, p.id)
               p.id, p.name, p.category, p.unit, p.base_price, p.min_order_qty,
               p.base_price AS price,
               m.id AS manufacturer_id, m.name AS manufacturer_name,
               pc.canonical_name AS catalog_name,
               m.id AS seller_id, m.name AS seller_name,
               'manufacturer' AS source
        FROM manufacturer_blocks mb
        JOIN blocks bl ON bl.id = mb.block_id
        JOIN organizations m ON m.id = mb.manufacturer_id AND m.type='manufacturer'
        JOIN products p ON p.manufacturer_id = m.id AND p.is_active = true
        LEFT JOIN product_catalog pc ON pc.id = p.catalog_product_id
        WHERE bl.district_id = $1
        ORDER BY m.id, p.id, p.name`, [districtId]);
    }

    return NextResponse.json({
      products: [...dist.rows, ...direct.rows],
      allow_merchant_buying: allowDirect,
      district_id: districtId,
    });
  } catch (e) { return NextResponse.json({ error: e.error||'Failed' }, { status: e.status||500 }); }
}
