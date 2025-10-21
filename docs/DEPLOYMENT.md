# 🚀 Deployment su Vercel - Guida Completa

## 📋 Pre-requisiti

- [x] Account Vercel (vercel.com)
- [x] Repository GitHub connesso
- [x] Variabili ambiente Supabase

## 🎨 Step 1: Generare le Icone PWA

### Metodo Automatico (Consigliato)

1. Apri `generate-icons.html` nel browser
2. Clicca "Generate All Icons"
3. Scarica tutte le icone (pulsante per ogni size o "Download All")
4. Crea la cartella `public/icons/`
5. Salva tutte le icone nella cartella

### Icone Richieste

```
public/icons/
├── icon-48x48.png
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-192x192.png
├── icon-256x256.png
├── icon-384x384.png
└── icon-512x512.png
```

### Metodo Manuale (Alternativo)

Se preferisci usare icone custom:

1. Crea un'immagine 512x512px
2. Usa uno strumento come [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
3. Oppure usa servizi online come [RealFaviconGenerator](https://realfavicongenerator.net/)

## ⚙️ Step 2: Configurare Vercel

### 2.1 - Primo Deploy

1. Vai su [vercel.com](https://vercel.com)
2. Clicca "Add New Project"
3. Importa il repository GitHub `MyMoney`
4. Vercel rileva automaticamente Vite
5. **NON cliccare ancora su "Deploy"**

### 2.2 - Configurare Environment Variables

Prima del deploy, aggiungi le variabili ambiente:

#### Variabili Richieste

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_VERSION=1.14.0
```

**Come trovarle in Supabase:**

1. Vai su [supabase.com](https://supabase.com)
2. Seleziona il tuo progetto
3. Settings → API
4. Copia `Project URL` → `VITE_SUPABASE_URL`
5. Copia `anon` key → `VITE_SUPABASE_ANON_KEY`

**Su Vercel:**

1. Nella pagina di configurazione del progetto
2. Sezione "Environment Variables"
3. Aggiungi le 3 variabili (usa "Add" per ognuna)
4. Seleziona tutti gli environment: Production, Preview, Development

### 2.3 - Build Settings (Auto-configurato)

Vercel dovrebbe rilevare automaticamente:

- **Framework**: Vite
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

Se non rilevato, configurali manualmente.

### 2.4 - Deploy

1. Clicca "Deploy"
2. Attendi 2-3 minuti
3. ✅ App online!

## 🔗 Step 3: Configurare il Dominio

### Dominio Custom (Opzionale)

1. Vai su Project Settings → Domains
2. Aggiungi il tuo dominio
3. Configura i record DNS come indicato
4. Attendi propagazione (10-30 minuti)

### URL Vercel (Default)

Il tuo progetto sarà disponibile su:

```
https://your-project-name.vercel.app
```

## 🔐 Step 4: Configurare Supabase per Vercel

### 4.1 - Aggiornare Redirect URLs

1. Vai su Supabase → Authentication → URL Configuration
2. Aggiungi in **Site URL**:
   ```
   https://your-project-name.vercel.app
   ```
3. Aggiungi in **Redirect URLs**:
   ```
   https://your-project-name.vercel.app/**
   http://localhost:5173/**
   ```

### 4.2 - CORS Configuration

Le chiamate API dovrebbero funzionare automaticamente, ma se hai problemi:

1. Vai su Project Settings → API
2. Verifica che l'URL sia nella whitelist

## 📱 Step 5: Testare la PWA

### Test su Desktop

1. Apri Chrome/Edge
2. Vai su `https://your-project-name.vercel.app`
3. Apri DevTools (F12) → Application tab
4. Controlla:
   - ✅ Service Worker registrato
   - ✅ Manifest caricato
   - ✅ Icone presenti
5. Clicca sull'icona di installazione nella barra URL
6. "Install ExpenseTracker"
7. L'app si apre in una finestra standalone

### Test su Mobile

#### iOS (Safari)

1. Apri Safari
2. Vai su `https://your-project-name.vercel.app`
3. Tap sul pulsante Condividi (□ con freccia)
4. Scorri e tap "Aggiungi a Home"
5. L'icona appare nella Home Screen
6. Tap per aprire come app nativa

#### Android (Chrome)

1. Apri Chrome
2. Vai su `https://your-project-name.vercel.app`
3. Apparirà un banner "Aggiungi a Home Screen"
4. Oppure: Menu (⋮) → "Installa app"
5. L'app si installa come app nativa

## 🧪 Step 6: Testare gli Aggiornamenti PWA

### Simulare un Aggiornamento

1. **Prima versione deployata** ✅
2. Fai una modifica (es. cambia un testo)
3. Commit e push su GitHub
4. Vercel fa il deploy automatico
5. Apri l'app già aperta in un tab
6. Dopo ~30 secondi appare la notifica:
   ```
   📥 Nuova versione disponibile
   ExpenseTracker ha un aggiornamento disponibile.
   Clicca "Aggiorna Ora" per installarlo.
   ```
7. Clicca "Aggiorna Ora"
8. La pagina ricarica con la nuova versione

## 🔍 Step 7: Verificare tutto funziona

### Checklist Finale

- [ ] **PWA installabile** - Badge di installazione appare
- [ ] **Service Worker attivo** - Controlla DevTools
- [ ] **Icone caricate** - Nessun errore 404 per icon-\*.png
- [ ] **Manifest valido** - DevTools → Application → Manifest
- [ ] **Login funziona** - Puoi loggarti con Supabase
- [ ] **Dati sincronizzati** - Le spese si salvano
- [ ] **Offline funziona** - Disabilita network, l'app funziona
- [ ] **Notifiche update** - Simula un nuovo deploy
- [ ] **Dark mode** - Il tema si applica correttamente
- [ ] **Traduzioni** - IT/EN funzionano

### Lighthouse Audit

1. Apri Chrome DevTools
2. Tab "Lighthouse"
3. Seleziona "Progressive Web App"
4. Clicca "Analyze page load"
5. Dovresti avere 90+ su tutte le metriche

Target:

- ✅ Performance: 90+
- ✅ Accessibility: 95+
- ✅ Best Practices: 95+
- ✅ SEO: 90+
- ✅ PWA: 100 (badge installable)

## 🐛 Troubleshooting

### Service Worker non si registra

```javascript
// Controlla nella console
navigator.serviceWorker.getRegistration().then((reg) => {
  console.log("SW:", reg);
  if (reg) reg.update();
});
```

### Icone non si caricano (404)

1. Verifica che le icone siano in `public/icons/`
2. Rebuild locale: `pnpm run build`
3. Controlla che `dist/icons/` contenga i file
4. Re-deploy su Vercel

### Variabili ambiente non funzionano

1. Vercel → Project Settings → Environment Variables
2. Verifica nomi esatti: `VITE_SUPABASE_URL` (non `SUPABASE_URL`)
3. Re-deploy dopo aver aggiunto variabili
4. Controlla che `VITE_` prefix sia presente

### Login non funziona

1. Controlla URL in Supabase Authentication
2. Verifica `VITE_SUPABASE_ANON_KEY` sia corretto
3. Controlla CORS in Supabase

### Cache problematiche

```javascript
// Pulisci tutte le cache
caches
  .keys()
  .then((names) => Promise.all(names.map((name) => caches.delete(name))));

// Unregister service worker
navigator.serviceWorker.getRegistration().then((reg) => reg.unregister());
```

## 🔄 Continuous Deployment

### Auto-Deploy configurato! ✅

Ogni push su GitHub trigger un nuovo deploy:

1. **Push su `dev` branch** → Deploy su Preview URL
2. **Push su `main` branch** → Deploy su Production URL
3. **Pull Request** → Deploy su URL temporaneo

### Versioning

Aggiorna `package.json` → `version`:

```json
{
  "version": "1.14.0"
}
```

E la variabile `VITE_APP_VERSION` su Vercel.

## 📊 Monitoring

### Vercel Analytics

1. Vai su Project → Analytics
2. Vedi traffico, performance, errori
3. Real-time visitors
4. Bottlenecks e slow pages

### Supabase Logs

1. Vai su Supabase → Logs
2. Vedi query SQL, errors, auth events
3. Monitora RLS policy violations

## 🎉 Deploy Completato!

La tua app è ora:

- ✅ **Live** su Vercel
- ✅ **PWA** installabile
- ✅ **Offline-first** con Dexie + SW
- ✅ **Auto-update** con notifiche
- ✅ **CI/CD** automatico da GitHub
- ✅ **Sicura** con HTTPS e RLS policies
- ✅ **Scalabile** con Vercel Edge Network

## 📞 Supporto

- [Vercel Docs](https://vercel.com/docs)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Supabase Docs](https://supabase.com/docs)

---

**Made with ❤️ by ExpenseTracker Team**
