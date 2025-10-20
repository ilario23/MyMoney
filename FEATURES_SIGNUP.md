# 📝 Signup Page - Documentation

## Overview

La pagina di **Signup** (`src/pages/signup.tsx`) permette ai nuovi utenti di creare un account e iniziare a tracciare le loro spese.

## Features

✅ **Validazione Form**

- Email valida richiesta
- Password minimo 6 caratteri
- Conferma password match
- Nome display minimo 2 caratteri
- Feedback errori in tempo reale

✅ **Creazione Account**

- Registrazione su Supabase Auth
- Salvataggio metadati user (display_name)
- Creazione record nella tabella `users` (Dexie)

✅ **Categorie Default**

- Creazione automatica di 8 categorie al signup:
  - 🍕 Cibo
  - 🚗 Trasporto
  - 🏠 Casa
  - 🎬 Intrattenimento
  - 💊 Salute
  - 🛍️ Shopping
  - ⚡ Utilità
  - 📌 Altro

✅ **UX Improvements**

- Alert di successo con feedback visivo
- Disabilitazione form durante registrazione
- Redirect automatico a dashboard dopo signup
- Link al login per utenti che hanno già account

✅ **ShadCN Components**

- `Button` - Submit button con loading state
- `Input` - Email, password, confirm password, display name fields
- `Card` + `CardContent` + `CardHeader` + `CardTitle` + `CardDescription` - Layout principale
- `Alert` + `AlertDescription` - Error e success messages

## Component Structure

```typescript
SignupPage
├── State Management
│   ├── email
│   ├── password
│   ├── confirmPassword
│   ├── displayName
│   ├── isLoading
│   ├── error
│   └── success
├── Form Validation
│   └── validateForm() - Controlla tutti i campi
├── Form Submission
│   └── handleSignup() - Registra utente e categorie
└── UI Components
    ├── Header (Logo + Title)
    ├── Card
    │   ├── Form Fields
    │   │   ├── Display Name Input
    │   │   ├── Email Input
    │   │   ├── Password Input
    │   │   ├── Confirm Password Input
    │   │   └── Alert (Error/Success)
    │   ├── Submit Button
    │   └── Login Link
    └── Features Grid
```

## Data Flow

```
User Input
    ↓
Form Validation
    ↓
Supabase Auth SignUp
    ↓
Create User in Dexie (local DB)
    ↓
Create Default Categories (8x)
    ↓
Auto-login + Redirect to Dashboard
```

## Form Fields

### Display Name

- **Type**: Text input
- **Placeholder**: "Mario Rossi"
- **Validation**: Min 2 characters
- **Required**: Yes

### Email

- **Type**: Email input
- **Placeholder**: "email@example.com"
- **Validation**: Valid email format
- **Required**: Yes

### Password

- **Type**: Password input
- **Placeholder**: "••••••••"
- **Validation**: Min 6 characters
- **Hint**: "Almeno 6 caratteri"
- **Required**: Yes

### Confirm Password

- **Type**: Password input
- **Placeholder**: "••••••••"
- **Validation**: Must match password field
- **Required**: Yes

## Error Handling

```typescript
// All field required
"Compila tutti i campi";

// Password mismatch
"Le password non coincidono";

// Password too short
"La password deve avere almeno 6 caratteri";

// Name too short
"Il nome deve avere almeno 2 caratteri";

// Generic signup error
// Mostra il messaggio di errore da Supabase
// (es. "Email already registered")

// Fallback error
"Si è verificato un errore. Riprova.";
```

## Default Categories Created

Ogni nuovo utente riceve automaticamente 8 categorie:

| Icon | Name            | Color   | Usage                    |
| ---- | --------------- | ------- | ------------------------ |
| 🍕   | Cibo            | #EF4444 | Alimenti, ristoranti     |
| 🚗   | Trasporto       | #F97316 | Benzina, mezzi pubblici  |
| 🏠   | Casa            | #EAB308 | Affitto, utenze          |
| 🎬   | Intrattenimento | #8B5CF6 | Cinema, concerti         |
| 💊   | Salute          | #EC4899 | Farmacia, visite mediche |
| 🛍️   | Shopping        | #06B6D4 | Abbigliamento, gadget    |
| ⚡   | Utilità         | #3B82F6 | Vari servizi             |
| 📌   | Altro           | #6B7280 | Categoria di fallback    |

**Marcate come**: `isSynced: false` (sincronizzeranno con Supabase al primo sync)

## Success Flow

1. ✅ Form validated
2. ✅ Supabase Auth account created
3. ✅ User record saved in Dexie
4. ✅ 8 default categories created in Dexie
5. ✅ Success alert shown for 1.5s
6. ✅ Auto-login via `setUser()`
7. ✅ Redirect to `/dashboard`

## Styling

- **Background**: Gradient (primary/10 → secondary/10)
- **Card**: Max width 448px (md), responsive on mobile
- **Colors**: Uses Tailwind CSS variables (light/dark compatible)
- **Responsive**: Full mobile support, optimized for small screens

## Routes

- **Public Route**: `/signup`
- **Redirect After Signup**: `/dashboard`
- **Login Link**: `/login`

## Integration Points

- **Supabase**: `supabase.auth.signUp()`
- **Dexie**: `db.users.add()`, `db.categories.add()`
- **Zustand**: `useAuthStore().setUser()`
- **React Router**: `useNavigate()`

## Testing Checklist

- [ ] Valid email format accepted
- [ ] Invalid email rejected with error
- [ ] Password < 6 chars rejected
- [ ] Passwords don't match rejected
- [ ] Name < 2 chars rejected
- [ ] All fields required checked
- [ ] Success message shown
- [ ] Redirects to dashboard after signup
- [ ] 8 default categories created (check Dexie DevTools)
- [ ] User record in Dexie verified
- [ ] Login link works
- [ ] Duplicate email shows Supabase error
- [ ] Form disabled during signup
- [ ] Error alerts styled correctly
- [ ] Mobile responsive checked

## Example Usage

```typescript
// Typical signup flow:
// 1. User fills form
// 2. Clicks "Registrati"
// 3. handleSignup() called
// 4. Validation passes
// 5. Supabase signup succeeds
// 6. User + categories saved locally
// 7. Success alert shown
// 8. After 1.5s auto-redirect to /dashboard
// 9. User sees dashboard with their data ready
```

## Related Files

- `src/pages/login.tsx` - Login page
- `src/lib/auth.store.ts` - Auth state management
- `src/lib/dexie.ts` - Database schema
- `src/router.tsx` - Route configuration
- `src/pages/dashboard.tsx` - Dashboard page

## Notes

- ✅ Uses ShadCN UI components throughout
- ✅ Type-safe with TypeScript
- ✅ Accessibility friendly
- ✅ Dark mode support
- ✅ Mobile-first design
- ✅ Zero external dependencies beyond existing packages

---

**Version**: 1.0.0  
**Last Updated**: October 20, 2025
