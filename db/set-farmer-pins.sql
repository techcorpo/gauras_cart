-- =====================================================================
-- Set all FARMER accounts to use PIN = 1234  (4-digit login)
-- Safe to run multiple times. Run in Supabase SQL Editor.
-- The hash below is bcrypt for "1234" (verified).
-- =====================================================================

UPDATE users
SET password_hash = '$2a$10$o8xwi2xiyOzX60gE753DH.yPsSB1Y883y6ZYhyd8D/xm.QB0wqhee'
WHERE role = 'farmer';

-- After this, every farmer logs in with their mobile number + PIN 1234.
-- (Other roles keep their existing passwords.)
