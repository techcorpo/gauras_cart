-- ============================================================
-- Gauras Mart — Feature migration (additive, safe to re-run)
-- Covers: direct manufacturer buying, min order qty (per product for
-- manufacturer + per distributor product for farmer lines), commissions,
-- payments, bilty/consignment.  Run once in Supabase SQL editor.
-- ============================================================

-- ---- Direct buying + manufacturer per-product min ----------
-- Farmer may buy directly from manufacturers (set by admin).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS allow_merchant_buying BOOLEAN NOT NULL DEFAULT FALSE;

-- Manufacturer's minimum order quantity for a product (0 = no limit).
-- Applies to the summed quantity of that product in an order placed to the
-- manufacturer (a distributor PO or a direct farmer order).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS min_order_qty NUMERIC NOT NULL DEFAULT 0;

-- ---- Distributor per-product minimum (on each farmer line) --
-- distributor_pricing is KEPT: price = its row if present, else base_price.
-- Add a per-(distributor, product) minimum qty applied to each farmer's line
-- (0 = no limit). Allow price to be null so a distributor can set only min_qty.
ALTER TABLE distributor_pricing
  ADD COLUMN IF NOT EXISTS min_qty NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE distributor_pricing
  ALTER COLUMN price DROP NOT NULL;

-- ---- Commissions (admin-set) -------------------------------
-- Commission terms per organization (manufacturer or distributor). Admin-only.
CREATE TABLE IF NOT EXISTS commission_terms (
  org_id      UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL DEFAULT 'pct',     -- 'pct' | 'fixed'
  value       NUMERIC NOT NULL DEFAULT 0,       -- pct (e.g. 1.5) or fixed amount per order
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Commission earned by the platform, recorded when a party marks payment
-- received. type is derived from org.type: manufacturer='M', distributor='D'.
CREATE TABLE IF NOT EXISTS commission_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),  -- whom we charge
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  base_amount   NUMERIC NOT NULL DEFAULT 0,                  -- order amount used
  kind          TEXT NOT NULL,                               -- 'pct' | 'fixed'
  rate          NUMERIC NOT NULL DEFAULT 0,
  amount        NUMERIC NOT NULL DEFAULT 0,                  -- commission we earn
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),          -- = receipt date
  UNIQUE (org_id, order_id)
);
CREATE INDEX IF NOT EXISTS idx_commission_org ON commission_ledger(org_id);
CREATE INDEX IF NOT EXISTS idx_commission_order ON commission_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_date ON commission_ledger(created_at);

-- ---- Payments (transaction details) — for a later phase -----
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  received_by   UUID NOT NULL REFERENCES organizations(id),
  payer_kind    TEXT,
  amount        NUMERIC NOT NULL DEFAULT 0,
  method        TEXT NOT NULL,                               -- cash|online|upi|cheque|neft|rtgs|bank_deposit
  bank_name     TEXT,
  cheque_no     TEXT,
  reference_no  TEXT,
  account_no    TEXT,
  paid_on       DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ---- Bilty / consignment — for a later phase ----------------
CREATE TABLE IF NOT EXISTS consignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_no  TEXT UNIQUE,
  manufacturer_id UUID NOT NULL REFERENCES organizations(id),
  driver_name     TEXT,
  vehicle_no      TEXT,
  notes           TEXT,
  shipped_on      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS consignment_orders (
  consignment_id  UUID NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  PRIMARY KEY (consignment_id, order_id)
);
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS consignment_id UUID REFERENCES consignments(id) ON DELETE SET NULL;
