# 🚀 Spendix PWA - Quick Start Guide

## 5 Minuti per Iniziare

### 1. Clone & Install

```bash
git clone <repo>
cd frontend-starter-kit
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Edita `.env.local` con le tue credenziali Supabase:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Crea Tabelle Supabase

Nel tuo progetto Supabase, vai su SQL Editor e esegui:

```sql
-- Copia il contenuto da SETUP.md sezione "Setup Supabase Database"
-- (SQL qui è troppo lungo per questo file)
```

**Oppure usa questo shortcut**: Leggi il file `SETUP.md` sezione "Setup Supabase Database" e copia il SQL completo.

### 4. Avvia Dev Server

```bash
pnpm dev
```

Visita `http://localhost:5173`

### 5. Crea Account e Inizia!

1. Clicca "Registrati" sulla pagina di login
2. Compila il form:
   - Nome
   - Email
   - Password (min 6 caratteri)
   - Conferma password
3. Clicca "Registrati"
4. 8 categorie default vengono create automaticamente
5. Vieni reindirizzato a dashboard
6. Aggiungi prima spesa con il bottone ➕
7. Sincronizza automaticamente quando online

**Nota**: Se hai già un account, clicca su "Accedi"

---

## 📱 Prova come PWA

### Chrome/Edge (Desktop)

1. Apri DevTools (`F12`)
2. Vai a **Application** > **Manifest**
3. Clicca **Install app** (in alto)

### Android

1. Apri app in Chrome
2. Tap menu (⋮) > **Install app**

### iOS (via Safari)

1. Apri app in Safari
2. Tap Condividi > **Aggiungi alla schermata Home**

---

## 🎯 Funzionalità v1 (Disponibili Ora)

✅ **Autenticazione** - Signup/Login con Supabase  
✅ **Dashboard** - Riepilogo spese mensili  
✅ **Spese Personali** - Aggiungi/modifica spese  
✅ **Categorie** - 8 categorie predefinite  
✅ **Offline** - Funziona senza internet  
✅ **Sincronizzazione** - Auto-sync quando online  
✅ **Dark Mode** - Toggle tema chiaro/scuro  
✅ **PWA** - Installabile su mobile

---

## 🔧 Ambiente di Sviluppo

### TypeScript Strict Mode

Abilitato. Errori di tipo bloccheranno la build.

### ESLint

```bash
pnpm lint
```

### Prettier

```bash
pnpm format
```

---

## 🐛 Debug

### Vedere Sync Logs

```javascript
// Nel browser console
localStorage.setItem("DEBUG", "true");

// Ricarica e aggiungi una spesa
// Controlla console per [Sync] logs
```

### Ispezionare IndexedDB

1. DevTools > **Application** > **IndexedDB**
2. Espandi `SpendixDB`
3. Visualizza dati in `expenses`, `categories`, etc.

### Controllare Service Worker

1. DevTools > **Application** > **Service Workers**
2. Attivo quando on `http://localhost:5173`

---

## 📊 Struttura File Importante

```
src/
├── router.tsx               ← Routes e protected pages
├── App.tsx                  ← Entry point
├── pages/
│   ├── login.tsx           ← Login page
│   └── dashboard.tsx       ← Main dashboard
├── components/
│   ├── expense/
│   │   └── expense-form.tsx ← Add/edit expense
│   └── layout/             ← Header, nav, sync indicator
├── lib/
│   ├── dexie.ts           ← Local DB schema
│   ├── auth.store.ts      ← Auth state (Zustand)
│   └── supabase.ts        ← Supabase client
├── services/
│   └── sync.service.ts    ← Core sync logic
└── hooks/
    ├── useSync.ts         ← Sync hook
    └── useTheme.ts        ← Dark mode hook
```

---

## 📈 Prossimi Step

1. **Categorie Custom** - Permetti user di creare categorie
2. **Analytics** - Grafico spese per categoria
3. **Import/Export** - CSV export dati
4. **Gruppi & Condivisione** - Spese condivise (v2)
5. **Ricorrenti** - Spese mensili automatiche

---

## 🆘 Problemi Comuni

### "Invalid API Key" Error

- Controlla `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Verifica in Supabase > Settings > API

### IndexedDB Non Persiste

- Disabilita private/incognito mode
- Controlla che storage non sia full

### Service Worker Non Registra

- Deve essere HTTPS in produzione
- Dev server va su HTTP (ok)

### Spese Non Sincronizzano

- Controlla online status (DevTools > Network > Offline)
- Verifica Dexie DB (vedi sezione Debug sopra)
- Consulta console per `[Sync]` error logs

---

## 📚 Documentazione

- `SETUP.md` - Setup completo e Supabase schema
- `TECHNICAL.md` - Architettura e dettagli tecnici
- `README.md` - Questo file

---

## 🎓 Learn More

- [React Router](https://reactrouter.com)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Dexie.js](https://dexie.org)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

**Buon divertimento! 🎉**
