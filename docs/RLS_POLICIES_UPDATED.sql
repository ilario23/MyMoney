/**
 * RLS POLICIES - Secure User Profile Access
 * 
 * Rules:
 * - Users can ONLY read/update their OWN profile
 * - No one can CREATE user profiles (managed by Supabase Auth only)
 * - DELETE is DISABLED - only soft-delete via UPDATE (deleted_at field)
 * - Categories and Expenses: same rules - soft-delete only
 */

-- ====== DROP OLD POLICIES ======
-- Users table
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Categories table
DROP POLICY IF EXISTS "Users can read own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

-- Expenses table
DROP POLICY IF EXISTS "Users can read own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

-- Stats_cache table
DROP POLICY IF EXISTS "Users can read own stats" ON public.stats_cache;
DROP POLICY IF EXISTS "Users can manage own stats" ON public.stats_cache;
DROP POLICY IF EXISTS "Users can update own stats" ON public.stats_cache;
DROP POLICY IF EXISTS "Users can delete own stats" ON public.stats_cache;

-- ====== RLS POLICIES FOR USERS TABLE ======
-- Only authenticated user can read their own profile
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Only authenticated user can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- DELETE is completely DISABLED - use soft-delete (UPDATE deleted_at) instead
-- No DELETE policy created intentionally

-- ====== RLS POLICIES FOR CATEGORIES TABLE ======
-- Only authenticated user can read their own categories
CREATE POLICY "Users can read own categories"
ON public.categories FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated user can create categories (and only for themselves)
CREATE POLICY "Users can create own categories"
ON public.categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated user can update their own categories
CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- DELETE is completely DISABLED - use soft-delete (UPDATE deleted_at) instead
-- No DELETE policy created intentionally

-- ====== RLS POLICIES FOR EXPENSES TABLE ======
-- Only authenticated user can read their own expenses
CREATE POLICY "Users can read own expenses"
ON public.expenses FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated user can create expenses (and only for themselves)
CREATE POLICY "Users can create own expenses"
ON public.expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated user can update their own expenses
CREATE POLICY "Users can update own expenses"
ON public.expenses FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- DELETE is completely DISABLED - use soft-delete (UPDATE deleted_at) instead
-- No DELETE policy created intentionally

-- ====== RLS POLICIES FOR STATS_CACHE TABLE ======
-- Only authenticated user can read their own stats
CREATE POLICY "Users can read own stats"
ON public.stats_cache FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated user can insert stats (and only for themselves)
CREATE POLICY "Users can insert own stats"
ON public.stats_cache FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated user can update their own stats
CREATE POLICY "Users can update own stats"
ON public.stats_cache FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- DELETE is completely DISABLED - use soft-delete (UPDATE deleted_at) instead
-- No DELETE policy created intentionally

/**
 * KEY CHANGES FROM PREVIOUS POLICIES:
 * 
 * 1. USERS Table:
 *    ✅ SELECT: Only read own profile (auth.uid() = id)
 *    ✅ UPDATE: Only update own profile (auth.uid() = id)
 *    ❌ INSERT: REMOVED - user profiles created by Supabase Auth only
 *    ❌ DELETE: DISABLED - physical deletion prevented
 * 
 * 2. CATEGORIES Table:
 *    ✅ SELECT: Only read own categories
 *    ✅ INSERT: Only create for self (auth.uid() = user_id in WITH CHECK)
 *    ✅ UPDATE: Only update own categories
 *    ❌ DELETE: DISABLED - use soft-delete via UPDATE deleted_at
 * 
 * 3. EXPENSES Table:
 *    ✅ SELECT: Only read own expenses
 *    ✅ INSERT: Only create for self (auth.uid() = user_id in WITH CHECK)
 *    ✅ UPDATE: Only update own expenses
 *    ❌ DELETE: DISABLED - use soft-delete via UPDATE deleted_at
 * 
 * 4. STATS_CACHE Table:
 *    ✅ SELECT: Only read own stats
 *    ✅ INSERT: Only create for self (auth.uid() = user_id in WITH CHECK)
 *    ✅ UPDATE: Only update own stats
 *    ❌ DELETE: DISABLED - use soft-delete via UPDATE deleted_at
 * 
 * SOFT-DELETE PATTERN:
 * Instead of DELETE, app should UPDATE with deleted_at timestamp:
 * 
 *   UPDATE public.categories 
 *   SET deleted_at = NOW(), updated_at = NOW()
 *   WHERE id = 'category-id' AND user_id = auth.uid();
 * 
 *   UPDATE public.expenses 
 *   SET deleted_at = NOW(), updated_at = NOW()
 *   WHERE id = 'expense-id' AND user_id = auth.uid();
 * 
 *   UPDATE public.stats_cache 
 *   SET deleted_at = NOW(), updated_at = NOW()
 *   WHERE id = 'stats-id' AND user_id = auth.uid();
 * 
 * Queries should FILTER OUT soft-deleted records:
 *   
 *   SELECT * FROM public.categories 
 *   WHERE user_id = auth.uid() AND deleted_at IS NULL;
 */
