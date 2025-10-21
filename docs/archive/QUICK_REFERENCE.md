# 📱 Spendix PWA - Quick Reference Card

## 🚀 Start Here (5 Minutes)

```bash
# 1. Clone & Install
git clone <repo> && cd frontend-starter-kit && pnpm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# 3. Create Database (in Supabase SQL Editor)
# Copy from SETUP.md section "Setup Supabase Database"

# 4. Run Dev
pnpm dev  # Visit http://localhost:5173

# 5. Test Offline
# DevTools > Network > Offline > Add expense > Go online
```

---

## 📂 File Structure at a Glance

```
src/
├── pages/              [Dashboard, Login]
├── components/         [Buttons, Forms, Layout]
├── lib/               [Database, Auth, Supabase]
├── hooks/             [useSync, useTheme]
├── services/          [Sync logic]
├── router.tsx         [Routes]
└── App.tsx            [Entry point]

public/
├── manifest.json      [PWA config]
└── sw.js             [Service Worker]
```

---

## 🔑 Key Concepts

### Local DB (Dexie)

```typescript
// Add expense offline
await db.expenses.add({
  id: uuid(),
  userId,
  amount: 50,
  isSynced: false, // Mark for sync
  // ...
});
```

### Sync Algorithm

```
1. Get lastSync timestamp
2. PUSH unsync'd (isSynced=false) to Supabase
3. PULL changes (updated_at > lastSync)
4. MERGE with conflict resolution
5. UPDATE isSynced=true + lastSync
```

### Auth Flow

```
Login > Supabase validates > JWT token stored
> Router checks session > Redirects to /dashboard
```

---

## 🎨 Components Available

**UI Ready:**

- Button, Badge, Card, Input
- Select, Dialog, Tabs, Alert

**Custom:**

- Navigation (mobile bottom nav)
- SyncIndicator (status + button)
- ThemeToggle (dark mode)
- ExpenseForm (add expenses)

---

## 🧭 Common Tasks

### Add New Expense Type

1. Add field to `Expense` interface in `lib/dexie.ts`
2. Update `ExpenseForm` input fields
3. Update sync service to map field

### Add Category

1. Predefined: Edit component constant
2. Custom: Need UI for user to create

### Add Page

1. Create `src/pages/MyPage.tsx`
2. Add route in `router.tsx`
3. Wrap with `<Layout>` if authenticated

### Debug Sync Issues

1. Set `localStorage.setItem('DEBUG', 'true')`
2. Reload app
3. Check browser console for `[Sync]` logs

### Test Offline

1. DevTools > Network tab
2. Select "Offline"
3. Add/edit expenses
4. DevTools > Network > Online
5. Expenses auto-sync

---

## 📊 Tech Quick Reference

| Tech           | Usage                      |
| -------------- | -------------------------- |
| **React 19**   | UI components & hooks      |
| **Vite**       | Dev server & build         |
| **TypeScript** | Type safety                |
| **Tailwind**   | Styling                    |
| **ShadCN UI**  | Pre-built components       |
| **Zustand**    | State management           |
| **Dexie**      | Local database (IndexedDB) |
| **Supabase**   | Cloud backend              |
| **PWA Plugin** | PWA config                 |
| **date-fns**   | Date utilities             |

---

## 🔒 Security Checklist

- [x] Supabase Auth enabled
- [x] Row-Level Security (RLS) active
- [x] Environment variables in `.env.local`
- [x] Never commit `.env.local`
- [x] HTTPS in production
- [ ] PIN/biometric (not planned)

---

## 📱 Install PWA

**Chrome/Edge (Desktop)**

1. Dev tools top-right
2. Install icon

**Android**

1. Menu (⋮)
2. Install app

**iOS Safari**

1. Share
2. Add to Home Screen

---

## 🚀 Deploy

```bash
# Vercel (easiest)
vercel

# Netlify
pnpm build
netlify deploy --prod --dir=dist

# Render, Railway, etc.
pnpm build
# Upload `dist/` folder
```

---

## 🐛 Troubleshooting

| Issue                          | Fix                                      |
| ------------------------------ | ---------------------------------------- |
| `Can't connect to Supabase`    | Check `VITE_SUPABASE_*` in `.env.local`  |
| Offline doesn't work           | IndexedDB might be disabled (incognito?) |
| Service Worker not registering | Needs HTTPS in production                |
| Expense not saving             | Check browser console for errors         |
| Dark mode not working          | Clear localStorage, reload               |

---

## 📚 Documentation Map

| File          | Purpose                |
| ------------- | ---------------------- |
| QUICKSTART.md | 5-min setup            |
| SETUP.md      | Complete setup + SQL   |
| TECHNICAL.md  | Architecture deep dive |
| API.md        | API calls + data flow  |
| README.md     | Project overview       |

---

## 💡 Pro Tips

- Use `localStorage.setItem('DEBUG', 'true')` to see sync logs
- DevTools > Application > IndexedDB to inspect local DB
- Test offline with DevTools Network tab set to "Offline"
- All costs in EUR by default (changeable in form)
- Categories are user-specific (can customize later)

---

## ✅ Feature Checklist

**v1.0 Ready:**

- ✅ Personal expenses
- ✅ Dashboard
- ✅ Offline
- ✅ Sync
- ✅ Dark mode
- ✅ PWA

**v2.0 Planned:**

- 📋 Groups
- 📋 Shared expenses
- 📋 Real-time sync
- 📋 Notifications

---

## 🎯 Next Actions

1. **Setup** (5 min): Follow QUICKSTART.md
2. **Supabase** (5 min): Create tables with provided SQL
3. **Develop** (ongoing): Add features as needed
4. **Test** (10 min): Try offline mode
5. **Deploy** (5 min): Push to Vercel/Netlify

---

## 📞 Quick Links

- 🌐 [React Docs](https://react.dev)
- 📦 [Vite Docs](https://vitejs.dev)
- 🎨 [ShadCN UI](https://ui.shadcn.com)
- 🛠️ [Supabase Docs](https://supabase.com/docs)
- 💾 [Dexie Docs](https://dexie.org)
- 📱 [PWA Guide](https://web.dev/progressive-web-apps/)

---

## 🎊 You're All Set!

Your Spendix PWA is ready to build upon. Happy coding! 🚀

_Last Updated: October 2024_
