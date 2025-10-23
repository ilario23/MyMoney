-- ============================================================================
-- Supabase Migration: Remove Groups, Shared Expenses - Keep only Users, Categories, Expenses
-- ============================================================================
-- This migration cleans up the database to match the new Dexie-based app
-- that no longer uses groups or shared expenses

-- Step 1: Drop RLS Policies on tables to be deleted
-- ============================================================================

-- Drop all policies on group_members table
DROP POLICY IF EXISTS "read_group_members" ON group_members;
DROP POLICY IF EXISTS "insert_group_members" ON group_members;
DROP POLICY IF EXISTS "update_group_members" ON group_members;
DROP POLICY IF EXISTS "delete_group_members" ON group_members;

-- Drop all policies on groups table
DROP POLICY IF EXISTS "read_groups" ON groups;
DROP POLICY IF EXISTS "insert_groups" ON groups;
DROP POLICY IF EXISTS "update_groups" ON groups;
DROP POLICY IF EXISTS "delete_groups" ON groups;

-- Drop all policies on shared_expenses table
DROP POLICY IF EXISTS "read_shared_expenses" ON shared_expenses;
DROP POLICY IF EXISTS "insert_shared_expenses" ON shared_expenses;
DROP POLICY IF EXISTS "update_shared_expenses" ON shared_expenses;
DROP POLICY IF EXISTS "delete_shared_expenses" ON shared_expenses;

-- Drop all policies on shared_expense_splits table
DROP POLICY IF EXISTS "read_shared_expense_splits" ON shared_expense_splits;
DROP POLICY IF EXISTS "insert_shared_expense_splits" ON shared_expense_splits;
DROP POLICY IF EXISTS "update_shared_expense_splits" ON shared_expense_splits;
DROP POLICY IF EXISTS "delete_shared_expense_splits" ON shared_expense_splits;

-- Step 2: Drop tables (in correct order due to foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS shared_expense_splits CASCADE;
DROP TABLE IF EXISTS shared_expenses CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Step 3: Update/Create RLS Policies for remaining tables
-- ============================================================================

-- Ensure users table has proper RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can delete own data" ON users;

-- Create new policies
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own data"
ON users FOR DELETE
USING (auth.uid() = id);

-- Categories table RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

CREATE POLICY "Users can read own categories"
ON categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON categories FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON categories FOR DELETE
USING (auth.uid() = user_id);

-- Expenses table RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "Users can read own expenses"
ON expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
ON expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
ON expenses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
ON expenses FOR DELETE
USING (auth.uid() = user_id);

-- Stats cache table RLS
ALTER TABLE stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own stats" ON stats_cache;
DROP POLICY IF EXISTS "Users can insert own stats" ON stats_cache;
DROP POLICY IF EXISTS "Users can update own stats" ON stats_cache;
DROP POLICY IF EXISTS "Users can delete own stats" ON stats_cache;

CREATE POLICY "Users can read own stats"
ON stats_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
ON stats_cache FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON stats_cache FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stats"
ON stats_cache FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Done! Database is now aligned with Dexie-based app
-- ============================================================================
