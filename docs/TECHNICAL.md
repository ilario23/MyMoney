# Spendix - Guida Tecnica Dettagliata

## 🏗️ Architettura

### Livelli dell'Applicazione

```
┌─────────────────────────────────────────────┐
│              UI Layer (React)                │
│  Pages, Components, Layouts, Forms          │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         State Management (Zustand)          │
│  Auth Store, App State, Preferences         │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Services & Business Logic                  │
│  Sync Service, API Wrappers                 │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│   Data Layer (Dexie + Supabase)            │
│  Local Cache (IndexedDB) + Remote DB        │
└─────────────────────────────────────────────┘
```

### Flusso Sincronizzazione

```
┌──────────────┐
│   App Start  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Check Auth from Supabase            │
│  (onAuthStateChange listener)        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Load User Data from Cache (Dexie)  │
│  Show Last Sync Timestamp            │
└──────┬───────────────────────────────┘
       │
       ├─ Online ──┐
       │           │
       ▼           ▼
   [Auto-Sync]  [Queue Changes]
       │           │
       └─────┬─────┘
             │
             ▼
   ┌─────────────────────────────────┐
   │  Sync Service Flow:            │
   │                                │
   │  1. Get lastSync time          │
   │  2. Send local unsync'd data   │
   │  3. Fetch remote changes       │
   │  4. Merge & resolve conflicts  │
   │  5. Update DB + mark as synced │
   │  6. Update lastSync time       │
   └─────────────────────────────────┘
```

## 📊 Schema Database

### Dexie (IndexedDB) - Local

```typescript
// Ogni tabella ha gli indici per query rapide
Users
├─ id (PK)
├─ email (unique)
└─ metadata

Expenses
├─ id (PK)
├─ userId (compound index con date)
├─ groupId
├─ amount, currency, category
├─ date
├─ isSynced (per filtrare unsync'd)
└─ createdAt, updatedAt

Categories
├─ id (PK)
├─ userId
└─ name, color, icon

Groups
├─ id (PK)
├─ ownerId
└─ members...

SyncLogs
├─ id (auto-increment)
├─ userId
├─ lastSyncTime
└─ syncedRecords count
```

### Supabase (PostgreSQL) - Remote

Schema identico, con RLS:

- Utente può leggere/scrivere solo propri dati
- Owner di gruppo può gestire members
- Trigger per aggiornare `updated_at`

## 🔄 Strategia Sincronizzazione

### Record Structure

```typescript
{
  id: 'uuid',              // Global ID
  updated_at: Date,        // Last modification
  isSynced: boolean,       // Local flag
  ...data
}
```

### Conflict Resolution

**Regola: Local wins**

```typescript
if (local && local.updatedAt > remote.updatedAt) {
  // Keep local version
  conflicts++;
  continue;
}
```

### Retry Logic

```typescript
try {
  // First attempt
  await sync({ force: true });
} catch (error) {
  // Queue per retry on next online
  registerBackgroundSync("sync-expenses");
}
```

## 🌐 API Integration

### Supabase Client

```typescript
// Real-time subscriptions (future)
supabase
  .channel("expenses")
  .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
    // Update local cache
  })
  .subscribe();

// Batch operations
const { data } = await supabase.from("expenses").insert(recordsArray);
```

## 💾 Offline Strategy

### Cache-First + Network-First

```
Request
  ├─ Online
  │  ├─ Try network
  │  ├─ Cache result
  │  └─ Return
  │
  └─ Offline
     └─ Return from cache
```

### Service Worker Events

```javascript
// Install: Pre-cache critical files
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urls)));
});

// Activate: Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(...));
});

// Fetch: Network first with cache fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request))
  );
});
```

## 🎨 Theme System

### CSS Variables

```css
:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(0, 0%, 3.6%);
  --primary: hsl(217, 91.2%, 59.8%);
  /* ... */
}

.dark {
  --background: hsl(0, 0%, 3.6%);
  --foreground: hsl(0, 0%, 98.2%);
  /* ... */
}
```

### useTheme Hook

```typescript
const { theme, isDark, setTheme } = useTheme();
// theme: 'light' | 'dark' | 'system'
// isDark: boolean (computed)
// setTheme: (theme: Theme) => void
```

## 🔐 Security Considerations

### Implemented

- ✅ Auth via Supabase (JWT tokens)
- ✅ Row-level security (RLS) on Supabase
- ✅ HTTPS enforcement in production
- ✅ XSS protection (React escaping)
- ✅ CSRF via Supabase session

### Not Implemented

- ❌ Local encryption
- ❌ Biometric auth
- ❌ PIN protection
- ❌ End-to-end encryption

## 🚀 Performance Optimizations

### Bundle Size

- Tree-shaking per rimuovere dead code
- Dynamic imports per code splitting
- Lazy loading routes

### Database Queries

- Compound indexes: `[userId+date]`
- Query filtering locale con Dexie
- Pagination per grandi dataset

### Caching

- HTTP cache headers
- IndexedDB con Dexie
- Service Worker cache

## 📱 Mobile Optimization

### Viewport Optimization

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

### Touch Optimization

- Button sizes: 44x44px minimum
- Spacing: 16px minimum
- Safe area insets per notch

### Performance

- 60fps animations con Framer Motion
- Virtual scrolling per lunghe liste
- Image lazy loading

## 🧪 Testing Strategy

### Unit Tests

```typescript
// services/sync.service.test.ts
describe("SyncService", () => {
  it("should sync expenses", async () => {
    const result = await syncService.sync({ userId });
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
// pages/dashboard.test.tsx
describe('Dashboard', () => {
  it('should display expenses', async () => {
    render(<DashboardPage />);
    expect(screen.getByText(/spese/i)).toBeInTheDocument();
  });
});
```

## 📈 Monitoraggio

### Analytics Events

```typescript
// Future: Google Analytics, Sentry
trackEvent("expense_added", {
  amount: 50,
  category: "Food",
});

trackError("sync_failed", {
  error: "Network timeout",
  retries: 3,
});
```

### Logging

```typescript
// Debug mode
if (process.env.DEBUG) {
  syncService.sync({ verbose: true });
  // Output: [Sync] Starting sync, [Sync] Synced 5 records...
}
```

## 🔄 Workflow Sviluppo

### 1. Aggiungere Feature

```
1. Crea componente in src/components/
2. Aggiungi logica in src/services/ se necessaria
3. Integra in pages/ e router.tsx
4. Test offline con DevTools > Application > Service Workers
5. Commit e push
```

### 2. Aggiungere Database Field

```
1. Aggiungi in Dexie schema (src/lib/dexie.ts)
2. Aggiungi in Supabase SQL
3. Aggiorna sync logic (src/services/sync.service.ts)
4. Migrazioni dati se necessario
```

### 3. Debug Sync Issues

```typescript
// In browser console
localStorage.setItem("DEBUG", "true");

// In app
const result = await syncService.sync({
  userId: user.id,
  verbose: true,
});
console.log(result);
```

## 📚 Risorse Utili

- [Supabase Docs](https://supabase.com/docs)
- [Dexie Documentation](https://dexie.org)
- [React Router v7](https://reactrouter.com)
- [Zustand Store](https://github.com/pmndrs/zustand)
- [ShadCN UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
