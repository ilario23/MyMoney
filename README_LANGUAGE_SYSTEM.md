# Language System Documentation

## 📝 Overview

The application now includes a complete **multi-language (i18n) system** with support for:

- 🇮🇹 **Italian (it)** - Default/Primary
- 🇬🇧 **English (en)** - Secondary

## 🏗️ Architecture

### Core Files

**`src/lib/language.tsx`**

- **Purpose**: Language context and translation system
- **Exports**:
  - `LanguageProvider`: React context provider
  - `useLanguage()`: Hook to access language & translation function
  - `Language` type: 'it' | 'en'
  - `translations` object: All language strings

**`src/App.tsx`**

- Wraps `AppRoutes` with `LanguageProvider`
- Initializes language system on app startup

**`src/pages/profile.tsx`**

- Language selector dropdown added to Profile page
- Uses `useLanguage()` hook to get/set language preference

## 🔄 How It Works

### 1. Initialization

```
App loads
  ↓
LanguageProvider checks localStorage for saved language
  ↓
If not found, checks browser locale (navigator.language)
  ↓
Defaults to 'it' if browser locale is not 'en'
  ↓
Sets HTML lang attribute for accessibility
```

### 2. Persistence

```
User selects language in Profile
  ↓
setLanguage() called
  ↓
LanguageProvider saves to localStorage key: 'app-language'
  ↓
useEffect updates document.documentElement.lang
  ↓
Component re-renders with new language
```

### 3. Translation Function

```typescript
const { t } = useLanguage();
const text = t("profile.title"); // Returns translated string
// If key doesn't exist, returns the key itself as fallback
```

## 🎯 Usage Guide

### For Component Developers

**1. Add translations to `src/lib/language.tsx`:**

```typescript
export const translations = {
  it: {
    "profile.title": "Profilo",
    "profile.logout": "Esci",
    // ... more Italian translations
  },
  en: {
    "profile.title": "Profile",
    "profile.logout": "Logout",
    // ... more English translations
  },
};
```

**2. Use in your component:**

```typescript
import { useLanguage } from '@/lib/language';

export function MyComponent() {
  const { language, t } = useLanguage();

  return (
    <div>
      <h1>{t('profile.title')}</h1>
      <p>Current language: {language}</p>
    </div>
  );
}
```

**3. For language-specific logic:**

```typescript
const { language } = useLanguage();

if (language === "it") {
  // Italian-specific behavior
} else if (language === "en") {
  // English-specific behavior
}
```

## 📋 Translation Keys Structure

### Profile Page Keys

All profile-related translations use `profile.*` prefix:

```
profile.title                    - Page title
profile.editProfile              - Edit button text
profile.name                     - Name field label
profile.email                    - Email field label
profile.statistics               - Statistics section title
profile.expenses                 - Expenses metric label
profile.totalAmount              - Total amount label
profile.categories               - Categories section title
profile.editCategories           - Edit categories button
profile.account                  - Account section title
profile.language                 - Language section title
profile.selectLanguage           - Language select description
profile.languageUpdated          - Success message on language change
profile.profileUpdated           - Success message on profile update
profile.nameCannotBeEmpty        - Error message for empty name
profile.errorUpdatingProfile     - Error message for update failure
profile.anErrorOccurred          - Generic error message
profile.dataDeleted              - Success message for data deletion
profile.dataExported             - Success message for data export
```

## 🎨 Language Selector UI

Located in Profile Page:

```
┌─ 🌍 Lingua ──────────────────────┐
│ Seleziona la tua lingua preferita │
│                                   │
│ [Dropdown: 🇮🇹 Italiano | 🇬🇧 English] │
│                                   │
│ ✓ Lingua aggiornata con successo! │
└─────────────────────────────────────┘
```

## 📱 Browser Locale Detection

The system automatically detects browser language:

```typescript
const browserLang = navigator.language.startsWith("en") ? "en" : "it";
// Examples:
// navigator.language = 'en-US'  → 'en'
// navigator.language = 'it-IT'  → 'it'
// navigator.language = 'fr-FR'  → 'it' (default)
```

## 💾 LocalStorage

**Key:** `app-language`
**Value:** `'it'` or `'en'`
**Persistence:** Survives page reloads

```javascript
// Manual retrieval if needed:
const savedLanguage = localStorage.getItem("app-language");
// Returns: 'it', 'en', or null if never saved
```

## 🌐 HTML Lang Attribute

The `<html lang>` attribute is updated automatically for:

- **SEO**: Search engines know the page language
- **Accessibility**: Screen readers use correct language
- **CSS**: Can style based on language (e.g., `html:lang(en)`)

```html
<!-- Italian -->
<html lang="it">
  <!-- English -->
  <html lang="en"></html>
</html>
```

## 🔮 Future Enhancement Ideas

### 1. Add More Languages

```typescript
// Add to translations object:
export const translations = {
  // ... existing languages
  es: { /* Spanish translations */ },
  fr: { /* French translations */ },
  de: { /* German translations */ },
};

// Add to language selector:
<SelectItem value="es">🇪🇸 Español</SelectItem>
```

### 2. Implement Translation Management System

- Database-backed translations (Supabase)
- Admin panel to manage translations
- Community translation contributions

### 3. Add Language-Specific Formatting

```typescript
interface LanguageContextType {
  // ... existing
  formatNumber: (num: number) => string;
  formatCurrency: (num: number) => string;
  formatDate: (date: Date) => string;
}

// Usage:
const { formatCurrency } = useLanguage();
console.log(formatCurrency(100)); // "€100,00" (IT) or "$100.00" (EN)
```

### 4. Add RTL (Right-to-Left) Support

```typescript
export const rtlLanguages = ["ar", "he", "fa"];

const isRTL = rtlLanguages.includes(language);
document.documentElement.dir = isRTL ? "rtl" : "ltr";
```

### 5. Pluralization Support

```typescript
const { tn } = useLanguage(); // "tn" = translate with number
tn("expense.count", 5); // "5 spese" (IT) or "5 expenses" (EN)
```

## 🧪 Testing the Language System

### Manual QA Checklist

- [ ] Open app first time → Detects browser language correctly
- [ ] Change language in Profile → Immediately reflects change
- [ ] Reload page → Language preference persists
- [ ] Verify localStorage contains 'app-language' key
- [ ] Check HTML element has correct `lang` attribute
- [ ] Switch between IT/EN multiple times
- [ ] Verify all UI text changes (currently only Profile page)

### Code Quality

- [ ] All translation keys in `translations` object
- [ ] No hardcoded text in components (use `t()` function)
- [ ] Type safety: `Language` type enforced
- [ ] No console errors/warnings

## 📦 Current Implementation Status

### Completed

✅ LanguageProvider created
✅ Translations object (profile.\* keys)
✅ useLanguage() hook
✅ Language selector in Profile page
✅ Browser locale detection
✅ LocalStorage persistence
✅ HTML lang attribute update

### In Progress

⏳ Extend translations to other pages
⏳ Use translations in more components

### Future

🔮 Dashboard page translations
🔮 Categories page translations
🔮 Expense form translations
🔮 Navigation translations
🔮 Login/Signup page translations

## 🐛 Troubleshooting

### Language not persisting

```
Check:
1. Browser localStorage is enabled
2. localStorage key is 'app-language'
3. Value is 'it' or 'en'
4. No errors in console
```

### HTML lang attribute not updating

```
Check:
1. document.documentElement exists
2. Language changed triggered useEffect
3. Check DOM: <html lang="it">
```

### Translations not showing

```
Check:
1. Key exists in translations object
2. useLanguage() hook called inside Provider
3. Component re-renders after language change
4. Key spelling matches exactly (case-sensitive)
```

## 📚 File References

- **src/lib/language.tsx** - Core language system (110+ lines)
- **src/App.tsx** - LanguageProvider wrapper
- **src/pages/profile.tsx** - Language selector implementation
- **README_LANGUAGE_SYSTEM.md** - This documentation

---

**Version**: v1.0
**Last Updated**: December 2024
**Status**: Production Ready ✅
