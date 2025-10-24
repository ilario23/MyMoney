# 📊 Analisi Completa: Sistema Categorie

## 📋 Indice

1. [Cos'è una Categoria](#cosè-una-categoria)
2. [Struttura Dati](#struttura-dati)
3. [Relazione Categoria-Sovracategoria](#relazione-categoria-sovracategoria)
4. [Come Funziona nel Codice](#come-funziona-nel-codice)
5. [Esempi Pratici](#esempi-pratici)
6. [Operazioni CRUD](#operazioni-crud)

---

## 🎯 Cos'è una Categoria

Una **categoria** è un'etichetta che permette di **classificare e organizzare le transazioni** (spese, entrate, investimenti). Ad esempio:

- 🍕 **Cibo**
- 🚗 **Trasporto**
- 🎬 **Intrattenimento**
- 💼 **Lavoro**

### Tipi di Categorie

Ogni categoria ha un **tipo** specifico:

| Tipo           | Icona | Uso                | Colore Tipico   |
| -------------- | ----- | ------------------ | --------------- |
| **expense**    | 📉    | Spese in uscita    | Rosso (#FF6B6B) |
| **income**     | 📈    | Entrate in entrata | Verde (#51CF66) |
| **investment** | ⚡    | Investimenti       | Blu (#3B82F6)   |

---

## 🏗️ Struttura Dati

### Schema TypeScript (`db-schemas.ts`)

```typescript
export interface CategoryDocType {
  id: string; // UUID unico della categoria
  user_id: string; // ID dell'utente proprietario
  name: string; // Nome (es: "Cibo")
  icon: string; // Nome icona Lucide (es: "ShoppingCart")
  color?: string | null; // Colore hex (es: "#3B82F6")
  type: "expense" | "income" | "investment"; // Tipo di categoria

  // ⭐ CHIAVE PER LA GERARCHIA ⭐
  parent_id?: string | null; // ID della categoria genitore (se null = top-level)

  is_active: boolean; // true = visibile nel form, false = archiviata
  created_at: string; // Timestamp creazione
  updated_at: string; // Timestamp ultimo aggiornamento
  synced_at?: string | null; // Timestamp ultima sincronizzazione
  deleted_at?: string | null; // Timestamp eliminazione (soft delete)
}
```

### Schema SQL (Supabase)

```sql
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📌',
  color TEXT DEFAULT '#3B82F6',
  type TEXT CHECK (type IN ('expense', 'income', 'investment')),

  -- ⭐ IL CAMPO CRUCIALE PER LA GERARCHIA ⭐
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Indice per performance
  CONSTRAINT categories_name_user_unique UNIQUE (user_id, name)
);

-- Indici per query veloci
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_user_parent ON categories(user_id, parent_id);
```

---

## 🔗 Relazione Categoria-Sovracategoria

### Concetto Fondamentale

La relazione **genitore-figlio** tra categorie si implementa tramite il campo `parent_id`:

```
┌─────────────────────────────────────────────────────────┐
│         CATEGORIA GENITORE (parent_id = NULL)           │
│  Es: "Shopping" - Sovracategoria principale             │
└──────────────────────────┬────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼───────┐   ┌────────▼────────┐
        │ SOTTOCATEGORIA│   │ SOTTOCATEGORIA  │
        │ "Groceries"   │   │   "Clothing"    │
        │ (parent_id =  │   │  (parent_id =   │
        │ shopping_uuid)│   │  shopping_uuid) │
        └───────────────┘   └─────────────────┘
```

### Regole della Gerarchia

1. **Top-level (Categoria Principale)**
   - `parent_id = NULL` o `parent_id = undefined`
   - Es: "Shopping", "Trasporto", "Intrattenimento"
   - Visibili immediatamente nella UI

2. **Sottocategoria (Sub-category)**
   - `parent_id = <UUID della categoria genitore>`
   - Es: "Groceries" è sottocategoria di "Shopping"
   - Nidificate gerarchicamente

3. **Proprietà Importanti**
   - ✅ **Senza limite di profondità**: puoi nidificare N livelli (ma 2-3 consigliati)
   - ✅ **Stessa sovracategoria**: più figlie possono avere lo stesso parent
   - ✅ **Controllo riferimenti circolari**: l'app valida che `parent_id ≠ id` (impossibile essere padre di se stesso)
   - ✅ **Cascade delete**: quando elimini una categoria genitore, i figli diventano top-level (`ON DELETE SET NULL`)

---

## 💻 Come Funziona nel Codice

### 1️⃣ Pagina Categorie (`src/pages/categories.tsx`)

#### Query delle Categorie

```typescript
const { data: categoryDocs } = useQuery(
  useCallback(
    (table: any) =>
      user
        ? table
            .where("user_id")
            .equals(user.id)
            .filter((cat: CategoryDocType) => !cat.deleted_at)
        : Promise.resolve([]),
    [user?.id]
  ),
  "categories"
);
```

- Carica **tutte le categorie** dell'utente (sia parent che figli)
- Filtra quelle non eliminate (`!deleted_at`)
- La struttura gerarchica NON è renderizzata qui (è flat)

#### Gestione Form

```typescript
const [formData, setFormData] = useState({
  name: "",
  icon: "ShoppingCart",
  color: "#3B82F6",
  type: "expense",
  is_active: true,
  // ⚠️ NOTE: parent_id NON è in formData perché non è ancora implementato nel form UI
});
```

- **Attualmente**: il form NON permette di scegliere la categoria genitore
- **Possibile miglioramento**: aggiungere dropdown per selezionare parent_id

### 2️⃣ Componente Form Transazioni (`src/components/transaction/transaction-form.tsx`)

#### Funzione Cruciale: `getGroupedCategories()`

```typescript
const getGroupedCategories = () => {
  // Step 1: Filtra categorie attive dello stesso tipo
  const activeCategories = categories.filter(
    (c) => !c.deleted_at && c.type === type
  );

  // Step 2: Estrai solo quelle top-level (parent_id = null/undefined)
  const topLevel = activeCategories.filter((c) => !c.parent_id);

  // Step 3: Crea mappa {parent_id => [figli]} per raggruppamento
  const childrenMap = new Map<string, CategoryDocType[]>();

  activeCategories.forEach((cat) => {
    if (cat.parent_id) {
      // Se è una sottocategoria
      if (!childrenMap.has(cat.parent_id)) {
        childrenMap.set(cat.parent_id, []);
      }
      childrenMap.get(cat.parent_id)!.push(cat);
    }
  });

  return { topLevel, childrenMap };
};
```

**Cosa fa:**

- Separa categorie top-level da sottocategorie
- Raggruppa i figli per genitore
- Ritorna struttura gerarchica facile da renderizzare

#### Rendering nel Dropdown

```tsx
<SelectContent>
  {(() => {
    const { topLevel, childrenMap } = getGroupedCategories();

    return topLevel.map((parent) => {
      const children = childrenMap.get(parent.id) || [];

      return (
        <div key={parent.id}>
          {/* Categoria Genitore - NON indentata */}
          <SelectItem value={parent.id}>
            <span className="flex items-center gap-2">
              {renderIcon(parent.icon)} {parent.name}
            </span>
          </SelectItem>

          {/* Sottocategorie - INDENTATE (pl-8 = padding-left) */}
          {children.map((child) => (
            <SelectItem
              key={child.id}
              value={child.id}
              className="pl-8" // ← Indentazione visiva
            >
              <span className="flex items-center gap-2">
                {renderIcon(child.icon)} {child.name}
              </span>
            </SelectItem>
          ))}
        </div>
      );
    });
  })()}
</SelectContent>
```

**Risultato visivo nel dropdown:**

```
[ Shopping ]          ← Categoria genitore
        🛒 Groceries  ← Sottocategoria (indentata)
        👕 Clothing   ← Sottocategoria (indentata)
[ Transportation ]    ← Categoria genitore
        ⛽ Fuel       ← Sottocategoria (indentata)
        🚌 Public Transit ← Sottocategoria (indentata)
```

---

## 📝 Esempi Pratici

### Esempio 1: Struttura Gerarchica Completa

**Database:**

```sql
-- Categorie top-level (parent_id = NULL)
| ID           | Name           | parent_id | type    |
|---|---|---|---|
| abc-123      | Shopping       | NULL      | expense |
| def-456      | Transportation | NULL      | expense |
| ghi-789      | Income         | NULL      | income  |

-- Sottocategorie (parent_id = <parent UUID>)
| ID           | Name           | parent_id | type    |
|---|---|---|---|
| jkl-012      | Groceries      | abc-123   | expense |
| mno-345      | Clothing       | abc-123   | expense |
| pqr-678      | Fuel           | def-456   | expense |
| stu-901      | Salary         | ghi-789   | income  |
```

**Albero risultante:**

```
Shopping (abc-123)
├─ Groceries (jkl-012)
└─ Clothing (mno-345)

Transportation (def-456)
├─ Fuel (pqr-678)

Income (ghi-789)
├─ Salary (stu-901)
```

### Esempio 2: Query per Trovare Figlie di una Categoria

```typescript
// Trova tutte le sottocategorie di "Shopping"
const parentCategory = categories.find((c) => c.name === "Shopping");
const children = categories.filter((c) => c.parent_id === parentCategory.id);

// Risultato: [Groceries, Clothing]
```

### Esempio 3: Eliminazione a Cascata

```typescript
// Quando elimini "Shopping" (abc-123):
const parentCat = categories.find((c) => c.id === "abc-123");

// Le sottocategorie diventano top-level:
// Groceries: parent_id = abc-123 → parent_id = NULL
// Clothing: parent_id = abc-123 → parent_id = NULL

// Nel database SQL: ON DELETE SET NULL
```

---

## ⚙️ Operazioni CRUD

### CREATE (Creare una Categoria)

#### Top-level

```typescript
await db.categories.add({
  id: crypto.randomUUID(),
  user_id: user.id,
  name: "Shopping",
  icon: "ShoppingCart",
  color: "#3B82F6",
  type: "expense",
  parent_id: null, // ← Top-level
  is_active: true,
  created_at: now,
  updated_at: now,
});
```

#### Sottocategoria

```typescript
// ⚠️ ATTUALMENTE NON IMPLEMENTATO NEL FORM
// Ma tecnicamente possibile:

await db.categories.add({
  id: crypto.randomUUID(),
  user_id: user.id,
  name: "Groceries",
  icon: "Basket",
  color: "#51CF66",
  type: "expense",
  parent_id: "abc-123", // ← Figlio di "Shopping"
  is_active: true,
  created_at: now,
  updated_at: now,
});
```

### READ (Leggere Categorie)

```typescript
// Tutte le categorie dell'utente
const allCats = categories;

// Solo top-level
const topLevel = categories.filter((c) => !c.parent_id);

// Solo sottocategorie
const subCats = categories.filter((c) => c.parent_id);

// Figli di una specifica categoria
const children = categories.filter((c) => c.parent_id === parentId);

// Categorizzate gerarchicamente
const { topLevel, childrenMap } = getGroupedCategories();
```

### UPDATE (Modificare una Categoria)

```typescript
await db.categories.update(categoryId, {
  name: "New Name",
  icon: "NewIcon",
  color: "#FF6B6B",
  type: "income",
  is_active: false, // Archivia
  updated_at: new Date().toISOString(),
});

// ⚠️ PER SPOSTARE SOTTO ALTRA GENITORE (non implementato):
// parent_id: newParentId,
```

### DELETE (Eliminare una Categoria)

```typescript
// Soft delete (non elimina, marca come deleted)
await db.categories.update(categoryId, {
  deleted_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Verifiche prima dell'eliminazione:
// 1. Se usata in transazioni → errore
// 2. Se ha figli → i figli diventano top-level (ON DELETE SET NULL)
```

---

## 🎨 Visualizzazione Gerarchica nel Form

### Stato Attuale

```
[Select a category ▼]

Shopping
  ↳ Groceries
  ↳ Clothing

Transportation
  ↳ Fuel
  ↳ Public Transit

Investment
  ↳ Stocks
```

**Quando selezionata:**

- Puoi scegliere sia la categoria genitore che la sottocategoria
- Il `category_id` salvato nella transazione è sempre l'ID della categoria selezionata (genitore O figlio)

### Indentazione CSS

```tsx
// Top-level: nessun padding
<SelectItem value={parent.id}>...</SelectItem>

// Sottocategoria: pl-8 (padding-left: 2rem)
<SelectItem value={child.id} className="pl-8">...</SelectItem>
```

---

## 📌 Punti Chiave da Ricordare

| Aspetto           | Dettaglio                                                           |
| ----------------- | ------------------------------------------------------------------- |
| **Campo chiave**  | `parent_id`: NULL = top-level, UUID = sottocategoria                |
| **Unicità**       | Tra categorie di uno stesso utente: `UNIQUE(user_id, name)`         |
| **Gerarchia**     | Multi-livello, ma 2-3 livelli consigliati per UX                    |
| **Elimina padre** | Figli diventano top-level (ON DELETE SET NULL)                      |
| **Usa in form**   | `getGroupedCategories()` per separare e raggruppare                 |
| **Visibilità UI** | Indentazione con `className="pl-8"` per figli                       |
| **Transazioni**   | Puoi assegnare sia padre che figlio, NON la categoria "sovra-padre" |

---

## 🚀 Possibili Sviluppi Futuri

1. **UI per creare sottocategorie**
   - Aggiungere dropdown nel form categorie per scegliere parent_id
   - Validare circolarità (un genitore non può essere suo stesso figlio)

2. **Visualizzazione gerarchica nella pagina categorie**
   - Mostrare albero espandibile/collassabile
   - Icone di genitore/figlio differenti

3. **Filtri avanzati**
   - Filtrare transazioni per categoria genitore (include automaticamente tutti i figli)
   - Aggregare spese per genitore

4. **Import/Export con gerarchia**
   - Mantenere la struttura parent-child durante sincronizzazione
