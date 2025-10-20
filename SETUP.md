# ExpenseTracker PWA - Gestione Spese Personali e Condivise

Una Progressive Web App mobile-first per la gestione delle spese personali e condivise, sviluppata con React, Vite, TypeScript, Tailwind CSS e ShadCN UI.

## 🎯 Caratteristiche

### Versione 1 (Personale)

- ✅ Registrazione e login sicuri (Supabase Auth)
- ✅ 8 categorie di default create automaticamente
- ✅ Aggiunta e modifica di spese personali
- ✅ Categorie personalizzabili
- ✅ Dashboard con riepilogo mensile
- ✅ Import/export locale dei dati
- ✅ Modalità offline con cache Dexie
- ✅ Sincronizzazione manuale con Supabase

### Versione 2 (Multi-utente) - In sviluppo

- 📋 Creazione e gestione di gruppi
- 📋 Spese condivise visibili da tutti i membri
- 📋 Spese ricorrenti modificabili solo dal creatore
- 📋 CRUD membri gruppo
- 📋 Notifiche locali per inviti e modifiche
- 📋 Sincronizzazione bidirezionale con Supabase

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + ShadCN UI
- **State Management**: Zustand
- **Database Locale**: Dexie.js (IndexedDB)
- **Backend**: Supabase (Auth, PostgreSQL, Real-time)
- **PWA**: vite-plugin-pwa, Service Worker
- **Date Handling**: date-fns
- **UI Icons**: Lucide React
- **Animations**: Framer Motion

## 📦 Setup

### Prerequisiti

- Node.js 18+
- npm o pnpm
- Account Supabase

### Installazione

1. **Clone repository**

```bash
git clone <repo>
cd frontend-starter-kit
```

2. **Installa dipendenze**

```bash
pnpm install
```

3. **Configura variabili di ambiente**

```bash
cp .env.example .env.local
```

Aggiungi le tue credenziali Supabase:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Setup Supabase Database**

⚠️ **IMPORTANTE**: Esegui il SQL **nell'ordine esatto** qui sotto, perché alcune tabelle hanno foreign keys su altre.

Vai a Supabase > SQL Editor e incolla tutto il seguente codice:

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

**Ordine di creazione:**

1. ✅ `users` (no dependencies)
2. ✅ `groups` (FK → users)
3. ✅ `categories` (FK → users)
4. ✅ `expenses` (FK → users, groups)
5. ✅ `group_members` (FK → groups, users)
6. ✅ `shared_expenses` (FK → groups, expenses, users)
7. ✅ Indexes

8. **Avvia il server di sviluppo**

```bash
pnpm dev
```

L'app sarà disponibile su `http://localhost:5173`

## 📁 Struttura del Progetto

```
src/
├── components/              # Componenti UI riutilizzabili
│   ├── expense/            # Componenti spese
│   ├── layout/             # Layout e navigazione
│   ├── landing/            # Landing page
│   └── ui/                 # Componenti ShadCN UI
├── pages/                  # Pagine principali
│   ├── dashboard.tsx       # Dashboard principale
│   └── login.tsx           # Pagina login
├── lib/                    # Utility functions
│   ├── dexie.ts           # Schema Dexie e config
│   ├── auth.store.ts      # Auth state store (Zustand)
│   └── supabase.ts        # Client Supabase
├── hooks/                  # Custom React hooks
│   ├── useSync.ts         # Sincronizzazione dati
│   └── useTheme.ts        # Dark mode e temi
├── services/               # Logica di business
│   └── sync.service.ts    # Servizio sincronizzazione
├── styles/                 # CSS globali e config
├── assets/                 # Icone e immagini
└── router.tsx             # Configurazione routing
```

## 🔄 Sincronizzazione

### Modello di Sincronizzazione

Ogni record ha:

- `id` (uuid): ID globale univoco
- `updated_at`: Timestamp ultima modifica
- `isSynced`: Flag sincronizzazione locale

### Flusso di Sync

1. **Al login**: Auto-sync dei dati da Supabase
2. **On demand**: Bottone sincronizzazione manuale
3. **On online**: Auto-sync quando torna connessione internet
4. **Offline**: Cache locale con Dexie

### Risoluzione Conflitti

Local wins: Se il record locale è più recente (`local.updatedAt > remote.updated_at`), viene mantenuta la versione locale.

## 🌓 Dark Mode

L'app supporta automaticamente:

- Light mode
- Dark mode
- Preferenza di sistema

Puoi cambiare tema con il toggle in header.

## 📱 PWA Features

- ✅ Installabile su mobile (home screen)
- ✅ Funziona offline
- ✅ Sincronizzazione intelligente
- ✅ Background sync
- ✅ Service Worker caching

### Installazione PWA

**iOS**:

1. Apri l'app nel browser Safari
2. Tap "Condividi" → "Aggiungi alla schermata Home"

**Android**:

1. Apri l'app nel browser Chrome
2. Tap menu (≡) → "Installa app"

## 🔐 Sicurezza

- ✅ Autenticazione Supabase
- ✅ Row-level security (RLS) su Supabase
- ❌ **Non include**: PIN, biometria, cifratura locale

## 📊 Debug e Logging

La sincronizzazione usa `console.log` verbose:

```typescript
const result = await syncService.sync({
  userId: user.id,
  verbose: true,
});
```

Controllare browser console per:

- `[Sync]` - Sync service logs
- `[ServiceWorker]` - SW logs

## 🚀 Deploy

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

## 📝 Changelog Versioni

### v1.0.0 - Beta

- [x] Setup progetto e dipendenze
- [x] Autenticazione Supabase
- [x] Dexie offline database
- [x] Sincronizzazione bidirezionale
- [x] Dashboard e expense form
- [x] Dark mode
- [x] PWA setup
- [ ] Import/export dati
- [ ] Analytics dashboard

### v2.0.0 - Coming Soon

- [ ] Gestione gruppi
- [ ] Spese condivise
- [ ] Notifiche locali
- [ ] Sincronizzazione real-time

## 🐛 Problemi Comuni

### Service Worker non registra

Assicurati che l'app sia servita via HTTPS in produzione.

### Dexie non persiste dati

Controlla che IndexedDB non sia disabilitato nel browser.

### Supabase auth non funziona

Verifica che le env variables siano corrette:

```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

## 📞 Support

Per problemi o suggerimenti, apri un issue su GitHub.

## 📄 Licenza

MIT License - vedi LICENSE

---

**Fatto con ❤️ per gestire le spese in modo semplice**
