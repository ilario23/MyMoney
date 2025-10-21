# Category-Expense Relationship Visualization Guide

## Suggested Implementation Approaches

### 1. **Simple List with Aggregation** (Easy - Implement Now)

**Best for:** Quick overview, minimal UI complexity
**Location:** Dashboard or Categories page

```
🍕 Food
   └─ €245.50 • 12 expenses
      • Last purchase: 2 hours ago
      • Average: €20.46 per transaction

🚗 Transport
   └─ €156.00 • 8 expenses
      • Last purchase: 1 day ago
      • Average: €19.50 per transaction

🏠 Housing
   └─ €1,200.00 • 1 expense
      • Last purchase: 15 days ago
```

**Code approach:**

```typescript
const categoryStats = await Promise.all(
  categories.map(async (cat) => {
    const expensesInCat = await db.expenses
      .where("userId")
      .equals(userId)
      .filter((e) => e.category === cat.name)
      .toArray();

    return {
      ...cat,
      count: expensesInCat.length,
      total: expensesInCat.reduce((s, e) => s + e.amount, 0),
      average:
        expensesInCat.length > 0
          ? expensesInCat.reduce((s, e) => s + e.amount, 0) /
            expensesInCat.length
          : 0,
      lastUsed:
        expensesInCat.length > 0
          ? expensesInCat.reduce((latest, e) =>
              e.date > latest.date ? e : latest
            ).date
          : null,
    };
  })
);
```

---

### 2. **Expandable Category Cards** (Medium - Implement v1.3)

**Best for:** Detailed review, drill-down capability
**Location:** New "Analysis" section in Dashboard

```
┌─ 🍕 Food (€245.50 - 12 expenses) ─────────────┐
│                                                 │
│ Tap to expand ↓                                 │
└─────────────────────────────────────────────────┘

When expanded:
┌─ 🍕 Food (€245.50 - 12 expenses) ─────────────┐
│                                                 │
│ • Breakfast at Café        €5.50  • 2h ago    │
│ • Lunch delivery           €15.00 • 1d ago    │
│ • Groceries - Carrefour    €45.00 • 2d ago    │
│ • Dinner out              €25.00 • 3d ago    │
│ • Coffee & snacks         €3.50  • 4d ago    │
│ ─────────────────────────────────────────     │
│ Average: €20.46 | Trend: +12% vs last week    │
│                                                 │
│ [Edit Category] [Delete] [View All]           │
└─────────────────────────────────────────────────┘
```

**React component approach:**

```tsx
export function ExpandableCategoryCards() {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<
    Map<string, Expense[]>
  >(new Map());

  const toggleCategory = async (categoryId: string, categoryName: string) => {
    if (expanded.includes(categoryId)) {
      setExpanded(expanded.filter((id) => id !== categoryId));
    } else {
      // Load expenses for this category
      const expenses = await db.expenses
        .where("category")
        .equals(categoryName)
        .toArray();

      categoryExpenses.set(categoryId, expenses);
      setCategoryExpenses(new Map(categoryExpenses));
      setExpanded([...expanded, categoryId]);
    }
  };

  return categories.map((cat) => (
    <Card key={cat.id} className="cursor-pointer">
      <CardHeader
        onClick={() => toggleCategory(cat.id, cat.name)}
        className="flex-row justify-between items-center pb-3"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cat.icon}</span>
          <div>
            <p className="font-semibold">{cat.name}</p>
            <p className="text-sm text-muted-foreground">
              {categoryStats[cat.name]?.count} expenses
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">
            €{categoryStats[cat.name]?.total.toFixed(2)}
          </p>
          <ChevronDown
            className={`transform transition ${expanded.includes(cat.id) ? "rotate-180" : ""}`}
          />
        </div>
      </CardHeader>

      {expanded.includes(cat.id) && (
        <CardContent className="space-y-2 border-t pt-4">
          {categoryExpenses.get(cat.id)?.map((exp) => (
            <div
              key={exp.id}
              className="flex justify-between p-2 hover:bg-muted rounded"
            >
              <span className="text-sm">{exp.description}</span>
              <span className="text-sm font-medium">
                €{exp.amount.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(exp.date), { locale: it })}
              </span>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  ));
}
```

---

### 3. **Donut/Pie Chart** (Medium - Implement v1.3)

**Best for:** Visual breakdown, budget comparison
**Library:** `recharts` (lightweight, already npm-compatible)
**Location:** Dashboard or Statistics page

```
Visual representation:
         ╔═════════╗
         ║         ║
      ╱╱ ║ Food ║ ╲╲
    ╱╱   ║ 35% ║   ╲╲
   ║ Transport      ║
   ║   25%          ║
    ╲╲              ╱╱
     ╲╲ Other 40%  ╱╱
      ╲╲         ╱╱
         ╚═════════╝

🍕 Food: €245.50 (35%)
🚗 Transport: €175.25 (25%)
📦 Other: €280.00 (40%)
```

**Implementation:**

```tsx
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export function CategoryPieChart({ categories, expenses, userId }) {
  const data = categories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat.name);
    const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      name: `${cat.icon} ${cat.name}`,
      value: total,
      fill: cat.color,
      count: catExpenses.length,
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-background border border-border rounded p-2">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">€{payload[0].value.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">
          {Math.round((payload[0].value / total) * 100)}%
        </p>
      </div>
    );
  };

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} (€${value.toFixed(0)})`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

### 4. **Monthly Breakdown Bar Chart** (Hard - Implement v1.4)

**Best for:** Trend analysis, monthly patterns
**Location:** Dashboard Analytics section

```
€400 ┤
     ├─ ████ ████ ███
€300 ├─ ████ ████ ███
     ├─ ████ ████ ███
€200 ├─ ████ ████ ███
     ├─ ████ ████ ███
€100 ├─ ████ ████ ███
     ├─ ════ ════ ═══
  €0 └─ ──────────────
       Oct  Nov  Dec

Legend:
████ Food    ████ Transport    ████ Other
```

**Implementation:**

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function MonthlyCategoryChart({ expenses, categories }) {
  // Group expenses by month and category
  const monthlyData = {};

  expenses.forEach((exp) => {
    const monthKey = format(new Date(exp.date), "MMM");
    if (!monthlyData[monthKey]) monthlyData[monthKey] = {};

    if (!monthlyData[monthKey][exp.category]) {
      monthlyData[monthKey][exp.category] = 0;
    }
    monthlyData[monthKey][exp.category] += exp.amount;
  });

  const chartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    ...data,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
        <Legend />
        {categories.map((cat) => (
          <Bar key={cat.id} dataKey={cat.name} stackId="a" fill={cat.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

### 5. **Category Tags on Expense Items** (Easy - Enhance Now)

**Best for:** Quick visual association in lists
**Location:** Dashboard expense list, expense detail view

```
Recent Expenses:

[ 🍕 Food ] Breakfast at Café - €5.50
          2 hours ago • Dec 19, 2024

[ 🚗 Transport ] Taxi to airport - €25.00
                1 day ago • Dec 18, 2024

[ 📖 Education ] Online course - €49.99
               3 days ago • Dec 16, 2024
```

**React component:**

```tsx
export function ExpenseItem({ expense, category }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Badge className="text-lg px-3 py-1">{category.icon}</Badge>
        <div>
          <p className="font-medium">{expense.description}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistance(new Date(expense.date), new Date(), { locale: it })}{" "}
            ago
          </p>
        </div>
      </div>
      <p className="font-bold">€{expense.amount.toFixed(2)}</p>
    </div>
  );
}
```

---

### 6. **Search/Filter by Category** (Medium - Implement v1.3)

**Best for:** Finding related expenses
**Location:** Dashboard filter bar

```
🔍 [Filter...] [All] [🍕 Food] [🚗 Trans...] [🏠 Hous...]

Results: 12 expenses in Food category
```

**Implementation:**

```tsx
export function CategoryFilter({ categories, expenses, onFilter }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleFilter = (categoryName: string | null) => {
    setActiveCategory(categoryName);

    if (categoryName === null) {
      onFilter(expenses);
    } else {
      onFilter(expenses.filter((e) => e.category === categoryName));
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant={activeCategory === null ? "default" : "outline"}
        onClick={() => handleFilter(null)}
      >
        All
      </Button>

      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeCategory === cat.name ? "default" : "outline"}
          onClick={() => handleFilter(cat.name)}
          className="gap-2"
        >
          <span className="text-lg">{cat.icon}</span>
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
```

---

### 7. **Category Statistics Widget** (Medium - Implement v1.3)

**Best for:** At-a-glance metrics
**Location:** Dashboard header or sidebar

```
📊 Category Stats

Top Spender: 🍕 Food (€245.50)
Growth: 🚗 Transport (+15% vs last month)
Biggest Jump: 🎬 Entertainment (+€50)
```

**Implementation:**

```tsx
export function CategoryStatsWidget({ expenses, categories }) {
  const stats = {
    topCategory: null,
    maxGrowth: null,
    biggest: null,
  };

  // Calculate top spending
  const byCategory = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  stats.topCategory = Object.entries(byCategory).sort(
    ([, a], [, b]) => b - a
  )[0];

  return (
    <div className="grid grid-cols-3 gap-2">
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Top Category</p>
          <p className="text-2xl font-bold">
            {categories.find((c) => c.name === stats.topCategory?.[0])?.icon}
          </p>
          <p className="text-sm">€{stats.topCategory?.[1].toFixed(2)}</p>
        </CardContent>
      </Card>
      {/* Similar cards... */}
    </div>
  );
}
```

---

## 🎨 UI/UX Recommendations

### Color Coding

- Assign each category a color (already in schema)
- Use consistently across all visualizations
- Ensure WCAG AA contrast ratio for accessibility

### Icon Usage

- Use emoji icons for quick visual scanning
- Display icon + name for clarity
- Size: 16px for lists, 24px for cards, 32px for charts

### Performance Considerations

- **Lazy load** chart libraries when needed
- **Memoize** category statistics calculations
- **Debounce** filter/search operations
- **Paginate** if 100+ expenses per category

### Mobile Optimization

- Stack charts vertically
- Use horizontal scroll for bar charts
- Touch-friendly filter buttons (min 44x44px)
- Collapsible sections for dense data

---

## 📱 Implementation Priority by Feature

| Level  | Feature          | Complexity | Time | v1.x   |
| ------ | ---------------- | ---------- | ---- | ------ |
| ⭐     | List with stats  | Easy       | 1h   | 1.2 ✅ |
| ⭐     | Expandable cards | Medium     | 2h   | 1.3    |
| ⭐     | Pie chart        | Medium     | 2h   | 1.3    |
| ⭐     | Filter/search    | Medium     | 1.5h | 1.3    |
| ⭐⭐   | Bar chart        | Hard       | 3h   | 1.4    |
| ⭐⭐   | Trends           | Hard       | 2.5h | 1.4    |
| ⭐⭐⭐ | Budget alerts    | Very Hard  | 4h   | 2.0    |

---

## Next Action

**Recommended v1.3 roadmap:**

1. Add category statistics to Categories page
2. Implement pie chart in new Dashboard Analytics section
3. Add category filter buttons to expense list
4. Expand category cards with recent expenses
