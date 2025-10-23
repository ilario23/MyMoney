# Sistema di Filtri Spese - Documentazione

## Panoramica

Sistema completo e shadcn-friendly di filtri per le spese con logica centralizzata e UI intuitiva.

## Componenti

### 1. **Hook `useExpenseFilters`** (`src/hooks/useExpenseFilters.ts`)

Hook custom che gestisce tutta la logica di filtro e ordinamento.

#### Interfaccia `ExpenseFilters`

```typescript
interface ExpenseFilters {
  searchQuery: string; // Ricerca per descrizione, categoria, importo
  selectedCategories: string[]; // IDs delle categorie selezionate
  selectedTypes: Array<"expense" | "income" | "investment">; // Tipi di transazione
  dateFrom?: string; // Data inizio (ISO format)
  dateTo?: string; // Data fine (ISO format)
  minAmount?: number; // Importo minimo
  maxAmount?: number; // Importo massimo
  sortBy: "date" | "amount" | "category"; // Campo ordinamento
  sortOrder: "asc" | "desc"; // Direzione ordinamento
}
```

#### Hook API

```typescript
const {
  filters, // Stato corrente dei filtri
  updateFilter, // (key, value) => Aggiorna un singolo filtro
  resetFilters, // () => Ripristina filtri di default
  hasActiveFilters, // boolean - Se ci sono filtri attivi
  filteredExpenses, // ExpenseDocType[] - Spese filtrate e ordinate
} = useExpenseFilters(expenses, categories);
```

#### Logica di Filtro (ordine di applicazione)

1. **Ricerca testo**: descrizione, nome categoria, importo
2. **Categorie**: filtra solo spese delle categorie selezionate
3. **Tipi**: filtra solo i tipi di transazione selezionati
4. **Data inizio**: >= dateFrom
5. **Data fine**: < dateTo (fine giornata)
6. **Importo minimo**: >= minAmount
7. **Importo massimo**: <= maxAmount
8. **Ordinamento**: per data, importo o categoria (asc/desc)

### 2. **Componente `ExpenseFilterPanel`** (`src/components/expense/expense-filters.tsx`)

Interfaccia UI per i filtri con layout collassabile.

#### Props

```typescript
interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  categories: Map<string, CategoryDocType>;
  onFilterChange: (key: keyof ExpenseFilters, value: any) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
}
```

#### Caratteristiche

- **Header collassabile**: Espandi/contrai i filtri con badge "Attivo"
- **Ricerca**: Input con clear button
- **Filtri tipo**: Pulsanti per Spesa, Entrata, Investimento
- **Filtri categoria**: Lista scrollabile con checkbox visuale
- **Range date**: Input da/a con validazione fine giornata
- **Range importo**: Min/Max con step 0.01€
- **Ordinamento**: Select sortBy + bottoni ASC/DESC
- **Reset**: Pulsante per ripristinare tutti i filtri

### 3. **Integrazione in `ExpensesPage`** (`src/pages/expenses.tsx`)

#### Utilizzo

```tsx
// Hook per filtri
const { filters, updateFilter, resetFilters, hasActiveFilters, filteredExpenses } =
  useExpenseFilters(expenseDocs, categories);

// Componente UI
<ExpenseFilterPanel
  filters={filters}
  categories={categories}
  onFilterChange={updateFilter}
  onReset={resetFilters}
  hasActiveFilters={hasActiveFilters}
  resultCount={filteredExpenses.length}
/>

// Uso risultati
{filteredExpenses.map(expense => (
  // Renderizza spesa
))}
```

## Design Patterns

### Filtri Indipendenti

Ogni filtro è indipendente e può essere modificato senza effetti collaterali:

```tsx
// Aggiorna ricerca
updateFilter("searchQuery", "pizza");

// Aggiungi categoria (non resetta ricerca)
updateFilter("selectedCategories", [...categories, newId]);

// Cambia ordinamento
updateFilter("sortBy", "amount");
```

### Reset Selettivo

Puoi resettare solo specifici filtri:

```tsx
// Resetta tutto
resetFilters();

// Resetta ricerca
updateFilter("searchQuery", "");

// Resetta categorie
updateFilter("selectedCategories", []);
```

### Indicatore Filtri Attivi

L'hook rileva automaticamente se ci sono filtri attivi (esclude default):

```tsx
hasActiveFilters; // true se searchQuery, categorie, tipi, date o importi attivi
```

## Esempi di Utilizzo

### Ricerca avanzata

```tsx
// Spese di "pizza" dal 01/01/2025 al 31/01/2025
updateFilter("searchQuery", "pizza");
updateFilter("dateFrom", "2025-01-01");
updateFilter("dateTo", "2025-01-31");
updateFilter("sortBy", "date");
updateFilter("sortOrder", "desc");
```

### Filtrare per categoria

```tsx
// Solo alimentari e trasporti
updateFilter("selectedCategories", [
  categoryAlimentari.id,
  categoryTrasporti.id,
]);
```

### Filtrare per tipo

```tsx
// Solo entrate
updateFilter("selectedTypes", ["income"]);
```

### Range importo

```tsx
// Spese tra 10€ e 100€
updateFilter("minAmount", 10);
updateFilter("maxAmount", 100);
```

## Ottimizzazioni

### Performance

- **Memoization**: Hook usa `useMemo` per evitare re-calcoli
- **Filtering sequenziale**: I filtri sono applicati in ordine efficienti
- **Sorting ottimizzato**: Usa `localeCompare` per stringhe

### UI

- **Collapsible panel**: Riduce clutter della pagina
- **Live filtering**: Aggiorna risultati in tempo reale
- **Visual feedback**: Badge "Attivo", checkmark su categorie

## Estensioni Future

Possibili miglioramenti:

1. **Filtri salvati**: Salva combinazioni di filtri preferite
2. **Esportazione**: Esporta risultati filtrati (CSV, PDF)
3. **Filtri avanzati**: Operatori logici (AND/OR)
4. **Statistiche**: Somma, media, conteggio dei risultati
5. **Preset**: Filtri predefiniti (Questo mese, Ultimo mese, Anno)
