# Aggiornamenti Sistema Filtri Spese

## Novità Implementate

### 1. **Dropdown Menu Categorie**

Le categorie sono ora in un dropdown menu collassabile invece di pulsanti singoli:

**Vantaggi:**

- Interfaccia più pulita e compatta
- Supporto per molte categorie senza overflow
- Indentazione visiva con checkbox
- Selezione multipla intuitiva
- Badge con le categorie selezionate (easy remove)

**Funzionamento:**

```tsx
// Click sul dropdown per aprire/chiudere
<button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
  "Seleziona categorie..." | "N categorie selezionate"
</button>

// Le categorie selezionate appaiono come badge
<Badge>{icon} {name} <X /></Badge>
```

### 2. **Bottone "Crea Filtro" / "Salva Filtro"**

Nuovo sistema per salvare le ricerche/filtri attuali:

**Funzionamento:**

1. Quando ci sono filtri attivi (`hasActiveFilters === true`)
2. Appare una nuova sezione in fondo al pannello
3. Input per il nome del filtro
4. Bottone "Salva" che chiama `onSaveFilter(filterName)`

**Storage:**

```typescript
// Salvataggio in localStorage
const savedFilter = {
  name: filterName, // Nome dato dall'utente
  filters: filters, // Stato completo dei filtri
  createdAt: new Date().toISOString(),
};

localStorage.setItem(
  "saved_filters",
  JSON.stringify([...savedFilters, newFilter])
);
```

**Implementazione in Expenses Page:**

```tsx
const handleSaveFilter = useCallback(
  (filterName: string) => {
    const savedFilter = {
      name: filterName,
      filters: filters,
      createdAt: new Date().toISOString(),
    };

    const savedFilters = JSON.parse(
      localStorage.getItem("saved_filters") || "[]"
    );
    savedFilters.push(savedFilter);
    localStorage.setItem("saved_filters", JSON.stringify(savedFilters));
  },
  [filters]
);

<ExpenseFilterPanel {...props} onSaveFilter={handleSaveFilter} />;
```

## UI Changes

### Categorie Dropdown

```
┌─────────────────────────────────────────┐
│ Categorie                               │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Seleziona categorie...           ▼ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [🍕 Alimentari ✕] [🚗 Trasporti ✕]    │
└─────────────────────────────────────────┘
```

### Dropdown Aperto

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ 2 categorie selezionate          ▲ │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ 🍕 Alimentari                  │ │
│ ├─────────────────────────────────────┤ │
│ │ ☐ 🚗 Trasporti                   │ │
│ ├─────────────────────────────────────┤ │
│ │ ☐ 💼 Lavoro                      │ │
│ └─────────────────────────────────────┘ │
```

### Save Filter Section (quando ci sono filtri attivi)

```
┌─────────────────────────────────────────┐
├─────────────────────────────────────────┤
│ Salva questo filtro                     │
│ ┌──────────────────────────────────────┐│
│ │ Nome filtro...                     ││
│ ├──────────────────────┬──────────────┤│
│ │                      │ 💾 Salva   ││
│ └──────────────────────┴──────────────┘│
└─────────────────────────────────────────┘
```

## Props Updates

### ExpenseFilterPanel

```typescript
interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  categories: Map<string, CategoryDocType>;
  onFilterChange: (key, value) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  onSaveFilter?: (filterName: string) => void; // 👈 NEW
}
```

## Next Steps / Possibili Estensioni

1. **Caricamento Filtri Salvati**
   - Dropdown con "Filtri Salvati"
   - Click per caricare filtro
   - Delete per rimuovere

2. **Sincronizzazione Dexie**
   - Spostare da localStorage a Dexie
   - Sincronizzare con Supabase
   - Accesso da qualsiasi device

3. **Condivisione Filtri**
   - Generare URL con filtri
   - Condividere link di ricerca
   - QR code per mobile

4. **Statistiche Filtri**
   - Tracciare filtri più usati
   - Suggerire filtri automatici
   - Analytics su ricerche frequenti

## Testing

```tsx
// Test 1: Dropdown categories
// - Click su "Seleziona categorie"
// - Verificare apertura dropdown
// - Selezionare una categoria
// - Verificare badge e numero

// Test 2: Save filter
// - Configurare alcuni filtri
// - Inserire nome filtro
// - Verificare salvatagggio in localStorage
// - Ricaricare pagina e verificare persistenza

// Test 3: Clear filter
// - Click X su badge categoria
// - Verificare rimozione dalla lista
```
