# 💰 ExpenseTracker PWA - Gestione Spese Personali

Una Progressive Web App mobile-first per tracciare spese personali e condivise con sincronizzazione intelligente, supporto offline e dark mode.

**[📖 Leggi SETUP →](./SETUP.md)** | **[⚡ Quick Start →](./QUICKSTART.md)** | **[🎯 Nuove Features →](./FEATURES_NEW.md)**

## ✨ Features v1.0

### � Tracking Personale

- ✅ Aggiungere/modificare spese rapidamente
- ✅ 8 categorie di default + creazione personalizzate inline
- ✅ Supporto multi-valuta (EUR, USD, GBP)
- ✅ Dashboard con riepilogo mensile
- ✅ Statistiche utente complete

### 🔄 Sincronizzazione Intelligente

- ✅ Offline-first con Dexie (IndexedDB)
- ✅ Auto-sync quando online
- ✅ Risoluzione conflitti (local wins)
- ✅ Bidirectional sync con Supabase
- ✅ Storico ultimi sync

### 🌓 UX & PWA

- ✅ Dark mode + system preference
- ✅ Installabile su mobile (home screen)
- ✅ Service Worker + caching
- ✅ Mobile-first responsive design
- ✅ TypeScript strict mode

### 🔐 Autenticazione & Profilo

- ✅ Login/Signup con Supabase
- ✅ Pagina profilo con statistiche
- ✅ Edit nome utente
- ✅ Export backup JSON
- ✅ Elimina dati locali
- ✅ Session persistence

---

## 🛠️ Tech Stack

| Componente       | Tech            | Ver    |
| ---------------- | --------------- | ------ |
| **Frontend**     | React           | 19     |
| **Build**        | Vite            | 6.4.1  |
| **Styling**      | Tailwind CSS    | 4.1    |
| **UI**           | ShadCN          | Latest |
| **State**        | Zustand         | Latest |
| **DB Local**     | Dexie           | 4.2.1  |
| **Auth/Backend** | Supabase        | Latest |
| **PWA**          | vite-plugin-pwa | 1.1    |

---

## 🚀 5-Minute Start

```bash
# 1. Setup (2 min)
git clone https://github.com/deomiarn/frontend-starter-kit.git
cd frontend-starter-kit
pnpm install

# 2. Environment (1 min)
cp .env.example .env.local
# Aggiungi credenziali Supabase

# 3. Database (1 min)
# Supabase SQL Editor → SQL da SETUP.md

# 4. Dev Server (1 min)
pnpm dev
# → http://localhost:5173

# 5. Test
# Signup → Add expense → Toggle dark mode
# Works offline! ✅
```

**Leggi la [QUICKSTART.md](./QUICKSTART.md) completa**

---

## 📁 Key Pages

| Route          | Component     | Features                                  |
| -------------- | ------------- | ----------------------------------------- |
| `/login`       | LoginPage     | Email/password auth                       |
| `/signup`      | SignupPage    | New account + 8 default categories        |
| `/dashboard`   | DashboardPage | Expenses list + summary cards             |
| `/expense/new` | ExpenseForm   | Add expense + inline category creator     |
| `/profile`     | ProfilePage   | Edit profile + stats + export/delete data |
| `/groups`      | GroupsPage    | Coming soon (v2)                          |

---

## ⚡ Key Features

### Expense Form (`v1.1` ✨ NEW)

```tsx
✅ Back button to dashboard
✅ Cancel button + success alert
✅ "+ Nuova" button to create categories inline
✅ 12 emoji icons to choose from
✅ Auto-redirect after save
```

### Profile Page (`v1.1` ✨ NEW)

```tsx
✅ Edit display name
✅ View email
✅ Statistics: total expenses, amount, categories
✅ Last sync timestamp
✅ Export data as JSON backup
✅ Delete all local data with confirmation
✅ Logout button
```

### Dashboard

```tsx
✅ 3 summary cards (expenses, balance, net)
✅ Recent expenses list (top 10)
✅ Quick "Aggiungi spesa" button (➕)
✅ Sync indicator + manual sync
✅ Dark mode toggle (🌙)
```

---

## 🔄 How Sync Works

```
User offline
  ↓
Add expense → Saved to Dexie (isSynced: false)
  ↓
Goes online → Auto-sync triggers
  ↓
SyncService:
  • Pushes local unsync'd → Supabase
  • Pulls remote changes → Merges locally
  • Conflict? Local wins (newer timestamp)
  ↓
SyncLog created, UI updates
✅ Synced!
```

**Manual Sync**: Click refresh in header  
**Auto-Sync**: On app start + browser online event

---

## 🌓 Dark Mode

- Respects system preference (matchMedia)
- Click moon/sun icon to toggle manually
- Saves to localStorage
- Uses CSS variables (light/dark)
- Smooth transitions

---

## 📱 PWA Installation

**Android**: Menu → "Installa app"  
**iOS**: Share → "Aggiungi alla schermata Home"  
**Desktop**: Install icon in address bar

Works fully offline! 📴

---

## 📊 Build & Performance

```bash
# Build
pnpm build       # 6.5s

# Size
JS:  670 KB (206 KB gzipped)
CSS: 86 KB (15 KB gzipped)

# PWA
Precache: 740 KB
Service Worker: Auto-generated
```

---

## 🧪 Commands

```bash
pnpm dev      # Start dev server (hot reload)
pnpm build    # Production build
pnpm lint     # ESLint + TypeScript
pnpm preview  # Preview production build
```

---

## 📚 Documentation

| File                                 | Content                   |
| ------------------------------------ | ------------------------- |
| [SETUP.md](./SETUP.md)               | Full setup + SQL database |
| [QUICKSTART.md](./QUICKSTART.md)     | 5-minute guide            |
| [TECHNICAL.md](./TECHNICAL.md)       | Architecture deep-dive    |
| [API.md](./API.md)                   | API reference             |
| [FEATURES_NEW.md](./FEATURES_NEW.md) | v1.1 new features         |

---

## 🗺️ Roadmap

**v1.0** ✅ Personal expenses + PWA + offline  
**v1.1** ✅ Category editor + Profile page  
**v2.0** 🚀 Groups + shared expenses + real-time

---

## 🤝 Contributing

```bash
git checkout -b feature/your-feature
# Make changes
pnpm lint && pnpm build
git commit -m "feat: description"
git push origin feature/your-feature
```

---

## 📄 License

MIT - See [LICENSE](./LICENSE)

---

**Made with ❤️ for efficient expense tracking**

Questions? Open an issue | Found a bug? Report it

🚀 Start tracking your expenses now!
