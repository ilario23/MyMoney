# 🔍 Diagnostica Errore Foreign Key Constraint - Sync v1.5

## ❌ Errore Segnalato

```
Expense error: {
  code: '23503',
  details: 'Key (user_id)=(2d1b003e-5fe5-42f7-bd31-6a9881dc4c03) is not present in table "users".',
  message: 'insert or update on table "expenses" violates foreign key constraint "expenses_user_id_fkey"'
}
```

---

## 🎯 Causa Root

L'utente **ESISTE in Supabase Auth** (`auth.users`), ma **NON nella tabella `public.users`** (il tuo database).

Quando provi a sincronizzare una spesa, la query:

```sql
INSERT INTO expenses (user_id, ...) VALUES (user_id, ...)
```

Fallisce perché `user_id` non esiste in `public.users`.

---

## 🔧 Diagnostica Step-by-Step

### Step 1: Verifica che le tabelle esistano

Nel Supabase SQL Editor, esegui:

```sql
-- Controlla se la tabella users esiste
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'users';

-- Controlla quanti user ci sono
SELECT COUNT(*) as user_count FROM public.users;

-- Vedi il contenuto
SELECT id, email, display_name FROM public.users LIMIT 10;
```

### Step 2: Verifica le RLS Policies

Nel Supabase Dashboard:

1. Vai a **Authentication → Policies**
2. Seleziona la tabella **users**
3. Controlla se ci sono policies abilitate

**Se NON ci sono policies:**

Questa è la causa! Le RLS policies devono essere create.

**Se ci sono policies:**

Controlla se una di queste blocca l'INSERT:

```sql
-- Visualizza tutte le policies
SELECT policy_name, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
```

### Step 3: Verifica il flusso di Signup

Quando fai signup, controlla la **console del browser** per questi messaggi:

```
📝 Attempting to create user in Supabase...
✅ User created successfully in Supabase
```

o

```
❌ Error creating user in Supabase: ...
Error code: ...
Error message: ...
```

**Se vedi l'errore**, il codice non è il problema - è un problema di **RLS policies o permessi Supabase**.

---

## ✅ Soluzione: Creare RLS Policies

### Option A: Disabilitare RLS (SOLO PER DEV!)

⚠️ **ATTENZIONE**: Non fare in produzione!

In Supabase Dashboard:

1. Vai a **Table Editor**
2. Seleziona `public.users`
3. Clicca su "..." → **Disable RLS**

### Option B: Configurare RLS Policies Corrette (CONSIGLIATO)

Nel Supabase SQL Editor, esegui:

```sql
-- 1. Abilita RLS sulla tabella users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Policy per SELECT: users leggono solo il loro record
CREATE POLICY "Users can read own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 3. Policy per INSERT: gli utenti autenticati possono creare il loro record
CREATE POLICY "Users can insert their own record"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Policy per UPDATE: gli utenti possono aggiornare il loro record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Verifica che sia funzionato:**

```sql
SELECT policy_name, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policy_name;
```

### Option C: Policy Temporanea Permissiva (SOLO PER DEV!)

Se le policies di sopra non funzionano, crea policies permissive:

```sql
-- SOLO PER TESTING - rimuovere prima di produzione!
CREATE POLICY "Allow all inserts" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all reads" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow all updates" ON public.users FOR UPDATE USING (true);
```

---

## 📋 Checklist di Configurazione

Deve essere fatto **almeno una volta** su Supabase:

- [ ] Tabella `public.users` creata
- [ ] Tabelle `expenses`, `categories`, ecc. create
- [ ] RLS **abilitata** su tutte le tabelle
- [ ] Policies CREATE/INSERT/SELECT/UPDATE configurate per `users`
- [ ] Policies CREATE/INSERT/SELECT/UPDATE configurate per `expenses`
- [ ] Policies CREATE/INSERT/SELECT/UPDATE configurate per `categories`

---

## 🚀 Step per Testare il Fix

### 1. Nel Supabase SQL Editor

Esegui il codice da Option B (sopra)

### 2. Nel Browser

Torna all'app e:

1. **Apri DevTools** (F12)
2. Vai tab **Console**
3. Fai un **nuovo signup** con email nuova
4. Controlla i messaggi di log:
   - Vedi `✅ User created successfully in Supabase`? ✓
   - Vedi un errore con code? Nota il codice e il messaggio

### 3. Aggiungi una Spesa

Dopo il signup, aggiungi una spesa e vedi se sincronizza.

---

## 🆘 Se Continua a Fallire

Se dopo aver configurato le RLS policies continua a non funzionare:

1. **Vai in Supabase Dashboard → Authentication → Users**
2. Controlla se il tuo user autenticato esiste
3. **Copia il UUID**
4. Nel SQL Editor, esegui:
   ```sql
   SELECT * FROM public.users WHERE id = 'INCOLLA_UUID_QUI';
   ```
5. Se non restituisce niente, il problema è che l'INSERT fallisce silenziosamente

**Possibili cause:**

- RLS policy blocca l'INSERT (controlla il codice della policy)
- Triggers o constraints personalizzati
- Permessi insufficienti

---

## 📝 File Modificati in v1.5

- `src/pages/signup.tsx` - Enhanced error logging
- `src/pages/login.tsx` - Enhanced error logging + check user exists

Ora quando fai signup, vedrai nei log **esattamente quale errore ricevi**.

---

## 🔗 Riferimenti

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Policies CLI](https://supabase.com/docs/reference/cli/supabase-policies)
