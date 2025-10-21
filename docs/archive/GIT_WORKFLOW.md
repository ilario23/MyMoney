# Git Workflow - MyMoney

## 📋 Branch Strategy

### Branches Principali

- **`main`** - Branch di produzione (stabile, solo merge da dev via PR)
- **`dev`** - Branch di sviluppo (lavoro attivo, feature in sviluppo)

### Workflow Standard

```
main (produzione stabile)
  ↑
  │ Pull Request
  │ (dopo test e review)
  │
dev (sviluppo attivo)
  ↑
  │ Feature branches (opzionale)
  │
feature/nome-feature
```

## 🚀 Comandi Standard

### Sviluppo Quotidiano (su dev)

```bash
# Assicurati di essere su dev
git checkout dev

# Aggiorna da remoto
git pull mymoney dev

# Lavora, fai modifiche...

# Commit
git add .
git commit -m "feat: descrizione modifiche"

# Push su dev
git push mymoney dev
```

### Release su Main (via Pull Request)

```bash
# 1. Assicurati che dev sia aggiornato
git checkout dev
git pull mymoney dev

# 2. Testa tutto
pnpm build
pnpm test (se presente)

# 3. Vai su GitHub
# https://github.com/ilario23/MyMoney/compare/main...dev

# 4. Crea Pull Request
# - Base: main
# - Compare: dev
# - Titolo: "Release v1.x.x"
# - Descrizione: changelog

# 5. Merge PR su GitHub

# 6. Aggiorna main locale
git checkout main
git pull mymoney main
```

## 📦 Conventional Commits

Usa prefissi standard per i commit:

- `feat:` - Nuova funzionalità
- `fix:` - Bug fix
- `docs:` - Modifiche documentazione
- `style:` - Formattazione, missing semi colons, etc
- `refactor:` - Refactoring codice
- `perf:` - Performance improvements
- `test:` - Aggiunta test
- `chore:` - Build, configurazioni, etc

### Esempi

```bash
git commit -m "feat: Add offline indicator with red color"
git commit -m "fix: Service Worker response clone error"
git commit -m "docs: Update README with installation steps"
git commit -m "refactor: Extract sync logic to separate service"
```

## 🏷️ Versioning (Semantic Versioning)

```
v1.4.3
│ │ │
│ │ └─ PATCH: Bug fix, piccole modifiche
│ └─── MINOR: Nuove feature (retrocompatibili)
└───── MAJOR: Breaking changes
```

### Changelog delle Release

**v1.4.3** (Current - Dev)

- fix: Sync service 409 conflict resolution
- fix: Service Worker response clone error
- feat: Red offline indicator in header
- feat: Offline banner improvements

**v1.4.2**

- feat: Offline indicator component
- fix: TypeScript configuration (isolatedModules)

**v1.4.1**

- feat: Automatic sync after CRUD operations
- feat: Soft delete for expenses
- fix: Filter deleted expenses from dashboard

**v1.4.0**

- feat: Complete i18n system (142 keys, IT/EN)

## 🔒 Protezione Branch Main

### Su GitHub (Consigliato)

1. Vai su **Settings** → **Branches**
2. Add branch protection rule per `main`:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass (se hai CI)
   - ✅ Require branches to be up to date before merging

## 🌳 Branch Naming

Per feature branches (opzionale):

```
feature/nome-feature        # Nuova funzionalità
fix/nome-bug                # Bug fix
refactor/nome-refactoring   # Refactoring
docs/nome-doc               # Documentazione
```

### Esempio Workflow Feature Branch

```bash
# Crea feature branch da dev
git checkout dev
git pull mymoney dev
git checkout -b feature/groups-management

# Lavora sulla feature...
git add .
git commit -m "feat: Add groups CRUD"

# Push feature branch
git push mymoney feature/groups-management

# Crea PR su GitHub: feature/groups-management → dev
# Dopo merge, elimina feature branch
git checkout dev
git pull mymoney dev
git branch -d feature/groups-management
```

## 📊 Branch Status

```bash
# Vedi branch corrente
git branch

# Vedi tutti i branch (locali e remoti)
git branch -a

# Vedi ultimo commit per branch
git branch -v

# Confronta branch
git diff main..dev
```

## 🔄 Sync Branches

### Aggiorna dev da main (dopo release)

```bash
git checkout dev
git merge main
git push mymoney dev
```

### Aggiorna main da dev (manuale - NON consigliato)

```bash
# Meglio usare Pull Request su GitHub
# Ma se necessario:
git checkout main
git merge dev
git push mymoney main
```

## 🚨 Situazioni di Emergenza

### Hotfix su Main (solo emergenze)

```bash
# Crea hotfix branch da main
git checkout main
git pull mymoney main
git checkout -b hotfix/critical-bug

# Fix il bug
git add .
git commit -m "fix: Critical security vulnerability"

# Push hotfix
git push mymoney hotfix/critical-bug

# PR: hotfix/critical-bug → main
# Dopo merge, sync su dev:
git checkout dev
git merge main
git push mymoney dev
```

## 📝 Checklist Prima del Push

- [ ] Build funziona (`pnpm build`)
- [ ] Nessun errore TypeScript
- [ ] Commit message descrittivo
- [ ] Su branch dev (non main direttamente)
- [ ] Codice testato localmente

## 📚 Risorse

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

**Nota**: Da ora in poi, tutto il lavoro di sviluppo va su `dev`. Solo release stabili vanno su `main` via Pull Request.
