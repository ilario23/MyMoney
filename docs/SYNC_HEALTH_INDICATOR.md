# Sync Health Indicator

## 🎯 Cos'è?

Un indicatore visivo globale che mostra lo stato di sincronizzazione tra il database locale (Dexie) e remoto (Supabase).

**Posizione**: In alto a destra (sostituisce il theme toggle)

**Apparenza**:

- 🟢 **Verde** = Tutto sincronizzato
- 🟠 **Arancione** = Cambiamenti locali in sospeso
- 🔴 **Rosso** = Remoto ha dati più recenti

---

## 📊 I 3 Stati

### 1. **SYNCED** 🟢 (Verde)

```
✅ Tutto è sincronizzato tra locale e remoto
```

**Quando:**

- Non ci sono cambiamenti locali non sincati (`unsyncedCount === 0`)
- Remoto non ha cambiamenti nuovi (`hasRemoteChanges === false`)

**Azioni:**

- Click → Mostra info: "Tutto sincronizzato ✅"
- Nessun pulsante di sincronizzazione

---

### 2. **PENDING** 🟠 (Arancione)

```
📝 Tu hai dati locali non ancora inviati a Supabase
```

**Quando:**

- Hai appena creato/modificato una spesa o categoria
- Questi dati sono in Dexie ma non ancora in Supabase
- O sei stato offline e non hai potuto sincronizzare

**Azioni:**

- Click → Mostra info + pulsante "Sincronizza ora"
- Se online: invia i dati subito
- Se offline: aspetta la connessione (sincronizza automaticamente)

**Conteggio:**

- Mostra il numero esatto di cambiamenti: "Hai 3 cambiamenti in sospeso"

---

### 3. **CONFLICT** 🔴 (Rosso)

```
⚠️ Il server ha dati che tu non hai localmente
```

**Quando:**

- Una subscription Realtime di Supabase rileva cambiamenti nel db remoto
- Questi cambiamenti sono più recenti di quello che hai in locale
- Es: Hai modificato da un'altra app/device o un altro utente ha fatto modifiche

**Azioni:**

- Click → Mostra info + pulsante "Sincronizza ora"
- Se online: scarica i dati da Supabase
- Dopo pull: torna a **SYNCED** 🟢

---

## 🔄 Il Flusso

### Scenario: Crei una spesa

```
1. Crei spesa offline
   ↓
2. State: PENDING 🟠
   ├─ unsyncedCount = 1
   └─ hasRemoteChanges = false
   ↓
3. Torna online
   ├─ Auto-sync in background
   └─ State: SYNCED 🟢
```

### Scenario: Modifiche da altro device

```
1. Modifichi spesa da altro device
   ↓
2. Supabase Realtime: "Hey, c'è una modifica!"
   ├─ hasRemoteChanges = true
   ↓
3. State: CONFLICT 🔴
   ├─ unsyncedCount = 0 (tu non hai cambiamenti locali)
   └─ hasRemoteChanges = true
   ↓
4. Clicki "Sincronizza"
   ├─ Pull da Supabase
   ├─ hasRemoteChanges = false (segnato come processed)
   └─ State: SYNCED 🟢
```

### Scenario: Offline con più cambiamenti

```
1. Offline, crei:
   - Spesa 1
   - Categoria A
   ↓
2. State: PENDING 🟠
   ├─ unsyncedCount = 2
   ├─ Mostra: "Hai 2 cambiamenti in sospeso"
   └─ Dati salvati in Dexie
   ↓
3. Torna online
   ├─ Auto-sync: invia Spesa 1 + Categoria A
   └─ State: SYNCED 🟢
```

---

## 🔌 Realtime Monitoring

### Come funziona?

Al login, il sync service attiva una **subscription Realtime a Supabase**:

```typescript
supabase
  .channel(`sync-monitoring:${userId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "categories",
      filter: `user_id=eq.${userId}`,
    },
    () => {
      hasRemoteChanges = true; // ← Rilevato cambio
      notifyListeners();
    }
  )
  .subscribe();
```

### Perché non è in loop infinito?

Intelligenza:

1. **Realtime attiva**: Ascolta solo cambiamenti su categories/expenses
2. **Listener notifica**: Solo se `hasRemoteChanges` cambia
3. **Pull azzera**: Dopo `pullFromSupabase()`, setta `hasRemoteChanges = false`
4. **Niente polling**: Non chiede ogni N secondi, iscritta ai cambiamenti

### Performance

- ✅ **Zero polling**: Nessuna query periodica
- ✅ **Lazy**: Subscription attiva solo quando loggato
- ✅ **Clean**: Disattiva al logout (cleanup)
- ✅ **99% dei casi**: Niente cambiamenti = niente overhead

---

## 🧮 Logica di Calcolo

```typescript
async calculateHealthStatus(userId: string): SyncHealthStatus {
  const unsyncedCount = await this.getUnsyncedCount(userId);

  // Se hai dati non sincati
  if (unsyncedCount > 0) return "pending";

  // Se remoto ha dati nuovi
  if (this.hasRemoteChanges) return "conflict";

  // Altrimenti
  return "synced";
}
```

---

## 💬 UI Dialog

Al click sull'icona, compare un dialog con:

```
┌─────────────────────────────────┐
│ 🟢 Sincronizzato                │
├─────────────────────────────────┤
│ Tutto è sincronizzato tra       │
│ locale e remoto.                │
├─────────────────────────────────┤
│ [Chiudi]                        │
└─────────────────────────────────┘
```

O se **PENDING**:

```
┌─────────────────────────────────┐
│ 🟠 Cambiamenti in sospeso       │
├─────────────────────────────────┤
│ Hai 3 cambiamenti non           │
│ sincronizzati localmente.       │
├─────────────────────────────────┤
│ 📝 Sincronizza ora per          │
│ inviare i tuoi cambiamenti      │
│ al server.                      │
├─────────────────────────────────┤
│ [Chiudi] [Sincronizza ora]      │
└─────────────────────────────────┘
```

---

## 🔧 Implementazione Tecnica

### Files Coinvolti

1. **sync.service.ts**
   - Type: `SyncHealthStatus = 'synced' | 'pending' | 'conflict'`
   - Metodi:
     - `calculateHealthStatus()` - Calcola lo stato
     - `setupRealtimeMonitoring()` - Iscrive a cambiamenti
     - `cleanupRealtimeMonitoring()` - Disiscrive al logout
     - `markRemoteChangesAsProcessed()` - Reset flag dopo pull

2. **useSync hook**
   - Espone: `healthStatus: SyncHealthStatus`
   - Aggiornato per sottoscrivere cambiamenti di `healthStatus`

3. **sync-health-indicator.tsx** (NEW)
   - Componente che mostra l'icona
   - Dialog con info e pulsante di sync
   - Colori: verde/arancione/rosso

4. **layout.tsx**
   - Rimosso: `ThemeToggle`
   - Aggiunto: `SyncHealthIndicator`

5. **router.tsx**
   - Al login: `setupRealtimeMonitoring()`
   - Al logout: `cleanupRealtimeMonitoring()`

---

## 📝 Log di Debug

```
// Startup
"Realtime monitoring setup completed"

// Cambio remoto rilevato
"Remote changes detected in categories"

// Pull completato
"Pulled 2 items from categories"

// Reset flag
"Marked remote changes as processed"

// Logout
"Realtime monitoring cleaned up"
```

---

## 🚀 Prossimi Miglioramenti (Opzionali)

1. **Toast/Badge animata**: Mostra in basso "Sincronizzato ✅" quando completo
2. **Countdown**: Mostra quanti secondi all'ultimo sync
3. **Conflict Resolution**: Se sia locale che remoto hanno cambiamenti
4. **Sync Progress**: % di completamento durante sync lungo
5. **Multi-device**: Notifica se stesso cambio da 2 device
