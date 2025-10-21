# CHANGELOG - MyMoney PWA

All notable changes to the MyMoney project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - October 2025 🚀

### COMPLETE - Version 2.0 Release

A major release introducing group-based expense sharing, complete bidirectional sync service, and enhanced navigation.

#### Added

**Core v2.0 Features:**
- ✅ Group Management System
  - Create, read, update, delete groups
  - Add/remove group members
  - Color-coded groups with descriptions
  - Group ownership and permissions

- ✅ Shared Expenses
  - Create expenses within groups
  - Track participant shares
  - Mark expenses as settled
  - Settlement status filtering
  - Participant breakdown by amount

- ✅ Desktop Navigation
  - Responsive sidebar (lg+ breakpoint only)
  - 6 main navigation items
  - Active route highlighting
  - Mobile-first design preserved

- ✅ Enhanced Sync Service (513+ lines)
  - `syncGroups()` - Bidirectional group sync with owner filtering
  - `syncGroupMembers()` - Member sync with owner-based permissions
  - `syncSharedExpenses()` - Full participant support with recurring rules
  - All functions: check-then-insert-or-update pattern
  - Return format: `{ synced, failed, conflicts }`
  - Timestamp-based conflict resolution

- ✅ Multi-Language Expansion
  - 46 new translation keys added
  - Groups namespace (24 keys)
  - Shared Expenses namespace (22 keys)
  - Navigation items translation
  - Total: 191 keys (IT + EN)

#### Changed

- **Sync Service Architecture**
  - Implemented consistent check-then-insert-or-update pattern across all entities
  - Improved conflict resolution with timestamp comparison
  - Better error handling per entity with detailed logging

- **Database Schema Evolution**
  - Groups table with ownership
  - Group Members junction table
  - Shared Expenses with participants array
  - Migration: Existing v1.0 data fully compatible

- **UI/UX**
  - Consolidated navigation: sidebar (desktop) + bottom nav (mobile)
  - Enhanced Profile page with language selector
  - Logout with confirmation dialog
  - Offline indicator: auto-hide after 2s
  - Responsive padding and spacing improvements

#### Fixed

- 409 Conflict errors on sync operations
- Service Worker clone response error
- TypeScript configuration (isolatedModules flag)
- Missing translation keys for logout
- Mobile content overlap with navigation bar
- Spacing issues on mobile & desktop

#### Build Metrics

- Bundle Size: 718.83 KB (gzipped: 215.33 KB)
- Build Time: ~10s
- Modules: 2687 transformed
- Errors: 0
- Warnings: 0

---

## [1.4.2] - October 2025

### Offline Indicator Enhancement

#### Added

- Red offline status banner with auto-hide (2s)
- Green online status indicator
- Manual close button for banner
- Red offline text in header (SyncIndicator)
- Offline functionality verification

#### Fixed

- Offline indicator visibility and auto-hide timing
- Service Worker clone response handling

---

## [1.4.1] - October 2025

### Automatic Sync After Operations

#### Added

- Auto-sync triggers:
  - After expense CRUD operations
  - After category modifications
  - When browser goes online
  - On application startup

- Improved error handling in sync operations
- Toast notifications for sync results

#### Changed

- Sync behavior: Now automatic by default
- Manual sync still available via refresh button

---

## [1.4.0] - September 2025

### Multi-Language System Implementation

#### Added

- Complete i18n system with React Context
- Language support:
  - Italian (it) - Primary
  - English (en) - Secondary

- Features:
  - Browser locale auto-detection
  - LocalStorage persistence
  - HTML lang attribute updates
  - Language selector in Profile page
  - 145+ translation keys

- Translation structure:
  - Namespaced keys: profile.*, expense.*, category.*, etc.
  - Type-safe TranslationKey union
  - Fallback to key name if translation missing

#### Fixed

- Language persistence across page reloads
- Browser compatibility for locale detection

---

## [1.3.0] - August 2025

### Profile Page & Category Management

#### Added

- Profile page with features:
  - Edit display name
  - View email
  - Statistics: total expenses, amount, categories
  - Last sync timestamp display
  - JSON backup export functionality
  - Delete all local data with confirmation
  - Logout button with session cleanup

- Category management page:
  - View all categories with colors
  - Edit category details
  - Delete categories
  - Inline category creation
  - Custom emoji support

#### Changed

- Dashboard UI: Added quick "Add Expense" button
- Navigation: Added Profile link

---

## [1.2.0] - July 2025

### Dark Mode & Advanced UX

#### Added

- Dark mode support:
  - System preference detection (matchMedia)
  - Manual toggle in header
  - CSS variable-based theming
  - LocalStorage persistence

- Expense form enhancements:
  - Back button to dashboard
  - Cancel button with confirmation
  - Inline category creation (+ button)
  - 12 emoji icons to choose from
  - Auto-redirect after save

- UI improvements:
  - Responsive card layouts
  - Better error messages
  - Loading states
  - Success notifications

#### Fixed

- Mobile-first responsive design issues
- Color contrast for accessibility

---

## [1.1.0] - June 2025

### Dashboard & Multi-Currency

#### Added

- Dashboard page with:
  - 3 summary cards (expenses, balance, net)
  - Recent expenses list (top 10)
  - Monthly statistics
  - Quick "Add Expense" button
  - Manual sync control
  - Dark mode toggle

- Multi-currency support:
  - EUR (default)
  - USD
  - GBP
  - Currency selector in expense form

- Category system:
  - 8 default categories with emojis
  - Custom category creation
  - Category colors
  - Category filtering

---

## [1.0.0] - May 2025 ✅

### Initial Release - Personal Expense Tracking

#### Added

**Core Features:**
- Personal expense tracking:
  - Add/edit/delete expenses
  - Date selection
  - Amount input
  - Category selection
  - Notes/description

- Authentication system:
  - Email/password signup
  - Login with session persistence
  - Logout with cleanup
  - Supabase integration

- Local storage:
  - Dexie.js (IndexedDB)
  - Offline-first architecture
  - Data persistence across sessions

- Synchronization:
  - Bidirectional sync with Supabase
  - Manual sync trigger
  - Sync history logging
  - Conflict resolution (local wins)
  - `isSynced` flag per entity

- PWA capabilities:
  - Service Worker registration
  - Precaching strategy
  - Installable on mobile
  - Works offline
  - Add to home screen support

- User interface:
  - Mobile-first responsive design
  - Light/dark mode foundation
  - Navigation with React Router
  - ShadCN UI components
  - Tailwind CSS styling

#### Tech Stack

| Component       | Technology      | Version |
| --------------- | --------------- | ------- |
| Frontend        | React           | 19      |
| Build Tool      | Vite            | 6.4     |
| Language        | TypeScript      | 5.x     |
| Styling         | Tailwind CSS    | 4.1     |
| Components      | ShadCN UI       | Latest  |
| State           | Zustand         | Latest  |
| Local DB        | Dexie.js        | 4.2.1   |
| Backend         | Supabase        | Latest  |
| PWA             | vite-plugin-pwa | 1.1     |

#### Build Metrics

- Bundle Size: 698.29 KB (gzipped: 211.31 KB)
- Build Time: ~8s
- First Load: 2-3s (cached)
- Offline Support: Full

---

## Migration & Upgrade Guides

### v1.x → v2.0

**No breaking changes!** All v1.0 data is fully compatible.

**What's new:**
- New tables: groups, group_members, shared_expenses
- Existing tables: categories, expenses, users, sync_logs (unchanged)
- New translation keys: 46 keys added (191 total)
- New pages: /groups, /shared-expenses

**Upgrade steps:**
1. Pull latest code
2. Run `pnpm install`
3. Run `pnpm build` to verify
4. Run `pnpm dev` to test
5. No database migration needed (RLS policies updated automatically)

---

## Deprecations & Removals

### Removed in v2.0

- Old README files (consolidated into single README.md)
- Deprecated i18n documentation (README_LANGUAGE_SYSTEM.md)
- Old feature documentation (FEATURES_NEW.md)

### Still Supported

- All v1.x API endpoints
- Old database structure (fully compatible)
- Legacy sync patterns (maintained for compatibility)

---

## Known Limitations

### Current Limitations

1. **Group Sharing**
   - Groups are not real-time (manual refresh needed)
   - No push notifications for shared expense updates
   - No email invitations (manual member addition)

2. **Sync**
   - No background sync in offline mode
   - Conflicts logged but not auto-resolved UI
   - Manual intervention needed for major conflicts

3. **Recurring Expenses**
   - Stored in database but UI not implemented
   - Manual creation for now

4. **Security**
   - No end-to-end encryption (Supabase RLS sufficient)
   - No biometric authentication
   - No PIN protection

### Planned for v2.1

- [ ] Real-time group updates (WebSockets)
- [ ] Push notifications
- [ ] Recurring expense UI
- [ ] Group detail pages
- [ ] Email invitations

---

## Performance Timeline

### Build Size Evolution

| Version | Size    | Gzipped | Modules |
| ------- | ------- | ------- | ------- |
| 1.0.0   | 698 KB  | 211 KB  | 2500    |
| 1.4.2   | 716 KB  | 213 KB  | 2600    |
| 2.0.0   | 718 KB  | 215 KB  | 2687    |

### Load Time Evolution

| Version | Cold    | Warm | Offline |
| ------- | ------- | ---- | ------- |
| 1.0.0   | 2.5s    | 0.5s | 0s      |
| 2.0.0   | 2.3s    | 0.4s | 0s      |

*Times measured on standard mobile (Slow 4G throttling)*

---

## Future Roadmap

### v2.1 (Q1 2026)

- [ ] Group detail pages
- [ ] Recurring expense automation
- [ ] Local push notifications
- [ ] Advanced reporting
- [ ] Budget tracking per group

### v3.0 (Q2-Q3 2026)

- [ ] Mobile app (React Native)
- [ ] Real-time sync (WebSockets)
- [ ] Receipt scanning (OCR)
- [ ] AI categorization
- [ ] Social features

### v3.1+ (Future)

- [ ] Multi-currency conversion
- [ ] Investment tracking
- [ ] Tax report generation
- [ ] Integration with banks
- [ ] Mobile-first redesign v2

---

## Security Updates

### Reported Vulnerabilities

None reported to date.

### Security Best Practices

- ✅ Regular dependency updates via dependabot
- ✅ TypeScript strict mode for type safety
- ✅ Supabase RLS policies for row-level security
- ✅ HTTPS enforcement in production
- ✅ Service Worker security headers
- ✅ XSS protection via React's built-in sanitization

### Security Audit Checklist

- [x] Authentication: Supabase (SOC 2 certified)
- [x] Authorization: Row-level security (RLS)
- [x] Data encryption: HTTPS + Supabase encryption
- [x] Input validation: Client-side + server-side
- [x] Output encoding: React built-in
- [x] CSRF protection: Supabase headers

---

## Contributors & Acknowledgments

- **Project**: MyMoney PWA
- **Author**: ilario23
- **License**: MIT
- **Repository**: https://github.com/ilario23/MyMoney

### Key Technologies

- React team for React 19
- Vercel for Vite
- Tailwind Labs for Tailwind CSS
- Shadcn for UI component library
- Supabase for backend as a service
- Dexie.js team for IndexedDB wrapper

---

## How to Read This Changelog

- **[X.Y.Z]** = Semantic version (Major.Minor.Patch)
- **Added** = New features
- **Changed** = Existing feature modifications
- **Fixed** = Bug fixes
- **Removed** = Deprecations/deletions
- **Deprecated** = Will be removed soon
- **Security** = Vulnerability fixes

---

**Last Updated:** October 2025 | **Current Version:** 2.0.0 | **Status:** Production Ready ✅

For detailed technical documentation, see [TECHNICAL.md](./TECHNICAL.md) and [V2_FEATURES.md](./V2_FEATURES.md)
