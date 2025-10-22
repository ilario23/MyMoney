# Changelog# CHANGELOG - MyMoney PWA

All notable changes to MyMoney will be documented in this file.All notable changes to the MyMoney project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2025-10-22## [1.8.0] - October 21, 2025 🌳

### 🚀 Major Release - Local-First Architecture### Tree View Categories & Advanced Expense Filters

This is a **complete rewrite** with breaking changes. Not compatible with v2.x.A major UX release focusing on hierarchical category visualization and powerful filtering capabilities.

### Added#### Added

#### Core Features**Category Management:**

- **RxDB Integration**: Reactive, observable database replacing Dexie.js

- **Local-First Statistics**: Client-side computation with intelligent caching- ✅ Tree view with expand/collapse for hierarchical categories

- **Improved Sync Service**: Bidirectional replication protocol with RxDB- ✅ Visual indentation for subcategories (8px per level depth)

- **Leader Election**: Multi-tab support with single sync leader- ✅ Chevron icons (ChevronDown/ChevronRight) for expand/collapse state

- **Reactive Queries**: Automatic UI updates via RxJS subscriptions- ✅ Edit parent category support with dropdown selector

- **Stats Cache Collection**: Local-only collection for computed statistics- ✅ Circular reference validation with graph traversal algorithm

- ✅ Category statistics badge (expense count + total amount)

#### Database- ✅ Recursive rendering function for tree structure

- New RxDB schema with JSON Schema validation- ✅ `buildCategoryTree()` helper to separate top-level from children

- `deleted_at` column on all tables for soft deletes- ✅ `wouldCreateCircularRef()` validation to prevent infinite loops

- `updated_at` triggers for automatic timestamp updates- ✅ `toggleExpand()` with Set-based state for O(1) performance

- Cleaner Supabase schema without aggregate views

- Single setup SQL file (`SETUP_v3.0.sql`) for fresh installations**Expense Filtering:**

#### Services- ✅ Advanced filter panel with collapse/expand toggle

- `src/lib/rxdb.ts`: Database initialization with leader election- ✅ Category dropdown filter (all categories)

- `src/lib/rxdb-schemas.ts`: Collection schemas (8 collections)- ✅ Date range filter (from/to date pickers)

- `src/services/sync.service.ts`: RxDB replication protocol- ✅ Amount range filter (min/max inputs in EUR)

- `src/services/stats.service.ts`: Local statistics calculation- ✅ Sort by: Date, Amount, or Category

- ✅ Sort order: Ascending or Descending

#### Documentation- ✅ Clear filters button (X icon) with active indicator

- Complete rewrite of `TECHNICAL.md` with v3.0 architecture- ✅ Multi-criteria filtering with useEffect dependencies

- New `SETUP.md` focused on fresh installations- ✅ Filter toggle button (SlidersHorizontal icon)

- Updated `README.md` with local-first concepts- ✅ Active filter state highlighting

- Created `SETUP_v3.0.sql` as single source of truth

#### Changed

### Changed

- **Categories Page**: Replaced flat grid with recursive tree structure

#### Breaking Changes- **Expenses Page**: Enhanced search bar with collapsible advanced filters

- **Database**: Complete schema redesign, no migration path from v2.x- **Category Edit Mode**: Added parent selector dropdown (top-level only)

- **Sync**: New replication protocol, incompatible with old sync service- **Expense Loading**: Merged with statistics aggregation for efficiency

- **Statistics**: Moved from database views to local computation

- **Dependencies**: Removed Dexie.js, added RxDB and RxJS#### Technical

#### Architecture- New state variables: `expandedCategories`, `expenseStats`, `editParentId`

- Local-first approach: app works offline by default- New filter states: `selectedCategory`, `dateFrom`, `dateTo`, `amountMin`, `amountMax`, `sortBy`, `sortOrder`

- Reactive data flow: UI updates automatically- Recursive `renderCategory(category, depth)` with React.ReactElement return type

- Client-side computation: reduced server load- Complex filtering logic with sequential application: search → category → date → amount → sort

- Leader election: only one tab syncs at a time- Graph traversal with visited Set for circular reference detection

#### Performance#### Files Changed

- Faster queries with RxDB indexes

- Instant UI updates via reactive subscriptions- `src/pages/categories.tsx` (+280 lines)

- Reduced network requests (local stats)- `src/pages/expenses.tsx` (+250 lines)

- Better offline experience- `docs/v1.8.0_RELEASE.md` (new)

- `docs/CHANGELOG.md` (this file)

### Removed

---

#### Cleanup

- All SQL migration files (`MIGRATION_*.sql`)## [2.0.0] - October 2025 🚀

- Database views and aggregate tables

- `FIX_RLS_*.sql` patch files### COMPLETE - Version 2.0 Release

- Dexie.js dependency

- Manual sync orchestration codeA major release introducing group-based expense sharing, complete bidirectional sync service, and enhanced navigation.

- Server-side statistics endpoints

#### Added

#### Documentation

- Old migration guides**Core v2.0 Features:**

- Patch-specific documentation

- Dexie-related setup instructions- ✅ Group Management System
  - Create, read, update, delete groups

### Fixed - Add/remove group members

- Color-coded groups with descriptions

- Sync conflicts now resolved consistently with last-write-wins - Group ownership and permissions

- Multi-tab sync issues eliminated with leader election

- Statistics calculation performance improved- ✅ Shared Expenses

- Offline mode more reliable with RxDB - Create expenses within groups
  - Track participant shares

### Migration from v2.x - Mark expenses as settled

- Settlement status filtering

⚠️ **Important**: No automatic migration available - Participant breakdown by amount

**Steps to upgrade:**- ✅ Desktop Navigation

1. Export your data from v2.x (Settings → Export) - Responsive sidebar (lg+ breakpoint only)

2. Setup fresh v3.0 installation (see `docs/SETUP.md`) - 6 main navigation items

3. Import your data via UI (if compatible) - Active route highlighting

- Mobile-first design preserved

**Alternative**: Keep v2.x running and start fresh in v3.0

- ✅ Enhanced Sync Service (513+ lines)

### Technical Details - `syncGroups()` - Bidirectional group sync with owner filtering

- `syncGroupMembers()` - Member sync with owner-based permissions

**New Dependencies:** - `syncSharedExpenses()` - Full participant support with recurring rules

````json - All functions: check-then-insert-or-update pattern

{  - Return format: `{ synced, failed, conflicts }`

  "rxdb": "^16.20.0",  - Timestamp-based conflict resolution

  "rxjs": "^7.8.2",

  "pouchdb-adapter-idb": "^9.0.0"- ✅ Multi-Language Expansion

}  - 46 new translation keys added

```  - Groups namespace (24 keys)

  - Shared Expenses namespace (22 keys)

**Removed Dependencies:**  - Navigation items translation

```json  - Total: 191 keys (IT + EN)

{

  "dexie": "^4.2.1"  // Replaced by RxDB#### Changed

}

```- **Sync Service Architecture**

  - Implemented consistent check-then-insert-or-update pattern across all entities

**Database Schema:**  - Improved conflict resolution with timestamp comparison

- 7 synced collections: users, categories, expenses, groups, group_members, shared_expenses, shared_expense_splits  - Better error handling per entity with detailed logging

- 1 local-only collection: stats_cache

- All collections include: id, created_at, updated_at, deleted_at- **Database Schema Evolution**

  - Groups table with ownership

---  - Group Members junction table

  - Shared Expenses with participants array

## [2.0.0] - 2024-XX-XX  - Migration: Existing v1.0 data fully compatible



### Added- **UI/UX**

- Group management for shared expenses  - Consolidated navigation: sidebar (desktop) + bottom nav (mobile)

- Group member CRUD operations  - Enhanced Profile page with language selector

- Shared expense tracking and splitting  - Logout with confirmation dialog

- Desktop sidebar navigation  - Offline indicator: auto-hide after 2s

- Mobile bottom navigation  - Responsive padding and spacing improvements

- Multi-user expense splitting

- Settlement tracking#### Fixed



### Changed- 409 Conflict errors on sync operations

- Enhanced sync service for groups- Service Worker clone response error

- Improved UI with better navigation- TypeScript configuration (isolatedModules flag)

- Updated dashboard with group summaries- Missing translation keys for logout

- Mobile content overlap with navigation bar

---- Spacing issues on mobile & desktop



## [1.8.0] - 2024-XX-XX#### Build Metrics



### Added- Bundle Size: 718.83 KB (gzipped: 215.33 KB)

- Database views for performance- Build Time: ~10s

- Category usage statistics- Modules: 2687 transformed

- Group expense summaries- Errors: 0

- User expense aggregations- Warnings: 0



------



## [1.7.0] - 2024-XX-XX## [1.4.2] - October 2025



### Added### Offline Indicator Enhancement

- Hierarchical categories (parent-child)

- Advanced search and filtering#### Added

- Grouped category dropdowns

- Enhanced expense form- Red offline status banner with auto-hide (2s)

- Green online status indicator

---- Manual close button for banner

- Red offline text in header (SyncIndicator)

## [1.0.0] - 2024-XX-XX- Offline functionality verification



### Added#### Fixed

- Initial release

- Personal expense tracking- Offline indicator visibility and auto-hide timing

- Categories management- Service Worker clone response handling

- Supabase authentication

- Offline support with Dexie---

- PWA installation

- Dark mode## [1.4.1] - October 2025

- Multi-language (IT/EN)

- Dashboard with statistics### Automatic Sync After Operations

- Profile management

#### Added

---

- Auto-sync triggers:

## Version Comparison  - After expense CRUD operations

  - After category modifications

| Feature | v1.x | v2.x | v3.0 |  - When browser goes online

|---------|------|------|------|  - On application startup

| Personal Expenses | ✅ | ✅ | ✅ |

| Categories | ✅ | ✅ | ✅ |- Improved error handling in sync operations

| Groups | ❌ | ✅ | ✅ |- Toast notifications for sync results

| Shared Expenses | ❌ | ✅ | ✅ |

| Local Database | Dexie | Dexie | RxDB |#### Changed

| Reactive Queries | ❌ | ❌ | ✅ |

| Local Statistics | ❌ | ❌ | ✅ |- Sync behavior: Now automatic by default

| Leader Election | ❌ | ❌ | ✅ |- Manual sync still available via refresh button

| Sync Protocol | Manual | Manual | RxDB Replication |

| Offline Mode | ✅ | ✅ | ✅✅ |---

| Dark Mode | ✅ | ✅ | ✅ |

| PWA | ✅ | ✅ | ✅ |## [1.4.0] - September 2025



---### Multi-Language System Implementation



## Upcoming#### Added



### v3.1 (Planned)- Complete i18n system with React Context

- [ ] End-to-end encryption- Language support:

- [ ] Advanced CRDT conflict resolution  - Italian (it) - Primary

- [ ] GraphQL sync protocol  - English (en) - Secondary

- [ ] Real-time collaborative editing

- [ ] Push notifications- Features:

- [ ] Export/import improvements  - Browser locale auto-detection

  - LocalStorage persistence

### v3.2 (Future)  - HTML lang attribute updates

- [ ] Budget tracking  - Language selector in Profile page

- [ ] Recurring transactions automation  - 145+ translation keys

- [ ] Advanced analytics dashboard

- [ ] Receipt scanning (OCR)- Translation structure:

- [ ] Multi-currency conversion  - Namespaced keys: profile._, expense._, category.\*, etc.

- [ ] Tax reports  - Type-safe TranslationKey union

  - Fallback to key name if translation missing

---

#### Fixed

## Support

- Language persistence across page reloads

For questions about specific versions:- Browser compatibility for locale detection

- **v3.0**: See [docs/SETUP.md](./docs/SETUP.md)

- **v2.x → v3.0**: Export data before upgrading---

- **v1.x → v3.0**: Export data before upgrading

## [1.3.0] - August 2025

---

### Profile Page & Category Management

[3.0.0]: https://github.com/yourusername/mymoney/releases/tag/v3.0.0

[2.0.0]: https://github.com/yourusername/mymoney/releases/tag/v2.0.0#### Added

[1.8.0]: https://github.com/yourusername/mymoney/releases/tag/v1.8.0

[1.7.0]: https://github.com/yourusername/mymoney/releases/tag/v1.7.0- Profile page with features:

[1.0.0]: https://github.com/yourusername/mymoney/releases/tag/v1.0.0  - Edit display name

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

| Component  | Technology      | Version |
| ---------- | --------------- | ------- |
| Frontend   | React           | 19      |
| Build Tool | Vite            | 6.4     |
| Language   | TypeScript      | 5.x     |
| Styling    | Tailwind CSS    | 4.1     |
| Components | ShadCN UI       | Latest  |
| State      | Zustand         | Latest  |
| Local DB   | Dexie.js        | 4.2.1   |
| Backend    | Supabase        | Latest  |
| PWA        | vite-plugin-pwa | 1.1     |

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

| Version | Size   | Gzipped | Modules |
| ------- | ------ | ------- | ------- |
| 1.0.0   | 698 KB | 211 KB  | 2500    |
| 1.4.2   | 716 KB | 213 KB  | 2600    |
| 2.0.0   | 718 KB | 215 KB  | 2687    |

### Load Time Evolution

| Version | Cold | Warm | Offline |
| ------- | ---- | ---- | ------- |
| 1.0.0   | 2.5s | 0.5s | 0s      |
| 2.0.0   | 2.3s | 0.4s | 0s      |

_Times measured on standard mobile (Slow 4G throttling)_

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
````
