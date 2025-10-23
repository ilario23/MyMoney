import { useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery } from "@/hooks/useQuery";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, X, Edit2, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import type { CategoryDocType } from "@/lib/db-schemas";
import { getDatabase } from "@/lib/db";

export function CategoriesPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "ShoppingCart",
    color: "#3B82F6",
    type: "expense" as "expense" | "income" | "investment",
    is_active: true,
  });

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

  // Get count of expenses for each category to determine if deletion is allowed
  const { data: expenseDocs } = useQuery(
    useCallback(
      (table: any) =>
        user
          ? table
              .where("user_id")
              .equals(user.id)
              .filter((exp: any) => !exp.deleted_at)
          : Promise.resolve([]),
      [user?.id]
    ),
    "expenses"
  );

  const resetForm = () => {
    setFormData({
      name: "",
      icon: "ShoppingCart",
      color: "#3B82F6",
      type: "expense",
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveCategory = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      if (editingId) {
        // Update existing
        await db.categories.update(editingId, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          type: formData.type,
          is_active: formData.is_active,
          updated_at: now,
        });
      } else {
        // Create new
        await db.categories.add({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          type: formData.type,
          is_active: true,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleEditCategory = (cat: CategoryDocType) => {
    setFormData({
      name: cat.name,
      icon: cat.icon,
      color: cat.color || "#3B82F6",
      type: cat.type,
      is_active: cat.is_active,
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleDeleteCategory = async (cat: CategoryDocType) => {
    // Count expenses using this category
    const expensesUsingCategory = expenseDocs.filter(
      (exp: any) => exp.category_id === cat.id && !exp.deleted_at
    ).length;

    if (expensesUsingCategory > 0) {
      alert(
        `Cannot delete category "${cat.name}": ${expensesUsingCategory} expense(s) are using it. Deactivate it instead.`
      );
      return;
    }

    if (
      confirm(`Delete category "${cat.name}"? This action cannot be undone.`)
    ) {
      try {
        const db = getDatabase();
        await db.categories.update(cat.id, {
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const renderCategoryIcon = (icon: string) => {
    const LucideIcons = require("lucide-react");
    const IconComponent = LucideIcons[icon];
    if (!IconComponent) {
      return <LucideIcons.HelpCircle className="w-5 h-5" />;
    }
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categorie</h1>
        <FloatingActionButton
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          label="Add category"
        />
      </div>

      {showForm && (
        <Card className="border-2 border-primary">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Category" : "New Category"}
              </h2>
              <button onClick={() => resetForm()}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "expense" })
                    }
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      formData.type === "expense"
                        ? "bg-destructive text-destructive-foreground shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      formData.type === "income"
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "investment" })
                    }
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      formData.type === "investment"
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Investment
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  placeholder="Es: Cibo, Trasporto..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <IconPicker
                value={formData.icon}
                onChange={(icon) => setFormData({ ...formData, icon })}
              />

              <div>
                <label className="text-sm font-medium mb-1 block">Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-16 h-10 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground self-center">
                    {formData.color}
                  </span>
                </div>
              </div>

              {editingId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active (show in form)
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveCategory}
                  className="flex-1"
                  disabled={!formData.name.trim()}
                >
                  {editingId ? "Update" : "Create"} Category
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resetForm()}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {categoryDocs.map((cat) => (
          <Card
            key={cat.id}
            className="hover:shadow-md transition-all group"
            style={{
              opacity: cat.is_active ? 1 : 0.6,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color || "#3B82F6" }}
                  >
                    {renderCategoryIcon(cat.icon)}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        {cat.type}
                      </span>
                      {!cat.is_active && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditCategory(cat)}
                    className="p-2 hover:bg-primary/15 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-primary" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-2 hover:bg-destructive/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {categoryDocs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories yet</p>
            <p className="text-sm text-muted-foreground">
              Create one to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
