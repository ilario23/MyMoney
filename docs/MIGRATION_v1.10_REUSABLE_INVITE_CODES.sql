-- Migration v1.10: Reusable Invite Codes with Allow New Members Flag
-- This migration updates the groups table to support reusable invite codes
-- with a flag to control whether new members can join

-- Add allow_new_members column to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS allow_new_members BOOLEAN DEFAULT true;

-- Update existing groups to allow new members by default
UPDATE groups
SET allow_new_members = true
WHERE allow_new_members IS NULL;

-- Make allow_new_members NOT NULL
ALTER TABLE groups
ALTER COLUMN allow_new_members SET NOT NULL;

-- Add comment to explain the new field
COMMENT ON COLUMN groups.allow_new_members IS 'Controls whether the group accepts new members via invite code. Owner can toggle this flag.';

-- Optional: Add index for filtering groups accepting new members
CREATE INDEX IF NOT EXISTS idx_groups_allow_new_members ON groups(allow_new_members);

-- Note: The used_by_user_id and used_at columns are deprecated but kept for backwards compatibility
-- New invite code system allows multiple uses as long as allow_new_members is true
COMMENT ON COLUMN groups.used_by_user_id IS 'DEPRECATED - kept for backwards compatibility. Use group_members table instead.';
COMMENT ON COLUMN groups.used_at IS 'DEPRECATED - kept for backwards compatibility. Use group_members.joined_at instead.';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'groups' 
    AND column_name = 'allow_new_members';
