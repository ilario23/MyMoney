-- ==============================================
-- MIGRATION: v1.11 - Remove Currency Field
-- ==============================================
-- Date: October 21, 2025
-- Description: Remove currency field from expenses table
-- Reason: Simplify expense tracking - app now assumes single currency (EUR)
-- ==============================================

-- Step 1: Drop the currency column from expenses table
ALTER TABLE public.expenses DROP COLUMN IF EXISTS currency;

-- ==============================================
-- VERIFY MIGRATION
-- ==============================================
-- Run this query to confirm the column was removed:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'expenses'
ORDER BY ordinal_position;

-- Expected result: currency column should NOT appear in the list
