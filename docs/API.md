# API & Data Flow Documentation

## 📡 Supabase Tables & RLS Policies

### Authentication Tables (Managed by Supabase)

- `auth.users` - Supabase auth users
- `auth.sessions` - Active sessions
- `auth.refresh_tokens` - Token refresh

### Application Tables

#### 1. `public.users`

```sql
id (UUID) - FK to auth.users
email (TEXT UNIQUE)
display_name (TEXT)
avatar_url (TEXT)
created_at, updated_at
```

**RLS Policies:**

- Users can read/update only their own row
- Authenticated users can insert themselves

#### 2. `public.categories`

```sql
id (UUID PK)
user_id (UUID FK → users.id)
name, color, icon
created_at, updated_at
```

**RLS:**

- Users can CRUD only their own categories
- Unique constraint: (user_id, name)

#### 3. `public.expenses`

```sql
id (UUID PK)
user_id (UUID FK → users.id)
group_id (UUID FK → groups.id, nullable)
amount (DECIMAL)
currency (TEXT)
category (TEXT)
description (TEXT)
date (DATE)
deleted_at (nullable, soft delete)
created_at, updated_at
```

**RLS:**

- Users can read/write own expenses
- Can read group expenses if group member
- Indexes: `(user_id, date)`, `group_id`

#### 4. `public.groups`

```sql
id (UUID PK)
name (TEXT)
owner_id (UUID FK → users.id)
description (TEXT)
color (TEXT)
created_at, updated_at
```

**RLS:**

- Owner can read/update/delete
- Members can read (via group_members)

#### 5. `public.group_members`

```sql
id (UUID PK)
group_id (UUID FK → groups.id)
user_id (UUID FK → users.id)
role ('owner' | 'member')
created_at
```

**RLS:**

- Owner can manage members
- Members can read own membership

#### 6. `public.shared_expenses`

```sql
id (UUID PK)
group_id (UUID FK → groups.id)
expense_id (UUID FK → expenses.id)
creator_id (UUID FK → users.id)
participants (JSONB) - [{userId, amount, settled}]
is_recurring (BOOLEAN)
recurring_rule (TEXT)
created_at, updated_at
```

**RLS:**

- Group members can read
- Creator can update

---

## 🔄 API Calls Structure

### Initialize Supabase Client

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

### Authentication API

#### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password123",
});
```

#### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});
```

#### Get Current Session

```typescript
const {
  data: { session },
} = await supabase.auth.getSession();
```

#### Sign Out

```typescript
await supabase.auth.signOut();
```

#### On Auth State Change

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    // User logged in
  } else if (event === "SIGNED_OUT") {
    // User logged out
  }
});
```

---

### Expenses API

#### Create Expense

```typescript
const { data, error } = await supabase.from("expenses").insert({
  user_id: userId,
  amount: 50.0,
  currency: "EUR",
  category: "Food",
  description: "Lunch",
  date: "2024-01-15",
  updated_at: new Date().toISOString(),
});
```

#### Read Expenses (Monthly)

```typescript
const { data, error } = await supabase
  .from("expenses")
  .select("*")
  .eq("user_id", userId)
  .gte("date", "2024-01-01")
  .lte("date", "2024-01-31")
  .is("deleted_at", null)
  .order("date", { ascending: false });
```

#### Read Expenses (Since Last Sync)

```typescript
const { data, error } = await supabase
  .from("expenses")
  .select("*")
  .eq("user_id", userId)
  .gt("updated_at", lastSyncTime.toISOString())
  .is("deleted_at", null);
```

#### Update Expense

```typescript
const { data, error } = await supabase
  .from("expenses")
  .update({
    amount: 60.0,
    updated_at: new Date().toISOString(),
  })
  .eq("id", expenseId);
```

#### Soft Delete Expense

```typescript
const { data, error } = await supabase
  .from("expenses")
  .update({
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq("id", expenseId);
```

#### Upsert (Insert or Update)

```typescript
const { data, error } = await supabase.from("expenses").upsert(
  {
    id: expenseId,
    user_id: userId,
    amount: 50,
    // ...
    updated_at: new Date().toISOString(),
  },
  {
    onConflict: "id",
  }
);
```

---

### Categories API

#### Get All Categories

```typescript
const { data, error } = await supabase
  .from("categories")
  .select("*")
  .eq("user_id", userId);
```

#### Create Category

```typescript
const { data, error } = await supabase.from("categories").insert({
  user_id: userId,
  name: "Groceries",
  color: "#FF6B6B",
  icon: "🛒",
});
```

---

### Groups API

#### Create Group

```typescript
const { data, error } = await supabase.from("groups").insert({
  name: "Trip to Barcelona",
  owner_id: userId,
  description: "Summer vacation 2024",
});
```

#### Add Member to Group

```typescript
const { data, error } = await supabase.from("group_members").insert({
  group_id: groupId,
  user_id: memberId,
  role: "member",
});
```

#### Get Group Expenses

```typescript
const { data, error } = await supabase
  .from("expenses")
  .select("*")
  .eq("group_id", groupId)
  .is("deleted_at", null)
  .order("date", { ascending: false });
```

---

## 🔐 Data Security

### Row-Level Security Example

```sql
-- Expenses: Users can only see their own or group expenses
CREATE POLICY "users_see_own_expenses"
ON expenses FOR SELECT
USING (
  auth.uid() = user_id OR
  group_id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid()
  )
);

-- Categories: Users can only see their own
CREATE POLICY "users_see_own_categories"
ON categories FOR SELECT
USING (auth.uid() = user_id);

-- Groups: Users can see groups they own or are members of
CREATE POLICY "users_see_accessible_groups"
ON groups FOR SELECT
USING (
  auth.uid() = owner_id OR
  id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid()
  )
);
```

---

## 📱 Local Data Flow (Dexie)

### Schema

```typescript
const db = new Dexie("SpendixDB");

db.version(1).stores({
  expenses: "id, userId, [userId+date], groupId, isSynced",
  categories: "id, userId",
  groups: "id, ownerId",
  groupMembers: "[groupId+userId]",
  sharedExpenses: "id, groupId",
  syncLogs: "++id, userId, lastSyncTime",
});
```

### Add Expense (Offline)

```typescript
const expense = {
  id: uuidv4(),
  userId,
  amount: 50,
  category: "Food",
  description: "Lunch",
  date: new Date(),
  isSynced: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

await db.expenses.add(expense);
```

### Query Expenses (Offline)

```typescript
// Get all expenses for user this month
const startOfMonth = new Date();
startOfMonth.setDate(1);
const endOfMonth = new Date();
endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);

const expenses = await db.expenses
  .where("[userId+date]")
  .between([userId, startOfMonth], [userId, endOfMonth])
  .toArray();
```

### Find Unsync'd Records

```typescript
const unsyncedExpenses = await db.expenses
  .where("userId")
  .equals(userId)
  .and((e) => !e.isSynced)
  .toArray();
```

---

## 🔄 Sync Algorithm

```typescript
async function sync(userId: string, lastSync: Date) {
  // 1. GET last sync time from local db
  const log = await db.syncLogs
    .where("userId")
    .equals(userId)
    .reverse()
    .first();

  const lastSyncTime = log?.lastSyncTime || new Date(0);

  // 2. PUSH unsync'd records to Supabase
  const unsynced = await db.expenses
    .where("userId")
    .equals(userId)
    .and((e) => !e.isSynced)
    .toArray();

  for (const exp of unsynced) {
    const { error } = await supabase.from("expenses").upsert(/* ... */);

    if (!error) {
      await db.expenses.update(exp.id, { isSynced: true });
    }
  }

  // 3. PULL changed records from Supabase
  const { data: remote } = await supabase
    .from("expenses")
    .select("*")
    .gt("updated_at", lastSyncTime.toISOString());

  // 4. MERGE with conflict resolution
  for (const rem of remote || []) {
    const local = await db.expenses.get(rem.id);

    if (local && local.updatedAt > new Date(rem.updated_at)) {
      // Local is newer, keep it
      continue;
    }

    // Remote is newer or doesn't exist locally
    await db.expenses.put({
      id: rem.id,
      userId: rem.user_id,
      // ... map fields
      isSynced: true,
      updatedAt: new Date(rem.updated_at),
    });
  }

  // 5. UPDATE last sync time
  await db.syncLogs.add({
    userId,
    lastSyncTime: new Date(),
    syncedRecords: unsynced.length + (remote?.length || 0),
  });
}
```

---

## ⚠️ Error Handling

### Network Errors

```typescript
try {
  const { data, error } = await supabase.from("expenses").select("*");

  if (error) {
    if (error.code === "PGRST116") {
      // Row not found
    } else if (error.code === "42P01") {
      // Relation not found
    }
    throw error;
  }
} catch (err) {
  // Queue for retry on next online
  console.error("API Error:", err);
}
```

### Validation Before Submit

```typescript
if (!description || description.trim() === "") {
  throw new Error("Description is required");
}

if (amount <= 0) {
  throw new Error("Amount must be positive");
}

if (!category) {
  throw new Error("Category is required");
}
```

---

## 🧪 Testing API

### Mock Supabase Responses

```typescript
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: jest.fn().mockResolvedValue({
        data: mockExpenses,
        error: null,
      }),
    }),
  }),
}));
```

### Test Sync Logic

```typescript
describe("SyncService", () => {
  it("syncs unsync'd expenses", async () => {
    const result = await syncService.sync({ userId: "test" });
    expect(result.synced).toBeGreaterThan(0);
  });
});
```

---

## 📊 Performance Metrics

- **Initial Load**: < 2s (with caching)
- **Sync Time**: < 5s (20 records)
- **Bundle Size**: ~650KB (minified)
- **DB Query**: < 100ms (Dexie)

---

## 📞 API Rate Limits (Supabase)

Default free tier:

- **Realtime connections**: 200
- **Database**: PostgreSQL defaults
- **Auth**: No specific limits
- **Storage**: 1GB per project

---

_Last Updated: October 2024_
