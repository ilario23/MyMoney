# UI Update - Filtri e Spese

## Modifiche Implementate

### 1. **Filtri in Modal/Drawer** 🎨

Il pannello filtri ora si apre in un drawer laterale (mobile) o overlay, non più come accordion inline.

**Prima:**

```
┌────────────────────────────────────┐
│ Spese    [FAB]                     │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│ ▼ Filtri                      Attivo│  ← Click per aprire
│ (contenuto nascosto)                │
└────────────────────────────────────┘
│ Spesa 1
│ Spesa 2
```

**Ora:**

```
┌────────────────────────────────────┐
│ Spese    [🎚] [FAB]                │  ← Icona filtri
└────────────────────────────────────┘
             ┌─────────────────────┐
             │ Filtri         ✕   │ (Mobile)
             │ ┌─────────────────┐ │
             │ │ Ricerca         │ │
             │ │ Tipo            │ │
             │ │ Categorie       │ │
             │ │ ... più campi   │ │
             │ └─────────────────┘ │
             └─────────────────────┘

│ Spesa 1
│ Spesa 2
```

**Vantaggi:**

- ✅ Icona intuitiva (Sliders)
- ✅ Contenuto sempre visible nel drawer
- ✅ Su mobile: drawer full-screen con overlay
- ✅ Su desktop: responsive, può essere inline
- ✅ No accordion logic - contenuto sempre visibile

**Implementazione:**

```tsx
const [showFilters, setShowFilters] = useState(false);

// Header con icona filtri
<button
  onClick={() => setShowFilters(!showFilters)}
  className="p-2 hover:bg-muted rounded-lg"
>
  <Sliders className="w-5 h-5" />
</button>;

// Modal/Drawer
{
  showFilters && (
    <div className="fixed inset-0 z-40 bg-black/50 md:static">
      {/* Contenuto filtri sempre visible */}
      <ExpenseFilterPanel {...props} />
    </div>
  );
}
```

### 2. **Spese con Ombra Colorata** 💎

Le spese non hanno più background colorato. Usano solo ombra del colore corretto.

**Prima (colorato):**

```
┌─────────────────────────────────┐
│ [Expense] Pizza              📤   │ bg-destructive/10 ← Color di fondo
│ 🍕 Cibo                         │
│ Alimentari • 23 ott 2025        │
│                         -15.50€ │
└─────────────────────────────────┘
```

**Ora (ombra sola):**

```
┌─────────────────────────────────┐
│ [Expense] Pizza              📤   │ Shadow red
│ 🍕 Cibo                         │
│ Alimentari • 23 ott 2025        │
│                         -15.50€ │
└─────────────────────────────────┘
  ↓↓↓ shadow-destructive/20 ↓↓↓
```

**Implementazione:**

```typescript
const getTypeStyle = (type: "expense" | "income" | "investment") => {
  switch (type) {
    case "expense":
      return {
        shadowColor: "shadow-destructive/20",  // ← Solo ombra
        textColor: "text-destructive",
        amountColor: "text-destructive",
        badgeColor: "bg-destructive/10 text-destructive",
        icon: "📤",
      };
    // ...
  }
};

// Uso
<div className={`${typeStyle.shadowColor} shadow-md rounded-lg p-4`}>
  {/* Contenuto */}
</div>
```

**Colori Ombra per Tipo:**
| Tipo | Colore | Shadow |
|------|--------|--------|
| **Expense** | Rosso (destructive) | shadow-destructive/20 |
| **Income** | Verde (primary) | shadow-primary/20 |
| **Investment** | Viola/Accent | shadow-accent/20 |

## File Modificati

### `src/pages/expenses.tsx`

- ✅ Aggiunto stato `showFilters`
- ✅ Icona filtri con Sliders icon
- ✅ Drawer/Modal per filtri
- ✅ Modificato `getTypeStyle` per usare shadow
- ✅ Aggiunto overlay per chiudere drawer

### `src/components/expense/expense-filters.tsx`

- ✅ Rimosso accordion (isExpanded)
- ✅ Contenuto sempre visible
- ✅ Header semplice con title e result count
- ✅ Rimosso Card import

## UX Improvements

1. **Interfaccia Pulita**
   - Niente accordion visivo
   - Filtri occupano spazio solo quando aperto
   - Design più minimalista

2. **Mobile Friendly**
   - Drawer full-screen con overlay
   - Easy to dismiss (click overlay o icona X)
   - Header sticky

3. **Desktop Responsive**
   - Drawer laterale
   - Integrato naturalmente

4. **Spese Meno "Rumorose"**
   - Ombra sottile anziché background pieno
   - Conserva il colore senza appesantire
   - Tipografia più leggibile

## Testing Checklist

- [ ] Click icona filtri apre/chiude drawer
- [ ] Overlay su mobile
- [ ] Click overlay chiude drawer
- [ ] Filtri applicati mentre drawer aperto
- [ ] Spese hanno ombra corretta (non background)
- [ ] Badge mantiene il colore chiaro
- [ ] Importo ha colore corretto
- [ ] Build senza errori

## Possibili Estensioni

1. **Animazioni**
   - Slide-in animation per drawer
   - Fade-in/out per overlay

2. **Persistenza**
   - Ricordare stato filtri aperto/chiuso

3. **Gestures (Mobile)**
   - Swipe down per chiudere
   - Momentum scroll

4. **Accessibility**
   - Focus trap nel drawer
   - ESC per chiudere
   - ARIA labels
