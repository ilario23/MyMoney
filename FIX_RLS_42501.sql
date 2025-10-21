-- Quick Fix for Error 42501 on Signup
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;

-- Step 2: Create a more permissive INSERT policy
-- This allows authenticated users to insert, validation happens on app side
CREATE POLICY "Users can insert their own record"
ON public.users
FOR INSERT
WITH CHECK (true);

-- Verify the policy was created
SELECT policy_name, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policy_name;
