// Price resolution helper.
//
// Effective price for a (product, distributor):
//   - if a distributor_pricing row with a non-null price exists -> use it
//   - else -> product.base_price
//
// SQL snippet usable where products p and distributor_pricing dp are joined.
export const RESOLVED_DIST_PRICE_SQL = 'COALESCE(dp.price, p.base_price)';
