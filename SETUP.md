# ExpenseTracker PWA - Setup Guide

A mobile-first Progressive Web App for managing personal and shared expenses, built with React, Vite, TypeScript, Tailwind CSS, and ShadCN UI.

## 🎯 Features

### Version 1 (Personal)

- ✅ Secure registration and login (Supabase Auth)
- ✅ 8 default categories created automatically
- ✅ Add and manage personal expenses
- ✅ Customizable categories
- ✅ Dashboard with monthly summary
- ✅ Local import/export data
- ✅ Offline mode with Dexie cache
- ✅ Bidirectional sync with Supabase

### Version 2 (Multi-user)

- ✅ Group creation and management
- ✅ Shared expenses visible to all members
- ✅ Recurring expenses (editable only by creator)
- ✅ Group member CRUD operations
- ✅ Local notifications for invites and changes
- ✅ Bidirectional synchronization with Supabase

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + ShadCN UI
- **State Management**: Zustand
- **Local Database**: Dexie.js (IndexedDB)
- **Backend**: Supabase (Auth, PostgreSQL, Real-time)
- **PWA**: vite-plugin-pwa, Service Worker
- **Date Handling**: date-fns
- **UI Icons**: Lucide React
- **Animations**: Framer Motion

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Step 1: Clone and Install

```bash
git clone <repo>
cd frontend-starter-kit
pnpm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Setup Supabase Database

#### 3a. Create Tables

Go to **Supabase → SQL Editor** and run the following SQL in order:

⚠️ **IMPORTANT**: Execute SQL **in exact order** - some tables have foreign keys on others.

```sql
-- 1. Users table (no dependencies)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Groups table (depends on users)
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categories table (depends on users)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- 4. Expenses table (depends on users and groups)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Group members table (depends on groups and users)
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- 6. Shared expenses table (depends on groups, expenses, and users)
CREATE TABLE public.shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users(id),
  participants JSONB DEFAULT '[]',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create indexes per performance
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date);
CREATE INDEX idx_expenses_group ON public.expenses(group_id);
CREATE INDEX idx_categories_user ON public.categories(user_id);
CREATE INDEX idx_groups_owner ON public.groups(owner_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_shared_expenses_group ON public.shared_expenses(group_id);
```

**Creation order summary:**

1. ✅ `users` (no dependencies)
2. ✅ `groups` (FK → users)
3. ✅ `categories` (FK → users)
4. ✅ `expenses` (FK → users, groups)
5. ✅ `group_members` (FK → groups, users)
6. ✅ `shared_expenses` (FK → groups, expenses, users)
7. ✅ Indexes

#### 3b. Enable Row Level Security (RLS) Policies

**⚠️ CRITICAL**: RLS policies are required to prevent unauthorized access to user data.

In **Supabase → SQL Editor**, run:

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;

-- ====== USERS TABLE POLICIES ======
-- Users can read own record
CREATE POLICY "Users can read own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own record (NEW USERS at signup)
CREATE POLICY "Users can insert their own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update own record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ====== CATEGORIES TABLE POLICIES ======
-- Users can read own categories
CREATE POLICY "Users can read own categories"
ON public.categories
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create categories
CREATE POLICY "Users can create categories"
ON public.categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own categories
CREATE POLICY "Users can update own categories"
ON public.categories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete own categories
CREATE POLICY "Users can delete own categories"
ON public.categories
FOR DELETE
USING (auth.uid() = user_id);

-- ====== EXPENSES TABLE POLICIES ======
-- Users can read own expenses
CREATE POLICY "Users can read own expenses"
ON public.expenses
FOR SELECT
USING (auth.uid() = user_id OR group_id IN (
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
));

-- Users can create expenses
CREATE POLICY "Users can create expenses"
ON public.expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own expenses
CREATE POLICY "Users can update own expenses"
ON public.expenses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete own expenses
CREATE POLICY "Users can delete own expenses"
ON public.expenses
FOR DELETE
USING (auth.uid() = user_id);

-- ====== GROUPS TABLE POLICIES ======
-- Users can read own groups and groups they're members of
CREATE POLICY "Users can read groups"
ON public.groups
FOR SELECT
USING (
  auth.uid() = owner_id OR
  id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

-- Owners can create groups
CREATE POLICY "Users can create groups"
ON public.groups
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update own groups
CREATE POLICY "Owners can update groups"
ON public.groups
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Owners can delete groups
CREATE POLICY "Owners can delete groups"
ON public.groups
FOR DELETE
USING (auth.uid() = owner_id);

-- ====== GROUP MEMBERS TABLE POLICIES ======
-- Members can read group members
CREATE POLICY "Members can read group members"
ON public.group_members
FOR SELECT
USING (
  user_id = auth.uid() OR
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

-- Owners can manage members
CREATE POLICY "Owners can manage members"
ON public.group_members
FOR INSERT
WITH CHECK (
  group_id IN (SELECT id FROM public.groups WHERE owner_id = auth.uid())
);

-- ====== SHARED EXPENSES TABLE POLICIES ======
-- Members can read shared expenses
CREATE POLICY "Members can read shared expenses"
ON public.shared_expenses
FOR SELECT
USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

-- Members can create shared expenses
CREATE POLICY "Members can create shared expenses"
ON public.shared_expenses
FOR INSERT
WITH CHECK (
  creator_id = auth.uid() AND
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

-- Creators can update shared expenses
CREATE POLICY "Creators can update shared expenses"
ON public.shared_expenses
FOR UPDATE
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());
```

### Step 4: Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── expense/            # Expense-related components
│   ├── layout/             # Layout and navigation
│   ├── landing/            # Landing page
│   └── ui/                 # ShadCN UI components
├── pages/                  # Main pages
│   ├── dashboard.tsx       # Main dashboard
│   ├── login.tsx           # Login page
│   ├── signup.tsx          # Signup page
│   └── profile.tsx         # User profile
├── lib/                    # Utility functions
│   ├── dexie.ts           # Dexie schema and config
│   ├── auth.store.ts      # Auth state (Zustand)
│   ├── language.tsx       # i18n translations
│   └── supabase.ts        # Supabase client
├── hooks/                  # Custom React hooks
│   ├── useSync.ts         # Sync data
│   └── useTheme.ts        # Dark mode
├── services/               # Business logic
│   └── sync.service.ts    # Synchronization service
├── translations/           # i18n translations
│   ├── en.ts              # English
│   └── it.ts              # Italian
└── router.tsx             # Routing configuration
```

## 🔄 Synchronization

### Data Model

Each record has:

- `id` (uuid): Globally unique ID
- `updated_at`: Last modification timestamp
- `isSynced`: Local sync flag

### Sync Flow

1. **On login**: Auto-sync data from Supabase
2. **On demand**: Manual sync button
3. **On online**: Auto-sync when connection returns
4. **Offline**: Local cache with Dexie

### Conflict Resolution

**Local wins**: If local record is newer (`local.updated_at > remote.updated_at`), local version is kept.

## 🔐 Row Level Security (RLS)

RLS ensures users can only access their own data. The policies above implement:

- **users table**: Can only read/modify own profile
- **categories table**: Can only read/modify own categories
- **expenses table**: Can read own expenses + group expenses
- **groups table**: Can read own groups + member groups
- **group_members table**: Can read members of their groups
- **shared_expenses table**: Can read/create expenses in member groups

### Important Notes on RLS Policies

**⚠️ Common Mistakes:**

1. **Forgetting `TO authenticated`** - This is the main cause of 42501 errors at signup
2. **RLS not enabled** - Policies do nothing if RLS is disabled on the table
3. **Copy-paste errors** - Even small syntax mistakes will break policies

### Troubleshooting RLS

If you get foreign key constraint errors during sync:

1. **Verify user exists in Supabase**:

   ```sql
   SELECT * FROM public.users WHERE id = 'your-user-id';
   ```

2. **Check RLS is enabled**:
   - Go to **Table Editor → Select table → Check RLS toggle**

3. **If user creation fails at signup**:
   - Check browser console for error messages
   - Verify RLS policies allow INSERT on users table
   - Ensure auth.uid() matches the user ID being inserted

### RLS Policy Error: 42501 "violates row-level security policy"

If you get error **42501** during signup when creating user:

**Problem**: The INSERT policy is rejecting the new user record.

**Solution**: Make sure the policy includes `TO authenticated`:

```sql
-- WRONG - will cause 42501 error
CREATE POLICY "Users can insert"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- CORRECT - allows authenticated users to insert
CREATE POLICY "Users can insert"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**To fix it**:

1. Go to **Supabase Dashboard → Table Editor**
2. Select `users` table → Click "Policies" tab
3. Find the INSERT policy that causes the error
4. Click the policy name and verify it has `TO authenticated`
5. If not, delete it and recreate with:
   ```sql
   DROP POLICY "Users can insert their own record" ON public.users;
   
   CREATE POLICY "Users can insert their own record"
   ON public.users
   FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid() = id);
   ```

**Alternative**: If policies keep failing, temporarily disable RLS to test:

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Then test signup. If it works, re-enable RLS and debug the policy:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## 🌍 Multi-Language Support

The app supports English (EN) and Italian (IT).

**To add a new language:**

1. Create `src/translations/xx.ts` (replace `xx` with language code)
2. Copy structure from `it.ts` or `en.ts`
3. Update `src/translations/index.ts` to include new language
4. Update `src/lib/language.tsx` to add to language options

## 🌓 Dark Mode

Automatically supports:

- Light mode
- Dark mode
- System preference detection

Toggle via button in header.

## 📱 PWA Features

- ✅ Installable on mobile (home screen)
- ✅ Works offline
- ✅ Intelligent sync
- ✅ Background sync support
- ✅ Service Worker caching

### PWA Installation

**iOS**:

1. Open app in Safari
2. Tap Share → Add to Home Screen

**Android**:

1. Open app in Chrome
2. Tap menu (⋮) → Install app

## � Deployment

### Vercel

```bash
pnpm install -g vercel
vercel
```

### Netlify

```bash
pnpm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 📊 Development & Debugging

### Verbose Sync Logging

```typescript
const result = await syncService.sync({
  userId: user.id,
  verbose: true,
});
```

Monitor browser console for:

- `[Sync]` logs from sync service
- `[ServiceWorker]` logs from service worker

### Common Issues

#### Service Worker not registering

- Ensure app is served over HTTPS in production
- Check browser DevTools → Application → Service Workers

#### Dexie not persisting

- Verify IndexedDB is enabled in browser
- Check DevTools → Application → IndexedDB

#### Supabase auth failing

- Verify environment variables are correct
- Check Supabase project URL and anon key
- Ensure CORS is configured correctly

#### Foreign key constraint errors

- User must exist in `public.users` table
- Verify user is created at signup (check console logs)
- Confirm RLS policies allow INSERT on users table

#### RLS policy errors

- Ensure `auth.uid()` matches the inserted user ID
- Check that RLS is enabled on the table
- Verify policies are created correctly (see Step 3b)

## � Changelog

### v1.5.0 - Enhanced FK Constraint Handling

- Added detailed logging for user creation
- Improved error messages and diagnostics
- Fixed query issues in sync service
- Added comprehensive RLS policy documentation

### v1.4.2 - Offline Indicator

- Added offline/online status indicator
- Improved sync state monitoring

### v1.4 - Multi-Language Support

- Full English and Italian translations
- Language selector in profile
- i18n infrastructure

### v1.0 - Beta Release

- Core expense tracking
- Personal expense management
- Offline-first sync
- PWA support
- Dark mode

## 📞 Support & Troubleshooting

For issues or questions:

1. Check browser console for error messages
2. Review this SETUP.md troubleshooting section
3. Check Supabase SQL Editor for table/policy issues
4. Open an issue on GitHub with:
   - Error message from console
   - Steps to reproduce
   - Browser and OS version

## 📄 License

MIT License - see LICENSE file

---

**Built with ❤️ for expense tracking made simple**
