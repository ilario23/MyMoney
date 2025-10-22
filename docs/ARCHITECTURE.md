# 🏗️ MyMoney v3.0 - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    React 19 + TypeScript                    │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   Dashboard  │  │   Expenses   │  │    Groups    │    │ │
│  │  │     Page     │  │     Page     │  │     Page     │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  │         │                  │                  │             │ │
│  │         └──────────────────┼──────────────────┘             │ │
│  │                            │                                │ │
│  │                   ┌────────▼────────┐                       │ │
│  │                   │  useRxQuery()   │                       │ │
│  │                   │   Hook Layer    │                       │ │
│  │                   └────────┬────────┘                       │ │
│  │                            │                                │ │
│  └────────────────────────────┼────────────────────────────────┘ │
│                               │                                  │
│  ┌────────────────────────────▼────────────────────────────────┐ │
│  │               RxDB 16.20 (Observable Database)              │ │
│  │                                                              │ │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐│ │
│  │  │  users   │ │categories │ │ expenses │ │    groups    ││ │
│  │  │collection│ │collection │ │collection│ │  collection  ││ │
│  │  └──────────┘ └───────────┘ └──────────┘ └──────────────┘│ │
│  │                                                              │ │
│  │  ┌───────────────┐ ┌──────────────────┐                   │ │
│  │  │group_members  │ │ shared_expenses  │                   │ │
│  │  │  collection   │ │   collection     │                   │ │
│  │  └───────────────┘ └──────────────────┘                   │ │
│  │                                                              │ │
│  │              Storage: IndexedDB (Browser)                   │ │
│  └────────────────────────────┬─────────────────────────────────┘ │
│                               │                                  │
│  ┌────────────────────────────▼────────────────────────────────┐ │
│  │                   Services Layer                             │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │Sync Service  │  │Stats Service │  │Notification  │    │ │
│  │  │(Replication) │  │(Local Calc)  │  │   Service    │    │ │
│  │  └──────┬───────┘  └──────────────┘  └──────────────┘    │ │
│  │         │                                                   │ │
│  │         │ Bidirectional Sync                               │ │
│  └─────────┼───────────────────────────────────────────────────┘ │
│            │                                                     │
│            │ HTTPS/REST                                         │
└────────────┼─────────────────────────────────────────────────────┘
             │
             │
┌────────────▼─────────────────────────────────────────────────────┐
│                         CLOUD (Supabase)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   PostgreSQL Database                        │ │
│  │                                                              │ │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────┐│ │
│  │  │  users  │  │categories│  │expenses │  │   groups    ││ │
│  │  │  table  │  │  table   │  │  table  │  │    table    ││ │
│  │  └─────────┘  └──────────┘  └─────────┘  └─────────────┘│ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌─────────────────┐                    │ │
│  │  │group_members │  │shared_expenses  │                    │ │
│  │  │    table     │  │     table       │                    │ │
│  │  └──────────────┘  └─────────────────┘                    │ │
│  │                                                              │ │
│  │  Features:                                                   │ │
│  │  • Row Level Security (RLS)                                │ │
│  │  • Auto-updated_at triggers                                │ │
│  │  • Soft deletes (deleted_at)                               │ │
│  │  • Foreign key constraints                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Supabase Auth (JWT)                        │ │
│  │             Email/Password Authentication                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Read Flow (Query)

```
User opens page
     ↓
Component calls useRxQuery()
     ↓
RxDB queries local IndexedDB
     ↓
Observable emits data
     ↓
Component auto-rerenders
     ↓
UI updates instantly
```

### 2. Write Flow (CRUD)

```
User creates/updates expense
     ↓
Component calls db.expenses.insert()
     ↓
Data saved to IndexedDB
     ↓
Observable emits change
     ↓
All subscribed components auto-update
     ↓
Sync service pushes to Supabase (background)
```

### 3. Sync Flow

```
App starts
     ↓
User authenticates
     ↓
Sync service starts replication
     ↓
┌─────────────────┐
│  PULL (Remote)  │
│ Supabase → RxDB │
└─────────────────┘
     ↓
Fetch remote changes (updated_at > lastSync)
     ↓
Merge into local RxDB (conflict resolution)
     ↓
┌─────────────────┐
│  PUSH (Local)   │
│ RxDB → Supabase │
└─────────────────┘
     ↓
Send local unsynced changes
     ↓
Update Supabase with check-then-upsert
     ↓
Mark as synced (isSynced: true)
```

---

## Component Architecture

```
src/
├── pages/                    # Route-level components
│   ├── dashboard.tsx         # ← useRxQuery(expenses, categories)
│   ├── expenses.tsx          # ← useRxQuery(expenses)
│   ├── groups.tsx            # ← useRxQuery(groups, group_members)
│   └── shared-expenses.tsx   # ← useRxQuery(shared_expenses, expenses, groups)
│
├── hooks/
│   ├── useRxDB.ts            # RxDB database access
│   ├── useRxQuery.ts         # Reactive query hook (auto-rerender)
│   └── useSync.ts            # Sync status and manual trigger
│
├── services/
│   ├── sync.service.ts       # Bidirectional replication (Pull/Push)
│   ├── stats.service.ts      # Client-side statistics with cache
│   └── notifications.ts      # PWA notification service
│
├── lib/
│   ├── rxdb.ts               # RxDB initialization & collections
│   ├── rxdb-schemas.ts       # JSON schemas for all entities
│   ├── supabase.ts           # Supabase client
│   ├── auth.store.ts         # Zustand auth state
│   ├── logger.ts             # Centralized logging
│   └── env.ts                # Environment validation
│
└── components/
    ├── error-boundary.tsx    # Global error catcher
    ├── expense/
    │   └── expense-form.tsx  # Direct RxDB writes
    └── layout/
        └── sync-indicator.tsx # Sync status UI
```

---

## State Management

### Local State (RxDB)

```typescript
// Reactive query - auto-updates on changes
const expenses = useRxQuery(() =>
  db.expenses.find({
    selector: { user_id: userId, deleted_at: null },
  })
);

// expenses automatically updates when:
// - New expense inserted
// - Existing expense modified
// - Expense soft-deleted
// - Remote sync pulls changes
```

### Global State (Zustand)

```typescript
// Only for non-database state
-useAuthStore() - // Auth session
  useLanguage() - // UI language
  useTheme(); // Dark/light mode
```

---

## Offline-First Strategy

```
┌─────────────────────┐
│   User Action       │
│  (Create expense)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Write to RxDB      │ ← Always succeeds (local)
│  (IndexedDB)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  UI Updates         │ ← Instant feedback
│  (Reactive)         │
└──────────┬──────────┘
           │
           ▼
     ┌─────────┐
     │ Online? │
     └────┬────┘
      Yes │ No
          │ └──────► Queue for later
          ▼
┌─────────────────────┐
│  Sync to Supabase   │
│  (Background)       │
└─────────────────────┘
```

---

## Security Architecture

### Client (RxDB)

- No authentication required
- All data stored locally
- Isolated by browser profile

### Server (Supabase)

- JWT authentication
- Row Level Security (RLS)
- User can only access their own data
- Group members can access shared data

### RLS Policy Example

```sql
-- Users can only see their own expenses
CREATE POLICY "Users manage own expenses"
ON expenses FOR ALL
USING (auth.uid() = user_id);

-- Group members can see group expenses
CREATE POLICY "Group members view group expenses"
ON expenses FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid()
  )
);
```

---

## Performance Optimizations

### 1. Client-Side Statistics

```typescript
// ❌ Old: Query Supabase views
const stats = await supabase.from("expense_stats").select("*");

// ✅ New: Calculate locally with cache
const stats = await statsService.getMonthlyStats(userId, year, month);
// Cached for 5 minutes
```

### 2. Reactive Queries

```typescript
// ❌ Old: Manual refetch
useEffect(() => {
  fetchExpenses();
}, [userId, month]);

// ✅ New: Auto-updates
const expenses = useRxQuery(() =>
  db.expenses.find({ selector: { user_id: userId } })
);
// No useEffect needed!
```

### 3. Indexes

```typescript
// RxDB indexes for fast queries
indexes: ['user_id', 'date', 'category_id', 'deleted_at']

// Supabase composite indexes
CREATE INDEX idx_expenses_user_date
ON expenses(user_id, date DESC)
WHERE deleted_at IS NULL;
```

---

## Multi-Tab Coordination

```
Tab 1                Tab 2                Tab 3
  │                    │                    │
  ├──► Leader Election ◄─────────────────────┤
  │                    │                    │
  │ (Becomes Leader)   │                    │
  │                    │                    │
  ├──► Start Sync      │                    │
  │                    │                    │
  ├──► BroadcastChannel ───────────────────►│
  │         "SYNC_STARTED"                  │
  │                    │                    │
  │                    ├──► Pause sync      │
  │                    │                    ├──► Pause sync
  │                    │                    │
  ├──► Complete Sync   │                    │
  │                    │                    │
  ├──► BroadcastChannel ───────────────────►│
           "SYNC_COMPLETE"                  │
```

---

**Last Updated**: October 2025 | **Version**: 3.0.0
