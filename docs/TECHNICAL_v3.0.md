# 🔧 MyMoney v3.0 - Technical Documentation

Complete technical reference for the RxDB reactive architecture.

**Version**: 3.0.0 | **Updated**: October 2025

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [RxDB Database](#rxdb-database)
3. [Reactive Queries](#reactive-queries)
4. [Sync Service](#sync-service)
5. [Statistics Service](#statistics-service)
6. [Multi-Tab Coordination](#multi-tab-coordination)
7. [Performance](#performance)
8. [Best Practices](#best-practices)

---

## 🏗️ Architecture Overview

### Stack Layers

```
┌──────────────────────────────────────────┐
│           React Components               │ ← UI Layer
│  - useRxQuery hook for subscriptions     │
│  - Automatic re-renders on data changes  │
└────────────────┬─────────────────────────┘
                 │ Observables (RxJS)
┌────────────────▼─────────────────────────┐
│          RxDB Collections                │ ← Data Layer
│  - users, categories, expenses           │
│  - groups, group_members, shared_expenses│
│  - Reactive queries with selectors       │
└────────────────┬─────────────────────────┘
                 │ Replication Protocol
┌────────────────▼─────────────────────────┐
│         Sync Service                     │ ← Sync Layer
│  - Bidirectional replication             │
│  - Conflict resolution (timestamp-based) │
│  - Leader election coordination          │
└────────────────┬─────────────────────────┘
                 │ REST API + Real-time
┌────────────────▼─────────────────────────┐
│         Supabase Backend                 │ ← Backend Layer
│  - PostgreSQL with RLS                   │
│  - Authentication (JWT)                  │
│  - Real-time subscriptions               │
└──────────────────────────────────────────┘
```

### Key Principles

1. **Local-First**: All data stored locally in RxDB (IndexedDB)
2. **Reactive**: Components subscribe to observables, auto-update
3. **Offline-First**: Full functionality without internet
4. **Eventual Consistency**: Changes sync when online

---

## 💾 RxDB Database

### Initialization

**File**: `src/lib/rxdb.ts`

```typescript
import { createRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

export async function initDatabase() {
  const db = await createRxDatabase({
    name: "mymoney",
    storage: getRxStorageDexie(),
    multiInstance: true, // Multi-tab support
    eventReduce: true, // Performance optimization
    ignoreDuplicate: true,
  });

  // Add collections
  await db.addCollections({
    users: { schema: userSchema },
    categories: { schema: categorySchema },
    expenses: { schema: expenseSchema },
    groups: { schema: groupSchema },
    group_members: { schema: groupMemberSchema },
    shared_expenses: { schema: sharedExpenseSchema },
  });

  return db;
}
```

### Collection Schemas

All schemas follow this pattern:

```typescript
const expenseSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    user_id: { type: "string" },
    category_id: { type: "string" },
    group_id: { type: ["string", "null"] },
    amount: { type: "number" },
    description: { type: "string" },
    date: { type: "string" },
    type: { type: "string", enum: ["expense", "income"] },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    deleted_at: { type: ["string", "null"] },
  },
  required: ["id", "user_id", "amount", "date", "type"],
  indexes: ["user_id", "date", "category_id", "deleted_at"],
};
```

**Key Points**:

- `primaryKey: 'id'` - UUID primary key
- `indexes` - Optimized for common queries
- `deleted_at` - Soft delete pattern
- Snake_case fields matching Supabase

---

## 🔄 Reactive Queries

### useRxQuery Hook

**File**: `src/lib/rxdb.ts`

```typescript
export function useRxQuery<T>(
  queryConstructor: () => RxQuery | null
): T[] | null {
  const [result, setResult] = useState<T[] | null>(null);

  useEffect(() => {
    const query = queryConstructor();
    if (!query) return;

    // Subscribe to observable
    const subscription = query.$.subscribe((docs: RxDocument[]) => {
      setResult(docs.map((doc) => doc.toJSON() as T));
    });

    return () => subscription.unsubscribe();
  }, [queryConstructor]);

  return result;
}
```

### Usage Pattern

```typescript
// In React component
const expenses = useRxQuery(() =>
  db.expenses.find({
    selector: {
      user_id: userId,
      deleted_at: null,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    },
    sort: [{ date: "desc" }],
  })
);

// expenses is automatically updated when:
// - New expense added
// - Existing expense modified
// - Expense deleted (soft)
// - Sync pulls remote changes
```

### Advanced Queries

```typescript
// Join-like query (categories with expenses)
const categories = useRxQuery(() =>
  db.categories.find({
    selector: { user_id: userId, deleted_at: null },
  })
);

const categoryExpenses = useMemo(() => {
  if (!categories || !expenses) return [];

  return categories.map((cat) => ({
    ...cat,
    expenses: expenses.filter((e) => e.category_id === cat.id),
    total: expenses
      .filter((e) => e.category_id === cat.id)
      .reduce((sum, e) => sum + e.amount, 0),
  }));
}, [categories, expenses]);
```

---

## 🔄 Sync Service

### Bidirectional Replication

**File**: `src/services/sync.service.ts`

```typescript
class SyncService {
  private isLeader = false;

  async startSync(userId: string) {
    // 1. Elect leader (multi-tab coordination)
    await this.electLeader();

    if (this.isLeader) {
      // 2. Start bidirectional sync
      await Promise.all([
        this.syncExpenses(userId),
        this.syncCategories(userId),
        this.syncGroups(userId),
        this.syncGroupMembers(userId),
        this.syncSharedExpenses(userId),
      ]);
    }
  }

  private async syncExpenses(userId: string) {
    // PUSH: Local → Supabase
    const localExpenses = await db.expenses
      .find({ selector: { user_id: userId, isSynced: false } })
      .exec();

    for (const expense of localExpenses) {
      const { data: existing } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", expense.id)
        .single();

      if (existing) {
        // Conflict resolution: local wins if newer
        if (new Date(expense.updated_at) > new Date(existing.updated_at)) {
          await supabase.from("expenses").update(expense).eq("id", expense.id);
        }
      } else {
        // Insert new
        await supabase.from("expenses").insert(expense);
      }

      // Mark synced
      await expense.patch({ isSynced: true });
    }

    // PULL: Supabase → Local
    const lastSync = localStorage.getItem("lastSync") || "1970-01-01";
    const { data: remoteExpenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .gte("updated_at", lastSync);

    for (const remote of remoteExpenses || []) {
      const local = await db.expenses.findOne(remote.id).exec();

      if (local) {
        // Update if remote is newer
        if (new Date(remote.updated_at) > new Date(local.updated_at)) {
          await local.patch(remote);
        }
      } else {
        // Insert new
        await db.expenses.insert(remote);
      }
    }

    localStorage.setItem("lastSync", new Date().toISOString());
  }
}
```

### Conflict Resolution Strategy

1. **Timestamp Comparison**: `local.updated_at` vs `remote.updated_at`
2. **Local Wins**: If local timestamp is newer
3. **Remote Wins**: If remote timestamp is newer
4. **Tie**: Local wins (client-authoritative)

### Sync Triggers

```typescript
// 1. Manual sync
await syncService.startSync(userId);

// 2. Auto-sync on online
window.addEventListener("online", () => {
  syncService.startSync(userId);
});

// 3. After CRUD operations
await db.expenses.insert(newExpense);
syncService.startSync(userId); // Background sync
```

---

## 📊 Statistics Service

### Client-Side Calculation

**File**: `src/services/stats.service.ts`

```typescript
class StatsService {
  private cache = new Map<string, CachedStats>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getMonthlyStats(userId: string, year: number, month: number) {
    const cacheKey = `${userId}-${year}-${month}`;

    // 1. Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // 2. Calculate from RxDB
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const expenses = await db.expenses
      .find({
        selector: {
          user_id: userId,
          deleted_at: null,
          date: { $gte: startDate, $lte: endDate },
        },
      })
      .exec();

    const stats = {
      totalExpenses: expenses.filter((e) => e.type === "expense").length,
      totalIncome: expenses.filter((e) => e.type === "income").length,
      totalAmount: expenses
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + e.amount, 0),
      totalIncomeAmount: expenses
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0),
      balance:
        expenses
          .filter((e) => e.type === "income")
          .reduce((sum, e) => sum + e.amount, 0) -
        expenses
          .filter((e) => e.type === "expense")
          .reduce((sum, e) => sum + e.amount, 0),
      categories: this.groupByCategory(expenses),
    };

    // 3. Update cache
    this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });

    return stats;
  }

  invalidateCache(userId: string) {
    // Remove all entries for user
    for (const key of this.cache.keys()) {
      if (key.startsWith(userId)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### Why Client-Side?

**Advantages**:

- ✅ Works offline
- ✅ No database views needed
- ✅ Instant results (cached)
- ✅ Reduces server load
- ✅ Easier to maintain

**Trade-offs**:

- ⚠️ Initial calculation cost
- ⚠️ Memory usage for cache
- ⚠️ Not suitable for 100k+ records

---

## 🔀 Multi-Tab Coordination

### Leader Election

```typescript
class SyncService {
  async electLeader() {
    const tabs = await db.$.broadcastChannel;

    // Request leadership
    tabs.postMessage({ type: "LEADER_ELECTION" });

    // Wait for responses
    await new Promise((resolve) => setTimeout(resolve, 100));

    // If no other leader, become leader
    if (!this.hasLeader) {
      this.isLeader = true;
      tabs.postMessage({ type: "LEADER_ELECTED", tabId: this.tabId });
    }
  }

  async relinquishLeadership() {
    this.isLeader = false;
    const tabs = await db.$.broadcastChannel;
    tabs.postMessage({ type: "LEADER_RESIGNED" });
  }
}
```

### BroadcastChannel Events

```typescript
// Tab A (Leader)
tabs.addEventListener("message", (msg) => {
  if (msg.type === "DATA_CHANGED") {
    // Trigger sync
    syncService.startSync(userId);
  }
});

// Tab B (Follower)
await db.expenses.insert(newExpense);
tabs.postMessage({ type: "DATA_CHANGED", collection: "expenses" });
```

**Benefits**:

- Only one tab syncs at a time
- Prevents race conditions
- Shares sync status across tabs
- Automatic re-election if leader closes

---

## ⚡ Performance

### Query Optimization

```typescript
// ❌ Bad: No index
const expenses = await db.expenses
  .find({
    selector: { description: { $regex: "pizza" } },
  })
  .exec();

// ✅ Good: Use indexed fields
const expenses = await db.expenses
  .find({
    selector: {
      user_id: userId, // Indexed
      category_id: catId, // Indexed
      deleted_at: null, // Indexed
    },
  })
  .exec();
```

### Memory Management

```typescript
// ❌ Bad: Load all at once
const allExpenses = await db.expenses.find().exec();

// ✅ Good: Paginate
const expenses = await db.expenses
  .find({
    selector: { user_id: userId },
    limit: 50,
    skip: page * 50,
  })
  .exec();
```

### Subscription Cleanup

```typescript
// ✅ Always cleanup in useEffect
useEffect(() => {
  const query = db.expenses.find();
  const sub = query.$.subscribe(setExpenses);

  return () => sub.unsubscribe(); // Critical!
}, []);
```

---

## 📐 Best Practices

### 1. Query Construction

```typescript
// ✅ Memoize query constructor
const queryConstructor = useCallback(
  () => db.expenses.find({ selector: { user_id: userId } }),
  [userId]
);

const expenses = useRxQuery(queryConstructor);
```

### 2. Data Transformation

```typescript
// ✅ Use useMemo for derived data
const sortedExpenses = useMemo(
  () => expenses?.sort((a, b) => b.date.localeCompare(a.date)),
  [expenses]
);
```

### 3. Soft Deletes

```typescript
// ✅ Always soft delete
await expense.patch({ deleted_at: new Date().toISOString() });

// ❌ Never hard delete (breaks sync)
await expense.remove();
```

### 4. Sync Conflicts

```typescript
// ✅ Handle conflicts gracefully
try {
  await syncService.startSync(userId);
} catch (error) {
  if (error.code === "CONFLICT") {
    // Local data kept, log conflict
    console.warn("Sync conflict resolved (local wins)");
  }
}
```

### 5. Schema Migrations

```typescript
// When changing schema, increment version
const expenseSchema = {
  version: 1, // Changed from 0
  // ... schema
  migrationStrategies: {
    1: (oldDoc) => {
      oldDoc.newField = "default";
      return oldDoc;
    },
  },
};
```

---

## 🔍 Debugging

### RxDB DevTools

```typescript
// Enable query logging
db.$.subscribe((changeEvent) => {
  console.log("RxDB Change:", changeEvent);
});
```

### Inspect IndexedDB

1. DevTools → Application → IndexedDB → `mymoney`
2. View collections: `expenses`, `categories`, etc.
3. Check document structure

### Sync Debugging

```typescript
// Log sync results
const result = await syncService.syncExpenses(userId);
console.log("Synced:", result.synced);
console.log("Failed:", result.failed);
console.log("Conflicts:", result.conflicts);
```

---

## 📚 References

- **RxDB Docs**: https://rxdb.info/
- **RxJS Docs**: https://rxjs.dev/
- **Supabase Docs**: https://supabase.com/docs
- **IndexedDB Spec**: https://www.w3.org/TR/IndexedDB/

---

## 🎯 Summary

MyMoney v3.0 uses:

1. **RxDB** for reactive local database
2. **useRxQuery** for automatic UI updates
3. **Sync Service** for bidirectional replication
4. **Stats Service** for client-side calculations
5. **Leader Election** for multi-tab coordination

**Result**: Local-first, reactive, offline-capable expense tracking.

---

**Questions?** Check [SETUP_v3.0.md](./SETUP_v3.0.md) or open an issue.
