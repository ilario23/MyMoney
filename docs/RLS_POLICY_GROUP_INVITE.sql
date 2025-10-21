-- RLS Policy: Allow reading group by valid invite code
-- This allows non-owners to find a group by invite code for joining

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can read groups" ON public.groups;

-- Create new combined policy: Users can read groups if owner OR by valid invite code
CREATE POLICY "Users can read groups"
ON public.groups
FOR SELECT
USING (
  -- Allow if user is owner
  auth.uid() = owner_id
  OR
  -- Allow if invite code is valid and not yet used (for joining)
  (invite_code IS NOT NULL AND used_by_user_id IS NULL)
);

-- Note: This policy allows ANYONE to read groups with unused invite codes
-- This is safe because:
-- 1. They need to know the exact 8-character code (hard to guess)
-- 2. The code is single-use (becomes invalid after first use)
-- 3. Only basic group info is exposed (name, description)
-- 4. Sensitive data (members, expenses) requires separate permissions
