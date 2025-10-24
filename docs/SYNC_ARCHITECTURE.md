# Sync Architecture - Local-First with Automatic Background Sync

## 📋 Il Problema (Prima)

L'app aveva questi problemi:

1. **Nessun auto-sync**: Le spese venivano salvate solo in Dexie, Supabase non lo sapeva fino a un sync manuale
2. **Blocco UI**: Il sync era un'operazione "tutto o nulla" che poteva bloccare l'interfaccia
3. **Confusione**: L'utente non sapeva se i dati erano sincronizzati o no
4. **Offline non ottimale**: Non era chiaro cosa succedesse quando l'app tornava online

---

## ✅ La Soluzione (Adesso)

### **Flusso di Avvio (Startup)**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User apre l'app                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. router.tsx: checkAuth()                                  │
│    - Verifica se l'utente è loggato su Supabase            │
│    - Se sì: setUser() + syncService.initializeAtStartup()  │
│    - setLoading(false) SUBITO (UI pronta)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐      ┌─────────────────────┐
│ Dexie        │      │ Supabase            │
│ (disponibile │      │ (sync background)   │
│  subito)     │      │                     │
│              │      │ Se ONLINE:          │
│ • Categories │      │  - Pull changes     │
│ • Expenses   │      │  - Push local data  │
│ • User data  │      │ Se OFFLINE:         │
└──────────────┘      │  - Aspetta online   │
                      └─────────────────────┘
```

### **Quando Aggiungi una Spesa**

```
┌──────────────────────────────────────┐
│ User crea una nuova spesa            │
└─────────────┬────────────────────────┘
              │
              ▼
      ┌───────────────┐
      │ Salva in      │
      │ Dexie         │ ◄─── ISTANTANEO
      │ (await)       │      L'UI rimane responsive
      └───────────┬───┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼ Se ONLINE          ▼ Se OFFLINE
    ┌────────────┐      ┌──────────────┐
    │ Trigger    │      │ Data salvato │
    │ background │      │ localmente   │
    │ sync       │      │              │
    │ (fire &    │      │ Sarà synced  │
    │  forget)   │      │ al ritorno   │
    └────────────┘      │ online       │
                        └──────────────┘
```

### **Quando Torni Online**

```
┌─────────────────────────────────────────────────┐
│ window.addEventListener('online')              │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │ useSync hook rileva      │
    │ online = true            │
    │                          │
    │ Chiama sync() automatico │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │ syncService.startSync()  │
    │ Completo (pull + push)   │
    └──────────────────────────┘
```

---

## 🎯 Tracking dei Dati Non Sincati (Unsync Tracking)

### **Come Funziona**

Ogni categoria e spesa ha un campo `synced_at` che traccia quando è stata sincronizzata l'ultima volta con Supabase.

```typescript
// Schema aggiornato
export interface CategoryDocType {
  id: string;
  user_id: string;
  name: string;
  // ... altri campi
  updated_at: string; // Quando è stato modificato
  synced_at?: string | null; // Quando è stato sincronizzato
}

export interface ExpenseDocType {
  id: string;
  user_id: string;
  // ... altri campi
  updated_at: string; // Quando è stato modificato
  synced_at?: string | null; // Quando è stato sincronizzato
}
```

### **Un Elemento è "Unsync" Se:**

1. **Mai sincronizzato**: `synced_at === null`
2. **Modificato ma non sincronizzato**: `updated_at > synced_at`

### **Metodi del Sync Service**

```typescript
// Scopri quanti dati sono in sospeso
const count = await syncService.getUnsyncedCount(userId);
// Ritorna: numero di categorie + spese non sincate

// Ottenere il timestamp dell'ultimo sync riuscito (per delta sync)
const lastSyncTime = await syncService.getLastSuccessfulSyncTime("expenses");
// Ritorna: timestamp ISO del pull precedente
// Primo sync? → ritorna epoch ("1970-01-01")
// Usi questo nelle query a Supabase per delta sync
```

### **Come Funziona il Delta Sync Internamente**

Ogni volta che `pullFromSupabase()` viene chiamato:

1. **Recupera il timestamp precedente**

   ```typescript
   const lastSync = await this.getLastSuccessfulSyncTime(collectionName);
   // Es: "2025-10-24T10:30:00Z"
   ```

2. **Query a Supabase con gte("updated_at", lastSync)**

   ```typescript
   .gte("updated_at", lastSync)  // ← Solo items modificati DOPO questo timestamp
   ```

3. **Merge in Dexie (upsert)**

   ```typescript
   for (const doc of data) {
     await table.put(doc); // ← Se esiste → update, altrimenti → insert
   }
   ```

4. **Aggiorna il timestamp SOLO se il pull ha successo**
   ```typescript
   localStorage.setItem(lastSyncKey, new Date().toISOString());
   ```

**Risultato:**

- Primo sync: tira TUTTI i dati (perché il timestamp è epoch)
- Sync successivi: tira SOLO i cambiamenti (perché il timestamp è recente)
- Se un sync fallisce: mantiene il timestamp vecchio e riprova da lì

### **Nel Hook useSync**

```typescript
const {
  isSyncing, // boolean: sta sincronizzando?
  lastSync, // Date | null: quando è stato l'ultimo sync riuscito
  sync, // () => Promise<void>: sync manuale
  hasUnsyncedChanges, // boolean: ha cambiamenti non sincati?
  isOnline, // boolean: sei online?
  triggerBackgroundSync, // () => void: trigger manual background sync
  unsyncedCount, // number: quanti dati sono in sospeso?
} = useSync();
```

### **Esempio d'Uso in una Componente**

```typescript
export function SyncStatus() {
  const { unsyncedCount, isOnline, isSyncing } = useSync();

  if (isOnline && unsyncedCount > 0) {
    return (
      <div className="text-warning">
        {unsyncedCount} cambiamenti in sospeso...
        {isSyncing && " Sincronizzando..."}
      </div>
    );
  }

  if (!isOnline && unsyncedCount > 0) {
    return (
      <div className="text-destructive">
        Offline - {unsyncedCount} cambiamenti salvati localmente
      </div>
    );
  }

  return <div className="text-success">Tutto sincronizzato ✅</div>;
}
```

### **Delta Sync: Query Efficienti a Supabase**

Il sistema usa **delta sync** per ridurre il traffico:

```typescript
// Primo sync (all'avvio): pull TUTTO
// localStorage non ha "last_sync_expenses"
// → getLastSuccessfulSyncTime() ritorna epoch (1970-01-01)
const { data } = await supabase
  .from("expenses")
  .select("*")
  .gte("updated_at", "1970-01-01") // ← pull tutto
  .eq("user_id", userId);
// Dopo: localStorage["last_sync_expenses"] = "2025-10-24T10:30:00Z"

// Sync successivi: pull solo le novità
const lastSync = await syncService.getLastSuccessfulSyncTime("expenses");
// → "2025-10-24T10:30:00Z"
const { data } = await supabase
  .from("expenses")
  .select("*")
  .gte("updated_at", "2025-10-24T10:30:00Z") // ← solo cambiamenti! 🚀
  .eq("user_id", userId);
// Risultato: Se 100 spese ma 3 modificate → tira solo 3 ✅
```

**Flusso Completo:**

```
1. initializeAtStartup() → backgroundSync()
   ↓
2. pullFromSupabase("expenses", userId)
   ├─ Prendi: localStorage["last_sync_expenses"]
   ├─ Se null → usa epoch ("1970-01-01")
   ├─ Query: .gte("updated_at", epoch) → tira TUTTO
   ├─ Merge in Dexie via upsert
   └─ Salva: localStorage["last_sync_expenses"] = NOW()

   … 2 ore dopo …

3. backgroundSync() (sync periodico/manuale)
   ↓
4. pullFromSupabase("expenses", userId)
   ├─ Prendi: localStorage["last_sync_expenses"] = "2025-10-24T10:30:00Z"
   ├─ Query: .gte("updated_at", "2025-10-24T10:30:00Z") → tira solo nuovi/modificati ✅
   ├─ Merge in Dexie
   └─ Salva: localStorage["last_sync_expenses"] = NOW()
```

### **Ciclo Completo: Sync e Update**

```
1. User crea spesa
   ↓
2. Salvo in Dexie
   ├─ id: '123'
   ├─ updated_at: '2025-10-23T10:30:00Z'
   └─ synced_at: null (NON sincato!)
   ↓
3. Se ONLINE: trigger background sync
   ├─ Invia a Supabase
   ├─ Se successo: aggiorna synced_at
   └─ synced_at: '2025-10-23T10:30:05Z' (SINCATO!)
   ↓
4. getUnsyncedCount(userId) → 0 ✅
```

---

### 1. **syncService.initializeAtStartup(userId)**

- Chiamato dal router al caricamento
- **Non aspetta nulla** - torna subito
- Se online → avvia background sync in parallelo
- Se offline → aspetta la connessione

### 2. **syncService.backgroundSync(userId)**

- Esegue pull completo da Supabase
- Esegue push di categorie e spese
- Non blocca l'UI
- Aggiorna i listener (SyncIndicator, ecc)
- Non rethrow errori (app continua a funzionare)

### 3. **syncService.syncAfterChange(userId)**

- Chiamato quando salvi una spesa/categoria
- **Solo PUSH** (veloce, incrementale)
- Se offline → logging ma senza blocco
- Se online → esegue in background
- Non aspettato dalla UI

### 4. **useSync Hook Aggiornato**

```typescript
{
  isSyncing: boolean;           // Se sta sincronizzando
  lastSync: Date | null;        // Ultimo sync riuscito
  sync: () => Promise<void>;    // Sync manuale
  hasUnsyncedChanges: boolean;  // Flag unsync
  isOnline: boolean;            // Stato connessione
  triggerBackgroundSync: () => void;  // Trigger manuale
}
```

---

## 🎯 Flow di Salvataggio (Dettagliato)

### Expense-Form → Dexie → Supabase

```typescript
// 1. User preme "Save Expense"
const handleSubmit = async (e: React.FormEvent) => {
  // 2. Salva in Dexie (BLOCKING - user deve aspettare)
  await db.expenses.put(expense);

  // 3. Subito dopo: se ONLINE, invia a Supabase (NON BLOCKING)
  if (syncService.isAppOnline()) {
    syncService.syncAfterChange(user.id).catch(...);
    // Non await! Torna subito all'UI
  }

  // 4. UI mostra successo
  setSuccess(true);
};
```

### Risultato:

- ✅ User vede "Spesa salvata" subito
- ✅ Data è disponibile offline
- 🔄 Se online, invia a Supabase in background
- ✅ Se offline, invia quando torna online

---

## 📊 Differenza Prima/Dopo

| Aspetto                      | Prima                   | Dopo                |
| ---------------------------- | ----------------------- | ------------------- |
| **Auto-sync al salvataggio** | ❌ No                   | ✅ Sì (background)  |
| **Blocco UI**                | ⚠️ Solo se sync manuale | ✅ Mai              |
| **Startup performance**      | ⚠️ Aspetta sync         | ✅ Istantaneo       |
| **Offline-first**            | ⚠️ Basic                | ✅ Full support     |
| **Data consistency**         | ⚠️ Manual sync          | ✅ Automatico       |
| **User feedback**            | ⚠️ Limited              | ✅ Real-time status |

---

## 🔍 Log dei Messaggi di Debug

Puoi seguire il flusso nei console logs:

```
// Startup:
"Initializing app - loading from local storage first"
"Online detected - starting background sync"
"Starting background sync for user: <id>"
"Pulled 5 items from categories"
"Pulled 10 items from expenses"
"Background sync completed"

// Salvataggio spesa:
"Expense saved locally - syncing with server"
"Syncing changes for user: <id>"
"Pushed 1 new and 0 updated items to expenses"
"Changes synced successfully"

// Offline:
"App is offline - working locally only"
"Offline - data saved locally, will sync when online"

// Ritorno online:
"App is online"
"Starting manual sync for user: <id>"
```

---

## 🛠️ Per Testare

### 1. **Scenario: Aggiungi spesa online**

```
1. App aperta e online
2. Aggiungi una spesa
3. Vedi "Expense saved" subito
4. In background: sync a Supabase
5. Controlla Supabase → spesa presente
```

### 2. **Scenario: Aggiungi spesa offline**

```
1. App aperta → vai offline (F12 Network > Offline)
2. Aggiungi una spesa
3. Vedi "Expense saved" subito
4. Vedi "Offline - will sync when online"
5. Torna online
6. Sync automatico si attiva
7. Controlla Supabase → spesa presente
```

### 3. **Scenario: Startup offline**

```
1. Chiudi app
2. Vai offline
3. Apri app
4. Vedi dati da Dexie subito
5. Torna online
6. Sync automatico pull da Supabase
```

---

## 📝 Note Importanti

⚠️ **Conflitti di sync**: Attualmente non gestiti. Se fai due edit offline e le due versioni conflitto, vince l'ultima modifica. Per il futuro: implementare conflict resolution.

⚠️ **Deleted items**: Soft-delete con `deleted_at`. Hard-delete da Supabase solo manualmente.

⚠️ **RLS Security**: Supabase deve avere RLS policies che controllano `user_id`. Tutti gli insert/update devono essere owned dall'utente.

---

## 🚀 Prossimi Miglioramenti

1. **Conflict resolution** per edit offline simultanei
2. **Sync progress indicator** (% completamento)
3. **Automatic retry** su fallimento sync
4. **Smart batching** (batch multiple changes)
5. **Delta sync** (solo cambiamenti, non full re-pull)
