-- ==============================================
-- MIGRATION: v1.12 - Group Shared Categories
-- ==============================================
-- Date: October 21, 2025
-- Description: Add group_id field to categories for shared group categories
-- Feature: Allow groups to have their own shared category sets
-- ==============================================

-- Step 1: Add group_id column to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Step 2: Create index for group categories queries
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON public.categories(group_id);

-- Step 3: Create composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_categories_user_group ON public.categories(user_id, group_id);

-- Step 4: Update RLS policies to allow group members to see group categories
-- Drop old policy
DROP POLICY IF EXISTS "Users can read own categories" ON public.categories;

-- Create new policy with group support
CREATE POLICY "Users can read own and group categories"
ON public.categories
FOR SELECT
USING (
  -- Personal categories (no group_id)
  (auth.uid() = user_id AND group_id IS NULL)
  OR
  -- Group categories where user is owner of the group
  (group_id IN (
    SELECT id FROM public.groups WHERE owner_id = auth.uid()
  ))
  OR
  -- Group categories where user is member of the group
  (group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  ))
);

-- ==============================================
-- VERIFY MIGRATION
-- ==============================================
-- Run this query to confirm the column was added:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'categories'
  AND column_name = 'group_id';

-- Verify indexes were created:
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'categories'
  AND indexname IN ('idx_categories_group_id', 'idx_categories_user_group');

-- Verify RLS policy:
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'categories'
  AND policyname = 'Users can read own and group categories';
