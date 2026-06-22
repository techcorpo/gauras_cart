# Gauras Mart — TODO / Open Items

## Big feature build (in phases)

### ✅ Phase 1 — Pricing, min-qty, district & direct buying (DONE)
- `users.allow_merchant_buying`, `products.min_order_qty` (manufacturer min, 0=no limit),
  `distributor_pricing.min_qty` (per farmer line, 0=no limit). Migration `db/features-2026.sql`.
- Farmer shop: district dropdown (default own district), re-list on change.
- Direct manufacturer buying with blue/green badges; both shown if same product from both.
- Min enforcement:
  - manufacturer min = summed product qty (distributor PO via aggregate + direct farmer order).
  - distributor min = each farmer line qty.
- Distributor Products page: set own price + min_qty per product.
- Manufacturer product form: Min Order Qty field.
- Discounts: REMOVED entirely (per decision).

### ✅ Phase 2a — Admin stakeholder pages + commission (DONE)
- Admin NAV: Manufacturers, Distributors, Farmers, Earnings (+ Dashboard, Catalog).
- Each list: name textbox (works without district) + district dropdown (+ block; disabled for
  manufacturer). List shows when name typed OR district selected; block filters when chosen.
  - manufacturer filtered by org.district_id (no block).
  - distributor filtered by served blocks (distributor_blocks).
  - farmer filtered by block->district.
- Manufacturer/Distributor rows: admin sets commission (pct or fixed) via `commission_terms`.
- Farmer rows: admin toggles `allow_merchant_buying` (inline dashboard toggle removed).
- Commission recorded on "payment received" (seller marks paid) into `commission_ledger`
  (type derived: manufacturer='M', distributor='D'); idempotent per (org, order).
- Admin Earnings page: from–to (receipt date) + radios both/merchant/distributor; columns
  name, type, order date, order amount, commission, receipt date; shows total.

### ⏳ Phase 2b — Payment transaction details (PENDING)
- When marking paid, capture method (cash/online/upi/cheque/neft/rtgs/bank_deposit) + conditional
  fields (bank name, cheque no, UTR/ref, account, date). Table `payments` ready in migration.
  (Currently paid is a simple status flip + commission capture.)

### ⏳ Phase 3 — Quantity editing (PENDING)
- Distributor edits farmer order-item qty; manufacturer edits distributor PO qty (recalc totals).

### ⏳ Phase 4 — Bilty / consignment (PENDING)
- Manufacturer "Print Bilty" on ship; consignment can hold multiple distributors' orders;
  distributor viewing a bilty sees only their own items. Tables ready in migration.

### ⏳ Phase 5 — Admin geography CRUD (PENDING)
- Admin create/manage States → Districts → Blocks (only read APIs exist now).

## Other open item
- Society-exclusivity check in distributor order flow (`aggregate`, `incoming`) — to confirm later.

## Migrations to run in Supabase (in order)
1. `db/society-fields.sql`
2. `db/set-farmer-pins.sql` (if not done)
3. `db/features-2026.sql`  ← run/re-run (now has min_qty + commission tables, no discounts)
