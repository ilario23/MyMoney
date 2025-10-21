-- Migration v1.7.0: Add hierarchical categories support
-- This migration adds parent_id field to categories table for tree structure

-- Step 1: Add parent_id column to categories table
ALTER TABLE categories
ADD COLUMN parent_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL;

-- Step 2: Add index for faster parent lookup
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Step 3: Add index for user hierarchies
CREATE INDEX idx_categories_user_parent ON categories(user_id, parent_id);

-- Step 4: Add check constraint to prevent circular references
-- (This is enforced at application level, but added as documentation)
-- Note: PostgreSQL doesn't support recursive CTEs in CHECK constraints
-- So we rely on app-level validation

-- Step 5: Update RLS policies (already permissive, no changes needed)
-- Categories RLS policies remain unchanged:
-- - SELECT: auth.uid() = user_id
-- - INSERT: WITH CHECK (true) -- app validates
-- - UPDATE: auth.uid() = user_id
-- - DELETE: auth.uid() = user_id

-- Step 6: Verify migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'categories'
      AND column_name = 'parent_id'
  ) THEN
    RAISE NOTICE '✅ Migration successful: parent_id column added';
  ELSE
    RAISE EXCEPTION '❌ Migration failed: parent_id column not found';
  END IF;
END $$;

-- Example queries for testing:
-- 1. Get all top-level categories (no parent)
-- SELECT * FROM categories WHERE user_id = auth.uid() AND parent_id IS NULL;

-- 2. Get children of a specific category
-- SELECT * FROM categories WHERE parent_id = 'some-uuid';

-- 3. Recursive query to get full category tree
-- WITH RECURSIVE category_tree AS (
--   -- Base case: top-level categories
--   SELECT id, name, parent_id, 0 as depth, ARRAY[name] as path
--   FROM categories
--   WHERE user_id = auth.uid() AND parent_id IS NULL
--   
--   UNION ALL
--   
--   -- Recursive case: children
--   SELECT c.id, c.name, c.parent_id, ct.depth + 1, ct.path || c.name
--   FROM categories c
--   INNER JOIN category_tree ct ON c.parent_id = ct.id
--   WHERE c.user_id = auth.uid()
-- )
-- SELECT * FROM category_tree ORDER BY path;

COMMIT;
