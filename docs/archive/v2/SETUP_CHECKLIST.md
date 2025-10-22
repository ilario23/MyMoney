# 📋 Setup Checklist - Real-time & Database Views

## ✅ To-Do

### 1. **Database Views (5 min)**

Vai su **Supabase Dashboard → SQL Editor**:

1. Copia il contenuto di `docs/MIGRATION_v1.8_DATABASE_VIEWS.sql`
2. Incolla nell'editor SQL
3. Clicca **RUN**
4. Verifica output: dovrebbero apparire 6 views

**Verifica creazione:**

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'
ORDER BY table_name;
```

Dovresti vedere:

- ✅ `user_expense_summary`
- ✅ `user_category_stats`
- ✅ `monthly_expense_summary`
- ✅ `group_expense_summary`
- ✅ `shared_expense_details`
- ✅ `category_usage_stats`

---

### 2. **Abilita Realtime (3 min)**

Vai su **Supabase Dashboard → Database → Replication**:

Abilita **Realtime** per queste tabelle:

- ✅ `expenses`
- ✅ `categories`
- ✅ `groups`
- ✅ `group_members`
- ✅ `shared_expenses`

**Come fare:**

1. Trova la tabella nella lista
2. Toggle **Enable Realtime** → ON
3. Ripeti per tutte e 5 le tabelle

---

### 3. **Test Real-time Sync (2 min)**

1. **Apri l'app su 2 dispositivi/browser:**
   - Device A: Chrome normale
   - Device B: Chrome incognito (stesso account)

2. **Test sync:**
   - Device A: Crea una spesa
   - Device B: Dovrebbe apparire **istantaneamente** (< 1 secondo)

3. **Verifica console:**

   ```bash
   # Su Device B dovresti vedere:
   ✅ [Realtime] Subscriptions started
   🔄 [Realtime] Synced expenses (INSERT)
   ```

4. **Verifica UI:**
   - Header dovrebbe mostrare: 🟢 **Real-time (1)**
   - Sync count aumenta ad ogni modifica

---

### 4. **Test Database Views (1 min)**

1. Apri **Profile page**
2. Le statistiche dovrebbero caricarsi **più velocemente**
3. Console dovrebbe mostrare:
   ```bash
   # Nessun errore di view non trovata
   ```

**Se vedi errori:**

- ❌ `relation "user_expense_summary" does not exist`
- ➡️ Torna allo Step 1 e esegui la migration SQL

---

## 🧪 Functional Tests

### **Test 1: Multi-device Sync**

- [ ] Crea spesa su Device A → Appare su Device B
- [ ] Modifica categoria su Device B → Aggiorna su Device A
- [ ] Elimina spesa su Device A → Scompare da Device B

### **Test 2: Offline/Online**

- [ ] Vai offline su Device A
- [ ] Crea 3 spese offline
- [ ] Torna online → Spese si sincronizzano automaticamente
- [ ] Device B riceve tutte e 3 le spese

### **Test 3: Conflict Resolution**

- [ ] Modifica stessa spesa su entrambi i devices
- [ ] La versione più recente vince
- [ ] Nessun errore o duplicati

### **Test 4: Database Views**

- [ ] Profile stats caricano velocemente
- [ ] Totali corretti
- [ ] Medie calcolate correttamente

---

## 🔍 Troubleshooting

### ❌ **Real-time non funziona**

**Problema**: Modifiche non appaiono su altri devices

**Soluzioni:**

1. Verifica Realtime abilitato su tutte le 5 tabelle
2. Check console per errori di subscription:
   ```bash
   ❌ Error: Realtime is disabled for table "expenses"
   ```
3. Verifica RLS policies permettono SELECT
4. Prova a ricaricare la pagina (F5)

---

### ❌ **Database Views non trovate**

**Problema**: Errore `relation "user_expense_summary" does not exist`

**Soluzioni:**

1. Esegui migration SQL (Step 1)
2. Verifica permissions:
   ```sql
   -- Esegui questo per dare permessi:
   GRANT SELECT ON user_expense_summary TO authenticated;
   GRANT SELECT ON user_category_stats TO authenticated;
   -- ... ripeti per tutte le views
   ```
3. Riconnetti al database (restart app)

---

### ❌ **Sync lento/ritardato**

**Problema**: Cambiamenti impiegano >5 secondi

**Soluzioni:**

1. Check connessione internet
2. Verifica Supabase non in manutenzione
3. Console: cerca errori di network
4. Prova a riavviare subscriptions:
   ```typescript
   await realtimeService.stop();
   await realtimeService.start({ userId });
   ```

---

### ❌ **Console pieno di log**

**Problema**: Troppi log di debug

**Soluzione**: Disabilita verbose mode:

```typescript
// In src/hooks/useRealtime.ts
await realtimeService.start({
  userId: user.id,
  verbose: false, // ← Cambia da true a false
  ...
});
```

---

## 📊 Performance Monitoring

### **Before/After Metrics**

Misura performance aprendo **DevTools → Network**:

**Profile Page Load:**

- ❌ Prima: ~500ms (calcoli frontend)
- ✅ Dopo: ~200ms (database view)

**Multi-device Sync:**

- ❌ Prima: 30s (polling)
- ✅ Dopo: <1s (realtime)

**Dashboard Stats:**

- ❌ Prima: Multiple queries + calculations
- ✅ Dopo: Single view query

---

## 🎯 Success Criteria

Quando tutto funziona, dovresti avere:

✅ Real-time indicator verde in header  
✅ Sync istantaneo tra devices (<1s)  
✅ Profile stats veloci (<200ms)  
✅ Nessun errore in console  
✅ Offline/online transitions smooth  
✅ Conflict resolution automatica

---

## 📝 Next Steps (Opzionali)

Dopo aver completato questo setup, puoi implementare:

1. **Storage** → Foto scontrini (📷)
2. **Edge Functions** → Calcoli server-side (⚡)
3. **Triggers** → Automazioni database (🤖)
4. **OAuth** → Login social (🔐)

Vedi `docs/REALTIME_IMPLEMENTATION.md` per dettagli.

---

## 🆘 Need Help?

- 📖 Documentazione: `docs/REALTIME_IMPLEMENTATION.md`
- 🐛 Debugging: Console logs con prefix `[Realtime]`
- 💬 Supabase Docs: https://supabase.com/docs/guides/realtime

---

**Tempo totale setup**: ~10 minuti  
**Difficulty**: ⭐⭐☆☆☆ (Medium-Easy)
