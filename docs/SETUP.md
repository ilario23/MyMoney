# 🚀 MyMoney Setup Guide v3.0 - Dexie + Local-First# 🚀 MyMoney Setup Guide v3.0 - Dexie + Local-First

Benvenuto! Questa guida ti aiuterà a configurare MyMoney da zero con la nuova architettura **Dexie + Local-First**.Benvenuto! Questa guida ti aiuterà a configurare MyMoney da zero con la nuova architettura **Dexie + Local-First**.

## 📋 Cosa è MyMoney?## 📋 Cosa è MyMoney?

**MyMoney** è un'app **locale-first** per la gestione delle spese personali:**MyMoney** è un'app **locale-first** per la gestione delle spese personali:

- 💾 **Dati salvati localmente** in IndexedDB via Dexie- 💾 **Dati salvati localmente** in IndexedDB via Dexie

- 🔄 **Sincronizzazione opzionale** con Supabase quando sei online- 🔄 **Sincronizzazione opzionale** con Supabase quando sei online

- 📱 **Funziona offline** - tutte le operazioni funzionano senza connessione- 📱 **Funziona offline** - tutte le operazioni funzionano senza connessione

- ⚡ **Reattivo** - aggiornamenti in tempo reale via Dexie.Observable- ⚡ **Reattivo** - aggiornamenti in tempo reale via Dexie.Observable

- 🔐 **Privato** - controllo totale dei tuoi dati- 🔐 **Privato** - controllo totale dei tuoi dati

---

## 🛠️ Prerequisiti## 🛠️ Prerequisiti

Prima di iniziare, assicurati di avere:

- **Node.js** v18 o superioreL'app usa **Dexie** per gestire i dati in IndexedDB. 4 tabelle principali:pnpm install

- **pnpm** v10 o superiore (o npm/yarn)

- **Git**

- Un account **Supabase** (opzionale, solo per sync online)

#### 1. **users\*\***Getting Supabase Credentials:\*\*```

### Verifica versioni

````typescript

```bash

node --version    # v18+{

pnpm --version    # v10+

```  id: string                    // UUID (da Supabase Auth)



---  email: string                 // Email dell'utente1. Go to [supabase.com](https://supabase.com)### Step 2: Configure Environment



## 📦 Installazione  full_name?: string            // Nome completo



### 1. Clone il repository  avatar_url?: string           // URL avatar2. Create a new project (or use existing)



```bash  preferred_language: string    // "it" | "en"

git clone https://github.com/ilario23/MyMoney.git

cd MyMoney  created_at: string            // ISO timestamp3. Go to **Settings** → **API**```bash

````

updated_at: string // ISO timestamp

### 2. Installa dipendenze

deleted_at?: string // Soft delete flag4. Copy:cp .env.example .env.local

```bash

pnpm install}

```

```  - **Project URL** →`VITE_SUPABASE_URL````

Questo installerà:

- **React 19** - Framework UI

- **Dexie 4.2.1** - IndexedDB wrapper#### 2. **categories** - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

- **dexie-observable 4.0.1** - Reattività real-time

- **Supabase** - Backend opzionale per sync```typescript

- **TypeScript 5.8** - Type-safety

- **Tailwind CSS** - Styling{Add your Supabase credentials:

- E altre librerie

  id: string // UUID

### 3. Configura variabili d'ambiente (opzionale)

user_id: string // Link all'utente### 3. Database Setup

Crea un file `.env.local` nella root del progetto:

name: string // Es: "Cibo", "Trasporto"

````env

# Supabase (opzionale - solo per sincronizzazione online)  icon: string                  // Emoji: "🍕"```env

VITE_SUPABASE_URL=https://your-project.supabase.co

VITE_SUPABASE_ANON_KEY=your-anon-key  color?: string                // Hex color

````

parent_id?: string // Per categorie annidate#### Option A: Fresh Installation (Recommended)VITE_SUPABASE_URL=https://your-project.supabase.co

Se **non usi Supabase**, l'app funzionerà comunque 100% localmente!

is_custom: boolean // true = creata dall'utente

---

created_at: stringVITE_SUPABASE_ANON_KEY=your-anon-key

## 📁 Architettura dei Dati

updated_at: string

### Database Locale (Dexie - IndexedDB)

deleted_at?: string1. Open your Supabase project```

L'app usa **Dexie** per gestire i dati in IndexedDB. 4 tabelle principali:

}

#### 1. **users**

````2. Go to **SQL Editor**

```typescript

{

  id: string                    // UUID (da Supabase Auth)

  email: string                 // Email dell'utente#### 3. **expenses**3. Copy the entire content of `docs/SETUP_v3.0.sql`### Step 3: Setup Supabase Database

  full_name?: string            // Nome completo

  avatar_url?: string           // URL avatar```typescript

  preferred_language: string    // "it" | "en"

  created_at: string            // ISO timestamp{4. Paste and run the script

  updated_at: string            // ISO timestamp

  deleted_at?: string           // Soft delete flag  id: string                    // UUID

}

```  user_id: string               // Link all'utente5. Wait for completion (should take 5-10 seconds)#### 📌 Important: Fresh Install vs Migration



#### 2. **categories**  category_id: string           // Link alla categoria



```typescript  amount: number                // Importo (positivo = spesa)

{

  id: string                    // UUID  description: string           // Es: "Colazione al bar"

  user_id: string               // Link all'utente

  name: string                  // Es: "Cibo", "Trasporto"  date: string                  // ISO timestamp#### Option B: Migrate from v2.x**If you're setting up for the FIRST TIME:**

  icon: string                  // Emoji: "🍕"

  color?: string                // Hex color  created_at: string

  parent_id?: string            // Per categorie annidate

  is_custom: boolean            // true = creata dall'utente  updated_at: string

  is_active: boolean            // true = visibile nel form

  created_at: string  deleted_at?: string           // Soft delete

  updated_at: string

  deleted_at?: string           // Soft delete}⚠️ **Important:** Export your data first!- Follow **Step 3a** below - the schema already includes all v1.10 features

}

````

#### 3. **expenses**- Skip migration files - they're only for upgrading existing databases

````typescript#### 4. **stats_cache** (opzionale)

{

  id: string                    // UUID`typescript`bash

  user_id: string               // Link all'utente

  category_id: string           // Link alla categoria{

  amount: number                // Importo (positivo = spesa)

  description: string           // Es: "Colazione al bar"id: string // "${userId}-${period}"# In your v2.x app, export data**If you're UPGRADING from an older version:**

  date: string                  // ISO timestamp

  created_at: stringuser_id: string

  updated_at: string

  deleted_at?: string           // Soft deleteperiod: string // "YYYY-MM"# Settings → Export Data → Download JSON

}

```total_expenses: number



#### 4. **stats_cache** (locale, non sincronizzato)total_income: number- Your database already exists



```typescriptexpense_count: number

{

  id: string                    // "${userId}-${period}"daily_average: number# Then follow Option A for fresh install- Run the migration SQL files in order:

  user_id: string

  period: string                // "YYYY-MM"monthly_average: number

  total_expenses: number

  expense_count: numbertop_categories: Array<{ // Top 5 categorie# Afterward, import your data via the app UI - `MIGRATION_v1.7_HIERARCHICAL_CATEGORIES.sql` (if coming from < v1.7)

  daily_average: number

  monthly_average: number    category_id: string

  top_categories: Array<{       // Top 5 categorie

    category_id: string    category_name: string```  - `MIGRATION_v1.8.1_ACTIVE_CATEGORIES.sql` (if coming from < v1.8.1)

    category_name: string

    amount: number    amount: number

    count: number

  }>    count: number  - `MIGRATION_v1.9_GROUP_INVITE_CODES.sql` (if coming from < v1.9)

  updated_at: string

}}>

````

updated_at: string### 4. Run the Application - `MIGRATION_v1.10_REUSABLE_INVITE_CODES.sql` (if coming from < v1.10)

### Tech Stack

}

- **Frontend**: React 19 + Vite + TypeScript

- **Styling**: Tailwind CSS v4 + ShadCN UI````

- **State Management**: Zustand

- **Local Database**: Dexie.js (IndexedDB)

- **Backend**: Supabase (Auth, PostgreSQL) - opzionale

- **PWA**: vite-plugin-pwa, Service Worker---```bash#### 3a. Create Tables

- **Date Handling**: date-fns

- **UI Icons**: Lucide React

---## 🔄 Sincronizzazione (Opzionale)# Development mode

## 🚀 Avvia l'app

### Development mode### Come funziona?pnpm devGo to **Supabase → SQL Editor** and run the following SQL in order:

````bash

pnpm dev

```Se configuri Supabase, MyMoney sincronizza i tuoi dati:



L'app sarà disponibile a: **http://localhost:5173**



### Build per produzione1. **Pull** - Scarica i dati aggiornati da Supabase# Production build⚠️ **IMPORTANT**: Execute SQL **in exact order** - some tables have foreign keys on others.



```bash2. **Push** - Carica i tuoi nuovi record su Supabase

pnpm build

```3. **Checkpoint** - Ricorda quando è avvenuta l'ultima sincronizzazione (localStorage)pnpm build



Output sarà in `dist/` pronto per il deploy.



---### Quando si sincronizza?pnpm preview```sql



## 🔄 Sincronizzazione (Opzionale)



### Come funziona?- ✅ Automaticamente al login```-- 1. Users table (no dependencies)



Se configuri Supabase, MyMoney sincronizza i tuoi dati:- ✅ Ogni 30 minuti se sei online



1. **Pull** - Scarica i dati aggiornati da Supabase- ✅ Quando la connessione ritorna dopo offlineCREATE TABLE public.users (

2. **Push** - Carica i tuoi nuovi record su Supabase

3. **Checkpoint** - Ricorda quando è avvenuta l'ultima sincronizzazione (localStorage)



### Quando si sincronizza?### Cosa succede offline?Open [http://localhost:5173](http://localhost:5173)  id UUID PRIMARY KEY,



- ✅ Automaticamente al login

- ✅ Ogni 30 minuti se sei online

- ✅ Quando la connessione ritorna dopo offline**Niente cambia!** Puoi:  email TEXT UNIQUE NOT NULL,



### Cosa succede offline?- ✅ Aggiungere spese



**Niente cambia!** Puoi:- ✅ Creare categorie---  display_name TEXT,



- ✅ Aggiungere spese- ✅ Visualizzare dati

- ✅ Creare categorie

- ✅ Visualizzare dati- ✅ Cancellare record  avatar_url TEXT,

- ✅ Cancellare record



Tutto funziona localmente. Quando torni online, si sincronizza automaticamente.

Tutto funziona localmente. Quando torni online, si sincronizza automaticamente.## 🔐 Authentication Setup  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

---



## 🗄️ Setup Database Supabase (Opzionale)

---  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

Se vuoi la sincronizzazione, crea il database in Supabase:



### 1. Accedi a Supabase

## 🗄️ Setup Database Supabase (Opzionale)### Enable Email Authentication);

https://supabase.com/dashboard



### 2. Crea nuovo progetto o usa uno esistente

Se vuoi la sincronizzazione, crea il database in Supabase:

### 3. Vai a **SQL Editor** e crea le tabelle



Esegui questo SQL:

### 1. Accedi a Supabase1. Go to Supabase Dashboard-- 2. Groups table (depends on users)

```sql

-- 1. Create users tablehttps://supabase.com/dashboard

CREATE TABLE public.users (

  id UUID PRIMARY KEY,2. **Authentication** → **Providers**CREATE TABLE public.groups (

  email TEXT UNIQUE NOT NULL,

  display_name TEXT,### 2. Crea nuovo progetto o usa uno esistente

  avatar_url TEXT,

  preferred_language TEXT DEFAULT 'it',3. Enable **Email** provider  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP### 3. Vai a **SQL Editor** e crea le tabelle

);

4. Configure email templates (optional)  name TEXT NOT NULL,

-- 2. Create categories table

CREATE TABLE public.categories (Esegui questo SQL:

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,

  icon TEXT NOT NULL,```sql

  color TEXT,

  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,-- Create users table### Optional: Social Login  description TEXT,

  is_custom BOOLEAN DEFAULT true,

  is_active BOOLEAN DEFAULT TRUE NOT NULL,CREATE TABLE users (

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  id UUID PRIMARY KEY REFERENCES auth.users(id),  color TEXT,

  deleted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, name)  email TEXT UNIQUE NOT NULL,

);

  full_name TEXT,To enable Google/GitHub/etc:  invite_code TEXT UNIQUE,  -- Reusable invite code (v1.10)

-- 3. Create expenses table

CREATE TABLE public.expenses (  avatar_url TEXT,

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,  preferred_language TEXT DEFAULT 'it',  allow_new_members BOOLEAN DEFAULT TRUE NOT NULL,  -- Owner can control if group accepts new members (v1.10)

  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE SET NULL,

  amount DECIMAL(10, 2) NOT NULL,  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  description TEXT,

  date DATE NOT NULL,  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),1. **Authentication** → **Providers**  used_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,  -- DEPRECATED (kept for backwards compatibility)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  deleted_at TIMESTAMP WITH TIME ZONE

  deleted_at TIMESTAMP WITH TIME ZONE

););2. Enable desired provider  used_at TIMESTAMP WITH TIME ZONE,  -- DEPRECATED (kept for backwards compatibility)



-- 4. Create stats_cache table (local cache, optional)

CREATE TABLE public.stats_cache (

  id TEXT PRIMARY KEY,-- Create categories table3. Add OAuth credentials  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  period TEXT NOT NULL,CREATE TABLE categories (

  total_expenses DECIMAL(12, 2) DEFAULT 0,

  expense_count INTEGER DEFAULT 0,  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),4. Update redirect URLs  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

  daily_average DECIMAL(12, 2) DEFAULT 0,

  monthly_average DECIMAL(12, 2) DEFAULT 0,  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  top_categories JSONB,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  name TEXT NOT NULL,);

);

  icon TEXT NOT NULL,

-- Create indexes for performance

CREATE INDEX idx_categories_user_id ON public.categories(user_id);  color TEXT,**Redirect URL format:**

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

CREATE INDEX idx_categories_active ON public.categories(user_id, is_active);  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);

CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date);  is_custom BOOLEAN DEFAULT true,```-- 3. Categories table (depends on users)

CREATE INDEX idx_stats_cache_user_id ON public.stats_cache(user_id);

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

-- Enable Row Level Security

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),https://your-domain.com/auth/callbackCREATE TABLE public.categories (

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;  deleted_at TIMESTAMP WITH TIME ZONE,

ALTER TABLE public.stats_cache ENABLE ROW LEVEL SECURITY;

  UNIQUE(user_id, name)http://localhost:5173/auth/callback  # for development  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

-- ====== RLS POLICIES FOR USERS ======

CREATE POLICY "Users can read own data");

ON public.users FOR SELECT USING (auth.uid() = id);

```  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

CREATE POLICY "Users can update own data"

ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);-- Create expenses table



-- ====== RLS POLICIES FOR CATEGORIES ======CREATE TABLE expenses (  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,  -- Shared group categories (v1.12)

CREATE POLICY "Users can read own categories"

ON public.categories FOR SELECT USING (auth.uid() = user_id);  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),



CREATE POLICY "Users can create categories"  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,---  name TEXT NOT NULL,

ON public.categories FOR INSERT WITH CHECK (true);

  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,

CREATE POLICY "Users can update own categories"

ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);  amount DECIMAL(12, 2) NOT NULL,  color TEXT,



CREATE POLICY "Users can delete own categories"  description TEXT,

ON public.categories FOR DELETE USING (auth.uid() = user_id);

  date TIMESTAMP WITH TIME ZONE NOT NULL,## 🗄️ Database Schema Overview  icon TEXT,

-- ====== RLS POLICIES FOR EXPENSES ======

CREATE POLICY "Users can read own expenses"  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

ON public.expenses FOR SELECT USING (auth.uid() = user_id);

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,  -- Hierarchical categories (v1.7.0)

CREATE POLICY "Users can create expenses"

ON public.expenses FOR INSERT WITH CHECK (true);  deleted_at TIMESTAMP WITH TIME ZONE



CREATE POLICY "Users can update own expenses");### Core Tables  is_active BOOLEAN DEFAULT TRUE NOT NULL,  -- Hide from expense form (v1.8.1)

ON public.expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);



CREATE POLICY "Users can delete own expenses"

ON public.expenses FOR DELETE USING (auth.uid() = user_id);-- Create stats_cache table  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,



-- ====== RLS POLICIES FOR STATS_CACHE ======CREATE TABLE stats_cache (

CREATE POLICY "Users can read own stats"

ON public.stats_cache FOR SELECT USING (auth.uid() = user_id);  id TEXT PRIMARY KEY,| Table | Purpose | Synced |  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,



CREATE POLICY "Users can manage own stats"  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

ON public.stats_cache FOR INSERT WITH CHECK (true);

  period TEXT NOT NULL,|-------|---------|--------|  UNIQUE(user_id, name)  -- One category name per user (case-sensitive, must trim spaces before INSERT)

CREATE POLICY "Users can update own stats"

ON public.stats_cache FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);  total_expenses DECIMAL(12, 2) DEFAULT 0,



CREATE POLICY "Users can delete own stats"  total_income DECIMAL(12, 2) DEFAULT 0,| `users` | User profiles | ✅ |);

ON public.stats_cache FOR DELETE USING (auth.uid() = user_id);

```  income_count INTEGER DEFAULT 0,



### 4. Copia le credenziali  expense_count INTEGER DEFAULT 0,| `categories` | Expense categories | ✅ |



Dalla dashboard Supabase:  top_categories JSONB,



- Vai a **Settings** → **API**  daily_average DECIMAL(12, 2) DEFAULT 0,| `expenses` | Personal expenses | ✅ |-- Create indexes for categories

- Copia `Project URL` e `anon public key`

- Aggiungi a `.env.local`:  monthly_average DECIMAL(12, 2) DEFAULT 0,



```env  calculated_at TIMESTAMP WITH TIME ZONE,| `groups` | Shared expense groups | ✅ |CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

VITE_SUPABASE_URL=https://your-project.supabase.co

VITE_SUPABASE_ANON_KEY=your-anon-key  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()

````

);| `group_members` | Group membership | ✅ |CREATE INDEX idx_categories_user_parent ON public.categories(user_id, parent_id);

### 5. Riavvia l'app

```bash

pnpm dev-- Create indexes| `shared_expenses` | Group expenses | ✅ |CREATE INDEX idx_categories_active ON public.categories(user_id, is_active);

```

CREATE INDEX idx_categories_user_id ON categories(user_id);

---

CREATE INDEX idx_expenses_user_id ON expenses(user_id);| `shared_expense_splits` | Split calculations | ✅ |CREATE INDEX idx_categories_group_id ON public.categories(group_id);

## 🔐 Authentication Setup

CREATE INDEX idx_expenses_category_id ON expenses(category_id);

### Enable Email Authentication

CREATE INDEX idx_expenses_date ON expenses(date);CREATE INDEX idx_categories_user_group ON public.categories(user_id, group_id);

1. Go to Supabase Dashboard

2. **Authentication** → **Providers**CREATE INDEX idx_stats_cache_user_id ON stats_cache(user_id);

3. Enable **Email** provider

4. Configure email templates (optional)### Local-Only Collections

### Optional: Social Login-- Enable RLS

To enable Google/GitHub/etc:ALTER TABLE users ENABLE ROW LEVEL SECURITY;-- 4. Expenses table (depends on users and groups)

1. **Authentication** → **Providers**ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

2. Enable desired provider

3. Add OAuth credentialsALTER TABLE expenses ENABLE ROW LEVEL SECURITY;| Collection | Purpose |CREATE TABLE public.expenses (

4. Update redirect URLs

ALTER TABLE stats_cache ENABLE ROW LEVEL SECURITY;

**Redirect URL format:**

|------------|---------| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

````

https://your-domain.com/auth/callback          # for production-- Create RLS Policies for users

http://localhost:5173/auth/callback            # for development

```CREATE POLICY "Users can read own data"| `stats_cache` | Cached statistics (not synced) |  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,



---ON users FOR SELECT USING (auth.uid() = id);



## 🎯 Prima volta che usi l'app  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,



### Step 1: SignupCREATE POLICY "Users can update own data"



1. Vai a http://localhost:5173ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);---  amount DECIMAL(10, 2) NOT NULL,

2. Clicca **"Non hai un account? Registrati"**

3. Inserisci email e password

4. Clicca **"Registra"**

-- Create RLS Policies for categories  category TEXT NOT NULL,  -- Foreign key to categories.id (stored as text for flexibility)

### Step 2: Crea categorie

CREATE POLICY "Users can read own categories"

1. Vai a **"Categorie"** nel menu

2. Clicca **"Nuova categoria"**ON categories FOR SELECT USING (auth.uid() = user_id);## 🔄 How Synchronization Works  description TEXT,

3. Aggiungi categorie come:

   - 🍕 Cibo

   - 🚗 Trasporto

   - 🎬 EntertainmentCREATE POLICY "Users can insert own categories"  date DATE NOT NULL,

   - 🏠 Casa

ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);

### Step 3: Aggiungi spese

### Initial Load  deleted_at TIMESTAMP WITH TIME ZONE,

1. Vai a **"Spese"** o clicca **"Nuova spesa"**

2. Compila il form:CREATE POLICY "Users can update own categories"

   - Descrizione (es: "Colazione al bar")

   - ImportoON categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

   - Categoria

   - Data

3. Clicca **"Salva"**

CREATE POLICY "Users can delete own categories"```  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### Step 4: Visualizza statistiche

ON categories FOR DELETE USING (auth.uid() = user_id);

1. Vai a **"Statistiche"**

2. Vedi il totale del mese e le categorie top1. User logs in);



----- Create RLS Policies for expenses



## 📱 Progressive Web App (PWA)CREATE POLICY "Users can read own expenses"2. RxDB initializes local database



MyMoney è una **PWA completa**:ON expenses FOR SELECT USING (auth.uid() = user_id);



- ✅ Installa come app sul desktop/mobile3. UI loads immediately from cache (if available)-- 5. Group members table (depends on groups and users)

- ✅ Funziona offline (con service worker)

- ✅ Icona nella home screenCREATE POLICY "Users can insert own expenses"

- ✅ Splash screen al launch

ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);4. Sync starts in backgroundCREATE TABLE public.group_members (

### Come installare:



**Desktop (Chrome/Edge):**

CREATE POLICY "Users can update own expenses"5. UI updates reactively as data syncs  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

1. Apri MyMoney nel browser

2. Clicca sull'icona "Installa" nella barra indirizziON expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

3. Oppure menu → "Installa app"

```  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,

**iOS (Safari):**

CREATE POLICY "Users can delete own expenses"

1. Apri app in Safari

2. Tap Share → Add to Home ScreenON expenses FOR DELETE USING (auth.uid() = user_id);  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,



**Android (Chrome):**



1. Apri app in Chrome-- Create RLS Policies for stats_cache### Ongoing Sync  role TEXT DEFAULT 'member',

2. Tap menu (⋮) → Install app

CREATE POLICY "Users can read own stats"

---

ON stats_cache FOR SELECT USING (auth.uid() = user_id);  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

## 🗂️ Struttura cartelle



````

frontend-starter-kit/CREATE POLICY "Users can insert own stats"``` UNIQUE(group_id, user_id)

├── src/ON stats_cache FOR INSERT WITH CHECK (auth.uid() = user_id);

│ ├── components/ # Componenti React

│ │ ├── ui/ # Radix UI components- Live sync: Changes replicate automatically);

│ │ ├── expense/ # Expense form

│ │ └── layout/ # Layout componentsCREATE POLICY "Users can update own stats"

│ ├── pages/ # Pagine (Login, Dashboard, etc)

│ ├── hooks/ # Custom hooksON stats_cache FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);- Conflict resolution: Last-write-wins based on updated_at

│ │ ├── useQuery.ts # Dexie query hook (reattivo)

│ │ └── useTheme.ts # Dark mode hook

│ ├── lib/

│ │ ├── db.ts # Dexie database setupCREATE POLICY "Users can delete own stats"- Soft deletes: Items marked as deleted_at, not hard-deleted-- 6. Shared expenses table (depends on groups, expenses, and users)

│ │ ├── db-schemas.ts # TypeScript types

│ │ ├── supabase.ts # Supabase clientON stats_cache FOR DELETE USING (auth.uid() = user_id);

│ │ ├── auth.store.ts # Zustand auth store

│ │ └── logger.ts # Logging utilities```- Leader election: Only one tab syncs at a timeCREATE TABLE public.shared_expenses (

│ ├── services/

│ │ ├── sync.service.ts # Sync logic con Supabase

│ │ └── stats.service.ts # Calcolo statistiche

│ └── translations/ # i18n (Italiano/Inglese)### 4. Copia le credenziali``` id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

├── public/ # Static files

├── dist/ # Build output (produzione)

└── docs/ # Documentation

```````Dalla dashboard Supabase:  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,



---- Vai a **Settings** → **API**



## 🔄 How Synchronization Works- Copia `Project URL` e `anon public key`### Offline Mode  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,



### Initial Load- Aggiungi a `.env.local`:



1. User logs in  creator_id UUID NOT NULL REFERENCES public.users(id),

2. Dexie initializes local database

3. UI loads immediately from cache (if available)```env

4. Sync starts in background

5. UI updates reactively as data syncsVITE_SUPABASE_URL=https://your-project.supabase.co```  participants JSONB DEFAULT '[]',



### Ongoing SyncVITE_SUPABASE_ANON_KEY=your-anon-key



``````- All data cached locally in IndexedDB  is_recurring BOOLEAN DEFAULT FALSE,

- Pull: Fetch remote data from Supabase

- Push: Send local changes to Supabase

- Checkpoint: Save last_sync timestamp

- Conflict resolution: Last-Write-Wins based on updated_at### 5. Riavvia l'app- Full CRUD operations work offline  recurring_rule TEXT,

- Soft deletes: Items marked as deleted_at, not hard-deleted

``````bash



### Offline Modepnpm dev- Changes queued automatically  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,



- All data cached locally in IndexedDB````

- Full CRUD operations work offline

- Changes queued automatically- Sync resumes when connection restored updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

- Sync resumes when connection restored

---

---

``````);

## 🔐 Row Level Security (RLS)

## 🎯 Prima volta che usi l'app

RLS ensures users can only access their own data. The policies above implement:



- **users table**: Can only read/modify own profile

- **categories table**: Can only read/modify own categories### Step 1: Signup

- **expenses table**: Can read/modify own expenses

- **stats_cache table**: Can read/modify own cached stats1. Vai a http://localhost:5173----- 7. Create indexes per performance



### Important Notes on RLS Policies2. Clicca **"Non hai un account? Registrati"**



**⚠️ Why Permissive Policies?**3. Inserisci email e passwordCREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date);



The current policies use `WITH CHECK (true)` for INSERT operations because:4. Clicca **"Registra"**



1. **42501 Error During Signup**: When creating a new user, `auth.uid()` isn't fully linked to the record yet, causing RLS violations## 📊 Local StatisticsCREATE INDEX idx_expenses_group ON public.expenses(group_id);

2. **Solution**: Use permissive policies and validate permissions in application code

### Step 2: Crea categorie

**Key Insight:**

1. Vai a **"Categorie"** nel menuCREATE INDEX idx_categories_user ON public.categories(user_id);

- **Database**: Allows operations with permissive policies

- **Application**: Validates that users have permission (signup.tsx, sync.service.ts)2. Clicca **"Nuova categoria"**

- **Result**: Security maintained without RLS errors

3. Aggiungi categorie come:### How It WorksCREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

### Troubleshooting RLS

   - 🍕 Cibo

If you get foreign key constraint errors during sync:

   - 🚗 TrasportoCREATE INDEX idx_categories_user_parent ON public.categories(user_id, parent_id);

1. **Verify user exists in Supabase**:

   - 🎬 Entertainment

   ```sql

   SELECT * FROM public.users WHERE id = 'your-user-id';   - 🏠 Casa1. **Check cache first**: 30-minute validityCREATE INDEX idx_categories_active ON public.categories(user_id, is_active);

```````

2. **Check RLS is enabled**:
   - Go to **Table Editor → Select table → Check RLS toggle**### Step 3: Aggiungi spese2. **Calculate from local data**: If cache expired/missingCREATE INDEX idx_groups_owner ON public.groups(owner_id);

3. **If user creation fails at signup**:1. Vai a **"Spese"** o clicca **"Nuova spesa"**
   - Check browser console for error messages

   - Verify RLS policies are PERMISSIVE (use `WITH CHECK (true)`)2. Compila il form:3. **Update cache**: Store results locallyCREATE INDEX idx_groups_invite_code ON public.groups(invite_code);

   - Ensure app validates user_id in signup.tsx

   - Descrizione (es: "Colazione al bar")

### RLS Policy Errors Reference

- Importo4. **Invalidate on change**: Recalculate when expenses changeCREATE INDEX idx_groups_allow_new_members ON public.groups(allow_new_members);

| Error | Cause | Solution |

| --------- | ---------------------------------- | --------------------------------------------------------------- | - Categoria

| **42501** | Row Level Security policy violated | Use `WITH CHECK (true)` for INSERT; app validates permissions |

| **406** | Malformed query | Check `.select("*")` instead of `.select("id")` | - DataCREATE INDEX idx_group_members_group ON public.group_members(group_id);

| **401** | Unauthorized | Verify auth token is valid; check CORS settings |

| **23503** | Foreign key constraint | User must exist in `public.users`; verify in signup.tsx |3. Clicca **"Salva"**

### If RLS Still Causes Issues### PerformanceCREATE INDEX idx_shared_expenses_group ON public.shared_expenses(group_id);

As a temporary diagnostic step, you can disable RLS on specific tables to test:### Step 4: Visualizza statistiche

```sql1. Vai a **"Statistiche"**`````

-- TEMPORARY: Disable RLS to test (for debugging only)

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;2. Vedi il totale del mese e le categorie top

ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

- **Instant results** for cached periods

-- Test your flow...

---

-- Re-enable RLS when done

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;- **No network latency\*\***Creation order summary:\*\*

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

```````## 🔧 Comandi disponibili



**⚠️ WARNING**: Do NOT deploy to production with RLS disabled - this removes all authorization checks!- **Works completely offline**



---```bash



## 🌍 Multi-Language Support# Development- **Scales to thousands of expenses**1. ✅ `users` (no dependencies)



The app supports English (EN) and Italian (IT).pnpm dev              # Avvia dev server



**To add a new language:**2. ✅ `groups` (FK → users)



1. Create `src/translations/xx.ts` (replace `xx` with language code)# Build

2. Copy structure from `it.ts` or `en.ts`

3. Update `src/translations/index.ts` to include new languagepnpm build            # Build per produzione---3. ✅ `categories` (FK → users)

4. Update `src/lib/language.tsx` to add to language options

pnpm preview          # Anteprima build locale

---

4. ✅ `expenses` (FK → users, groups)

## 🌓 Dark Mode

# Lint

Automatically supports:

pnpm lint             # Controlla errori di codice## 🎨 Customization5. ✅ `group_members` (FK → groups, users)

- Light mode

- Dark mode``````

- System preference detection

6. ✅ `shared_expenses` (FK → groups, expenses, users)

Toggle via button in header.

---

---

### Theme7. ✅ Indexes

## 🚢 Deployment

## 📱 Progressive Web App (PWA)

### Vercel (Recommended)

Edit `src/index.css` to customize colors:#### 3b. Enable Row Level Security (RLS) Policies

```bash

pnpm install -g vercelMyMoney è una **PWA completa**:

vercel

```- ✅ Installa come app sul desktop/mobile````css**⚠️ CRITICAL**: RLS policies are required to prevent unauthorized access to user data.



### Netlify- ✅ Funziona offline (con service worker)



```bash- ✅ Icona nella home screen:root {

pnpm install -g netlify-cli

netlify deploy --prod --dir=dist- ✅ Splash screen al launch

```````

--primary: 240 5.9% 10%;In **Supabase → SQL Editor**, run:

### Docker

### Come installare:

``````dockerfile

FROM node:18-alpine1. Apri MyMoney su Chrome/Edge --primary-foreground: 0 0% 98%;

WORKDIR /app

COPY package.json pnpm-lock.yaml ./2. Clicca sull'icona "Installa" nella barra indirizzi

RUN npm install -g pnpm && pnpm install

COPY . .3. Oppure menu → "Installa app" /_ ... more variables _/```sql

RUN pnpm build

EXPOSE 5173---}-- Enable RLS on all tables

CMD ["pnpm", "preview", "--host"]

```## 🗂️ Struttura cartelle```ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;



---`````ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;



## 🔧 Troubleshootingfrontend-starter-kit/



### "Cannot read property 'users' of undefined"├── src/### TranslationsALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;



❌ Database Dexie non inizializzato│   ├── components/          # Componenti React



✅ Controlla che `src/lib/db.ts` sia corretto│   │   ├── ui/              # Radix UI componentsALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

✅ Vedi la console (F12) per errori di inizializzazione

│   │   ├── expense/         # Expense form

### "Dexie database not initialized"

│   │   └── layout/          # Layout componentsAdd new languages in `src/translations/`:ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

❌ Il database non si è avviato

│   ├── pages/               # Pagine (Login, Dashboard, etc)

✅ Controlla la console per errori

✅ Cancella localStorage/IndexedDB: F12 → Application → Clear storage│   ├── hooks/               # Custom hooksALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;



### App offline ma non sincronizza│   │   ├── useQuery.ts      # Dexie query hook (reattivo)



❌ Credenziali Supabase non configurate│   │   └── useRxDB.ts       # Compatibility layer```typescript



✅ Aggiunta `.env.local` con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY│   ├── lib/



### Password dimenticata│   │   ├── db.ts            # Dexie database setup// src/translations/de.ts-- ====== USERS TABLE POLICIES ======



✅ Usa "Hai dimenticato la password?" nella pagina di login│   │   ├── db-schemas.ts    # TypeScript types

✅ Ti arriverà un link di reset via email (se Supabase è configurato)

│   │   ├── supabase.ts      # Supabase clientexport default {-- Users can read own record

### Build fallisce con errori TypeScript

│   │   ├── auth.store.ts    # Zustand auth store

❌ Importa da file vecchi

│   │   └── logger.ts        # Logging utilities  common: {CREATE POLICY "Users can read own record"

✅ Verifica tutti gli import siano da `@/lib/db` e non da vecchie locazioni

│   ├── services/

### Service Worker not registering

│   │   ├── sync.service.ts  # Sync logic con Supabase    appName: 'MeinGeld',ON public.users

- Ensure app is served over HTTPS in production

- Check browser DevTools → Application → Service Workers│   │   └── stats.service.ts # Calcolo statistiche



### Dexie not persisting│   └── translations/        # i18n (Italiano/Inglese)    // ... translationsFOR SELECT



- Verify IndexedDB is enabled in browser├── public/                  # Static files

- Check DevTools → Application → IndexedDB

├── dist/                    # Build output (produzione)  }USING (auth.uid() = id);

### Supabase auth failing

└── docs/                    # Documentation

- Verify environment variables are correct

- Check Supabase project URL and anon key```}

- Ensure CORS is configured correctly



### Category Unique Constraint

---```-- Users can insert their own record (NEW USERS at signup)

Categories are unique per user by name. The database enforces:



```sql

UNIQUE(user_id, name)  -- One category name per user## 🚨 Troubleshooting-- NOTE: Uses permissive policy (WITH CHECK true) because auth.uid() isn't fully linked yet

``````

**Important**: The app must:

### "Cannot read property 'users' of undefined"Register in `src/translations/index.ts`:-- during user creation. App logic validates user_id = auth.uid() in signup.tsx

1. **Trim whitespace** before INSERT/UPDATE: `.trim()`

2. **Case-sensitive comparison** - "Food" and "food" are different❌ Database Dexie non inizializzato

3. **Check for duplicates** before INSERT (for better UX)

✅ Controlla che `src/lib/db.ts` sia correttoCREATE POLICY "Users can insert their own record"

When a duplicate is detected:

✅ Vedi la console (F12) per errori di inizializzazione

- **App Level**: Show error message "Category already exists" immediately (better UX)

- **DB Level**: PostgreSQL will reject with constraint violation (safety net)```typescriptON public.users

### Hierarchical Categories### "Dexie database not initialized"

Categories support **parent-child relationships** for better organization:❌ Il database non si è avviatoimport de from './de';FOR INSERT

- **Top-level categories**: `parent_id = NULL` (e.g., "Shopping", "Transportation")✅ Controlla la console per errori

- **Sub-categories**: `parent_id = <parent-uuid>` (e.g., "Groceries" under "Shopping")

- **Tree structure**: Unlimited depth (but recommended max 2-3 levels for UX)✅ Cancella localStorage/IndexedDB: F12 → Application → Clear storageWITH CHECK (true); -- Allow insertion, app validates user_id match

- **Cascade delete**: When parent deleted, children become top-level (`ON DELETE SET NULL`)

**Example tree:**

### App offline ma non sincronizzaexport const translations = {

`````

📌 Shopping (parent_id: null)❌ Credenziali Supabase non configurate

  └─ 🍕 Groceries (parent_id: shopping-uuid)

  └─ 👕 Clothing (parent_id: shopping-uuid)✅ Aggiunta `.env.local` con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY  en,-- Users can update own record

🚗 Transportation (parent_id: null)

  └─ ⛽ Fuel (parent_id: transportation-uuid)

  └─ 🚌 Public Transit (parent_id: transportation-uuid)

```### Password dimenticata  it,CREATE POLICY "Users can update own record"



---✅ Usa "Hai dimenticato la password?" nella pagina di login



## 📊 Development & Debugging✅ Ti arriverà un link di reset via email (se Supabase è configurato)  de  // Add hereON public.users



### Verbose Sync Logging



```typescript### Build fallisce con errori TypeScript};FOR UPDATE

const result = await syncService.sync({

  userId: user.id,❌ Importa da @/lib/rxdb (file vecchio)

  verbose: true,

});✅ Cambia in `@/lib/db````USING (auth.uid() = id)

`````

Monitor browser console for:

---WITH CHECK (auth.uid() = id);

- `[Sync]` logs from sync service

- `[ServiceWorker]` logs from service worker

---## 📖 Documentazione---

## 📚 Additional Resources

- **Dexie**: https://dexie.org/docsPer approfondire:-- ====== CATEGORIES TABLE POLICIES ======

- **Dexie.Observable**: https://dexie.org/docs/Observable

- **Supabase**: https://supabase.com/docs- **Dexie**: https://dexie.org/docs

- **React**: https://react.dev

- **TypeScript**: https://www.typescriptlang.org/docs- **Dexie.Observable**: https://dexie.org/docs/Observable## 🧪 Testing-- Users can read own and group categories (v1.12)

---- **Supabase**: https://supabase.com/docs

## 📝 Changelog- **React**: https://react.devCREATE POLICY "Users can read own and group categories"

### v3.0 (Attuale)- **TypeScript**: https://www.typescriptlang.org/docs

- ✨ Migrazione da RxDB a Dexie### Run TestsON public.categories

- ✨ Architettura 100% locale-first

- ✨ Dexie.Observable per reattività---

- ✨ Setup semplificato

- ✨ Sincronizzazione opzionale con SupabaseFOR SELECT

- **Database schema fresh start** - v3.0 uses a completely new local database structure

## 🤝 Contribuisci

### v2.x

````bashUSING (

- ❌ Removed in v3.0

Il progetto è open source su GitHub:

### v1.x

https://github.com/ilario23/MyMoney# Unit tests  -- Personal categories (no group_id)

- ❌ Removed in v3.0



---

Bugs, feature requests, PRs sono benvenuti!pnpm test  (auth.uid() = user_id AND group_id IS NULL)

## 📞 Support & Troubleshooting



For issues or questions:

---  OR

1. Check browser console for error messages

2. Review this SETUP.md troubleshooting section

3. Check Supabase SQL Editor for table/policy issues

4. Open an issue on GitHub with:## 📝 Changelog# E2E tests  -- Group categories where user is owner of the group

   - Error message from console

   - Steps to reproduce

   - Browser and OS version

### v3.0 (Attuale)pnpm test:e2e  (group_id IN (

---

- ✨ Migrazione da RxDB a Dexie

## 📄 License

- ✨ Architettura 100% locale-first    SELECT id FROM public.groups WHERE owner_id = auth.uid()

MIT License - see LICENSE file

- ✨ Dexie.Observable per reattività

---

- ❌ Rimossi gruppi e spese condivise# Coverage report  ))

**Built with ❤️ for personal expense tracking - Simple, Fast, Private**

- ✨ Setup semplificato

- ✨ Sincronizzazione opzionale con Supabasepnpm test:coverage  OR



### v2.x```  -- Group categories where user is member of the group

- RxDB con replicazione

- Supporto gruppi e spese condivise  (group_id IN (



### v1.x### Test Sync Locally    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()

- Prima versione

  ))

---

```bash);

**Buon divertimento! Happy budgeting! 💰**

# Terminal 1: Start dev server

Se hai domande, apri un issue su GitHub o contatta lo sviluppatore.

pnpm dev-- Users can create categories

-- NOTE: Permissive policy (WITH CHECK true) to avoid 42501 errors

# Terminal 2: Open Supabase local (optional)-- App validates user_id = auth.uid() in frontend/sync

npx supabase startCREATE POLICY "Users can create categories"

```ON public.categories

FOR INSERT

---WITH CHECK (true);  -- Allow insertion, app validates user_id match



## 🚢 Deployment-- Users can update own categories

CREATE POLICY "Users can update own categories"

### Vercel (Recommended)ON public.categories

FOR UPDATE

1. Push your code to GitHubUSING (auth.uid() = user_id)

2. Import project in VercelWITH CHECK (auth.uid() = user_id);

3. Add environment variables:

   - `VITE_SUPABASE_URL`-- Users can delete own categories

   - `VITE_SUPABASE_ANON_KEY`CREATE POLICY "Users can delete own categories"

4. Deploy!ON public.categories

FOR DELETE

**vercel.json** is already configured:USING (auth.uid() = user_id);



```json-- ====== EXPENSES TABLE POLICIES ======

{-- Users can read own expenses (NO nested queries - causes 42P17 infinite recursion)

  "rewrites": [CREATE POLICY "Users can read own expenses"

    { "source": "/(.*)", "destination": "/index.html" }ON public.expenses

  ]FOR SELECT

}USING (auth.uid() = user_id);

````

-- Users can create expenses

### Netlify-- NOTE: Permissive policy (WITH CHECK true) to avoid 42501 errors

-- App validates user_id = auth.uid() and group_id permissions in frontend

````bashCREATE POLICY "Users can create expenses"

pnpm buildON public.expenses

FOR INSERT

# Deploy dist/ folderWITH CHECK (true);  -- Allow insertion, app validates user_id match

netlify deploy --prod --dir=dist

```-- Users can update own expenses

CREATE POLICY "Users can update own expenses"

### DockerON public.expenses

FOR UPDATE

```dockerfileUSING (auth.uid() = user_id)

FROM node:18-alpineWITH CHECK (auth.uid() = user_id);

WORKDIR /app

COPY package.json pnpm-lock.yaml ./-- Users can delete own expenses

RUN npm install -g pnpm && pnpm installCREATE POLICY "Users can delete own expenses"

COPY . .ON public.expenses

RUN pnpm buildFOR DELETE

EXPOSE 5173USING (auth.uid() = user_id);

CMD ["pnpm", "preview", "--host"]

```-- ====== GROUPS TABLE POLICIES ======

-- Users can read own groups OR groups with valid invite codes AND allow_new_members = true (for joining)

---CREATE POLICY "Users can read groups"

ON public.groups

## 🔧 TroubleshootingFOR SELECT

USING (

### Sync Not Working  auth.uid() = owner_id

  OR

**Check:**  (invite_code IS NOT NULL AND allow_new_members = TRUE)

1. Supabase credentials in `.env.local`);

2. RLS policies enabled on all tables

3. User is authenticated-- Owners can create groups

4. Browser console for errorsCREATE POLICY "Users can create groups"

ON public.groups

**Reset sync:**FOR INSERT

```typescriptWITH CHECK (auth.uid() = owner_id);

// Open browser console

syncService.stopSync()-- Owners can update own groups

await syncService.startSync(userId)CREATE POLICY "Owners can update groups"

```ON public.groups

FOR UPDATE

### IndexedDB Quota ExceededUSING (auth.uid() = owner_id)

WITH CHECK (auth.uid() = owner_id);

**Solution:**

```typescript-- Owners can delete groups

// Clear old dataCREATE POLICY "Owners can delete groups"

await db.expensesON public.groups

  .find({FOR DELETE

    selector: {USING (auth.uid() = owner_id);

      deleted_at: { $ne: null },

      updated_at: { $lt: thirtyDaysAgo }-- ====== GROUP MEMBERS TABLE POLICIES ======

    }-- Members can read group members (permissive - frontend filters by user's groups)

  })-- NOTE: Permissive policy avoids recursive subquery issues (42P17 infinite recursion)

  .remove()-- Security maintained at groups table level + frontend filtering

```CREATE POLICY "Members can read group members"

ON public.group_members

### Stats Not UpdatingFOR SELECT

USING (true);

**Fix:**

```typescript-- Owners can manage members (create/add members)

// Invalidate cache-- NOTE: Permissive policy to avoid nested query infinite recursion

await statsService.invalidateCache(userId)-- App validates ownership in sync.service.ts before inserting

CREATE POLICY "Owners can manage members"

// RecalculateON public.group_members

const stats = await statsService.calculateMonthlyStats(userId, new Date())FOR INSERT

```WITH CHECK (true);



### Multiple Tabs Syncing-- ====== SHARED EXPENSES TABLE POLICIES ======

-- Members can read shared expenses (NO nested queries - simplified)

RxDB handles this automatically with leader election. Only one tab will sync at a time.CREATE POLICY "Members can read shared expenses"

ON public.shared_expenses

**Check current leader:**FOR SELECT

```typescriptUSING (true);  -- Frontend filters by user's groups

db.waitForLeadership().then(() => {

  console.log('This tab is the leader')-- Members can create shared expenses

})-- NOTE: Permissive policy (WITH CHECK true) to avoid 42501 errors

```-- App validates creator_id = auth.uid() and group membership in sync.service.ts

CREATE POLICY "Members can create shared expenses"

---ON public.shared_expenses

FOR INSERT

## 📚 Additional ResourcesWITH CHECK (true);



- [Technical Documentation](./TECHNICAL.md) - Architecture deep-dive-- Creators can update shared expenses

- [API Reference](./API.md) - Service APIs and hooksCREATE POLICY "Creators can update shared expenses"

- [Changelog](./CHANGELOG.md) - Version historyON public.shared_expenses

- [PWA Guide](./PWA.md) - Progressive Web App featuresFOR UPDATE

USING (creator_id = auth.uid())

---WITH CHECK (creator_id = auth.uid());

````

## 🤝 Contributing

### Step 4: Create Database Views (v1.8+)

We welcome contributions! Please:

**Purpose**: Pre-calculated views for optimized queries and better performance.

1. Fork the repository

2. Create a feature branchGo to **Supabase → SQL Editor** and run:

3. Make your changes

4. Add tests```sql

5. Submit a pull request-- ============================================================

-- DATABASE VIEWS - v1.8

----- Ottimizzazione query con viste pre-calcolate

-- ============================================================

## 📞 Support

-- 1. Vista: Riepilogo spese utente

- **Issues**: [GitHub Issues](https://github.com/yourusername/mymoney/issues)CREATE OR REPLACE VIEW user_expense_summary AS

- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mymoney/discussions)SELECT

- **Email**: support@mymoney.app user_id,

  COUNT(\*) FILTER (WHERE deleted_at IS NULL) as total_expenses,

--- SUM(amount) FILTER (WHERE deleted_at IS NULL) as total_amount,

AVG(amount) FILTER (WHERE deleted_at IS NULL) as avg_expense,

## 📄 License MIN(date) FILTER (WHERE deleted_at IS NULL) as first_expense_date,

MAX(date) FILTER (WHERE deleted_at IS NULL) as last_expense_date,

MIT License - see [LICENSE](../LICENSE) file for details. COUNT(DISTINCT category) FILTER (WHERE deleted_at IS NULL) as unique_categories

FROM expenses

---GROUP BY user_id;

**Version:** 3.0.0 -- 2. Vista: Statistiche categoria per utente

**Last Updated:** October 2025 CREATE OR REPLACE VIEW user_category_stats AS

**Minimum Node:** 18+ SELECT

**Supported Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ e.user_id,

e.category,
COUNT(\*) as expense_count,
SUM(e.amount) as total_amount,
AVG(e.amount) as avg_amount,
MIN(e.date) as first_expense,
MAX(e.date) as last_expense
FROM expenses e
WHERE e.deleted_at IS NULL
GROUP BY e.user_id, e.category;

-- 3. Vista: Spese mensili aggregate
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
user_id,
DATE_TRUNC('month', date) as month,
COUNT(\*) as expense_count,
SUM(amount) as total_amount,
AVG(amount) as avg_amount,
COUNT(DISTINCT category) as unique_categories
FROM expenses
WHERE deleted_at IS NULL
GROUP BY user_id, DATE_TRUNC('month', date);

-- 4. Vista: Totali gruppo
CREATE OR REPLACE VIEW group_expense_summary AS
SELECT
g.id as group_id,
g.name as group_name,
g.owner_id,
COUNT(DISTINCT e.id) FILTER (WHERE e.deleted_at IS NULL) as total_expenses,
SUM(e.amount) FILTER (WHERE e.deleted_at IS NULL) as total_amount,
COUNT(DISTINCT gm.user_id) as member_count,
MIN(e.date) FILTER (WHERE e.deleted_at IS NULL) as first_expense_date,
MAX(e.date) FILTER (WHERE e.deleted_at IS NULL) as last_expense_date
FROM groups g
LEFT JOIN expenses e ON e.group_id = g.id
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id, g.name, g.owner_id;

-- 5. Vista: Spese condivise con dettagli
CREATE OR REPLACE VIEW shared_expense_details AS
SELECT
se.id,
se.group_id,
se.expense_id,
se.creator_id,
e.amount,
e.category,
e.description,
e.date,
g.name as group_name,
JSONB_ARRAY_LENGTH(se.participants) as participant_count,
se.is_recurring,
se.created_at,
se.updated_at
FROM shared_expenses se
JOIN expenses e ON e.id = se.expense_id
JOIN groups g ON g.id = se.group_id
WHERE e.deleted_at IS NULL;

-- 6. Vista: Categorie attive con conteggio utilizzo
CREATE OR REPLACE VIEW category_usage_stats AS
SELECT
c.id,
c.user_id,
c.group_id,
c.name,
c.icon,
c.color,
c.parent_id,
c.is_active,
COUNT(e.id) as usage_count,
COALESCE(SUM(e.amount), 0) as total_amount,
MAX(e.date) as last_used
FROM categories c
LEFT JOIN expenses e ON e.category = c.name
AND e.user_id = c.user_id
AND e.deleted_at IS NULL
GROUP BY c.id, c.user_id, c.group_id, c.name, c.icon, c.color, c.parent_id, c.is_active;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON user_expense_summary TO authenticated;
GRANT SELECT ON user_category_stats TO authenticated;
GRANT SELECT ON monthly_expense_summary TO authenticated;
GRANT SELECT ON group_expense_summary TO authenticated;
GRANT SELECT ON shared_expense_details TO authenticated;
GRANT SELECT ON category_usage_stats TO authenticated;

-- Verify views created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'VIEW'
ORDER BY table_name;

````

**Expected output**: Should show 6 views created (user_expense_summary, user_category_stats, etc.)

**Benefits**:

- ⚡ ~200ms faster queries (pre-calculated aggregates)
- 📊 Profile page loads instantly
- 🎯 Dashboard stats optimized

### Step 5: Enable Realtime Subscriptions (v1.8+)

**Purpose**: Instant multi-device sync without polling.

Go to **Supabase → SQL Editor** and run:

```sql
-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_expenses;

-- Verify Realtime is enabled
SELECT 'Realtime enabled for: ' || tablename as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
````

**Expected output**: Should show 5 tables with Realtime enabled.

**Benefits**:

- 🔄 Sync between devices in <1 second
- 🌐 Multi-user collaboration in real-time
- ⚡ No more 30-second polling delays

**How it works**:

1. User creates expense on Device A
2. Supabase broadcasts change via WebSocket
3. Device B receives event and updates UI instantly
4. All happens in <100ms! ⚡

**Troubleshooting Realtime**:

If subscriptions don't work:

1. Verify tables are in `supabase_realtime` publication (query above)
2. Check browser console for `[Realtime] Subscriptions started`
3. Ensure RLS policies allow SELECT (already configured in Step 3b)
4. Test with two browser windows logged in as same user

### Step 6: Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

**First-time setup verification**:

Open browser console (F12) and look for:

```bash
✅ [Realtime] Subscriptions started
✅ [Realtime] Expenses subscription status: SUBSCRIBED
🟢 Real-time indicator in header
```

If you see these logs, everything is working correctly!

## 📁 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── expense/            # Expense-related components
│   ├── layout/             # Layout and navigation
│   ├── landing/            # Landing page
│   └── ui/                 # ShadCN UI components
├── pages/                  # Main pages
│   ├── dashboard.tsx       # Main dashboard
│   ├── login.tsx           # Login page
│   ├── signup.tsx          # Signup page
│   └── profile.tsx         # User profile
├── lib/                    # Utility functions
│   ├── dexie.ts           # Dexie schema and config
│   ├── auth.store.ts      # Auth state (Zustand)
│   ├── language.tsx       # i18n translations
│   └── supabase.ts        # Supabase client
├── hooks/                  # Custom React hooks
│   ├── useSync.ts         # Sync data
│   └── useTheme.ts        # Dark mode
├── services/               # Business logic
│   └── sync.service.ts    # Synchronization service
├── translations/           # i18n translations
│   ├── en.ts              # English
│   └── it.ts              # Italian
└── router.tsx             # Routing configuration
```

## 🔄 Synchronization

### Data Model

Each record has:

- `id` (uuid): Globally unique ID
- `updated_at`: Last modification timestamp
- `isSynced`: Local sync flag

### Sync Flow

1. **On login**: Auto-sync data from Supabase
2. **On demand**: Manual sync button
3. **On online**: Auto-sync when connection returns
4. **Offline**: Local cache with Dexie

### Conflict Resolution

**Local wins**: If local record is newer (`local.updated_at > remote.updated_at`), local version is kept.

## 🔐 Row Level Security (RLS)

RLS ensures users can only access their own data. The policies above implement:

- **users table**: Can only read/modify own profile
- **categories table**: Can only read/modify own categories
- **expenses table**: Can read own expenses (groups handled in frontend)
- **groups table**: Can read own groups (owners only)
- **group_members table**: Can manage members of their groups
- **shared_expenses table**: Can read/create expenses (frontend validates permissions)

### Important Notes on RLS Policies

**⚠️ Why Permissive Policies?**

The current policies use `WITH CHECK (true)` for INSERT operations because:

1. **42501 Error During Signup**: When creating a new user, `auth.uid()` isn't fully linked to the record yet, causing RLS violations
2. **42P17 Infinite Recursion**: Nested SELECT queries in policies (like `WHERE group_id IN (SELECT ...)`) can cause infinite loops
3. **Solution**: Use permissive policies and validate permissions in application code

**Key Insight:**

- **Database**: Allows operations with permissive policies
- **Application**: Validates that users have permission (signup.tsx, sync.service.ts, expense-form.tsx)
- **Result**: Security maintained without RLS errors

### Troubleshooting RLS

If you get foreign key constraint errors during sync:

1. **Verify user exists in Supabase**:

   ```sql
   SELECT * FROM public.users WHERE id = 'your-user-id';
   ```

2. **Check RLS is enabled**:
   - Go to **Table Editor → Select table → Check RLS toggle**

3. **If user creation fails at signup**:
   - Check browser console for error messages
   - Verify RLS policies are PERMISSIVE (use `WITH CHECK (true)`)
   - Ensure app validates user_id in signup.tsx line 109

### RLS Policy Errors Reference

| Error     | Cause                              | Solution                                                               |
| --------- | ---------------------------------- | ---------------------------------------------------------------------- |
| **42501** | Row Level Security policy violated | Use `WITH CHECK (true)` for INSERT; app validates permissions          |
| **42P17** | Infinite recursion in policy       | Remove nested SELECT queries; use simple `auth.uid() = user_id` checks |
| **406**   | Malformed query                    | Check `.select("*")` instead of `.select("id")`                        |
| **401**   | Unauthorized                       | Verify auth token is valid; check CORS settings                        |
| **23503** | Foreign key constraint             | User must exist in `public.users`; verify in signup.tsx                |

### If RLS Still Causes Issues

As a temporary diagnostic step, you can disable RLS on specific tables to test:

```sql
-- TEMPORARY: Disable RLS to test (for debugging only)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- Test your flow...

-- Re-enable RLS when done
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING**: Do NOT deploy to production with RLS disabled - this removes all authorization checks!

## 🌍 Multi-Language Support

The app supports English (EN) and Italian (IT).

**To add a new language:**

1. Create `src/translations/xx.ts` (replace `xx` with language code)
2. Copy structure from `it.ts` or `en.ts`
3. Update `src/translations/index.ts` to include new language
4. Update `src/lib/language.tsx` to add to language options

## 🌓 Dark Mode

Automatically supports:

- Light mode
- Dark mode
- System preference detection

Toggle via button in header.

## 📱 PWA Features

- ✅ Installable on mobile (home screen)
- ✅ Works offline
- ✅ Intelligent sync
- ✅ Background sync support
- ✅ Service Worker caching

### PWA Installation

**iOS**:

1. Open app in Safari
2. Tap Share → Add to Home Screen

**Android**:

1. Open app in Chrome
2. Tap menu (⋮) → Install app

## � Deployment

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

## 🎯 Best Practices

### Categories

1. **Category names must be unique per user**
   - The database enforces this with `UNIQUE(user_id, name)`
   - Try to create a duplicate category → PostgreSQL rejects

2. **Always trim whitespace**
   - ✅ User enters "Food " → Stored as "Food"
   - ✅ User enters " Food" → Stored as "Food"
   - ✅ Prevents hidden duplicates

3. **Case-sensitive comparison**
   - ✅ "Food" and "Food" → Duplicate (error)
   - ✅ "Food" and "food" → Different (allowed)
   - This is intentional - users can have "Breakfast" and "breakfast" if they want

4. **Category ID as FK in Expenses**
   - Expenses store `category` field as UUID (FK to `categories.id`)
   - Allows category names to change without breaking expense references
   - Example: Rename "Food" to "Groceries" → All expenses still linked correctly

### Sync & Offline

1. **Bidirectional sync**
   - Local changes upload when online
   - Remote changes download to local DB
   - Conflicts: Local wins if newer

2. **Offline mode**
   - Create expenses offline → Marked as `isSynced = false`
   - When online → Auto-sync to Supabase
   - No data loss

## 📊 Development & Debugging

### Verbose Sync Logging

```typescript
const result = await syncService.sync({
  userId: user.id,
  verbose: true,
});
```

Monitor browser console for:

- `[Sync]` logs from sync service
- `[ServiceWorker]` logs from service worker

### Common Issues

#### Service Worker not registering

- Ensure app is served over HTTPS in production
- Check browser DevTools → Application → Service Workers

#### Dexie not persisting

- Verify IndexedDB is enabled in browser
- Check DevTools → Application → IndexedDB

#### Supabase auth failing

- Verify environment variables are correct
- Check Supabase project URL and anon key
- Ensure CORS is configured correctly

#### Foreign key constraint errors

- User must exist in `public.users` table
- Verify user is created at signup (check console logs)
- Confirm RLS policies allow INSERT on users table

#### RLS policy errors

- Ensure `auth.uid()` matches the inserted user ID
- Check that RLS is enabled on the table
- Verify policies are created correctly (see Step 3b)

### Category Unique Constraint

Categories are unique per user by name. The database enforces:

```sql
UNIQUE(user_id, name)  -- One category name per user
```

**Important**: The app must:

1. **Trim whitespace** before INSERT/UPDATE: `.trim()`
2. **Case-sensitive comparison** - "Food" and "food" are different
3. **Check for duplicates** before INSERT (for better UX) and rely on DB constraint as safety net

When a duplicate is detected:

- **App Level**: Show error message "Category already exists" immediately (better UX)
- **DB Level**: PostgreSQL will reject with constraint violation (safety net)

### Expense Category Reference

Expenses store category as UUID (text field):

```
expenses.category → categories.id
```

This allows category names to change without breaking references. The frontend resolves the ID to name for display.

### Hierarchical Categories (v1.7.0+)

Starting from v1.7.0, categories support **parent-child relationships** for better organization:

- **Top-level categories**: `parent_id = NULL` (e.g., "Shopping", "Transportation")
- **Sub-categories**: `parent_id = <parent-uuid>` (e.g., "Groceries" under "Shopping")
- **Tree structure**: Unlimited depth (but recommended max 2-3 levels for UX)
- **Circular reference prevention**: App validates that a category cannot be its own ancestor
- **Cascade delete**: When parent deleted, children become top-level (`ON DELETE SET NULL`)

**Migration**: If upgrading from v1.6.0 or earlier, run `MIGRATION_v1.7_HIERARCHICAL_CATEGORIES.sql` in Supabase SQL Editor.

**Example tree:**

```
📌 Shopping (parent_id: null)
  └─ 🍕 Groceries (parent_id: shopping-uuid)
  └─ � Clothing (parent_id: shopping-uuid)
🚗 Transportation (parent_id: null)
  └─ ⛽ Fuel (parent_id: transportation-uuid)
  └─ 🚌 Public Transit (parent_id: transportation-uuid)
```

## 📝 Changelog

### v1.8.0 - Real-time Sync & Database Views

- **NEW**: Real-time subscriptions for instant multi-device sync
  - Sync between devices in <1 second (vs 30s polling before)
  - WebSocket-based push notifications
  - 5 tables with real-time enabled: expenses, categories, groups, members, shared
  - Auto-reconnect on online/offline transitions
  - Visual real-time indicator in header
- **NEW**: Database Views for optimized queries
  - 6 pre-calculated views (user_expense_summary, user_category_stats, etc.)
  - ~200ms faster profile stats loading
  - Reduced CPU usage in browser (server-side aggregations)
  - Fallback to local calculation when offline
- **NEW**: Dynamic app version from package.json
  - Sidebar and profile show current version automatically
  - Single source of truth for versioning
- **IMPROVED**: Conflict resolution with Last-Write-Wins strategy
- **IMPROVED**: Performance optimizations across the board
- Migration: `MIGRATION_v1.8_DATABASE_VIEWS.sql` + Realtime setup
- Documentation: `REALTIME_IMPLEMENTATION.md`, `SETUP_CHECKLIST.md`

### v1.10.0 - Icon Dropdown & Reusable Invite Codes

- **NEW**: Category icons in dropdown menu
  - Cleaner UI with Select component instead of icon grid
  - Applied to both create and edit modes
- **NEW**: Reusable invite codes with access control
  - Owner can toggle `allow_new_members` flag
  - Single invite code works for multiple members
  - No need to generate new codes for each invite
- **NEW**: Group member display
  - Shows participant count and names for each group
  - Owner badge for group creators
- Updated database schema with `allow_new_members` field
- Enhanced translations (EN/IT) with new keys
- Migration: `MIGRATION_v1.10_REUSABLE_INVITE_CODES.sql`

### v1.7.0 - Hierarchical Categories & Search

- **NEW**: Hierarchical categories with parent-child relationships
  - Added `parent_id` field to categories table
  - Tree view UI with expand/collapse
  - Grouped dropdown in expense form
  - Migration SQL script included
- **NEW**: Search/filter on Categories page
  - Real-time search by category name
  - Shows "X of Y categories" when filtering
- All Expenses page with search functionality
- Dashboard UI improvements (unified summary card)
- Version bump to 1.7.0

### v1.6.0 - Category ID Refactor & Validation

- **BREAKING**: Expenses now store category ID (UUID) instead of name
  - Allows category names to change without breaking references
  - Dashboard resolves category ID to name for display
- Category names are now trimmed before insert/update
- Case-sensitive duplicate detection for categories
- Updated expense form with empty state when no categories
- Fixed 406 errors by changing .single() → .maybeSingle() in sync queries
- Added comprehensive Data Model documentation

### v1.5.0 - Enhanced FK Constraint Handling

- Added detailed logging for user creation
- Improved error messages and diagnostics
- Fixed query issues in sync service
- Added comprehensive RLS policy documentation

### v1.4.2 - Offline Indicator

- Added offline/online status indicator
- Improved sync state monitoring

### v1.4 - Multi-Language Support

- Full English and Italian translations
- Language selector in profile
- i18n infrastructure

### v1.0 - Beta Release

- Core expense tracking
- Personal expense management
- Offline-first sync
- PWA support
- Dark mode

## 📞 Support & Troubleshooting

For issues or questions:

1. Check browser console for error messages
2. Review this SETUP.md troubleshooting section
3. Check Supabase SQL Editor for table/policy issues
4. Open an issue on GitHub with:
   - Error message from console
   - Steps to reproduce
   - Browser and OS version

## 📄 License

MIT License - see LICENSE file

---

**Built with ❤️ for expense tracking made simple**
