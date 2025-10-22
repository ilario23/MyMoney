# MyMoney v3.0 - Setup Guide

> **Version**: 3.0.0  
> **Architecture**: Local-First with RxDB + Supabase Sync  
> **Last Updated**: October 2025

---

## 🎯 Overview

MyMoney v3.0 is a modern expense tracking application built with a **local-first architecture**. All data lives in your browser using **RxDB** (powered by IndexedDB), with optional cloud synchronization via **Supabase**.

### Key Features

- ✨ **100% Offline-First** - Works without internet
- 🔄 **Real-time Sync** - Automatic bidirectional sync with Supabase
- ⚡ **Reactive UI** - Instant updates using RxDB observables
- 📊 **Local Statistics** - Client-side aggregations, no backend queries
- 🔐 **Row-Level Security** - Supabase RLS for data protection
- 🌍 **Multi-language** - Italian & English support
- 📱 **PWA** - Install as mobile/desktop app

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (recommended) or npm
- **Supabase Account** (free tier works perfectly)
- Modern browser with IndexedDB support

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/mymoney.git
cd mymoney
pnpm install
```

### 2. Setup Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API**
3. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment

Create `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Initialize Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the content from docs/SCHEMA_v3.0.sql
# Paste and run in Supabase SQL Editor
```

This will create:

- All tables with proper types
- Row-Level Security policies
- Triggers for `updated_at` automation
- Indexes for performance

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🗄️ Database Architecture

### Local Storage (RxDB)

**Location**: Browser IndexedDB  
**Purpose**: Primary data storage, works offline

**Collections**:

- `users` - User profiles and settings
- `categories` - Expense categories (hierarchical support)
- `expenses` - Individual expense records
- `groups` - Shared expense groups
- `group_members` - Group membership
- `shared_expenses` - Split expense details

### Cloud Storage (Supabase)

**Purpose**: Backup, sync across devices, collaboration

**Sync Strategy**:

- ✅ Automatic sync after login
- ✅ Background sync every 5 minutes (when online)
- ✅ Manual sync via UI button
- ✅ Conflict resolution using `updated_at` timestamp
- ✅ Soft deletes with `deleted_at` column

**Data Flow**:

```
Local RxDB ←→ Supabase PostgreSQL
    ↓
Client-side Stats (cached)
```

---

## 🔐 Authentication

### Supabase Auth Configuration

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Set redirect URLs:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

### User Flow

```
Sign Up → Email Verification → Auto Login → Sync Data
```

**First-time users**:

- Create account with email/password
- Default categories are created locally
- Data syncs to Supabase automatically

**Returning users**:

- Login → Pull latest data from Supabase
- Merge with local changes (if any)
- Continue working offline

---

## 📊 Statistics & Aggregations

All statistics are calculated **client-side** using `stats.service.ts`:

### Cached Calculations

- Monthly totals (income, expenses, savings)
- Category breakdowns with percentages
- Top 5 spending categories
- Monthly trends and comparisons
- Group expense summaries

### Cache Strategy

- Calculated on-demand
- Cached in memory for performance
- Invalidated on data changes
- No backend queries needed

### Benefits

- ⚡ Instant calculations (no network latency)
- 🔒 Privacy (data never leaves device for stats)
- 📴 Works offline
- 💰 Reduces Supabase database load

---

## 🛠️ Development

### Project Structure

```
src/
├── lib/
│   ├── rxdb.ts              # RxDB database initialization
│   ├── rxdb-schemas.ts      # JSON schemas for collections
│   ├── supabase.ts          # Supabase client
│   └── auth.store.ts        # Zustand auth store
├── services/
│   ├── sync.service.ts      # Supabase sync logic
│   └── stats.service.ts     # Client-side statistics
├── hooks/
│   ├── useRxDB.ts          # Access RxDB instance
│   ├── useRxQuery.ts       # Reactive queries
│   └── useSync.ts          # Sync state management
├── pages/
│   ├── login.tsx
│   ├── dashboard.tsx
│   ├── expenses.tsx
│   └── ...
└── components/
    ├── layout/
    ├── ui/
    └── expense/
```

### Key Files

**`src/lib/rxdb.ts`**

- Initializes RxDB database
- Creates collections from schemas
- Configures leader election (multi-tab)
- Sets up Dexie.js storage adapter

**`src/services/sync.service.ts`**

- Bidirectional sync with Supabase
- Conflict resolution
- Background sync scheduler
- Sync state notifications

**`src/services/stats.service.ts`**

- Local aggregations
- Memory caching
- Percentage calculations
- Trend analysis

### Adding a New Page

1. Create component in `src/pages/`
2. Use `useRxQuery` for reactive data:

```typescript
import { useRxDB, useRxQuery } from "@/hooks/useRxDB";

export function MyPage() {
  const db = useRxDB();
  const { data: expenseDocs, loading } = useRxQuery(() =>
    db.expenses.find({
      selector: { user_id: user.id, deleted_at: null },
      sort: [{ date: "desc" }],
    })
  );

  const expenses = useMemo(
    () => expenseDocs?.map((doc) => doc.toJSON()) || [],
    [expenseDocs]
  );

  // Your UI here
}
```

3. Add route to `src/router.tsx`

---

## 🔄 Sync Behavior

### Automatic Sync Triggers

1. **On Login** - Full sync of all user data
2. **Background** - Every 5 minutes (configurable)
3. **On Reconnect** - When coming back online
4. **After CRUD** - After create/update/delete operations

### Conflict Resolution

**Strategy**: Last Write Wins (LWW)

```
IF remote.updated_at > local.updated_at
  THEN use remote version
ELSE
  THEN use local version
```

### Soft Deletes

Records are never permanently deleted immediately:

- Set `deleted_at = NOW()`
- Sync delete to cloud
- Local garbage collection after 30 days (optional)

---

## 🧪 Testing

### Development Testing

```bash
# Run dev server
pnpm dev

# Run with HTTPS (for PWA testing)
pnpm dev --https

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Testing Offline Behavior

1. Open app in browser
2. Open DevTools → Network tab
3. Set to "Offline" mode
4. Continue using the app normally
5. Go back "Online"
6. Verify sync indicator shows success

### Testing Multi-Tab Sync

1. Open app in 2+ browser tabs
2. Create an expense in Tab 1
3. Verify it appears in Tab 2 instantly (via RxDB leader election)

---

## 🚢 Deployment

### Build for Production

```bash
pnpm build
```

Output: `dist/` folder ready for deployment

### Recommended Platforms

**Static Hosting** (PWA support):

- ✅ Vercel
- ✅ Netlify
- ✅ Cloudflare Pages
- ✅ GitHub Pages

### Deployment Checklist

- [ ] Set production `VITE_SUPABASE_URL`
- [ ] Set production `VITE_SUPABASE_ANON_KEY`
- [ ] Configure Supabase redirect URLs
- [ ] Enable HTTPS (required for PWA)
- [ ] Test PWA installation
- [ ] Test offline mode
- [ ] Verify sync functionality

---

## 🔒 Security

### Supabase Row-Level Security (RLS)

All tables have RLS policies:

```sql
-- Users can only see their own data
CREATE POLICY "Users manage own data"
  ON expenses FOR ALL
  USING (auth.uid() = user_id);
```

### Group Access Control

```sql
-- Members can access group data
CREATE POLICY "Group members access"
  ON expenses FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );
```

### Best Practices

- ✅ Never expose anon key in public repos (use `.env`)
- ✅ RLS policies enforce data isolation
- ✅ Supabase Auth handles JWT tokens
- ✅ HTTPS required for production

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"

**Solution**: Check your `.env` file and Supabase project status

### "Data not syncing"

**Solutions**:

1. Check browser console for errors
2. Verify you're logged in
3. Check internet connection
4. Try manual sync (click sync button)
5. Check Supabase RLS policies

### "App won't load offline"

**Solutions**:

1. Ensure you've visited the app online first
2. Check service worker is registered (DevTools → Application)
3. Clear cache and try again

### "Statistics not updating"

**Solution**: Statistics are cached in memory. Reload the page or trigger a sync.

---

## 📚 Additional Resources

- [Technical Documentation](./TECHNICAL_v3.0.md)
- [Migration Guide (v2.x → v3.0)](./MIGRATION_v3.0.md)
- [Changelog](./CHANGELOG_v3.0.md)
- [RxDB Documentation](https://rxdb.info/)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🤝 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@mymoney.app

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details

---

**Built with ❤️ using React, RxDB, and Supabase**
