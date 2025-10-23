# 🗄️ SQL Files Organization

**Source of Truth**: `SUPABASE_INIT.sql`

## 📋 File Structure

### `SUPABASE_INIT.sql` ✅ PRIMARY

**The SINGLE SOURCE OF TRUTH** for all database setup.

**Contains**:

- ✅ Table creation (users, categories, expenses, stats_cache)
- ✅ Foreign keys and constraints
- ✅ Performance indexes (6 indexes)
- ✅ RLS enable on all tables
- ✅ All RLS policies (12 total)
- ✅ Comments and documentation
- ✅ Verification queries (commented)

**How to use**:

1. Go to Supabase → SQL Editor
2. Create new query
3. Copy entire `SUPABASE_INIT.sql` content
4. Click "Run"
5. Done! ✅

**Size**: ~500 lines (well-organized with clear sections)

---

### `SUPABASE_SETUP.md` (Guides reference this)

Step-by-step setup guide that **references** `SUPABASE_INIT.sql`.

Contains also:

- Environment variables setup
- Supabase account creation steps
- Authentication setup
- Troubleshooting guide

---

### `RLS_POLICIES_UPDATED.sql` (Deprecated)

⚠️ **Kept for reference only**

- Contains only DROP + CREATE policies
- Useful if you already have tables and just need to update policies
- Use this ONLY if migrating existing database
- For fresh setup, use `SUPABASE_INIT.sql` instead

---

### `RLS_SECURITY_UPDATE.md` (Migration guide)

Documentation about RLS changes and how to migrate.

- Explains breaking changes
- Soft-delete pattern
- Troubleshooting

---

### `RLS_IMPLEMENTATION_COMPLETE.md` (Summary)

Summary of RLS security implementation.

- What changed from v3.0 to v3.2
- Security improvements table
- Testing procedures

---

## 🎯 When to Use Each File

### Fresh Supabase Project

✅ Use: `SUPABASE_INIT.sql`

```
1. Create Supabase project
2. Go to SQL Editor
3. Paste SUPABASE_INIT.sql
4. Run
5. Done!
```

### Already Have Tables, Just Need RLS Update

✅ Use: `RLS_POLICIES_UPDATED.sql`

```
1. Go to SQL Editor
2. Paste RLS_POLICIES_UPDATED.sql
3. Run
4. Done!
```

### Need Setup Instructions

✅ Read: `SUPABASE_SETUP.md`

---

## 📊 What's in SUPABASE_INIT.sql

```
SECTION 1: DROP EXISTING OBJECTS (safe if re-running)
  └─ Drop all policies first
  └─ Drop all tables

SECTION 2: CREATE TABLES
  ├─ users table
  ├─ categories table
  ├─ expenses table
  └─ stats_cache table
  └─ All with columns, constraints, defaults

SECTION 3: CREATE INDEXES
  ├─ idx_categories_user_id
  ├─ idx_categories_parent_id
  ├─ idx_categories_active (filtered)
  ├─ idx_expenses_user_id
  ├─ idx_expenses_user_date
  └─ idx_stats_cache_user_id

SECTION 4: ENABLE RLS
  ├─ RLS ON users
  ├─ RLS ON categories
  ├─ RLS ON expenses
  └─ RLS ON stats_cache

SECTION 5: RLS POLICIES
  ├─ Users table: 2 policies (SELECT, UPDATE)
  ├─ Categories table: 3 policies (SELECT, INSERT, UPDATE)
  ├─ Expenses table: 3 policies (SELECT, INSERT, UPDATE)
  └─ Stats_cache table: 3 policies (SELECT, INSERT, UPDATE)

SECTION 6: VERIFICATION QUERIES
  └─ Commented queries to verify setup

SECTION 7: DOCUMENTATION
  └─ Complete schema documentation with comments
```

---

## ✅ Verification After Running SUPABASE_INIT.sql

Paste these in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name FROM pg_tables
WHERE schemaname = 'public'
ORDER BY table_name;
-- Should show: categories, expenses, stats_cache, users

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Should show: true for all 4 tables

-- Check indexes created
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;
-- Should show: 6 indexes (idx_categories_*, idx_expenses_*, idx_stats_cache_*)

-- Check policies created
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
ORDER BY cmd;
-- Should show: 12 policies (2 for users, 3 for categories, 3 for expenses, 3 for stats)
```

---

## 🔄 Migration Path (If Upgrading)

**From v3.0 → v3.1+**:

1. Back up your Supabase (export via Dashboard)
2. Run `RLS_POLICIES_UPDATED.sql` to update policies
3. No table changes needed

**From scratch**:

1. Create new Supabase project
2. Run `SUPABASE_INIT.sql` once
3. Done!

---

## 📝 Notes

- **All SQL in `SUPABASE_INIT.sql` is idempotent** (safe to run multiple times)
- **DROP TABLE IF EXISTS CASCADE** prevents errors if re-running
- **Comments in SQL** explain each section
- **Soft-delete pattern** used throughout (deleted_at field)
- **RLS enabled** on all tables (strict security)

---

## 🎓 Understanding the Schema

See `SUPABASE_INIT.sql` Section 6 for ASCII diagrams of each table.

Or use this summary:

```
users
├─ id (UUID) ← From Supabase Auth
├─ email
├─ display_name
└─ avatar_url

categories
├─ id (UUID)
├─ user_id (FK → users)
├─ name
├─ icon + color
├─ parent_id (self-reference for subcategories)
├─ is_custom (true = user-created)
├─ is_active (controls form visibility)
└─ deleted_at (soft-delete)

expenses
├─ id (UUID)
├─ user_id (FK → users)
├─ category_id (FK → categories)
├─ amount (EUR/€)
├─ description
├─ date
└─ deleted_at (soft-delete)

stats_cache
├─ id (TEXT: {user_id}-{YYYY-MM})
├─ user_id (FK → users)
├─ period (YYYY-MM)
├─ total_expenses
├─ expense_count
├─ daily_average + monthly_average
└─ top_categories (JSON)
```

---

**Status**: ✅ Ready for Production

Last Updated: October 23, 2025
