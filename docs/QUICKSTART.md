# ⚡ Quick Start - 5 Minutes

Vuoi iniziare subito? Segui questi 5 step!

---

## 📋 Opzione 1: **Solo Local** (No Supabase) ✅ FACILE

Perfetto se vuoi solo provare l'app localmente, senza sincronizzazione cloud.

### Step 1: Installa

```bash
git clone https://github.com/ilario23/MyMoney.git
cd MyMoney
pnpm install
```

### Step 2: Avvia

```bash
pnpm dev
```

### Step 3: Apri

Vai a **http://localhost:5173**

### Step 4: Crea un account

- Clicca "Registra"
- Inserisci email e password
- ✅ Sei dentro!

### Step 5: Usa l'app

- Crea categorie
- Aggiungi spese
- Vedi statistiche

**Nota**: Tutti i dati sono salvati **localmente nel tuo browser**. Niente sincronizzazione, massima privacy! 🔒

---

## 🌐 Opzione 2: **Con Supabase** (Sync Online) ⭐ CONSIGLIATO

Aggiungi sincronizzazione opzionale con il cloud.

### Step 1-5: Come sopra

(Segui i step 1-5 dell'opzione 1)

### Step 6: Crea progetto Supabase

1. Vai a https://supabase.com/dashboard
2. Clicca "New Project"
3. Compila:
   - **Name**: mymoney
   - **Database Password**: (scegli una password forte)
   - **Region**: Europe (o la più vicina a te)
4. Clicca "Create new project"

### Step 7: Crea le tabelle

1. Nel dashboard Supabase, clicca **"SQL Editor"**
2. Clicca **"New Query"**
3. Copia e incolla questo script:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'it',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name)
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create stats_cache table
CREATE TABLE stats_cache (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  total_income DECIMAL(12, 2) DEFAULT 0,
  income_count INTEGER DEFAULT 0,
  expense_count INTEGER DEFAULT 0,
  top_categories JSONB,
  daily_average DECIMAL(12, 2) DEFAULT 0,
  monthly_average DECIMAL(12, 2) DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_stats_cache_user_id ON stats_cache(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for users
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create RLS Policies for categories
CREATE POLICY "Users can read own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for expenses
CREATE POLICY "Users can read own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for stats_cache
CREATE POLICY "Users can read own stats" ON stats_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON stats_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON stats_cache FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stats" ON stats_cache FOR DELETE USING (auth.uid() = user_id);
```

4. Clicca **"Run"** (oppure Ctrl+Enter)

### Step 8: Copia le credenziali

1. Nel dashboard Supabase, clicca **"Settings"** → **"API"**
2. Copia:
   - `Project URL`
   - `anon public key`

### Step 9: Crea `.env.local`

Nella root del progetto MyMoney, crea un file `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

(Sostituisci con i valori da Step 8)

### Step 10: Riavvia l'app

```bash
pnpm dev
```

### ✅ Fatto!

Ora MyMoney sincronizza i tuoi dati con Supabase quando sei online! 🎉

---

## 🤔 Quale opzione scelgo?

|             | **Solo Local** | **Con Supabase**                 |
| ----------- | -------------- | -------------------------------- |
| **Privacy** | 🔒 Massima     | 🔒 Buona (account personale)     |
| **Offline** | ✅ Sì          | ✅ Sì                            |
| **Sync**    | ❌ No          | ✅ Automatico                    |
| **Setup**   | ⚡ 2 min       | ⚡ 10 min                        |
| **Costo**   | 💲 Gratuito    | 💲 Gratuito (Supabase free tier) |
| **Backup**  | ❌ Solo locale | ✅ Cloud backup                  |

**Consiglio**: Inizia con "Solo Local" per provare, poi aggiungi Supabase se ti piace! ✨

---

## 🚀 Prossimi step

1. **Crea categorie** - Personalizz le tue categorie
2. **Aggiungi spese** - Inizia a tracciare le tue spese
3. **Guarda statistiche** - Vedi i report mensili
4. **Esporta dati** - Scarica un backup JSON

---

## ❓ Domande?

- Leggi la **[guida completa](SETUP.md)**
- Controlla il **[README](README.md)**
- Apri un issue su GitHub

---

**Enjoy! 💰**
