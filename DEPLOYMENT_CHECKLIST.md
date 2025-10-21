# 📋 Checklist Deployment Vercel

## Prima del Deploy

### ✅ Icone PWA

- [ ] Aprire `generate-icons.html` nel browser
- [ ] Generare tutte le icone (48px - 512px)
- [ ] Creare cartella `public/icons/`
- [ ] Salvare tutte le 9 icone nella cartella
- [ ] Verificare che i nomi siano corretti:
  - `icon-48x48.png`
  - `icon-72x72.png`
  - `icon-96x96.png`
  - `icon-128x128.png`
  - `icon-144x144.png`
  - `icon-192x192.png`
  - `icon-256x256.png`
  - `icon-384x384.png`
  - `icon-512x512.png`

### ✅ File di Configurazione

- [x] `vercel.json` creato
- [x] `robots.txt` creato
- [x] `.env.example` aggiornato
- [x] `docs/DEPLOYMENT.md` creato
- [x] `generate-icons.html` creato

### ✅ Build Locale

- [ ] Eseguire `pnpm run build`
- [ ] Verificare che `dist/` sia creato
- [ ] Verificare che `dist/manifest.webmanifest` esista
- [ ] Verificare che `dist/sw.js` esista

## Durante il Deploy su Vercel

### 1. Importare Progetto

- [ ] Andare su vercel.com
- [ ] Cliccare "Add New Project"
- [ ] Importare `MyMoney` da GitHub
- [ ] Vercel rileva automaticamente Vite

### 2. Configurare Environment Variables

- [ ] Aggiungere `VITE_SUPABASE_URL`
- [ ] Aggiungere `VITE_SUPABASE_ANON_KEY`
- [ ] Aggiungere `VITE_APP_VERSION` (es: 1.14.0)
- [ ] Selezionare tutti gli environment (Production, Preview, Development)

### 3. Verificare Build Settings

- [ ] Framework: Vite
- [ ] Build Command: `pnpm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `pnpm install`

### 4. Deploy

- [ ] Cliccare "Deploy"
- [ ] Attendere completamento (2-3 minuti)
- [ ] Verificare che non ci siano errori

## Dopo il Deploy

### ✅ Configurare Supabase

- [ ] Andare su Supabase → Authentication → URL Configuration
- [ ] Aggiungere Site URL: `https://your-project.vercel.app`
- [ ] Aggiungere Redirect URL: `https://your-project.vercel.app/**`
- [ ] Salvare

### ✅ Test PWA su Desktop

- [ ] Aprire l'URL Vercel in Chrome
- [ ] Aprire DevTools (F12) → Application
- [ ] Verificare Service Worker registrato
- [ ] Verificare Manifest caricato (no errori)
- [ ] Verificare Icone caricate (no 404)
- [ ] Cliccare sull'icona di installazione
- [ ] Installare l'app
- [ ] Verificare che si apra in finestra standalone

### ✅ Test PWA su Mobile

#### iOS

- [ ] Aprire Safari
- [ ] Andare su URL Vercel
- [ ] Condividi → Aggiungi a Home
- [ ] Verificare icona sulla Home Screen
- [ ] Aprire l'app
- [ ] Verificare funzionamento

#### Android

- [ ] Aprire Chrome
- [ ] Andare su URL Vercel
- [ ] Verificare banner "Aggiungi a Home Screen"
- [ ] Oppure: Menu → Installa app
- [ ] Verificare installazione
- [ ] Aprire l'app
- [ ] Verificare funzionamento

### ✅ Test Funzionalità

- [ ] Login con Supabase funziona
- [ ] Creare una spesa
- [ ] Verificare sync con Supabase
- [ ] Creare una categoria
- [ ] Unirsi a un gruppo
- [ ] Creare spesa di gruppo
- [ ] Cambiare lingua (IT/EN)
- [ ] Attivare dark mode
- [ ] Verificare che tutto funziona

### ✅ Test Offline

- [ ] DevTools → Network → Offline
- [ ] Navigare nell'app
- [ ] Verificare che tutto funziona
- [ ] Creare una spesa offline
- [ ] Riattivare network
- [ ] Verificare sync automatico

### ✅ Test Aggiornamenti PWA

- [ ] Fare una modifica nel codice
- [ ] Commit e push su GitHub
- [ ] Vercel fa deploy automatico
- [ ] Aprire l'app già aperta
- [ ] Dopo ~30 secondi appare notifica
- [ ] Cliccare "Aggiorna Ora"
- [ ] Verificare ricaricamento
- [ ] Verificare nuova versione attiva

### ✅ Lighthouse Audit

- [ ] DevTools → Lighthouse
- [ ] Selezionare "Progressive Web App"
- [ ] Eseguire audit
- [ ] Verificare score:
  - Performance: 90+
  - Accessibility: 95+
  - Best Practices: 95+
  - SEO: 90+
  - PWA: 100

## Troubleshooting

### Se Service Worker non si registra

```javascript
// Console browser
navigator.serviceWorker.getRegistration().then(console.log);
```

### Se icone danno 404

- Verificare che `public/icons/` contenga i file
- Rebuild: `pnpm run build`
- Verificare `dist/icons/` dopo build
- Re-deploy su Vercel

### Se variabili ambiente non funzionano

- Verificare prefisso `VITE_` (obbligatorio!)
- Re-deploy dopo aver aggiunto variabili
- Controllare nella console: `import.meta.env.VITE_SUPABASE_URL`

### Se login non funziona

- Verificare URL in Supabase Authentication
- Verificare CORS in Supabase
- Controllare variabili ambiente su Vercel

## 🎉 Deploy Completato!

Una volta completata questa checklist, la tua app sarà:

- ✅ Live su Vercel con HTTPS
- ✅ PWA installabile su tutti i dispositivi
- ✅ Offline-first con Dexie + Service Worker
- ✅ Auto-update con notifiche eleganti
- ✅ CI/CD automatico da GitHub
- ✅ Pronta per la produzione!

---

**Prossimo step**: Condividi il link con gli utenti! 🚀
