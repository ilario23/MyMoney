/**
 * Supabase Migration: Rename "expenses" table to "transactions"
 * 
 * IMPORTANT: Run this migration on existing Supabase projects to rename the
 * "expenses" table to "transactions" and update all related indexes and policies.
 * 
 * This migration:
 * 1. Drops existing RLS policies on expenses table
 * 2. Renames "expenses" table to "transactions"
 * 3. Renames all related indexes
 * 4. Creates new RLS policies on transactions table
 * 
 * BACKUP: This operation is non-destructive. Data is preserved.
 * 
 * Usage:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Create new query
 * 3. Copy entire file content and paste
 * 4. Click "Run"
 * 5. Verify "Success" message
 * 
 * If any error occurs, all changes will be rolled back automatically.
 */

BEGIN TRANSACTION;

-- ============================================================================
-- SECTION 1: DROP EXISTING RLS POLICIES
-- ============================================================================
-- Drop policies on expenses table so we can rename it

DROP POLICY IF EXISTS "Users can read own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;

-- ============================================================================
-- SECTION 2: RENAME TABLE
-- ============================================================================

ALTER TABLE public.expenses RENAME TO transactions;

-- ============================================================================
-- SECTION 3: RENAME INDEXES
-- ============================================================================

ALTER INDEX IF EXISTS idx_expenses_user_id RENAME TO idx_transactions_user_id;
ALTER INDEX IF EXISTS idx_expenses_type RENAME TO idx_transactions_type;
ALTER INDEX IF EXISTS idx_expenses_user_date RENAME TO idx_transactions_user_date;

-- ============================================================================
-- SECTION 4: UPDATE INDEX COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_transactions_user_id IS 'Fast lookup of transactions by user';
COMMENT ON INDEX idx_transactions_type IS 'Fast lookup of transactions by type';
COMMENT ON INDEX idx_transactions_user_date IS 'Fast lookup of transactions for date range queries';

-- ============================================================================
-- SECTION 5: UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.transactions IS 'Transactions (expenses, income, investments) - supports soft-delete via deleted_at';
COMMENT ON COLUMN public.transactions.type IS 'Transaction type: expense, income, or investment';
COMMENT ON COLUMN public.transactions.amount IS 'Amount in EUR (€), 2 decimal places';
COMMENT ON COLUMN public.transactions.date IS 'Transaction date (YYYY-MM-DD format)';
COMMENT ON COLUMN public.transactions.deleted_at IS 'Soft-delete timestamp (NULL = active)';

-- ============================================================================
-- SECTION 6: RECREATE RLS POLICIES WITH NEW TABLE NAME
-- ============================================================================

CREATE POLICY "Users can read own transactions"
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECTION 7: VERIFY MIGRATION
-- ============================================================================

-- These should all return results if migration was successful:

-- List transactions table columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'transactions' ORDER BY ordinal_position;

-- Check that old expenses table no longer exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'expenses';

-- Check RLS policies on transactions
-- SELECT policyname FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'transactions' ORDER BY policyname;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- If you see "Success" above, the migration completed successfully.
-- 
-- Next steps:
-- 1. Clear Dexie IndexedDB cache in browser (or app will auto-sync)
-- 2. Verify frontend app still works
-- 3. Check Supabase dashboard to confirm transactions table exists
-- 4. Monitor sync.service.ts logs for any sync errors
-- 
-- To rollback (if needed):
-- 1. Create new SQL query with opposite renames
-- 2. Rename transactions table back to expenses
-- 3. Rename indexes back to old names
-- 4. Recreate old expense RLS policies
--
