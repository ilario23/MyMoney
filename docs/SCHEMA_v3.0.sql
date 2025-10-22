-- ============================================================================
-- MyMoney v3.0 - Definitive Database Schema
-- ============================================================================
-- 
-- Purpose: Complete Supabase PostgreSQL schema for MyMoney v3.0
-- Architecture: Local-first with RxDB + Supabase sync
-- Features: RLS policies, soft deletes, automatic timestamps, indexes
-- 
-- Usage: Run this script ONCE in your Supabase SQL Editor
-- 
-- Last Updated: October 2025
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  default_currency TEXT DEFAULT 'EUR',
  language TEXT DEFAULT 'it',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID, -- NULL for personal categories
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📌',
  color TEXT DEFAULT '#3B82F6',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Hierarchical categories
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT categories_name_user_unique UNIQUE (user_id, name, group_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON categories(group_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Group members view group categories"
  ON categories FOR SELECT
  USING (
    group_id IS NOT NULL AND 
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  group_id UUID, -- NULL for personal expenses
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own expenses"
  ON expenses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Group members view group expenses"
  ON expenses FOR SELECT
  USING (
    group_id IS NOT NULL AND 
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  invite_code TEXT UNIQUE, -- Reusable invite code
  allow_new_members BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own groups"
  ON groups FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Members view their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "Anyone can view groups by invite code"
  ON groups FOR SELECT
  USING (invite_code IS NOT NULL AND allow_new_members = true);

-- ============================================================================
-- GROUP_MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT group_members_unique UNIQUE (group_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_deleted_at ON group_members(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group owners manage members"
  ON group_members FOR ALL
  USING (
    group_id IN (
      SELECT id FROM groups WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Members view group membership"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SHARED_EXPENSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS shared_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  split_method TEXT DEFAULT 'equal' CHECK (split_method IN ('equal', 'percentage', 'custom')),
  participants JSONB NOT NULL DEFAULT '[]', -- Array of {user_id, amount, settled}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT shared_expenses_expense_unique UNIQUE (expense_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shared_expenses_expense_id ON shared_expenses(expense_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_group_id ON shared_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_creator_id ON shared_expenses(creator_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_deleted_at ON shared_expenses(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members manage shared expenses"
  ON shared_expenses FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT
-- ============================================================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_expenses_updated_at
  BEFORE UPDATE ON shared_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING ONLY)
-- ============================================================================

-- Uncomment to create sample categories for testing:
/*
INSERT INTO categories (id, user_id, name, icon, color)
VALUES
  (uuid_generate_v4(), auth.uid(), 'Alimentari', '🍕', '#EF4444'),
  (uuid_generate_v4(), auth.uid(), 'Trasporti', '🚗', '#3B82F6'),
  (uuid_generate_v4(), auth.uid(), 'Casa', '🏠', '#8B5CF6'),
  (uuid_generate_v4(), auth.uid(), 'Salute', '💊', '#EC4899'),
  (uuid_generate_v4(), auth.uid(), 'Svago', '🎬', '#F97316')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables are created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check all triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SCHEMA COMPLETE ✅
-- ============================================================================
-- 
-- Your MyMoney v3.0 database is now ready!
-- 
-- Next steps:
-- 1. Configure your environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
-- 2. Start your frontend app (pnpm dev)
-- 3. Sign up and start tracking expenses!
-- 
-- ============================================================================
