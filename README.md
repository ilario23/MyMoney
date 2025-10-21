# 💰 MyMoney PWA - Personal & Shared Expense Manager# 💰 ExpenseTracker PWA - Gestione Spese Personali



A **Progressive Web App** for managing personal and shared expenses with intelligent synchronization, offline support, dark mode, and multi-language support (Italian & English).Una Progressive Web App mobile-first per tracciare spese personali e condivise con sincronizzazione intelligente, supporto offline e dark mode.



**[📖 Quick Start →](./QUICKSTART.md)** | **[⚡ Full Setup →](./SETUP.md)** | **[🎯 Features →](#features)** | **[🚀 Roadmap →](#roadmap)****[📖 Leggi SETUP →](./SETUP.md)** | **[⚡ Quick Start →](./QUICKSTART.md)** | **[🎯 Nuove Features →](./FEATURES_NEW.md)**



---## ✨ Features v1.0



## 🎯 Overview### � Tracking Personale



MyMoney is a mobile-first PWA that allows you to:- ✅ Aggiungere/modificare spese rapidamente

- ✅ 8 categorie di default + creazione personalizzate inline

✅ **Track personal expenses** - Record all your daily spending  - ✅ Supporto multi-valuta (EUR, USD, GBP)

✅ **Categorize spending** - 8 default categories + create custom ones  - ✅ Dashboard con riepilogo mensile

✅ **Share expenses** - Split costs with friends and family (v2.0)  - ✅ Statistiche utente complete

✅ **Work offline** - Full functionality without internet  

✅ **Auto-sync** - Changes automatically sync to cloud  ### 🔄 Sincronizzazione Intelligente

✅ **Dark mode** - System preference support + manual toggle  

✅ **Multi-language** - Italian & English support  - ✅ Offline-first con Dexie (IndexedDB)

✅ **Install as app** - Add to home screen on mobile/desktop- ✅ Auto-sync quando online

- ✅ Risoluzione conflitti (local wins)

---- ✅ Bidirectional sync con Supabase

- ✅ Storico ultimi sync

## ✨ Features

### 🌓 UX & PWA

### Core Features (v1.0) ✅

- ✅ Dark mode + system preference

- **Personal Expense Tracking**- ✅ Installabile su mobile (home screen)

  - Quick add/edit/delete expenses- ✅ Service Worker + caching

  - 8 default categories + custom categories inline- ✅ Mobile-first responsive design

  - Multi-currency support (EUR, USD, GBP)- ✅ TypeScript strict mode

  - Monthly summary dashboard

  - Complete user statistics### 🔐 Autenticazione & Profilo



- **Intelligent Sync**- ✅ Login/Signup con Supabase

  - Offline-first with Dexie (IndexedDB)- ✅ Pagina profilo con statistiche

  - Auto-sync when online- ✅ Edit nome utente

  - Check-then-insert-or-update pattern (conflict resolution)- ✅ Export backup JSON

  - Bidirectional sync with Supabase- ✅ Elimina dati locali

  - Sync history & timestamps- ✅ Session persistence



- **PWA & UX**---

  - Dark mode + system preference detection

  - Installable on mobile (home screen)## 🛠️ Tech Stack

  - Service Worker + smart caching

  - Mobile-first responsive design| Componente       | Tech            | Ver    |

  - TypeScript strict mode| ---------------- | --------------- | ------ |

  - Offline indicator banner| **Frontend**     | React           | 19     |

  - Manual sync control| **Build**        | Vite            | 6.4.1  |

| **Styling**      | Tailwind CSS    | 4.1    |

- **Authentication & Profile**| **UI**           | ShadCN          | Latest |

  - Email/password login with Supabase| **State**        | Zustand         | Latest |

  - Signup with automatic category creation| **DB Local**     | Dexie           | 4.2.1  |

  - Profile page with statistics| **Auth/Backend** | Supabase        | Latest |

  - Edit display name & settings| **PWA**          | vite-plugin-pwa | 1.1    |

  - JSON backup export

  - Secure logout with data cleanup---

  - Session persistence

## 🚀 5-Minute Start

### Version 2.0 Features (NEW) 🚀

```bash

- **Group Management**# 1. Setup (2 min)

  - Create and manage groupsgit clone https://github.com/deomiarn/frontend-starter-kit.git

  - Add members to groupscd frontend-starter-kit

  - Delete groups with confirmationpnpm install

  - View group statistics

# 2. Environment (1 min)

- **Shared Expenses**cp .env.example .env.local

  - Create shared expenses within groups# Aggiungi credenziali Supabase

  - Track who owes whom

  - Mark expenses as settled# 3. Database (1 min)

  - View shared expense history# Supabase SQL Editor → SQL da SETUP.md

  - Filter by group and settlement status

  - Participant breakdown with amounts# 4. Dev Server (1 min)

pnpm dev

- **Sync for v2 Entities**# → http://localhost:5173

  - Bidirectional sync for groups

  - Bidirectional sync for group members (owner-based)# 5. Test

  - Bidirectional sync for shared expenses# Signup → Add expense → Toggle dark mode

  - Timestamp-based conflict resolution# Works offline! ✅

  - Recurring expense support```



- **Enhanced Navigation****Leggi la [QUICKSTART.md](./QUICKSTART.md) completa**

  - Desktop sidebar with 6 main routes

  - Mobile-optimized bottom navigation---

  - Active route highlighting

  - Responsive layout## 📁 Key Pages



- **Multi-Language System (i18n)**| Route          | Component     | Features                                  |

  - Italian (it) - Primary| -------------- | ------------- | ----------------------------------------- |

  - English (en) - Secondary| `/login`       | LoginPage     | Email/password auth                       |

  - Browser locale auto-detection| `/signup`      | SignupPage    | New account + 8 default categories        |

  - LocalStorage persistence| `/dashboard`   | DashboardPage | Expenses list + summary cards             |

  - 191+ translation keys| `/expense/new` | ExpenseForm   | Add expense + inline category creator     |

| `/profile`     | ProfilePage   | Edit profile + stats + export/delete data |

---| `/groups`      | GroupsPage    | Coming soon (v2)                          |



## 🛠️ Tech Stack---



| Layer        | Technology                       | Version |## ⚡ Key Features

| ------------ | -------------------------------- | ------- |

| **Frontend** | React                            | 19      |### Expense Form (`v1.1` ✨ NEW)

| **Build**    | Vite                             | 6.4     |

| **Language** | TypeScript                       | 5.x     |```tsx

| **Styling**  | Tailwind CSS                     | 4.1     |✅ Back button to dashboard

| **UI**       | ShadCN UI                        | Latest  |✅ Cancel button + success alert

| **State**    | Zustand (lightweight store)      | Latest  |✅ "+ Nuova" button to create categories inline

| **Local DB** | Dexie.js (IndexedDB)             | 4.2.1   |✅ 12 emoji icons to choose from

| **Backend**  | Supabase (Auth + PostgreSQL)     | Latest  |✅ Auto-redirect after save

| **PWA**      | vite-plugin-pwa + Service Worker | 1.1     |```

| **Icons**    | Lucide React                     | Latest  |

| **Date**     | date-fns                         | Latest  |### Profile Page (`v1.1` ✨ NEW)



---```tsx

✅ Edit display name

## 🚀 Quick Start (5 Minutes)✅ View email

✅ Statistics: total expenses, amount, categories

### 1. Install Dependencies✅ Last sync timestamp

✅ Export data as JSON backup

```bash✅ Delete all local data with confirmation

# Clone repository✅ Logout button

git clone https://github.com/ilario23/MyMoney.git```

cd MyMoney

### Dashboard

# Install with pnpm (recommended)

pnpm install```tsx

```✅ 3 summary cards (expenses, balance, net)

✅ Recent expenses list (top 10)

### 2. Setup Environment✅ Quick "Aggiungi spesa" button (➕)

✅ Sync indicator + manual sync

```bash✅ Dark mode toggle (🌙)

# Copy example env```

cp .env.example .env.local

---

# Add your Supabase credentials:

# VITE_SUPABASE_URL=https://xxx.supabase.co## 🔄 How Sync Works

# VITE_SUPABASE_ANON_KEY=xxx

``````

User offline

### 3. Configure Database  ↓

Add expense → Saved to Dexie (isSynced: false)

Get SQL from [SETUP.md](./SETUP.md) section "Database Schema" and run in Supabase SQL Editor.  ↓

Goes online → Auto-sync triggers

### 4. Start Development Server  ↓

SyncService:

```bash  • Pushes local unsync'd → Supabase

pnpm dev  • Pulls remote changes → Merges locally

# Open http://localhost:5173  • Conflict? Local wins (newer timestamp)

```  ↓

SyncLog created, UI updates

### 5. Test Features✅ Synced!

```

- Create account (Signup)

- Add an expense**Manual Sync**: Click refresh in header  

- Toggle dark mode**Auto-Sync**: On app start + browser online event

- Create a group (v2)

- Add shared expense (v2)---

- Go offline and test local functionality

## 🌓 Dark Mode

**Full setup guide:** [SETUP.md](./SETUP.md)

- Respects system preference (matchMedia)

---- Click moon/sun icon to toggle manually

- Saves to localStorage

## 📱 Pages & Routes- Uses CSS variables (light/dark)

- Smooth transitions

| Route              | Component            | Features                              |

| ------------------ | -------------------- | ------------------------------------- |---

| `/login`           | LoginPage            | Email/password authentication          |

| `/signup`          | SignupPage           | New account + 8 default categories    |## 📱 PWA Installation

| `/dashboard`       | DashboardPage        | Expense list + summary cards + stats  |

| `/expense/new`     | ExpenseForm          | Add/edit expense + inline categories  |**Android**: Menu → "Installa app"  

| `/categories`      | CategoriesPage       | Manage custom categories              |**iOS**: Share → "Aggiungi alla schermata Home"  

| `/profile`         | ProfilePage          | Edit profile + language + settings    |**Desktop**: Install icon in address bar

| `/groups`          | GroupsPage           | Create/manage groups (v2)             |

| `/shared-expenses` | SharedExpensesPage   | View shared expenses (v2)             |Works fully offline! 📴



------



## 🏗️ Project Structure## 📊 Build & Performance



``````bash

src/# Build

├── pages/pnpm build       # 6.5s

│   ├── login.tsx                 # Authentication page

│   ├── signup.tsx                # Account creation# Size

│   ├── dashboard.tsx             # Main expenses viewJS:  670 KB (206 KB gzipped)

│   ├── categories.tsx            # Category managementCSS: 86 KB (15 KB gzipped)

│   ├── profile.tsx               # User profile + settings

│   ├── groups.tsx                # Group management (v2)# PWA

│   └── shared-expenses.tsx       # Shared expenses (v2)Precache: 740 KB

│Service Worker: Auto-generated

├── components/```

│   ├── expense/

│   │   └── expense-form.tsx      # Add/edit expenses---

│   │

│   ├── layout/## 🧪 Commands

│   │   ├── layout.tsx            # Main layout wrapper

│   │   ├── navigation.tsx        # Mobile bottom nav```bash

│   │   ├── sidebar.tsx           # Desktop sidebarpnpm dev      # Start dev server (hot reload)

│   │   ├── sync-indicator.tsx    # Sync status indicatorpnpm build    # Production build

│   │   ├── offline-indicator.tsx # Offline bannerpnpm lint     # ESLint + TypeScript

│   │   └── theme-toggle.tsx      # Dark mode togglepnpm preview  # Preview production build

│   │```

│   ├── landing/

│   │   ├── header.tsx            # Landing page header---

│   │   ├── hero.tsx              # Hero section

│   │   ├── features.tsx          # Features showcase## 📚 Documentation

│   │   ├── pricing.tsx           # Pricing section

│   │   ├── testimonials.tsx      # Testimonials| File                                 | Content                   |

│   │   ├── cta.tsx               # Call to action| ------------------------------------ | ------------------------- |

│   │   └── footer.tsx            # Landing footer| [SETUP.md](./SETUP.md)               | Full setup + SQL database |

│   │| [QUICKSTART.md](./QUICKSTART.md)     | 5-minute guide            |

│   └── ui/                       # ShadCN UI components| [TECHNICAL.md](./TECHNICAL.md)       | Architecture deep-dive    |

│       ├── alert.tsx| [API.md](./API.md)                   | API reference             |

│       ├── badge.tsx| [FEATURES_NEW.md](./FEATURES_NEW.md) | v1.1 new features         |

│       ├── button.tsx

│       ├── card.tsx---

│       ├── dialog.tsx

│       ├── input.tsx## 🗺️ Roadmap

│       ├── select.tsx

│       └── tabs.tsx**v1.0** ✅ Personal expenses + PWA + offline  

│**v1.1** ✅ Category editor + Profile page  

├── lib/**v2.0** 🚀 Groups + shared expenses + real-time

│   ├── dexie.ts                  # IndexedDB schema & initialization

│   ├── supabase.ts               # Supabase client config---

│   ├── auth.store.ts             # Zustand auth store

│   ├── language.tsx              # i18n context & translations## 🤝 Contributing

│   └── utils.ts                  # Helper functions

│```bash

├── hooks/git checkout -b feature/your-feature

│   ├── useSync.ts                # Sync orchestration hook# Make changes

│   ├── useTheme.ts               # Dark mode hookpnpm lint && pnpm build

│   └── useLanguage.ts            # Language hookgit commit -m "feat: description"

│git push origin feature/your-feature

├── services/```

│   └── sync.service.ts           # Core sync engine (513+ lines)

│---

├── translations/

│   ├── en.ts                     # English translations (191 keys)## 📄 License

│   ├── it.ts                     # Italian translations (191 keys)

│   └── index.ts                  # Translation exportsMIT - See [LICENSE](./LICENSE)

│

├── App.tsx                       # Main app wrapper---

├── router.tsx                    # React Router v6 configuration

├── main.tsx                      # App entry point**Made with ❤️ for efficient expense tracking**

├── index.css                     # Global styles + dark mode

└── vite-env.d.ts                # Vite typesQuestions? Open an issue | Found a bug? Report it



public/🚀 Start tracking your expenses now!

├── manifest.json                 # PWA manifest
├── sw.js                         # Service Worker
└── icons/                        # App icons

[CONFIG FILES]
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── components.json               # ShadCN config
├── eslint.config.js              # ESLint rules
└── package.json                  # Dependencies
```

---

## 🔄 Synchronization Architecture

### How Sync Works

MyMoney uses a **check-then-insert-or-update** pattern to prevent conflicts:

```
1. User adds expense (offline)
   ↓
2. Saved to Dexie (isSynced: false)
   ↓
3. App goes online → Auto-sync triggers
   ↓
4. SyncService.syncExpenses():
   
   PUSH PHASE (Local → Supabase):
   ├─ Load all unsync'd expenses (isSynced=false)
   ├─ For each expense:
   │  ├─ Check if exists in Supabase
   │  ├─ If exists:
   │  │  ├─ Compare timestamps
   │  │  ├─ If local.updatedAt > remote.updated_at → UPDATE
   │  │  └─ Else → conflict detected
   │  └─ If not exists → INSERT
   └─ Track synced/failed/conflicts
   
   PULL PHASE (Supabase → Local):
   ├─ Load remote expenses modified since lastSync
   ├─ For each remote expense:
   │  ├─ Check if exists locally
   │  ├─ If exists:
   │  │  ├─ Compare timestamps
   │  │  ├─ If remote.updated_at > local.updatedAt → UPDATE
   │  │  └─ Else → keep local (wins)
   │  └─ If not exists → INSERT
   └─ Track synced/failed/conflicts
   
5. SyncLog created with results
6. lastSync timestamp updated
7. UI updates with sync status
   ↓
✅ Synced!
```

### Sync Patterns

**Auto-Sync Triggers:**
- ✅ On app startup (window.load)
- ✅ When browser goes online (window.online event)
- ✅ After CRUD operations (create/update/delete)
- ✅ Every 5 minutes (background interval - future)

**Conflict Resolution:**
- Timestamp-based: `local.updatedAt > remote.updated_at` wins
- Local changes take precedence if timestamps are equal
- Conflicts tracked in sync result

**Sync Entities:**
- Categories (personal)
- Expenses (personal + soft delete)
- Groups (v2, owner-based)
- Group Members (v2, owner-filtered)
- Shared Expenses (v2, all participants)

### Sync Service Implementation

Located in `src/services/sync.service.ts` (513+ lines):

```typescript
// Core functions
syncExpenses()         // Personal expenses (bidirectional)
syncCategories()       // Personal categories (bidirectional)
syncGroups()           // Groups with owner filtering
syncGroupMembers()     // Group members (owner-filtered)
syncSharedExpenses()   // Shared expenses (all participants)

// Each returns: { synced: number, failed: number, conflicts: number }
```

---

## 🌓 Dark Mode

### Auto-Detection

```typescript
// Respects system preference
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Updates on system change
window.matchMedia('(prefers-color-scheme: dark)').addListener(updateTheme);
```

### Manual Toggle

- Click moon/sun icon in header
- Saves preference to localStorage (`theme` key)
- Applies immediately with CSS variables

### Implementation

```typescript
// In component
const { theme, isDark, setTheme } = useTheme();

// Toggle
<button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
  {isDark ? '☀️' : '🌙'}
</button>
```

---

## 🌍 Multi-Language System (i18n)

### Supported Languages

- 🇮🇹 **Italian (it)** - Primary language
- 🇬🇧 **English (en)** - Secondary language

### How It Works

1. **Initialization**
   - Checks localStorage for saved language (`app-language`)
   - Falls back to browser locale detection
   - Defaults to Italian if browser language unknown

2. **Persistence**
   - Language preference saved to localStorage
   - HTML `lang` attribute updated for accessibility
   - Survives page reloads

3. **Usage in Components**

```typescript
import { useLanguage } from '@/lib/language';

export function MyComponent() {
  const { language, t } = useLanguage();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>Current: {language}</p>
    </div>
  );
}
```

### Translation Structure

All translations in `src/translations/`:
- `it.ts` - Italian (191 keys)
- `en.ts` - English (191 keys)
- `index.ts` - Type exports

**Key namespacing:**
- `dashboard.*` - Dashboard page
- `expense.*` - Expense management
- `category.*` - Categories
- `profile.*` - Profile & settings
- `groups.*` - Group management (v2)
- `sharedExpenses.*` - Shared expenses (v2)
- `nav.*` - Navigation items
- `common.*` - Common UI labels

### Changing Language

Profile page has language selector dropdown:
```
🌍 Language Section
├─ Current: 🇮🇹 Italiano
├─ Selector: [🇮🇹 Italiano | 🇬🇧 English]
└─ ✓ Language updated successfully!
```

---

## 📱 PWA Features

### Installation

**Android Chrome:**
1. Open app in Chrome
2. Menu (⋮) → "Install app"

**iOS Safari:**
1. Open app in Safari
2. Share → "Add to Home Screen"

**Desktop (Chromium):**
1. Install icon appears in address bar
2. Click to install

### Offline Support

- **Service Worker**: Caches critical app files on first visit
- **IndexedDB**: Stores all expenses, categories, groups locally
- **Network-first with cache fallback**: Try network, fallback to cache
- **Background sync**: Changes queued when offline, synced when online

### Performance

```
Build Size:
  - Main JS: 718.83 KB (gzipped: 215.33 KB)
  - CSS: Embedded in main
  - Total: ~720 KB

Load Time:
  - First visit: ~2-3s (Service Worker cache)
  - Subsequent visits: <1s (cached)
  - Offline: Instant

Features:
  - Precache: 740 KB
  - Runtime cache: Unlimited (IndexedDB)
  - SW: Auto-generated with Workbox
```

---

## 🔐 Security & Privacy

### Authentication

- ✅ Supabase Auth (enterprise-grade)
- ✅ Email/password with bcrypt hashing
- ✅ Session tokens with expiration
- ✅ HTTPS enforcement

### Data Protection

- ✅ Row-level security (RLS) on Supabase
- ✅ User isolation (only see own data)
- ✅ XSS protection (React sanitization)
- ✅ CSRF protection (Supabase headers)

### Local Storage

- ✅ IndexedDB encryption support (browser-native)
- ✅ No sensitive data in localStorage (only language + theme)
- ✅ Logout clears Dexie + localStorage

### Not Included

- ❌ PIN protection
- ❌ Biometric authentication
- ❌ Local encryption (browser-native used)
- ❌ End-to-end encryption (Supabase RLS sufficient)

---

## 🎨 Available Commands

### Development

```bash
pnpm dev                # Start dev server @ localhost:5173
pnpm dev --host         # Accessible on network
```

### Build & Deploy

```bash
pnpm build             # Production build → dist/
pnpm preview           # Preview production build locally
```

### Code Quality

```bash
pnpm lint              # ESLint check
pnpm lint --fix        # Auto-fix ESLint issues
pnpm format            # Prettier format
```

### Testing

```bash
pnpm type-check        # TypeScript check
```

---

## 📊 Build & Performance

### Development Build

```
pnpm dev
├─ Vite dev server
├─ Hot reload enabled
├─ Source maps enabled
└─ → http://localhost:5173
```

### Production Build

```bash
pnpm build

Output:
vite v6.4.1 building for production...
✓ 2687 modules transformed
dist/index-BWPgvCdA.js     718.83 kB │ gzip: 215.33 kB
✓ built in 10.41s
PWA v1.1.0 - files generated
```

### Performance Metrics

| Metric              | Value       |
| ------------------- | ----------- |
| Bundle Size (JS)    | 718.83 KB   |
| Bundle Size (gzip)  | 215.33 KB   |
| Build Time          | ~10s        |
| First Load (cached) | <1s         |
| First Load (fresh)  | 2-3s        |

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Will auto-detect Vite and deploy
```

### Netlify

```bash
# Build locally
pnpm build

# Deploy with Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "preview"]
```

---

## 📚 Documentation

### Quick References

| Document                         | Purpose                          |
| -------------------------------- | -------------------------------- |
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup guide             |
| [SETUP.md](./SETUP.md)           | Complete setup + SQL database    |
| [TECHNICAL.md](./TECHNICAL.md)   | Architecture & deep-dive         |
| [API.md](./API.md)               | API reference & data flow        |
| [V2_FEATURES.md](./V2_FEATURES.md) | Version 2.0 features & sync      |

### Additional Resources

- **Sync Deep-Dive**: Check `sync.service.ts` (513 lines with comments)
- **Type Definitions**: `src/lib/dexie.ts` (database schema)
- **Component Examples**: `src/components/` (reusable UI components)
- **Translation System**: `src/lib/language.tsx` + `src/translations/`

---

## 🗺️ Roadmap

### Version 1.0 ✅ Complete

- Personal expense tracking
- Offline support with Dexie
- Bidirectional sync
- Dark mode
- PWA installation
- Multi-language (IT/EN)

### Version 2.0 ✅ Complete

- Group management
- Shared expenses
- Expense settlement tracking
- Desktop sidebar navigation
- Enhanced sync service

### Version 2.1 (Planned)

- [ ] Group detail pages with members
- [ ] Recurring expense automation
- [ ] Local push notifications
- [ ] Advanced reporting & charts
- [ ] Budget tracking per group
- [ ] Email notifications (sync)

### Version 3.0 (Future)

- [ ] Mobile app (React Native)
- [ ] Real-time sync (WebSockets)
- [ ] Image receipt scanning
- [ ] AI expense categorization
- [ ] Social sharing & stats
- [ ] Multi-currency conversion

---

## 🐛 Troubleshooting

### Common Issues

| Problem                      | Solution                           |
| ---------------------------- | ---------------------------------- |
| `PGRST116` Supabase error   | Check RLS policies & credentials   |
| IndexedDB empty in incognito | Normal browser behavior, not a bug |
| Service Worker not updating  | Requires HTTPS in production       |
| Build error "unknown utility"| Clear `/dist` & rebuild            |
| Sync not working             | Check internet connection & Supabase credentials |
| Language not persisting      | Verify localStorage is enabled     |
| Dark mode not applying       | Clear browser cache & reload       |

### Debug Mode

Add to browser console:

```javascript
// Check sync status
localStorage.getItem('lastSync');

// Check language
localStorage.getItem('app-language');

// Check theme
localStorage.getItem('theme');

// View IndexedDB
// DevTools → Application → IndexedDB → MyMoney
```

---

## 🤝 Contributing

### How to Contribute

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes & test thoroughly
4. Lint & format: `pnpm lint --fix && pnpm format`
5. Build & verify: `pnpm build`
6. Commit with conventional format: `git commit -m "feat: Add amazing feature"`
7. Push: `git push origin feature/amazing-feature`
8. Create Pull Request (PR to `dev` first)

### Git Workflow

```
main (production)
  ↑
  └── dev (development)
       ↑
       └── feature/* (new features)
           ↑
           └── PR reviewed before merge
```

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

Free to use, modify, and distribute. No restrictions.

---

## 👨‍💻 Tech Preferences

This project uses:
- ✅ React 19 (latest features + Suspense)
- ✅ TypeScript strict mode (full type safety)
- ✅ Tailwind CSS v4 (utility-first styling)
- ✅ ShadCN UI (accessible components)
- ✅ Supabase (open-source backend)
- ✅ PWA standards (offline-first)
- ✅ Mobile-first design (responsive)
- ✅ Conventional commits (clean history)

---

## 📞 Support

- **Issues**: Open GitHub issue with detailed description
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check docs before asking
- **PRs**: Welcome! Follow contribution guidelines

---

## 🎉 Getting Started

Ready to manage your expenses smartly?

1. **Clone**: `git clone https://github.com/ilario23/MyMoney.git`
2. **Install**: `pnpm install`
3. **Setup**: Copy `.env.example` → `.env.local` + add credentials
4. **Run**: `pnpm dev`
5. **Create account**: Signup to get started

**Enjoy tracking your expenses! 💸**

---

**Made with ❤️ for managing finances simply and efficiently**

Last Updated: **October 2025** | Version: **2.0** | Status: **Production Ready** ✅
