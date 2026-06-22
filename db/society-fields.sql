-- ============================================================
-- Society fields for organizations (manufacturers + distributors)
-- Run this once in Supabase (SQL editor). Safe to re-run (idempotent).
-- ============================================================

-- A manufacturer belongs to / represents a society (e.g. "SANCHI").
-- A distributor records which society it is a member of via the same column.
-- is_exclusive = true means: only distributors of this society may sell its products.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS society_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN NOT NULL DEFAULT FALSE;

-- Helpful index for looking up distributors/manufacturers by society.
CREATE INDEX IF NOT EXISTS idx_organizations_society_code
  ON organizations (society_code);
