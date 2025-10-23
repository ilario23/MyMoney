# 🔒 RLS Security Update - v3.2.0

**Data**: Octubre 23, 2025

## 📋 Cosa Cambia

Le RLS policies di Supabase sono state aggiornate per **massima sicurezza**:

### Prima (v3.0 - v3.1)

❌ **Troppo Permissive:**
- INSERT con `WITH CHECK (true)` → chiunque poteva creare record per altri
- DELETE policies esistenti → rischio cancellazione accidentale
- No protezione su user profiles

### Dopo (v3.2+)

✅ **Strict Security:**
- INSERT limitato a `auth.uid() = user_id` → solo propri record
- DELETE completamente disabilitato → soft-delete only
- User profiles: no INSERT, no DELETE
- SELECT/UPDATE: solo record propri

---

## 🔄 Come Applicare

### Step 1: Backup (Opzionale ma Consigliato)

In Supabase SQL Editor:

```sql
-- Esporta tutte le policies attuali
SELECT policyname, cmd, using_expression, with_check_expression 
FROM pg_policies 
WHERE schemaname = 'public';
```

Copia l'output da qualche parte sicura.

### Step 2: Run New Policies

In Supabase SQL Editor, incolla il contenuto di `docs/RLS_POLICIES_UPDATED.sql` e clicca **Run**.

Questo farà:

1. ✅ Drop tutte le policies vecchie
2. ✅ Create le nuove policies (strict)
3. ✅ Nessun dato modificato - solo accesso cambiato

### Step 3: Verifica

```sql
-- Lista tutte le policies
SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY cmd;
```

Dovresti vedere:

**Users (2 policies)**:
- Users can read own profile (SELECT)
- Users can update own profile (UPDATE)

**Categories (3 policies)**:
- Users can read own categories (SELECT)
- Users can create own categories (INSERT)
- Users can update own categories (UPDATE)

**Expenses (3 policies)**:
- Users can read own expenses (SELECT)
- Users can create own expenses (INSERT)
- Users can update own expenses (UPDATE)

**Stats_cache (3 policies)**:
- Users can read own stats (SELECT)
- Users can insert own stats (INSERT)
- Users can update own stats (UPDATE)

**Niente DELETE policies** ← Corretto! ✅

---

## 🛑 Breaking Changes

### Code che Smette di Funzionare

❌ Tentare di cancellare tramite Supabase diretto (senza l'app):

```javascript
// FALLIRÀ dopo l'update
await supabase
  .from('categories')
  .delete()
  .eq('id', 'category-id');
// Error: DELETE policy not found
```

✅ Soluzione: Usa soft-delete:

```javascript
// FUNZIONA - usato dall'app
await supabase
  .from('categories')
  .update({ 
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq('id', 'category-id')
  .eq('user_id', userId);
```

### Codice App Deve Filtrare Soft-Deleted

Nelle queries Supabase, aggiungi:

```sql
WHERE deleted_at IS NULL
```

✅ L'app lo fa già nei sync services.

---

## 🔍 Troubleshooting

### "Policy not found" Error

**Causa**: Applicazione non completata.

**Soluzione**:

1. Vai a SQL Editor → copia `docs/RLS_POLICIES_UPDATED.sql`
2. Esegui tutto il file
3. Verifica che non ci siano errori

### "INSERT permission denied"

**Causa Probabile**: Stai cercando di creare un record con `user_id` ≠ `auth.uid()`

**Soluzione**: Assicurati che:

```javascript
// ✅ CORRETTO
await supabase.from('categories').insert({
  user_id: userId,  // deve uguagliare auth.uid()
  name: 'Food',
  icon: '🍕',
  is_custom: true
});

// ❌ SBAGLIATO
await supabase.from('categories').insert({
  user_id: 'other-user-id',  // non uguaglia auth.uid()
  name: 'Food',
  icon: '🍕'
});
// ERROR: WITH CHECK policy violation
```

### "UPDATE permission denied"

**Verifica**:

1. Il record appartiene a te? `SELECT * FROM categories WHERE id = 'xxx' AND user_id = auth.uid();`
2. `auth.uid()` è definito? (devi essere logged in)

---

## 📊 Soft-Delete Pattern

### Come Funziona

**Eliminare** categoria logicamente (soft-delete):

```sql
UPDATE public.categories 
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = 'cat-123' AND user_id = auth.uid();
```

**Leggere** solo categorie attive:

```sql
SELECT * FROM public.categories 
WHERE user_id = auth.uid() AND deleted_at IS NULL;
```

**Recuperare** una categoria cancellata:

```sql
UPDATE public.categories 
SET deleted_at = NULL, updated_at = NOW()
WHERE id = 'cat-123' AND user_id = auth.uid();
```

### Vantaggi

✅ **Sync**: Non perde dati storici  
✅ **Analytics**: Puoi ancora fare report su dati cancellati  
✅ **Recovery**: Undo feature possibile  
✅ **Audit**: Track quando/cosa è stato cancellato  
✅ **Safety**: Nessuna cancellazione accidentale permanente  

---

## 🚀 Deployment

### Se Deployi Ora (Post-Update)

```bash
# Assicurati di essere su branch con RLS update
git checkout dev  # o il branch con RLS changes
git pull

# Build e deploy normalmente
pnpm build
# Vercel/Netlify deploy...
```

### Non Devi Fare Nulla In Più

- Environment variables rimangono uguali
- No migration queries necessarie
- RLS changes sono retroattive (dati esistenti non cambiano)

---

## ✅ Checklist

Prima di considerare questo completo:

- [ ] Ho fatto backup delle policies vecchie (opzionale)
- [ ] Ho eseguito `RLS_POLICIES_UPDATED.sql` su Supabase
- [ ] Ho verificato le nuove policies con la query SELECT
- [ ] Ho testato signup/login - funzionano?
- [ ] Ho testato creazione categoria - funziona?
- [ ] Ho testato soft-delete categoria - funziona?
- [ ] La app ancora sincronizza offline ↔ online?

---

## 📚 Risorse

- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Row Level Security Policy Examples](https://supabase.com/docs/guides/database/postgres/row-level-security/policies)
- [Soft Delete Pattern](https://en.wikipedia.org/wiki/Soft_delete)

---

**Versione**: v3.2.0  
**Status**: Ready for Production  
**Last Updated**: 2025-10-23
