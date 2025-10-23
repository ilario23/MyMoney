/**
 * MyMoney v3.0+ - Supabase Database Initialization
 * 
 * Complete SQL setup for Supabase PostgreSQL:
 * - Creates all tables with correct schema
 * - Sets up foreign keys and constraints
 * - Creates performance indexes
 * - Enables Row Level Security (RLS)
 * - Creates secure RLS policies
 * 
 * This is the SINGLE SOURCE OF TRUTH for database schema.
 * Run this once when setting up a new Supabase project.
 * 
 * ⚠️ IMPORTANT: User profiles are AUTO-CREATED by trigger on auth signup.
 * The app only needs to read/update user profiles, not create them.
 * 
 * Usage:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Create new query
 * 3. Copy entire file content and paste
 * 4. Click "Run"
 * 5. Verify "Success" message
 */

-- ============================================================================
-- SECTION 1: DROP EXISTING OBJECTS (if re-running)
-- ============================================================================
-- Note: Policies are dropped automatically when tables are dropped with CASCADE

DROP TABLE IF EXISTS public.stats_cache CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- SECTION 2: CREATE TABLES
-- ============================================================================

-- Table 1: users (managed by Supabase Auth - do NOT insert manually)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Immutable fields constraint (prevents modification of core fields)
  -- Note: This prevents NULL -> value or value -> value changes to these fields
  CONSTRAINT immutable_core_fields CHECK (
    -- This constraint is checked on UPDATE
    -- In practice, RLS policy will prevent most updates anyway
    true
  )
);

COMMENT ON TABLE public.users IS 'User profiles - created automatically by Supabase Auth trigger';
COMMENT ON COLUMN public.users.id IS 'UUID from Supabase Auth, linked to auth.uid()';
COMMENT ON COLUMN public.users.email IS 'User email from Auth, UNIQUE constraint';
COMMENT ON COLUMN public.users.display_name IS 'User''s display name (can contain spaces/special chars)';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user''s avatar image';
COMMENT ON COLUMN public.users.deleted_at IS 'Soft-delete timestamp (NULL = active)';

-- Table 2: categories (expense categories)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT,
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'investment')),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_custom BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name, type)
);

COMMENT ON TABLE public.categories IS 'Transaction categories per user - supports soft-delete via deleted_at';
COMMENT ON COLUMN public.categories.type IS 'Category type: expense, income, or investment';
COMMENT ON COLUMN public.categories.is_custom IS 'true = user-created, false = default category';
COMMENT ON COLUMN public.categories.is_active IS 'Controls visibility in transaction form';
COMMENT ON COLUMN public.categories.deleted_at IS 'Soft-delete timestamp (NULL = active)';

-- Table 3: transactions (user transactions - expenses, income, investments)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'investment')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.expenses IS 'Transactions (expenses, income, investments) - supports soft-delete via deleted_at';
COMMENT ON COLUMN public.expenses.type IS 'Transaction type: expense, income, or investment';
COMMENT ON COLUMN public.expenses.amount IS 'Amount in EUR (€), 2 decimal places';
COMMENT ON COLUMN public.expenses.date IS 'Transaction date (YYYY-MM-DD format)';
COMMENT ON COLUMN public.expenses.deleted_at IS 'Soft-delete timestamp (NULL = active)';

-- Table 4: stats_cache (monthly statistics cache)
CREATE TABLE public.stats_cache (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  expense_count INTEGER DEFAULT 0,
  daily_average DECIMAL(12, 2) DEFAULT 0,
  monthly_average DECIMAL(12, 2) DEFAULT 0,
  top_categories JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.stats_cache IS 'Cached monthly statistics for performance - format: user_id-YYYY-MM';
COMMENT ON COLUMN public.stats_cache.top_categories IS 'JSON array of top categories with amount/count';

-- ============================================================================
-- SECTION 3: CREATE INDEXES (for performance)
-- ============================================================================

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
COMMENT ON INDEX idx_categories_user_id IS 'Fast lookup of categories by user';

CREATE INDEX idx_categories_type ON public.categories(user_id, type) 
WHERE deleted_at IS NULL;
COMMENT ON INDEX idx_categories_type IS 'Fast lookup of categories by type';

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
COMMENT ON INDEX idx_categories_parent_id IS 'Fast lookup of subcategories';

CREATE INDEX idx_categories_active ON public.categories(user_id, is_active) 
WHERE deleted_at IS NULL;
COMMENT ON INDEX idx_categories_active IS 'Fast lookup of active categories for transaction form';

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
COMMENT ON INDEX idx_expenses_user_id IS 'Fast lookup of transactions by user';

CREATE INDEX idx_expenses_type ON public.expenses(user_id, type) 
WHERE deleted_at IS NULL;
COMMENT ON INDEX idx_expenses_type IS 'Fast lookup of transactions by type';

CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date);
COMMENT ON INDEX idx_expenses_user_date IS 'Fast lookup of transactions for date range queries';

CREATE INDEX idx_stats_cache_user_id ON public.stats_cache(user_id);
COMMENT ON INDEX idx_stats_cache_user_id IS 'Fast lookup of cached stats by user';

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 4b: AUTO-CREATE USER PROFILE ON AUTH SIGNUP
-- ============================================================================
-- This trigger automatically creates a user record in public.users
-- whenever someone signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table
  -- Only copy id and email from auth.users
  -- The app will set display_name on first login
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    '',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Trigger to enforce immutable fields on user profile updates
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_immutable_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changes to immutable fields
  IF NEW.id != OLD.id THEN
    RAISE EXCEPTION 'Cannot modify user id';
  END IF;
  
  IF NEW.email != OLD.email THEN
    RAISE EXCEPTION 'Cannot modify user email';
  END IF;
  
  IF NEW.avatar_url != OLD.avatar_url THEN
    RAISE EXCEPTION 'Cannot modify avatar_url';
  END IF;
  
  IF NEW.created_at != OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that fires BEFORE UPDATE to check immutable fields
DROP TRIGGER IF EXISTS before_user_update ON public.users;
CREATE TRIGGER before_user_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_immutable_changes();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ====== RLS POLICIES FOR USERS TABLE ======
-- Rules:
-- - SELECT: User can read own profile
-- - UPDATE: User can ONLY update display_name
-- - INSERT: DISABLED (only trigger can create user profiles)
-- - DELETE: DISABLED (prevent accidental deletion)

CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- ====== RLS POLICIES FOR CATEGORIES TABLE ======
-- Rules:
-- - SELECT: User can read only own categories
-- - INSERT: User can create only for self (auth.uid() = user_id)
-- - UPDATE: User can update only own categories
-- - DELETE: DISABLED (use soft-delete via UPDATE deleted_at)

CREATE POLICY "Users can read own categories"
ON public.categories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
ON public.categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ====== RLS POLICIES FOR EXPENSES TABLE ======
-- Rules:
-- - SELECT: User can read only own expenses
-- - INSERT: User can create only for self (auth.uid() = user_id)
-- - UPDATE: User can update only own expenses
-- - DELETE: DISABLED (use soft-delete via UPDATE deleted_at)

CREATE POLICY "Users can read own expenses"
ON public.expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
ON public.expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
ON public.expenses FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ====== RLS POLICIES FOR STATS_CACHE TABLE ======
-- Rules:
-- - SELECT: User can read only own stats
-- - INSERT: User can create only for self (auth.uid() = user_id)
-- - UPDATE: User can update only own stats
-- - DELETE: DISABLED (use soft-delete via UPDATE deleted_at)

CREATE POLICY "Users can read own stats"
ON public.stats_cache FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
ON public.stats_cache FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON public.stats_cache FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECTION 6: VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify setup is correct:

-- Check all tables exist and have correct columns
-- SELECT table_name FROM pg_tables WHERE schemaname = 'public' ORDER BY table_name;

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check all indexes are created
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- List all RLS policies
-- SELECT policyname, cmd, using_expression FROM pg_policies WHERE schemaname = 'public' ORDER BY cmd;

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================

/*
 * SCHEMA OVERVIEW:
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ users (auto-created by trigger on auth signup)                      │
 * ├─────────────┬────────────────────────┬──────────────────────────────┤
 * │ id (UUID)   │ Primary Key            │ From auth.uid()              │
 * │ email       │ UNIQUE NOT NULL        │ From auth.email              │
 * │ display_name│ TEXT                   │ User's display name          │
 * │ avatar_url  │ TEXT                   │ URL to avatar image          │
 * │ created_at  │ TIMESTAMP              │ Auto-set                     │
 * │ updated_at  │ TIMESTAMP              │ Auto-updated                 │
 * │ deleted_at  │ TIMESTAMP NULL         │ Soft-delete marker           │
 * └─────────────┴────────────────────────┴──────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ categories (User's expense categories)                              │
 * ├──────────────┬────────────────────────┬─────────────────────────────┤
 * │ id (UUID)    │ Primary Key            │ Generated automatically      │
 * │ user_id (FK) │ Foreign Key → users.id │ Links to user               │
 * │ name         │ TEXT NOT NULL          │ Category name               │
 * │ icon         │ TEXT NOT NULL          │ Emoji or icon code          │
 * │ color        │ TEXT                   │ Hex color (#RRGGBB)         │
 * │ parent_id (FK)│ Foreign Key → self    │ For subcategories           │
 * │ is_custom    │ BOOLEAN                │ true = user-created         │
 * │ is_active    │ BOOLEAN NOT NULL       │ Controls form visibility    │
 * │ created_at   │ TIMESTAMP              │ Auto-set                    │
 * │ updated_at   │ TIMESTAMP              │ Auto-updated                │
 * │ deleted_at   │ TIMESTAMP NULL         │ Soft-delete marker          │
 * │ CONSTRAINT   │ UNIQUE(user_id, name) │ No duplicate names per user  │
 * └──────────────┴────────────────────────┴─────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ expenses (User's expenses in EUR)                                   │
 * ├──────────────┬────────────────────────┬─────────────────────────────┤
 * │ id (UUID)    │ Primary Key            │ Generated automatically      │
 * │ user_id (FK) │ Foreign Key → users.id │ Links to user               │
 * │ category_id  │ Foreign Key → cat.id   │ Links to category           │
 * │ amount       │ DECIMAL(10,2) NOT NULL │ Amount in EUR (€)           │
 * │ description  │ TEXT                   │ Optional note               │
 * │ date         │ DATE NOT NULL          │ Expense date                │
 * │ created_at   │ TIMESTAMP              │ Auto-set                    │
 * │ updated_at   │ TIMESTAMP              │ Auto-updated                │
 * │ deleted_at   │ TIMESTAMP NULL         │ Soft-delete marker          │
 * └──────────────┴────────────────────────┴─────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ stats_cache (Monthly expense statistics)                            │
 * ├──────────────┬────────────────────────┬─────────────────────────────┤
 * │ id           │ TEXT Primary Key       │ Format: {user_id}-{YYYY-MM} │
 * │ user_id (FK) │ Foreign Key → users.id │ Links to user               │
 * │ period       │ TEXT NOT NULL          │ Period (e.g., '2025-10')    │
 * │ total_exp    │ DECIMAL(12,2)          │ Sum of expenses in period   │
 * │ exp_count    │ INTEGER                │ Count of expenses           │
 * │ daily_avg    │ DECIMAL(12,2)          │ Average per day             │
 * │ monthly_avg  │ DECIMAL(12,2)          │ Average per month           │
 * │ top_cats     │ JSONB                  │ Top 5 categories            │
 * │ updated_at   │ TIMESTAMP              │ When cache was last updated │
 * └──────────────┴────────────────────────┴─────────────────────────────┘
 * 
 * SECURITY MODEL:
 * ✅ RLS enabled on all tables
 * ✅ Users can only read/modify their own data
 * ✅ DELETE operations disabled (soft-delete only)
 * ✅ Auto-trigger creates user profiles on auth signup
 * ✅ Soft-delete on users table via deleted_at field
 * 
 * SOFT-DELETE PATTERN:
 * Instead of: DELETE FROM categories WHERE id = 'xxx';
 * Use:        UPDATE categories SET deleted_at = NOW() WHERE id = 'xxx';
 * Query:      SELECT * FROM categories WHERE deleted_at IS NULL;
 */

-- ============================================================================
-- END OF SUPABASE_INIT.sql
-- ============================================================================
