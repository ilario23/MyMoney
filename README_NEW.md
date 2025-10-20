# 💰 ExpenseTracker PWA - Gestione Spese Personali e Condivise

Una **Progressive Web App mobile-first** per gestire spese personali e condivise, costruita con tecnologie moderne e best practices PWA.

## 🎯 Overview

ExpenseTracker è un'app mobile-first PWA che permette di:

✅ **Gestire spese personali** - Traccia tutte le tue spese quotidiane  
✅ **Categorizzare** - 8 categorie predefinite + custom  
✅ **Funzionare offline** - Continua a usare l'app senza internet  
✅ **Sincronizzare automaticamente** - Dati sempre aggiornati su cloud  
✅ **Tema scuro** - Supporta automaticamente le preferenze di sistema  
✅ **Installare come app** - Home screen su Android/iOS

## 🛠️ Tech Stack

| Layer        | Technology                       |
| ------------ | -------------------------------- |
| **Frontend** | React 19 + TypeScript + Vite     |
| **Styling**  | Tailwind CSS v4 + ShadCN UI      |
| **State**    | Zustand (lightweight store)      |
| **Local DB** | Dexie.js (IndexedDB)             |
| **Backend**  | Supabase (Auth + PostgreSQL)     |
| **PWA**      | vite-plugin-pwa + Service Worker |
| **Date**     | date-fns                         |
| **UI**       | Lucide Icons + Framer Motion     |

## 📦 Versioni

### v1.0 - Personal Edition ✅ Ready

- Spese personali CRUD
- Categorie personalizzabili
- Dashboard con statistiche mensili
- Offline support con Dexie
- Sincronizzazione manuale/auto
- Dark mode
- PWA installabile

### v2.0 - Shared Edition (In Sviluppo)

- Creazione gruppi condivisione
- Spese condivise visibili a tutti
- Spese ricorrenti
- Notifiche locali
- Sincronizzazione real-time

## 🚀 Quick Start

**Vedi [QUICKSTART.md](./QUICKSTART.md) per iniziare in 5 minuti!**

### Minimal Setup

```bash
# Install
pnpm install

# Configure
cp .env.example .env.local
# Aggiungi credenziali Supabase in .env.local

# Run
pnpm dev
```

## 📁 Struttura Progetto

```
src/
├── pages/                    # Schermate principali
│   ├── login.tsx
│   ├── dashboard.tsx
│   └── signup.tsx (future)
├── components/
│   ├── expense/             # Form e list spese
│   ├── layout/              # Header, nav, sync indicator
│   ├── ui/                  # ShadCN components
│   └── landing/             # Landing page
├── lib/
│   ├── dexie.ts            # Dexie schema
│   ├── auth.store.ts       # Zustand store
│   └── supabase.ts         # Supabase client
├── hooks/
│   ├── useSync.ts          # Sync logic
│   └── useTheme.ts         # Dark mode
├── services/
│   └── sync.service.ts     # Core sync engine
├── router.tsx              # React Router v7
└── index.css               # Global styles + dark mode
```

## 🔄 Sincronizzazione Dati

### Come Funziona

1. **Local-first**: Dati salvati in IndexedDB (Dexie)
2. **Push**: Modifiche locali → Supabase (isSynced=false)
3. **Pull**: Modifiche remote → Cache locale
4. **Merge**: Conflitti risolti (local wins se più recente)
5. **Update**: lastSync timestamp aggiornato

### Flusso

```
User adds expense (offline)
         ↓
Saved in Dexie (isSynced=false)
         ↓
App goes online
         ↓
Auto-sync triggered
         ↓
Push to Supabase + Pull changes
         ↓
Merge with conflict resolution
         ↓
Mark as isSynced=true
```

## 🌓 Dark Mode

Automaticamente basato su preferenze di sistema o manuale tramite toggle in header.

```typescript
const { theme, isDark, setTheme } = useTheme();
// Cambia tema: setTheme('dark' | 'light' | 'system')
```

## 📱 PWA Features

### Installazione

**Android Chrome**

1. App → Menu (⋮) → Install app

**iOS Safari**

1. App → Share → Add to Home Screen

### Offline Support

- Service Worker caching
- IndexedDB per dati
- Background sync per modifiche
- Network-first con cache fallback

### Push Notifications

Coming in v2!

## 🔐 Sicurezza

✅ Autenticazione Supabase  
✅ Row-level security (RLS)  
✅ HTTPS enforcement  
✅ XSS protection  
✅ CSRF protection

❌ **Non include**: PIN, biometria, cifratura locale

## 📚 Documentazione

- **[QUICKSTART.md](./QUICKSTART.md)** - Setup in 5 minuti
- **[SETUP.md](./SETUP.md)** - Setup completo con SQL Supabase
- **[TECHNICAL.md](./TECHNICAL.md)** - Architettura dettagliata
- **[API.md](./API.md)** - API calls e data flow

## 🎓 Comandi Disponibili

```bash
# Development
pnpm dev                 # Start dev server @ localhost:5173

# Build
pnpm build              # Production build
pnpm preview            # Preview build

# Code Quality
pnpm lint               # ESLint
pnpm format             # Prettier format

# TypeScript
pnpm type-check         # Type checking
```

## 🚀 Deploy

### Vercel (Recommended)

```bash
pnpm install -g vercel
vercel
```

### Netlify

```bash
pnpm build
netlify deploy --prod --dir=dist
```

## 🐛 Troubleshooting

| Problema                      | Soluzione                            |
| ----------------------------- | ------------------------------------ |
| `PGRST116` Supabase error     | Controlla RLS policies e credenziali |
| IndexedDB vuoto               | Disabilita incognito mode            |
| Service Worker non registra   | Richiede HTTPS in produzione         |
| Build error "unknown utility" | Tailwind cache - ripulisci `/dist`   |

Vedi [QUICKSTART.md](./QUICKSTART.md) per problemi comuni.

## 🤝 Contributing

Suggermenti e PR sono benvenuti!

## 📄 Licenza

MIT License - vedi [LICENSE](./LICENSE)

## 👨‍💻 Stack Preferiti

- ✅ React 19
- ✅ TypeScript strict mode
- ✅ Tailwind CSS v4
- ✅ ShadCN UI
- ✅ Supabase
- ✅ PWA standards
- ✅ Mobile-first design

---

**Made with ❤️ for managing finances simply**
