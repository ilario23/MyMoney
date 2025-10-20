# MyMoney v2.0 - Groups & Shared Expenses

## 📋 Sommario delle Funzionalità

### Version 2 Features
- ✅ **Gestione Gruppi**: Crea e gestisci gruppi di spese condivise
- ✅ **Spese Condivise**: Traccia le spese condivise tra i membri del gruppo
- ✅ **Liquidazione**: Segna le spese come saldate
- ✅ **Multi-Lingua**: Supporto completo per IT e EN
- ✅ **Sidebar Desktop**: Menu laterale per navigazione su desktop

## 🗂️ Struttura Database

### Tables Utilizzate

#### `groups`
```typescript
{
  id: string;              // UUID
  name: string;            // Nome del gruppo
  ownerId: string;         // ID del proprietario
  description?: string;    // Descrizione opzionale
  color?: string;          // Colore per visualizzazione
  isSynced: boolean;       // Sincronizzato con Supabase
  createdAt: Date;
  updatedAt: Date;
}
```
**Indici**: `id`, `ownerId`

#### `groupMembers`
```typescript
{
  id: string;              // UUID
  groupId: string;         // Riferimento al gruppo
  userId: string;          // ID utente membro
  role: "owner" | "member";// Ruolo nel gruppo
  joinedAt: Date;          // Data di adesione
  isSynced: boolean;
}
```
**Indici**: `[groupId+userId]`, `groupId`

#### `sharedExpenses`
```typescript
{
  id: string;              // UUID
  groupId: string;         // Gruppo di appartenenza
  expenseId: string;       // Riferimento a expenses
  creatorId: string;       // Chi ha registrato
  participants: [{         // Array di partecipanti
    userId: string;
    amount: number;        // Quota dell'utente
    settled: boolean;      // Pagato?
  }];
  isRecurring: boolean;    // Ricorrente?
  recurringRule?: string;  // Regola ricorrenza (rrule)
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indici**: `id`, `groupId`, `creatorId`

## 🎯 Pagine Principali

### 1. **Groups Page** (`/groups`)
- Visualizza tutti i gruppi creati dall'utente
- Crea nuovo gruppo (Dialog)
- Modifica gruppo
- Elimina gruppo
- Mostra descrizione e colore

**Componente**: `src/pages/groups.tsx`

**Funzionalità**:
- ✅ CRUD completo
- ✅ Dialog per creazione
- ✅ Validazione nome
- ✅ Toast di successo/errore

### 2. **Shared Expenses Page** (`/shared-expenses`)
- Visualizza tutte le spese condivise
- Filtra per gruppo
- Filtra per stato (pending/settled)
- Segna come saldato
- Mostra quote per partecipante

**Componente**: `src/pages/shared-expenses.tsx`

**Funzionalità**:
- ✅ Visualizzazione con enrichment dati
- ✅ Filtri avanzati
- ✅ Status tracking
- ✅ Marker settled

### 3. **Groups Detail Page** (Futura)
- Gestione membri del gruppo
- Aggiunta/Rimozione membri
- Statistiche del gruppo
- Spese del gruppo

## 🔄 Flusso di Sincronizzazione

### Per i Gruppi

**Sync Ciclo** (da implementare in `sync.service.ts`):
1. Carica gruppi locali non sincronizzati
2. Carica gruppo da Supabase (se esiste)
3. Compara `updatedAt` locali vs remoti
4. Local wins se più recente
5. Inserisci o aggiorna a seconda

```typescript
const { data: existing } = await supabase
  .from("groups")
  .select("id, updatedAt")
  .eq("id", localGroup.id)
  .single();

if (existing) {
  if (localGroup.updatedAt > existing.updatedAt) {
    await supabase.from("groups").update(localGroup).eq("id", localGroup.id);
  }
} else {
  await supabase.from("groups").insert(localGroup);
}
```

### Per le Spese Condivise
Stesso pattern del sopra, applicato a `sharedExpenses` table.

## 🌐 Traduzioni Aggiunte

### Italian (it.ts)
```typescript
"groups.title": "Gruppi",
"groups.newGroup": "Nuovo Gruppo",
"groups.createGroup": "Crea Gruppo",
"groups.groupName": "Nome Gruppo",
// ... 30+ keys

"sharedExpenses.title": "Spese Condivise",
"sharedExpenses.myExpenses": "Le Mie Spese Condivise",
"sharedExpenses.pending": "In Sospeso",
// ... 25+ keys
```

### English (en.ts)
Equivalenti in inglese per tutte le chiavi italiane.

**Total Translation Keys**: 191 (da 145)

## 🎨 Interfaccia Utente

### Desktop Layout (1024px+)
```
┌─────────────────┬──────────────────────────┐
│   Header        │   Header continues...    │
├─────────────────┼──────────────────────────┤
│  📊 Dashboard   │                          │
│  🛒 Spese       │   Main Content           │
│  📁 Categorie   │   (Groups/Shared Exp)    │
│  👥 Gruppi      │                          │
│  🤝 Spese Cond. │                          │
│  👤 Profilo     │                          │
│                 │                          │
│  v1.0 PWA       │                          │
└─────────────────┴──────────────────────────┘
```

### Mobile Layout (<1024px)
```
┌──────────────────────────┐
│      Header              │
├──────────────────────────┤
│                          │
│   Main Content           │
│   (Responsive)           │
│                          │
├──────────────────────────┤
│📊 🛒 📁 👥 🤝 👤 (Nav)    │
└──────────────────────────┘
```

## 📱 Navigazione

### Sidebar Items (Desktop)
1. Dashboard (`/dashboard`)
2. Spese (`/expenses`)
3. Categorie (`/categories`)
4. Gruppi (`/groups`) **NEW**
5. Spese Condivise (`/shared-expenses`) **NEW**
6. Profilo (`/profile`)

### Mobile Navigation
Stessa struttura, visualizzata come bottom nav bar.

## 🔗 Ruote Aggiunte

```typescript
// In router.tsx
<Route path="/groups" element={<Layout><GroupsPage /></Layout>} />
<Route path="/shared-expenses" element={<Layout><SharedExpensesPage /></Layout>} />
```

## ⚙️ Sync Service (Da Completare)

Aggiungere a `src/services/sync.service.ts`:

```typescript
async syncGroups() {
  // Implementazione simile a syncCategories
  // Check-then-insert-or-update pattern
}

async syncSharedExpenses() {
  // Implementazione simile a syncExpenses
  // Gestire timestamps e conflitti
}

async sync(options?: { verbose?: boolean }) {
  // Aggiungere chiamate ai nuovi sync
  await this.syncGroups();
  await this.syncSharedExpenses();
  // ... resto del sync
}
```

## 📊 Statistiche

- **Pagine Nuove**: 2 (`groups.tsx`, `shared-expenses.tsx`)
- **Componenti Nuovi**: 0 (reuso di componenti UI)
- **Traduzioni Nuove**: 46 keys (23 per groups, 23 per shared-expenses)
- **Linee di Codice**: ~600 (pagine)
- **Time to Implement**: ~4-6 ore (incluso sync)

## 🚀 Prossimi Step

1. ✅ Crea pagine Groups e SharedExpenses
2. ✅ Aggiorna traduzioni
3. ✅ Aggiorna sidebar/navigation
4. ⏳ Implementa syncGroups/syncSharedExpenses
5. ⏳ Aggiungi group detail page
6. ⏳ Aggiungi member management
7. ⏳ Aggiungi notifiche per spese condivise
8. ⏳ Aggiungi recurring expenses logic

## 🔐 Security Notes

- Ogni gruppo è di proprietà di un utente (ownerId)
- Solo il proprietario può eliminare il gruppo
- I membri possono visualizzare ma non modificare le impostazioni
- Le spese condivise sono immutabili dopo la creazione

## 📝 Note di Sviluppo

- Database schema è già pronto in `src/lib/dexie.ts`
- Indici sono ottimizzati per query comuni
- Pattern di sincronizzazione è coerente con v1.x
- Traduzioni segui lo stesso sistema che in v1.x
- UI è responsive e mobile-first come il resto dell'app
