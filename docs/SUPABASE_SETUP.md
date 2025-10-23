# 🗄️ Supabase Setup Guide

Guida completa per setupare Supabase con MyMoney v3.0.

## 📋 Prerequisiti

- Account Supabase (gratuito su https://supabase.com)
- MyMoney clonato e dipendenze installate
- `.env.local` pronto nel progetto

---

## 🚀 Step 1: Crea un Progetto Supabase

1. Vai a https://supabase.com/dashboard
2. Clicca **"New Project"**
3. Scegli:
   - **Name**: MyMoney (o quello che vuoi)
   - **Database Password**: scegli una password sicura
   - **Region**: scegli quella più vicina a te
4. Clicca **"Create new project"**

Aspetta 2-3 minuti che il progetto si crei.

---

## 🔑 Step 2: Copia le Credenziali

1. Una volta creato, vai a **Settings** → **API**
2. Copia:
   - **Project URL** (es: `https://xxxxxxx.supabase.co`)
   - **anon/public key** (la chiave lunga)

3. Crea `.env.local` nella root del progetto:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📊 Step 3: Crea le Tabelle

Vai a **SQL Editor** in Supabase e copia/incolla questo SQL:

```sql
-- 1. Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'it',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_custom BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name)
);

-- 3. Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create stats_cache table
CREATE TABLE public.stats_cache (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  expense_count INTEGER DEFAULT 0,
  daily_average DECIMAL(12, 2) DEFAULT 0,
  monthly_average DECIMAL(12, 2) DEFAULT 0,
  top_categories JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_active ON public.categories(user_id, is_active);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date);
CREATE INDEX idx_stats_cache_user_id ON public.stats_cache(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_cache ENABLE ROW LEVEL SECURITY;

-- ====== RLS POLICIES FOR USERS TABLE ======
-- Only authenticated user can read their own profile
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Only authenticated user can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- ⚠️ DELETE DISABLED - User profiles cannot be deleted (soft-delete only)
-- No INSERT policy - profiles created by Supabase Auth only

-- ====== RLS POLICIES FOR CATEGORIES TABLE ======
-- Only authenticated user can read their own categories
CREATE POLICY "Users can read own categories"
ON public.categories FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated user can create categories (for themselves only)
CREATE POLICY "Users can create own categories"
ON public.categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated user can update their own categories
CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ⚠️ DELETE DISABLED - Use soft-delete via UPDATE deleted_at instead

-- ====== RLS POLICIES FOR EXPENSES TABLE ======
-- Only authenticated user can read their own expenses
CREATE POLICY "Users can read own expenses"
ON public.expenses FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated user can create expenses (for themselves only)
CREATE POLICY "Users can create own expenses"
ON public.expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated user can update their own expenses
CREATE POLICY "Users can update own expenses"
ON public.expenses FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ⚠️ DELETE DISABLED - Use soft-delete via UPDATE deleted_at instead

-- ====== RLS POLICIES FOR STATS_CACHE TABLE ======
-- Only authenticated user can read their own stats
CREATE POLICY "Users can read own stats"
ON public.stats_cache FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated user can insert their own stats
CREATE POLICY "Users can insert own stats"
ON public.stats_cache FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated user can update their own stats
CREATE POLICY "Users can update own stats"
ON public.stats_cache FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ⚠️ DELETE DISABLED - Use soft-delete via UPDATE deleted_at instead
```

Clicca **"Run"** e aspetta che finisca (2-3 secondi).

✅ Se vedi "Success" → Perfetto!

---

## � Step 3b: RLS Security Model

**Key Principles:**

1. **User Profiles (users table)**:
   - ✅ Users can read only their own profile
   - ✅ Users can update only their own profile
   - ❌ No one can create user profiles (Supabase Auth manages this)
   - ❌ Deletion completely disabled (prevents accidental data loss)

2. **Categories & Expenses**:
   - ✅ Users can CRUD only their own records
   - ❌ Deletion disabled - use **soft-delete** instead

3. **Soft-Delete Pattern**:

   Instead of DELETE, update the `deleted_at` field:

   ```sql
   -- Soft-delete a category
   UPDATE public.categories 
   SET deleted_at = NOW(), updated_at = NOW()
   WHERE id = 'category-id' AND user_id = auth.uid();

   -- Query active records only
   SELECT * FROM public.categories 
   WHERE user_id = auth.uid() AND deleted_at IS NULL;
   ```

   **Benefits**:
   - 🔄 Sync can recover deleted records if needed
   - 📊 Historical data preserved for analytics
   - 🔙 Undo is possible
   - 🛡️ Prevents accidental permanent loss

---

## �🔐 Step 4: Abilita Email Authentication

1. Vai a **Authentication** → **Providers**
2. Clicca su **Email**
3. Assicurati che il toggle sia **ON** (blu)
4. Opzionale: Personalizza email templates

### Optional: Social Login

Se vuoi Google/GitHub:

1. Vai a **Authentication** → **Providers**
2. Clicca sul provider che vuoi (Google, GitHub, etc)
3. Aggiungi le credenziali OAuth
4. Configura i redirect URLs

**Redirect URLs:**

```
https://your-domain.com/auth/callback          # production
http://localhost:5173/auth/callback            # development
```

---

## ✅ Step 5: Verifica Setup

Nel browser, apri la console di Supabase e vai a **SQL Editor**, esegui:

```sql
-- Verifica tabelle create
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verifica RLS abilitato
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Verifica indexes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

Dovresti vedere:

- ✅ 4 tabelle: `users`, `categories`, `expenses`, `stats_cache`
- ✅ RLS abilitato su tutte
- ✅ 6 indexes creati

---

## 🧪 Step 6: Test la Connessione

Nel progetto MyMoney, riavvia il dev server:

```bash
pnpm dev
```

Vai a http://localhost:5173:

1. Clicca **"Registrati"**
2. Inserisci email e password
3. Clicca **"Registra"**

Se vedi la dashboard → ✅ Perfetto! Supabase è connesso.

---

## 🔧 Troubleshooting

### "Cannot connect to Supabase"

✅ Verifica `.env.local`:

- `VITE_SUPABASE_URL` è corretto?
- `VITE_SUPABASE_ANON_KEY` è corretto?

✅ Riavvia il dev server dopo aver cambiato `.env.local`

### "User creation failed"

✅ Verifica che RLS policies siano create:

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'users';
```

Dovresti vedere 2 policies: "Users can read own data" e "Users can update own data"

### "Foreign key constraint failed"

✅ Verifica user esiste in `public.users`:

```sql
SELECT * FROM public.users WHERE email = 'your-email@example.com';
```

Se non vedi nulla, il signup non ha creato l'utente. Controlla console del browser.

### "RLS policy denied"

❌ Questa è una security feature, non un errore.

✅ Significa che stai cercando di accedere a dati di altri utenti. L'app controlla questo correttamente, quindi non dovrebbe mai succedere durante l'uso normale.

---

## 📚 Documentazione Supabase

- **Auth**: https://supabase.com/docs/guides/auth
- **Database**: https://supabase.com/docs/guides/database
- **RLS**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **JavaScript Client**: https://supabase.com/docs/reference/javascript/

---

## 🔄 Sync & Offline

Con questo setup:

- ✅ App funziona 100% offline (tutto in Dexie/IndexedDB)
- ✅ Quando online, sincronizza automaticamente con Supabase
- ✅ Conflicts: last-write-wins
- ✅ Soft deletes: `deleted_at` field

Niente di speciale da configurare - funziona già!

---

## 📝 Note Importanti

### RLS Policies - Sicurezza First

**Regole di Accesso:**

1. **INSERT**: Solo campo `user_id` nel WITH CHECK (non `true`)
   - Categories: `WITH CHECK (auth.uid() = user_id)` → solo proprie
   - Expenses: `WITH CHECK (auth.uid() = user_id)` → solo proprie
   - Users: No INSERT policy → profili creati solo da Auth

2. **DELETE**: Completamente disabilitato
   - Nessuna policy DELETE creata
   - Previene cancellazioni accidentali
   - Usa soft-delete via UPDATE deleted_at

3. **SELECT**: Solo record dell'utente autenticato
   - `USING (auth.uid() = user_id)` su tutte le tabelle

4. **UPDATE**: Solo record propri
   - `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`

Questa è la configurazione **più sicura**.

### Unique Constraint su Categorie

```sql
UNIQUE(user_id, name)
```

Significa che ogni utente può avere solo una categoria con lo stesso nome.

L'app deve:

1. `.trim()` whitespace prima di INSERT/UPDATE
2. Case-sensitive comparison ("Food" ≠ "food")
3. Mostrare errore se categoria esiste già

---

## 🚢 Production Deployment

Se deployi su Vercel/Netlify:

1. Aggiungi environment variables nel provider:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Build e deploy normalmente:

   ```bash
   pnpm build
   ```

3. Supabase continuerà a sincronizzare da qualsiasi dominio

---

**✅ Setup completato!** 🎉

Torna a http://localhost:5173 e inizia a usare MyMoney.
