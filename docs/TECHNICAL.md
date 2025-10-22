# MyMoney v3.0 - Technical Documentation# Spendix - Guida Tecnica Dettagliata

## 🚀 Overview## 🏗️ Architettura

MyMoney v3.0 is a **local-first expense tracking application** built with a modern, reactive architecture. The app prioritizes offline functionality, performance, and user experience through a sophisticated client-side data layer.### Livelli dell'Applicazione

**Key Technologies:**```

- **Frontend:** React 19 + TypeScript + Vite┌─────────────────────────────────────────────┐

- **Local Database:** RxDB (reactive, observable)│ UI Layer (React) │

- **Remote Backend:** Supabase (PostgreSQL + Auth)│ Pages, Components, Layouts, Forms │

- **State Management:** Zustand + RxJS└────────────────┬────────────────────────────┘

- **Styling:** Tailwind CSS v4 │

- **PWA:** Vite PWA Plugin┌────────────────▼────────────────────────────┐

│ State Management (Zustand) │

---│ Auth Store, App State, Preferences │

└────────────────┬────────────────────────────┘

## 🏗️ Architecture │

┌────────────────▼────────────────────────────┐

### Local-First Philosophy│ Services & Business Logic │

│ Sync Service, API Wrappers │

````└────────────────┬────────────────────────────┘

┌──────────────────────────────────────────────────┐                 │

│                  User Interface                   │┌────────────────▼────────────────────────────┐

│         (React Components + RxJS)                 ││   Data Layer (Dexie + Supabase)            │

└────────────────┬─────────────────────────────────┘│  Local Cache (IndexedDB) + Remote DB        │

                 │└─────────────────────────────────────────────┘

                 │ Reactive Subscriptions```

                 │

┌────────────────▼─────────────────────────────────┐### Flusso Sincronizzazione

│               RxDB Collections                    │

│  (Local IndexedDB with Reactive Queries)          │```

│  - users, expenses, categories, groups            │┌──────────────┐

│  - stats_cache (local-only)                       ││   App Start  │

└────────────────┬─────────────────────────────────┘└──────┬───────┘

                 │       │

                 │ Bidirectional Sync       ▼

                 │┌──────────────────────────────────────┐

┌────────────────▼─────────────────────────────────┐│  Check Auth from Supabase            │

│            Supabase Backend                       ││  (onAuthStateChange listener)        │

│  (PostgreSQL + RLS + Realtime)                    │└──────┬───────────────────────────────┘

└──────────────────────────────────────────────────┘       │

```       ▼

┌──────────────────────────────────────┐

### Application Layers│  Load User Data from Cache (Dexie)  │

│  Show Last Sync Timestamp            │

```typescript└──────┬───────────────────────────────┘

// 1. UI Layer - React components with reactive subscriptions       │

const expenses$ = db.expenses.find().$.subscribe(...)       ├─ Online ──┐

       │           │

// 2. Data Layer - RxDB collections       ▼           ▼

const db = await initDatabase()   [Auto-Sync]  [Queue Changes]

await db.expenses.insert({...})       │           │

       └─────┬─────┘

// 3. Sync Layer - Automatic bidirectional replication             │

await syncService.startSync(userId)             ▼

   ┌─────────────────────────────────┐

// 4. Stats Layer - Local computation with caching   │  Sync Service Flow:            │

const stats = await statsService.calculateMonthlyStats(userId, date)   │                                │

```   │  1. Get lastSync time          │

   │  2. Send local unsync'd data   │

---   │  3. Fetch remote changes       │

   │  4. Merge & resolve conflicts  │

## 📦 RxDB Schema   │  5. Update DB + mark as synced │

   │  6. Update lastSync time       │

### Collections   └─────────────────────────────────┘

````

#### 1. Users

````typescript## 📊 Schema Database

{

  id: string (PK)### Dexie (IndexedDB) - Local

  email: string

  full_name?: string```typescript

  avatar_url?: string// Ogni tabella ha gli indici per query rapide

  preferred_language: stringUsers

  created_at: datetime├─ id (PK)

  updated_at: datetime├─ email (unique)

  deleted_at?: datetime└─ metadata

}

```Expenses

├─ id (PK)

#### 2. Categories├─ userId (compound index con date)

```typescript├─ groupId

{├─ amount, currency, category

  id: string (PK)├─ date

  user_id?: string (FK)├─ isSynced (per filtrare unsync'd)

  name: string└─ createdAt, updatedAt

  icon?: string

  color?: stringCategories

  type: 'expense' | 'income'├─ id (PK)

  parent_id?: string (FK - hierarchical)├─ userId

  is_active: boolean└─ name, color, icon

  created_at: datetime

  updated_at: datetimeGroups

  deleted_at?: datetime├─ id (PK)

}├─ ownerId

```└─ members...



#### 3. ExpensesSyncLogs

```typescript├─ id (auto-increment)

{├─ userId

  id: string (PK)├─ lastSyncTime

  user_id: string (FK)└─ syncedRecords count

  amount: number```

  description?: string

  category_id?: string (FK)### Supabase (PostgreSQL) - Remote

  date: date

  notes?: stringSchema identico, con RLS:

  created_at: datetime

  updated_at: datetime- Utente può leggere/scrivere solo propri dati

  deleted_at?: datetime- Owner di gruppo può gestire members

}- Trigger per aggiornare `updated_at`

````

## 🔄 Strategia Sincronizzazione

#### 4. Groups

````typescript### Record Structure

{

  id: string (PK)```typescript

  name: string{

  description?: string  id: 'uuid',              // Global ID

  owner_id: string (FK)  updated_at: Date,        // Last modification

  invite_code?: string  isSynced: boolean,       // Local flag

  invite_code_expires_at?: datetime  ...data

  created_at: datetime}

  updated_at: datetime```

  deleted_at?: datetime

}### Conflict Resolution

````

**Regola: Local wins**

#### 5. Group Members

`typescript`typescript

{if (local && local.updatedAt > remote.updatedAt) {

id: string (PK) // Keep local version

group_id: string (FK) conflicts++;

user_id: string (FK) continue;

role: 'owner' | 'admin' | 'member'}

joined_at: datetime```

created_at: datetime

updated_at: datetime### Retry Logic

deleted_at?: datetime

}```typescript

````try {

  // First attempt

#### 6. Shared Expenses  await sync({ force: true });

```typescript} catch (error) {

{  // Queue per retry on next online

  id: string (PK)  registerBackgroundSync("sync-expenses");

  group_id: string (FK)}

  creator_id: string (FK)```

  amount: number

  description: string## 🌐 API Integration

  category_id?: string (FK)

  date: date### Supabase Client

  split_type: 'equal' | 'percentage' | 'amount' | 'shares'

  created_at: datetime```typescript

  updated_at: datetime// Real-time subscriptions (future)

  deleted_at?: datetimesupabase

}  .channel("expenses")

```  .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {

    // Update local cache

#### 7. Stats Cache (Local-Only)  })

```typescript  .subscribe();

{

  id: string (PK)// Batch operations

  user_id: string (FK)const { data } = await supabase.from("expenses").insert(recordsArray);

  period: string // e.g., '2025-10'```

  total_expenses: number

  total_income: number## 💾 Offline Strategy

  expense_count: number

  top_categories: Array<{### Cache-First + Network-First

    category_id: string

    category_name: string```

    amount: numberRequest

    count: number  ├─ Online

  }>  │  ├─ Try network

  daily_average: number  │  ├─ Cache result

  monthly_average: number  │  └─ Return

  calculated_at: datetime  │

  updated_at: datetime  └─ Offline

}     └─ Return from cache

````

---### Service Worker Events

## 🔄 Synchronization Strategy```javascript

// Install: Pre-cache critical files

### Overviewself.addEventListener('install', (e) => {

e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urls)));

````});

┌─────────────┐

│  App Start  │// Activate: Clean old caches

└──────┬──────┘self.addEventListener('activate', (e) => {

       │  e.waitUntil(caches.keys().then(...));

       ▼});

┌──────────────────────┐

│  Initialize RxDB     │// Fetch: Network first with cache fallback

│  Load from Cache     │self.addEventListener('fetch', (e) => {

│  (Instant UI)        │  e.respondWith(

└──────┬───────────────┘    fetch(e.request)

       │      .catch(() => caches.match(e.request))

       ▼  );

┌──────────────────────┐});

│  User Authentication │```

│  (Supabase Auth)     │

└──────┬───────────────┘## 🎨 Theme System

       │

       ▼### CSS Variables

┌──────────────────────────────┐

│  Start Sync (Background)     │```css

│  - Pull remote changes       │:root {

│  - Push local changes        │  --background: hsl(0, 0%, 100%);

│  - Conflict resolution       │  --foreground: hsl(0, 0%, 3.6%);

└──────────────────────────────┘  --primary: hsl(217, 91.2%, 59.8%);

```  /* ... */

}

### RxDB Replication Protocol

.dark {

**Pull Handler:**  --background: hsl(0, 0%, 3.6%);

```typescript  --foreground: hsl(0, 0%, 98.2%);

pull: {  /* ... */

  async handler(checkpoint, batchSize) {}

    const minTimestamp = checkpoint?.updated_at || new Date(0)```



    const { data } = await supabase### useTheme Hook

      .from(collectionName)

      .select('*')```typescript

      .gte('updated_at', minTimestamp)const { theme, isDark, setTheme } = useTheme();

      .order('updated_at', { ascending: true })// theme: 'light' | 'dark' | 'system'

      .limit(batchSize)// isDark: boolean (computed)

    // setTheme: (theme: Theme) => void

    return {```

      documents: data,

      checkpoint: { updated_at: lastDoc.updated_at }## 🔐 Security Considerations

    }

  }### Implemented

}

```- ✅ Auth via Supabase (JWT tokens)

- ✅ Row-level security (RLS) on Supabase

**Push Handler:**- ✅ HTTPS enforcement in production

```typescript- ✅ XSS protection (React escaping)

push: {- ✅ CSRF via Supabase session

  async handler(rows) {

    for (const doc of rows) {### Not Implemented

      if (doc.deleted_at) {

        // Soft delete- ❌ Local encryption

        await supabase.from(table).update({ - ❌ Biometric auth

          deleted_at: doc.deleted_at - ❌ PIN protection

        }).eq('id', doc.id)- ❌ End-to-end encryption

      } else {

        // Upsert## 🚀 Performance Optimizations

        await supabase.from(table).upsert(doc)

      }### Bundle Size

    }

  }- Tree-shaking per rimuovere dead code

}- Dynamic imports per code splitting

```- Lazy loading routes



### Conflict Resolution### Database Queries



**Strategy:** Last-Write-Wins (LWW) based on `updated_at` timestamp- Compound indexes: `[userId+date]`

- Query filtering locale con Dexie

1. Compare `updated_at` between local and remote- Pagination per grandi dataset

2. Keep the document with the latest timestamp

3. Soft-delete conflicting versions (set `deleted_at`)### Caching

4. Notify user in case of critical conflicts

- HTTP cache headers

---- IndexedDB con Dexie

- Service Worker cache

## 📊 Statistics System

## 📱 Mobile Optimization

### Local-First Approach

### Viewport Optimization

**Why Local?**

- 95% of usage is offline/local```html

- Instant calculations, no network latency<meta

- Supports offline mode  name="viewport"

- Reduces server load  content="width=device-width, initial-scale=1, viewport-fit=cover"

/>

### Calculation Flow```



```typescript### Touch Optimization

// 1. Check cache first

const cached = await db.stats_cache- Button sizes: 44x44px minimum

  .findOne({ user_id: userId, period: '2025-10' })- Spacing: 16px minimum

  .exec()- Safe area insets per notch



if (cached && isCacheValid(cached.calculated_at)) {### Performance

  return mapCacheToStats(cached)

}- 60fps animations con Framer Motion

- Virtual scrolling per lunghe liste

// 2. Calculate from local expenses- Image lazy loading

const expenses = await db.expenses

  .find({## 🧪 Testing Strategy

    selector: {

      user_id: userId,### Unit Tests

      date: { $gte: startOfMonth, $lte: endOfMonth },

      deleted_at: null```typescript

    }// services/sync.service.test.ts

  })describe("SyncService", () => {

  .exec()  it("should sync expenses", async () => {

    const result = await syncService.sync({ userId });

const stats = processExpenses(expenses)    expect(result.success).toBe(true);

  });

// 3. Update cache});

await db.stats_cache.upsert({ ...stats, calculated_at: now })```



return stats### Integration Tests

````

````typescript

### Cache Invalidation// pages/dashboard.test.tsx

describe('Dashboard', () => {

- **After expense CRUD:** Invalidate current month's cache  it('should display expenses', async () => {

- **After sync:** Invalidate all affected periods    render(<DashboardPage />);

- **Max age:** 30 minutes    expect(screen.getByText(/spese/i)).toBeInTheDocument();

- **Manual refresh:** User-triggered recalculation  });

});

---```



## 🔐 Security## 📈 Monitoraggio



### Row Level Security (RLS)### Analytics Events



All Supabase tables enforce RLS policies:```typescript

// Future: Google Analytics, Sentry

```sqltrackEvent("expense_added", {

-- Example: Expenses table  amount: 50,

CREATE POLICY "Users can view own expenses"  category: "Food",

  ON expenses FOR SELECT});

  USING (auth.uid() = user_id AND deleted_at IS NULL);

trackError("sync_failed", {

CREATE POLICY "Users can insert own expenses"  error: "Network timeout",

  ON expenses FOR INSERT  retries: 3,

  WITH CHECK (auth.uid() = user_id);});

````

### Authentication Flow### Logging

````typescript

User Login// Debug mode

    ↓if (process.env.DEBUG) {

Supabase Auth.signInWithPassword()  syncService.sync({ verbose: true });

    ↓  // Output: [Sync] Starting sync, [Sync] Synced 5 records...

JWT Token stored in localStorage}

    ↓```

Auth state synced with Zustand

    ↓## 🔄 Workflow Sviluppo

Sync starts with authenticated user

```### 1. Aggiungere Feature



---```

1. Crea componente in src/components/

## 🚀 Performance Optimizations2. Aggiungi logica in src/services/ se necessaria

3. Integra in pages/ e router.tsx

### 1. Reactive Queries4. Test offline con DevTools > Application > Service Workers

```typescript5. Commit e push

// Subscribe to changes - automatic UI updates```

expenses$ = db.expenses.find().$.subscribe(expenses => {

  setExpenses(expenses)### 2. Aggiungere Database Field

})

````

1. Aggiungi in Dexie schema (src/lib/dexie.ts)

### 2. Indexed Queries2. Aggiungi in Supabase SQL

````typescript3. Aggiorna sync logic (src/services/sync.service.ts)

// Fast lookups with indexes4. Migrazioni dati se necessario

db.expenses.find({```

  selector: {

    user_id: userId,### 3. Debug Sync Issues

    date: { $gte: startDate }

  },```typescript

  index: ['user_id', 'date']// In browser console

})localStorage.setItem("DEBUG", "true");

````

// In app

### 3. Leader Electionconst result = await syncService.sync({

Only one tab handles sync at a time: userId: user.id,

````typescript verbose: true,

db.waitForLeadership().then(() => {});

  console.log('This tab is the leader')console.log(result);

  syncService.startSync(userId)```

})

```## 📚 Risorse Utili



### 4. Batch Operations- [Supabase Docs](https://supabase.com/docs)

```typescript- [Dexie Documentation](https://dexie.org)

// Bulk inserts- [React Router v7](https://reactrouter.com)

await db.expenses.bulkInsert([...expenses])- [Zustand Store](https://github.com/pmndrs/zustand)

- [ShadCN UI](https://ui.shadcn.com)

// Batch sync- [Tailwind CSS](https://tailwindcss.com)

push: { batchSize: 50 }- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

pull: { batchSize: 100 }
````

---

## 🧪 Testing Strategy

### Unit Tests

- Service layer (sync, stats, auth)
- Utility functions
- Schema validation

### Integration Tests

- RxDB + Supabase sync flow
- Conflict resolution
- Offline mode behavior

### E2E Tests

- Critical user flows
- Multi-tab sync
- PWA installation

---

## 📱 PWA Features

### Service Worker

- Cache-first strategy for assets
- Network-first for API calls
- Background sync for offline changes

### Install Prompt

```typescript
const { needRefresh, updateServiceWorker } = usePWAUpdate()

if (needRefresh) {
  <button onClick={() => updateServiceWorker()}>
    Update Available
  </button>
}
```

### Offline Indicator

Real-time connection status:

```typescript
const isOnline = useOnlineStatus();
```

---

## 🔧 Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Code Structure

```
src/
├── lib/
│   ├── rxdb.ts              # RxDB initialization
│   ├── rxdb-schemas.ts      # Collection schemas
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utilities
├── services/
│   ├── sync.service.ts      # Sync logic
│   └── stats.service.ts     # Stats calculation
├── hooks/
│   ├── useRealtime.ts       # Realtime subscriptions
│   └── useSync.ts           # Sync state hook
├── pages/                   # Route pages
├── components/              # Reusable components
└── translations/            # i18n files
```

---

## 📚 Key Dependencies

| Package               | Version  | Purpose              |
| --------------------- | -------- | -------------------- |
| rxdb                  | ^16.20.0 | Reactive database    |
| rxjs                  | ^7.8.2   | Reactive programming |
| @supabase/supabase-js | ^2.50.2  | Backend client       |
| react                 | ^19.1.0  | UI framework         |
| zustand               | ^5.0.8   | State management     |
| vite                  | ^6.3.5   | Build tool           |
| tailwindcss           | ^4.1.10  | Styling              |

---

## 🎯 Future Enhancements (v3.1+)

- [ ] End-to-end encryption for sensitive data
- [ ] CRDTs for more sophisticated conflict resolution
- [ ] GraphQL sync protocol
- [ ] Multi-device push notifications
- [ ] Collaborative real-time editing
- [ ] Advanced analytics dashboard
- [ ] Export/import data (JSON, CSV)
- [ ] Recurring transactions automation

---

## 📞 Support & Contribution

For questions or contributions, see:

- [Setup Guide](./SETUP.md)
- [API Documentation](./API.md)
- [Changelog](./CHANGELOG.md)

---

**Version:** 3.0.0  
**Last Updated:** October 2025  
**License:** MIT
