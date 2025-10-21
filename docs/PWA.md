# PWA (Progressive Web App) - Gestione e Configurazione

## 📱 Panoramica

ExpenseTracker è configurato come una Progressive Web App (PWA) completa, che consente agli utenti di installare l'app sul proprio dispositivo e utilizzarla offline.

## 🎯 Funzionalità Principali

### 1. **Notifiche di Aggiornamento**
- Sistema automatico di rilevamento nuove versioni
- Notifica elegante che appare quando è disponibile un aggiornamento
- L'utente può scegliere quando aggiornare (non forzato)

### 2. **Offline First**
- Cache intelligente delle risorse statiche
- Cache delle API Supabase (5 minuti)
- Cache delle immagini (30 giorni)
- Funzionamento completo offline con IndexedDB

### 3. **Installabile**
- Prompt di installazione su mobile e desktop
- Icone ottimizzate per diverse piattaforme
- Esperienza standalone (senza barra del browser)

## 🛠️ Architettura

### File Chiave

#### 1. `vite.config.ts`
Configurazione principale della PWA:
- **registerType: 'prompt'** - Notifica l'utente di nuovi aggiornamenti invece di aggiornarsi automaticamente
- **Solo in produzione** - PWA disabilitata in development per facilitare il debug
- **Workbox** - Service worker con strategie di caching avanzate
- **Manifest** - Configurazione dell'app (nome, icone, colori, ecc.)

```typescript
VitePWA({
  registerType: "prompt", // Notifica invece di auto-update
  filename: "sw.js",
  devOptions: {
    enabled: false, // Disabilitato in development
  }
})
```

#### 2. `src/lib/pwa.ts`
Utility per la gestione del Service Worker:
- `registerSW()` - Registra il service worker e imposta i listener
- `checkForUpdates()` - Controlla manualmente per nuovi aggiornamenti
- `clearAllCaches()` - Pulisce tutte le cache (usato al logout)
- `getAppVersion()` - Restituisce la versione dell'app

#### 3. `src/hooks/usePWAUpdate.ts`
Hook React per gestire lo stato degli aggiornamenti:
- `needRefresh` - True quando è disponibile un aggiornamento
- `offlineReady` - True quando l'app è pronta per l'offline
- `updateSW()` - Applica l'aggiornamento (ricarica la pagina)
- `checkForUpdates()` - Trigger manuale per controllare aggiornamenti
- `lastChecked` - Timestamp dell'ultimo controllo
- `error` - Eventuali errori durante il processo

#### 4. `src/components/layout/pwa-update-prompt.tsx`
Componente UI per notificare l'utente:
- Card elegante che appare in basso a destra
- Colori diversi per update/offline/error
- Pulsanti: "Update Now", "Retry", "Dismiss"
- Supporto dark mode
- Traduzioni i18n complete

## 🔄 Flusso di Aggiornamento

```
1. Utente visita l'app
   ↓
2. Service Worker controlla per aggiornamenti
   ↓
3. Se trovato, registra "updatefound" event
   ↓
4. Event listener in pwa.ts intercetta l'evento
   ↓
5. Dispatch evento custom "vite-plugin-pwa:update-found"
   ↓
6. usePWAUpdate hook setta needRefresh = true
   ↓
7. PWAUpdatePrompt mostra la notifica
   ↓
8. Utente clicca "Update Now"
   ↓
9. updateSW() ricarica la pagina
   ↓
10. Nuova versione attiva! ✅
```

## ⚙️ Strategie di Caching

### Network First (API Supabase)
```typescript
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
  handler: "NetworkFirst",
  options: {
    cacheName: "supabase-api-cache",
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 5 * 60, // 5 minuti
    },
    networkTimeoutSeconds: 10,
  },
}
```
- Prova prima la rete (timeout 10s)
- Se fallisce, usa la cache
- Cache di max 50 richieste per 5 minuti

### Cache First (Immagini)
```typescript
{
  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  handler: "CacheFirst",
  options: {
    cacheName: "images-cache",
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 giorni
    },
  },
}
```
- Prova prima la cache
- Se non trovata, scarica dalla rete
- Cache di max 50 immagini per 30 giorni

## 📝 Manifest PWA

```json
{
  "name": "ExpenseTracker - Gestione Spese",
  "short_name": "ExpenseTracker",
  "description": "Gestisci le tue spese personali e condivise con facilità",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "categories": ["finance", "productivity"],
  "lang": "it"
}
```

### Icone
Utilizzano SVG inline con emoji 💰 per evitare file di immagine separati.

## 🧪 Testing

### Development
```bash
pnpm run dev
```
- PWA disabilitata per evitare caching durante lo sviluppo
- Hot Module Replacement funziona normalmente

### Production Build
```bash
pnpm run build
pnpm run preview
```
- PWA completamente abilitata
- Service Worker generato automaticamente
- Testare su mobile per vedere l'installazione

### Test Installazione
1. Apri l'app in Chrome/Edge
2. Vai su Menu → "Installa ExpenseTracker"
3. L'app si aprirà come app standalone
4. Icona aggiunta alla home screen / desktop

### Test Aggiornamenti
1. Fai una build e deploya
2. Modifica qualcosa nel codice
3. Fai un'altra build e deploya
4. Apri l'app già aperta in un tab
5. Dopo qualche secondo, appare la notifica di aggiornamento

### Test Offline
1. Apri l'app online
2. Attendi il caricamento completo
3. Attiva "Offline" nelle DevTools (Network tab)
4. Naviga nell'app
5. Dovrebbe funzionare completamente offline grazie a Dexie + cache

## 🚀 Deployment

### Vercel / Netlify
Nessuna configurazione aggiuntiva necessaria. Il Service Worker viene servito automaticamente.

### Custom Server
Assicurati che:
- `sw.js` sia servito con `Content-Type: application/javascript`
- HTTPS sia abilitato (obbligatorio per Service Workers)
- `manifest.webmanifest` sia accessibile

## 🔍 Debug

### Chrome DevTools
1. Apri DevTools (F12)
2. Tab "Application"
3. Sezione "Service Workers"
   - Vedi lo stato del SW
   - Forza l'update
   - Unregister per ripartire da zero
4. Sezione "Cache Storage"
   - Ispeziona cosa è cachato
   - Cancella singole cache

### Console Commands
```javascript
// Check service worker status
navigator.serviceWorker.getRegistration().then(reg => console.log(reg));

// Force update check
navigator.serviceWorker.getRegistration().then(reg => reg.update());

// Unregister service worker
navigator.serviceWorker.getRegistration().then(reg => reg.unregister());

// Clear all caches
caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))));
```

## 📚 Risorse

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🎨 Personalizzazione

### Cambiare le Icone
Modifica `vite.config.ts` → `manifest.icons`:
```typescript
icons: [
  {
    src: "/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
  },
  // ...altre icone
]
```

### Cambiare Strategia di Caching
Modifica `vite.config.ts` → `workbox.runtimeCaching`:
```typescript
{
  urlPattern: /your-pattern/,
  handler: "CacheFirst", // o "NetworkFirst", "StaleWhileRevalidate"
  options: { /* ... */ }
}
```

### Disabilitare Notifiche di Update
Cambia `registerType` in `vite.config.ts`:
```typescript
VitePWA({
  registerType: "autoUpdate", // Auto-update senza notifica
  // ...
})
```

## ⚠️ Note Importanti

1. **HTTPS Obbligatorio**: Service Workers funzionano solo su HTTPS (eccetto localhost)
2. **Cache Persistente**: Le cache rimangono anche dopo la chiusura del browser
3. **Pulizia al Logout**: La funzione di logout pulisce tutte le cache
4. **Version Control**: Ogni build genera un nuovo hash, forzando l'update
5. **Controlli Periodici**: L'app controlla per aggiornamenti ogni 30 minuti

## 🆚 Differenze Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Service Worker | ❌ Disabilitato | ✅ Abilitato |
| Caching | ❌ No cache | ✅ Cache completa |
| PWA Prompt | ❌ Non mostrato | ✅ Mostrato |
| Update Notifications | ❌ No | ✅ Sì |
| Hot Reload | ✅ Funzionante | ❌ N/A |

Questo permette uno sviluppo fluido senza i problemi di caching, mantenendo tutte le funzionalità PWA in produzione.
