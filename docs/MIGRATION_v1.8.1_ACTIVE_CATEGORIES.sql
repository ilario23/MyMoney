-- Migration v1.8.1: Add isActive field to categories
-- Date: October 21, 2025
-- Purpose: Allow categories to be hidden from expense form without breaking hierarchy

-- Add isActive column (default TRUE for existing categories)
ALTER TABLE public.categories
ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Create index for active categories filtering
CREATE INDEX idx_categories_active ON public.categories(user_id, is_active);

-- Optional: Add comment for documentation
COMMENT ON COLUMN public.categories.is_active IS 'FALSE = hidden from expense form but still visible in hierarchy (e.g., "America 2025" trip after completion)';

-- Verify migration
SELECT id, name, parent_id, is_active, created_at
FROM public.categories
ORDER BY created_at DESC
LIMIT 10;
