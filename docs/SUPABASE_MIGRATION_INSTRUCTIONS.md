# 🗑️ Supabase Database Migration Guide

## Problema

La tua app è migrata da RxDB a Dexie e non usa più i gruppi ("groups", "group_members", "shared_expenses"). Però il database Supabase ha ancora queste tabelle con politiche RLS che causano errori di "infinite recursion".

## Soluzione

Abbiamo creato uno script SQL che:

1. ✅ Rimuove le tabelle obsolete (groups, group_members, shared_expenses, shared_expense_splits)
2. ✅ Elimina le politiche RLS difettose
3. ✅ Ricrea le politiche RLS corrette per le tabelle rimaste (users, categories, expenses, stats_cache)

## Come eseguire

### Step 1: Accedi a Supabase

1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto MyMoney
3. Clicca su **SQL Editor** nel menu sinistro

### Step 2: Copia lo script SQL

- Apri il file: `docs/SUPABASE_MIGRATION.sql`
- Copia tutto il contenuto

### Step 3: Esegui nel SQL Editor

1. Nel Supabase SQL Editor, clicca su **New Query** (o **+** button)
2. Incolla lo script completo
3. Clicca **Run** (o premi Ctrl+Enter)

### Step 4: Verifica il risultato

- Se vedi "Query executed successfully", tutto è ok! ✅
- Se vedi errori, controlla che:
  - Le tabelle groups/group_members/shared_expenses ancora non hanno referenze nella app
  - Nessun altro dato dipende da queste tabelle

## Cosa succede dopo?

Una volta eseguito lo script:

- ✅ Le tabelle vecchie saranno eliminate
- ✅ Le politiche RLS saranno pulite e ricreate
- ✅ L'errore "infinite recursion detected" scomparirà
- ✅ La sincronizzazione funzionerà correttamente per users, categories, expenses

## Tabelle rimaste

Dopo la migration, il database avrà solo:

- `users` - Dati utente
- `categories` - Categorie di spesa
- `expenses` - Spese individuali
- `stats_cache` - Cache delle statistiche (opzionale)

## Sincronizzazione

Il sync service sincronizza automaticamente questi dati quando sei online:

- Pull da Supabase ogni 30 minuti
- Push automatico di nuovi record
- Usa localStorage per tracciare i checkpoint di sync

---

**Fatto?** La tua app dovrebbe ora funzionare senza errori di Supabase! 🚀
