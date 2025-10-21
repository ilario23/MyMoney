# Quick Reference: Category Management v1.2

## 📍 File Map

| File                                      | Purpose                       | Key Changes                        |
| ----------------------------------------- | ----------------------------- | ---------------------------------- |
| `src/pages/categories.tsx`                | **NEW** - Full CRUD interface | Complete category management       |
| `src/components/expense/expense-form.tsx` | **MODIFIED** - Expense form   | Removed inline creator, simplified |
| `src/pages/profile.tsx`                   | **MODIFIED** - Profile page   | Added category management link     |
| `src/router.tsx`                          | **MODIFIED** - Routes         | Added `/categories` route          |

## 🔗 User Navigation

```
Dashboard
  └─ Profile Button (Nav bar)
      └─ Profile Page
          └─ "🏷️ Modifica Categorie" Card
              └─ Categories Page (CRUD interface)
```

## 💾 Database Schema Reference

### Categories Table

```typescript
interface Category {
  id: string; // UUID
  userId: string; // FK User.id
  name: string; // "Food", "Transport"
  icon: string; // Emoji: "🍕"
  color: string; // Hex: "#EF4444"
  isSynced: boolean; // Sync flag
  createdAt: Date; // ISO timestamp
  updatedAt: Date; // ISO timestamp
}
```

### Dexie Index

- Primary: `id`
- Secondary: `userId` (for queries)

## 🎯 API Reference

### Load Categories

```typescript
const categories = await db.categories
  .where("userId")
  .equals(user.id)
  .toArray();
```

### Create Category

```typescript
await db.categories.add({
  id: uuidv4(),
  userId: user.id,
  name: categoryName,
  icon: selectedIcon,
  color: selectedColor,
  isSynced: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Update Category

```typescript
const updated = await db.categories.get(categoryId);
updated.name = newName;
updated.icon = newIcon;
updated.color = newColor;
updated.updatedAt = new Date();
updated.isSynced = false;
await db.categories.put(updated);
```

### Delete Category

```typescript
// First check if used:
const isUsed = expenses.some((e) => e.category === categoryToDelete.name);

if (!isUsed) {
  await db.categories.delete(categoryId);
}
```

## 🎨 Component Props

### CategoriesPage

No props required - uses auth store and Dexie internally

```typescript
export function CategoriesPage() {
  const { user } = useAuthStore(); // Gets user context
  const [categories, setCategories] = useState<Category[]>([]);
  // ... full state management
}
```

## 🎪 UI Elements

### Icon Picker (16 options)

```typescript
const CATEGORY_ICONS = [
  "🍕",
  "🚗",
  "🏠",
  "🎬",
  "💊",
  "🛍️",
  "⚡",
  "📌",
  "🎮",
  "📚",
  "✈️",
  "🎵",
  "⚽",
  "🎨",
  "📖",
  "🍎",
];
```

### Color Palette (8 colors)

```typescript
const CATEGORY_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6B7280", // Gray
];
```

## ⚡ Key Features Checklist

### Create

- [x] Dialog with title & description
- [x] Name input (min 2 chars)
- [x] Icon picker (16 options)
- [x] Color picker (8 options)
- [x] Validation (no duplicates)
- [x] Success message

### Read

- [x] Card grid layout
- [x] Icon + color display
- [x] Sync status badge
- [x] Stats summary (top card)
- [x] Empty state message

### Update

- [x] Edit mode (inline on card)
- [x] Save/Cancel buttons
- [x] Validation on save
- [x] Success message

### Delete

- [x] Confirmation dialog
- [x] Usage validation (no delete if used)
- [x] Error message if used
- [x] Success on delete

## 🔄 Sync Workflow

### Category Sync Status

```
isSynced = false  → Show "Non sincronizzata" badge
isSynced = true   → Show "Sincronizzata" badge
```

### Sync Service Integration

- Categories marked `isSynced: false` on create/update
- SyncService batch uploads to Supabase
- On success, marks `isSynced: true`
- Next sync pull merges remote changes

## 🧪 Testing Checklist

### Manual QA

- [ ] Create category with all icon/color combos
- [ ] Update all fields of a category
- [ ] Try to delete used category (should error)
- [ ] Delete unused category
- [ ] Verify categories appear in ExpenseForm
- [ ] Check sync status badges update
- [ ] Test offline mode (sync pending)
- [ ] Verify categories sync to Supabase

### Edge Cases

- [ ] Very long category names
- [ ] Duplicate names (different cases)
- [ ] Delete then create same name
- [ ] Rapid create/update/delete
- [ ] Form validation errors

## 📱 Mobile Optimization

✅ **Responsive Layout**

- Card grid: 1 col mobile, 2 cols tablet, 3 cols desktop
- Buttons: Full width on mobile, inline on desktop
- Dialog: Full screen on mobile, centered on desktop

✅ **Touch Friendly**

- Buttons: 44×44px minimum
- Icon picker: 48×48px buttons
- Color picker: 48×48px buttons

✅ **Performance**

- Lazy load Dexie queries
- Memoized category stats
- No infinite scrolling (pagination ready)

## 🐛 Troubleshooting

### Categories not showing in form

```
Check:
1. User is authenticated (user !== null)
2. Categories exist in Dexie for this userId
3. No filter removing them from list
```

### Delete button disabled

```
Check:
1. Category is used in expenses
2. expense.category === category.name
3. Validate matching case and spacing
```

### Sync not working

```
Check:
1. User is online
2. Supabase connection valid
3. SyncService running in background
4. Check browser console for errors
```

## 🚀 Performance Tips

### Query Optimization

```typescript
// Good ✅ - Uses index
const cats = await db.categories.where("userId").equals(userId).toArray();

// Slow ❌ - Full table scan
const cats = await db.categories.toArray();
```

### Caching

```typescript
// Load once, reuse in component
const categories = useMemo(
  () => db.categories.where("userId").equals(userId),
  [userId]
);
```

## 📚 Related Documentation

- **CATEGORIES_v1.2.md** - Full architecture + 8 viz ideas
- **CATEGORY_VISUALIZATION_GUIDE.md** - 7 visualization approaches
- **v1.2_RELEASE_SUMMARY.md** - Complete release notes

## 🔮 v1.3 Preview

Looking at the visualization suggestions:

1. **Category Statistics** - Add totalExpenses per category
2. **Pie Chart** - Visual breakdown using recharts
3. **Filter/Search** - Filter expenses by category
4. **Expandable Cards** - Click to see recent expenses

All have code examples in the guides!

---

**Last Updated:** December 2024
**Version:** v1.2.0
**Status:** Production Ready ✅
