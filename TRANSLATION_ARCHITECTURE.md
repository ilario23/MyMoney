# Translation Architecture - i18n System

## 📁 Struttura File

```
src/
├── translations/
│   ├── index.ts        # Esportazione centrale di tutte le traduzioni
│   ├── it.ts          # Traduzioni italiane (file master)
│   ├── en.ts          # Traduzioni inglesi
│   └── [future].ts    # Lingue future (es, fr, de, etc.)
│
└── lib/
    └── language.tsx    # Context provider e hook useLanguage()
```

## 🏗️ Architettura

### 1. **File di Traduzione Separati**

Ogni lingua ha il proprio file dedicato:

**`src/translations/it.ts`** (Master file con type definitions)

```typescript
export const it = {
  "profile.title": "Profilo",
  "dashboard.welcome": "Benvenuto",
  // ... altre chiavi
} as const;

export type TranslationKey = keyof typeof it;
```

**`src/translations/en.ts`** (Importa il type dal file italiano)

```typescript
import { type TranslationKey } from "./it";

export const en: Record<TranslationKey, string> = {
  "profile.title": "Profile",
  "dashboard.welcome": "Welcome",
  // ... deve avere TUTTE le stesse chiavi di `it`
};
```

### 2. **Index Centrale**

**`src/translations/index.ts`**

```typescript
import { it, type TranslationKey } from "./it";
import { en } from "./en";

export type { TranslationKey };

export const translations = {
  it,
  en,
} as const;

export type Language = keyof typeof translations;
```

### 3. **Language Provider**

**`src/lib/language.tsx`**

```typescript
import {
  translations,
  type Language,
  type TranslationKey,
} from "@/translations";

// Context + Hook
export function useLanguage() {
  const { language, setLanguage, t } = useContext(LanguageContext);
  return { language, setLanguage, t };
}
```

## 🎯 Convenzioni di Naming

### Pattern delle Chiavi

```
<sezione>.<chiave>

Esempi:
- profile.title
- dashboard.welcome
- expense.addExpense
- common.save
- nav.dashboard
- auth.login
```

### Sezioni Principali

```typescript
profile.*      // Pagina profilo
dashboard.*    // Dashboard
expense.*      // Form spese
categories.*   // Gestione categorie
common.*       // Elementi comuni (bottoni, stati, etc.)
nav.*          // Navigazione
auth.*         // Autenticazione
```

## ✅ Type Safety

### Autocomplete e Type Checking

Grazie a TypeScript, ottieni:

1. **Autocomplete** quando usi `t()`:

   ```typescript
   const { t } = useLanguage();

   // ✅ Autocomplete delle chiavi disponibili
   t("profile.title"); // OK
   t("dashboard.welcome"); // OK
   t("invalid.key"); // ❌ Errore TypeScript
   ```

2. **Validazione a Compile Time**:
   - Se aggiungi una chiave in `it.ts`, TypeScript richiederà la stessa in `en.ts`
   - Se rimuovi una chiave, TypeScript segnalerà tutti i punti dove viene usata

3. **Type Inference**:
   ```typescript
   // TranslationKey è automaticamente il tipo di tutte le chiavi
   type Keys = TranslationKey;
   // = 'profile.title' | 'dashboard.welcome' | ...
   ```

## 🔄 Come Aggiungere una Nuova Traduzione

### Step 1: Aggiungi in `it.ts`

```typescript
export const it = {
  // ... esistenti
  "mySection.newKey": "Nuovo Testo Italiano",
} as const;
```

### Step 2: TypeScript richiederà l'aggiunta in `en.ts`

```typescript
export const en: Record<TranslationKey, string> = {
  // ... esistenti
  "mySection.newKey": "New English Text", // ✅ Obbligatorio
};
```

### Step 3: Usa nel componente

```typescript
function MyComponent() {
  const { t } = useLanguage();

  return <h1>{t('mySection.newKey')}</h1>;
}
```

## 🌍 Come Aggiungere una Nuova Lingua

### Step 1: Crea file lingua (es. `es.ts` per Spagnolo)

```typescript
// src/translations/es.ts
import { type TranslationKey } from "./it";

export const es: Record<TranslationKey, string> = {
  "profile.title": "Perfil",
  "dashboard.welcome": "Bienvenido",
  // ... tutte le altre chiavi
};
```

### Step 2: Aggiorna `index.ts`

```typescript
import { es } from "./es";

export const translations = {
  it,
  en,
  es, // ✅ Nuova lingua
} as const;
```

### Step 3: Aggiorna UI selector

```typescript
<SelectContent>
  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
  <SelectItem value="en">🇬🇧 English</SelectItem>
  <SelectItem value="es">🇪🇸 Español</SelectItem> {/* Nuovo */}
</SelectContent>
```

## 📦 Best Practices

### 1. **File Italiano come Master**

- `it.ts` definisce il `TranslationKey` type
- Tutte le altre lingue devono implementare questo type
- Garantisce sincronizzazione forzata

### 2. **Raggruppa per Sezione**

```typescript
// ✅ BUONO
{
  'profile.title': '...',
  'profile.name': '...',
  'profile.email': '...',
}

// ❌ EVITA
{
  'titleProfile': '...',
  'profileName': '...',
  'emailForProfile': '...',
}
```

### 3. **Chiavi Descrittive**

```typescript
// ✅ BUONO
'expense.addExpense': 'Aggiungi Spesa'
'common.save': 'Salva'

// ❌ EVITA
'exp.add': 'Aggiungi Spesa'
'btn1': 'Salva'
```

### 4. **Interpolazione Stringhe**

Per variabili dinamiche:

```typescript
// Traduzione
'categories.confirmDelete': 'Sei sicuro di voler eliminare "{name}"?'

// Uso
const message = t('categories.confirmDelete').replace('{name}', category.name);
```

### 5. **Pluralizzazione**

```typescript
// Semplice
'expense.count': '{count} spese'

// Con logica
const expenseText = count === 1
  ? t('expense.single')
  : t('expense.multiple').replace('{count}', String(count));
```

## 🚀 Migrazione a i18next (Futuro)

Se in futuro vuoi migrare a `i18next`:

1. Struttura compatibile:

   ```typescript
   // Attuale
   translations = { it: {...}, en: {...} }

   // i18next
   i18n.addResourceBundle('it', 'translation', it);
   i18n.addResourceBundle('en', 'translation', en);
   ```

2. Refactoring minimo:
   - Mantieni i file `it.ts`, `en.ts`
   - Cambia solo `language.tsx` per usare `i18next`
   - Le chiavi rimangono identiche

## 📊 Coverage Attuale

```
Profile Page:    44 chiavi ✅
Categories:      25 chiavi ✅
Dashboard:        9 chiavi ✅
Expense Form:    15 chiavi ✅
Common:           8 chiavi ✅
Navigation:       5 chiavi ✅
Auth:             7 chiavi ✅

TOTALE:         113 chiavi
```

## 🔍 Debugging

### Chiave Mancante

Se una chiave non esiste, viene restituita la chiave stessa:

```typescript
t("invalid.key"); // Returns: 'invalid.key'
```

### Verifica Sincronizzazione

TypeScript ti avviserà se:

- `en.ts` manca una chiave presente in `it.ts`
- Usi una chiave non esistente con `t()`

### Console Log Lingua Attiva

```typescript
const { language } = useLanguage();
console.log("Current language:", language); // 'it' | 'en'
```

## 💡 Quando Usare vs Non Usare i18next

### ✅ Usa Sistema Attuale Se:

- Progetto piccolo/medio (< 500 traduzioni)
- Solo 2-3 lingue
- Traduzioni statiche
- Vuoi pieno controllo TypeScript
- Bundle size è critico

### ✅ Migra a i18next Se:

- Progetto grande (> 500 traduzioni)
- Molte lingue (> 5)
- Pluralizzazione complessa
- Interpolazione avanzata
- Traduzioni dinamiche/lazy loading
- Necessità di strumenti esterni (Lokalise, Crowdin, etc.)

## 📝 Checklist Nuova Traduzione

- [ ] Aggiungi chiave in `it.ts`
- [ ] TypeScript richiede chiave in `en.ts` → aggiungi
- [ ] Sostituisci stringa hardcoded con `t('chiave')`
- [ ] Testa cambio lingua
- [ ] Verifica build (`pnpm run build`)
- [ ] Commit con messaggio descrittivo

---

**Conclusione**: Questa architettura offre type safety completo, scalabilità per più lingue, e facilità di manutenzione, mantenendo il bundle leggero senza dipendenze esterne.
