# 🚀 Deployment Guide v1.10 - Reusable Invite Codes

## 📋 Pre-Deployment Checklist

### ✅ Code Changes
- [ ] All TypeScript files compile without errors
- [ ] No ESLint warnings
- [ ] Tested locally in dev mode
- [ ] Tested PWA features (offline, sync)
- [ ] Verified category icon dropdown works
- [ ] Verified group invite toggle works
- [ ] Verified member display shows correctly

### ✅ Database
- [ ] Backup current database (if upgrading existing)
- [ ] Migration SQL ready: `MIGRATION_v1.10_REUSABLE_INVITE_CODES.sql`
- [ ] Supabase credentials confirmed

---

## 🗄️ Database Migration

### For Existing Databases (Upgrading from v1.9 or earlier)

1. **Backup Database First!**
   ```sql
   -- In Supabase SQL Editor
   -- Go to: SQL Editor → New Query → Backup
   ```

2. **Run Migration**
   ```bash
   # Navigate to docs folder
   cd docs
   
   # Open migration file
   # File: MIGRATION_v1.10_REUSABLE_INVITE_CODES.sql
   ```

3. **Execute in Supabase SQL Editor**
   - Go to: Supabase Dashboard → SQL Editor
   - Copy contents of `MIGRATION_v1.10_REUSABLE_INVITE_CODES.sql`
   - Click "Run"
   - Verify success message

4. **Verify Migration**
   ```sql
   -- Check that column exists
   SELECT 
       column_name, 
       data_type, 
       is_nullable, 
       column_default
   FROM information_schema.columns
   WHERE table_name = 'groups' 
       AND column_name = 'allow_new_members';
   
   -- Expected result:
   -- allow_new_members | boolean | NO | true
   ```

5. **Update RLS Policy**
   ```sql
   -- Drop old policy
   DROP POLICY IF EXISTS "Users can read groups" ON public.groups;
   
   -- Create new policy with allow_new_members check
   CREATE POLICY "Users can read groups"
   ON public.groups
   FOR SELECT
   USING (
     auth.uid() = owner_id
     OR
     (invite_code IS NOT NULL AND allow_new_members = TRUE)
   );
   ```

### For Fresh Install (New Project)

- Follow `SETUP.md` Step 3a
- Schema already includes `allow_new_members` field
- No migration needed

---

## 📦 Frontend Deployment

### 1. Build Production Bundle

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Preview build locally (optional)
pnpm preview
```

### 2. Environment Variables

Ensure these are set in your deployment platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI (if not already)
pnpm install -g vercel

# Deploy
vercel --prod

# Or link to existing project
vercel link
vercel --prod
```

### 4. Deploy to Netlify

```bash
# Install Netlify CLI (if not already)
pnpm install -g netlify-cli

# Build
pnpm build

# Deploy
netlify deploy --prod --dir=dist
```

---

## 🧪 Post-Deployment Testing

### Critical Paths

#### 1. Category Management
- [ ] Create new category with icon dropdown
- [ ] Edit existing category icon
- [ ] Verify icon selection works smoothly
- [ ] Confirm sync to Supabase

#### 2. Group Creation
- [ ] Create new group
- [ ] Verify invite code is generated
- [ ] Confirm `allow_new_members = true` by default
- [ ] Check member count shows "1 member" (owner)

#### 3. Group Access Control
- [ ] Toggle "Accept New Members" on/off
- [ ] Verify 🔓/🔒 icon changes
- [ ] Confirm sync to Supabase
- [ ] Verify badge updates

#### 4. Invite Code Reusability
- [ ] Copy invite code
- [ ] Join with first user → Success
- [ ] Join with second user (same code) → Success
- [ ] Toggle off "Allow New Members"
- [ ] Try joining with third user → Should fail with error
- [ ] Toggle back on → Join should work again

#### 5. Member Display
- [ ] Verify member count is correct
- [ ] Check member names display
- [ ] Confirm Owner badge shows for creator
- [ ] Test with 3+ members

#### 6. Backwards Compatibility
- [ ] Existing groups load correctly
- [ ] Old invite codes work (if any)
- [ ] No data loss from migration

---

## 🔍 Verification SQL Queries

### Check Groups Schema
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'groups'
ORDER BY ordinal_position;
```

### Verify All Groups Have allow_new_members
```sql
SELECT 
    id, 
    name, 
    allow_new_members,
    invite_code
FROM public.groups
WHERE allow_new_members IS NULL;

-- Should return 0 rows
```

### Check RLS Policies
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'groups';
```

### Test Group Join Query
```sql
-- Simulate what happens when user tries to join
SELECT *
FROM public.groups
WHERE invite_code = 'YOUR_CODE_HERE'
  AND allow_new_members = TRUE;

-- Should return group if code is valid and accepting members
```

---

## 🐛 Troubleshooting

### Issue: Migration Fails with "column already exists"

**Cause:** Migration was already run or column was manually added

**Solution:**
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'groups' 
  AND column_name = 'allow_new_members';

-- If exists, skip ADD COLUMN and just run:
UPDATE groups SET allow_new_members = true WHERE allow_new_members IS NULL;
ALTER TABLE groups ALTER COLUMN allow_new_members SET NOT NULL;
```

### Issue: Users can't join groups anymore

**Cause:** RLS policy still checks for `used_by_user_id IS NULL`

**Solution:**
```sql
-- Drop old policy
DROP POLICY IF EXISTS "Users can read groups" ON public.groups;

-- Recreate with new logic
CREATE POLICY "Users can read groups"
ON public.groups
FOR SELECT
USING (
  auth.uid() = owner_id
  OR
  (invite_code IS NOT NULL AND allow_new_members = TRUE)
);
```

### Issue: Member count shows 0

**Cause:** `group_members` table not populated correctly

**Solution:**
```sql
-- Check group_members table
SELECT gm.*, u.display_name, u.email
FROM group_members gm
LEFT JOIN users u ON u.id = gm.user_id
WHERE gm.group_id = 'your-group-id';

-- Ensure owner is in group_members
-- App should auto-add owner when creating group
```

### Issue: Toggle doesn't sync

**Cause:** Network issue or sync service error

**Solution:**
1. Check browser console for errors
2. Verify network tab shows PUT request to Supabase
3. Check RLS policy allows owner to update:
   ```sql
   -- Owners can update groups
   CREATE POLICY "Owners can update groups"
   ON public.groups
   FOR UPDATE
   USING (auth.uid() = owner_id)
   WITH CHECK (auth.uid() = owner_id);
   ```

### Issue: Frontend shows old code after migration

**Cause:** Browser cache

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear site data: DevTools → Application → Clear Storage
3. Unregister service worker: DevTools → Application → Service Workers → Unregister

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Database**
   - Query performance on `groups` table
   - Index usage on `allow_new_members`
   - RLS policy hit rate

2. **Frontend**
   - Category icon dropdown interaction rate
   - Group toggle usage
   - Join group success rate

3. **Errors**
   - Monitor for 403 (RLS violations)
   - Monitor for 409 (constraint violations)
   - Check Supabase logs for failed queries

---

## 🎯 Rollback Plan

If deployment fails:

### Database Rollback
```sql
-- Remove allow_new_members column
ALTER TABLE public.groups DROP COLUMN IF EXISTS allow_new_members;

-- Restore old RLS policy
DROP POLICY IF EXISTS "Users can read groups" ON public.groups;

CREATE POLICY "Users can read groups"
ON public.groups
FOR SELECT
USING (
  auth.uid() = owner_id
  OR
  (invite_code IS NOT NULL AND used_by_user_id IS NULL)
);
```

### Frontend Rollback
```bash
# Deploy previous version
git checkout v1.9.0  # or last stable tag
pnpm build
vercel --prod  # or netlify deploy --prod
```

---

## ✅ Sign-off Checklist

Before marking deployment as complete:

- [ ] All migration queries executed successfully
- [ ] RLS policies updated
- [ ] Frontend built and deployed
- [ ] Critical paths tested
- [ ] No errors in Supabase logs
- [ ] No console errors in browser
- [ ] PWA still installable
- [ ] Offline mode works
- [ ] Sync works both ways
- [ ] Documentation updated
- [ ] Team notified of changes

---

## 📞 Support

If issues arise during deployment:

1. Check this troubleshooting guide
2. Review `v1.10.0_RELEASE.md` for technical details
3. Check browser console for errors
4. Review Supabase logs
5. Open GitHub issue with:
   - Error message
   - SQL query that failed (if database)
   - Browser console logs (if frontend)
   - Steps to reproduce

---

**Deployment Version:** 1.10.0  
**Date:** 21 October 2025  
**Status:** Ready for Production ✅
