import { useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { useQuery } from "@/hooks/useQuery";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, TrendingDown, TrendingUp, Zap, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import type { CategoryDocType } from "@/lib/db-schemas";
import { getDatabase } from "@/lib/db";
import { syncService } from "@/services/sync.service";
import { syncLogger } from "@/lib/logger";

export function CategoriesPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
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

  // Get count of transactions for each category to determine if deletion is allowed
  const { data: transactionDocs } = useQuery(
    useCallback(
      (table: any) =>
        user
          ? table
              .where("user_id")
              .equals(user.id)
              .filter((trx: any) => !trx.deleted_at)
          : Promise.resolve([]),
      [user?.id]
    ),
    "transactions"
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

      syncLogger.success("Category saved locally - syncing with server");

      // Mark that local data has changed (CRUD operation)
      syncService.markLocalChangesAsChanged();

      // Trigger background sync if online (don't wait for it)
      if (syncService.isAppOnline()) {
        syncService.syncAfterChange(user.id).catch((error) => {
          syncLogger.error("Background sync error:", error);
        });
      } else {
        syncLogger.info("Offline - data saved locally, will sync when online");
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
    // Count transactions using this category
    const transactionsUsingCategory = transactionDocs.filter(
      (trx: any) => trx.category_id === cat.id && !trx.deleted_at
    ).length;

    if (transactionsUsingCategory > 0) {
      alert(
        `Cannot delete category "${cat.name}": ${transactionsUsingCategory} transaction(s) are using it. Deactivate it instead.`
      );
      return;
    }

    if (
      confirm(t("categories.deleteConfirmMessage").replace("{name}", cat.name))
    ) {
      try {
        const db = getDatabase();
        await db.categories.update(cat.id, {
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        syncLogger.success("Category deleted locally - syncing with server");

        // Mark that local data has changed (CRUD operation)
        syncService.markLocalChangesAsChanged();

        // Trigger background sync if online (don't wait for it)
        if (user && syncService.isAppOnline()) {
          syncService.syncAfterChange(user.id).catch((error) => {
            syncLogger.error("Background sync error:", error);
          });
        } else {
          syncLogger.info(
            "Offline - data saved locally, will sync when online"
          );
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const renderCategoryIcon = (icon: string) => {
    const IconComponent = (LucideIcons as any)[icon];
    if (!IconComponent) {
      return <LucideIcons.HelpCircle className="w-5 h-5" />;
    }
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
        <h1 className="text-3xl font-bold">{t("categories.title")}</h1>
        <FloatingActionButton
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          label="Add category"
        />
      </div>

      {showForm && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader>
            <CardTitle>
              {editingId
                ? t("categories.editCategoryTitle")
                : t("categories.newCategoryTitle")}
            </CardTitle>
            <CardAction>
              <button
                onClick={() => resetForm()}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("categories.typeLabel")}
                </label>
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
                    <span className="hidden sm:inline">Expense</span>
                    <span className="sm:hidden">Exp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      formData.type === "income"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Income</span>
                    <span className="sm:hidden">In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "investment" })
                    }
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      formData.type === "investment"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Investment</span>
                    <span className="sm:hidden">Inv</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t("categories.nameLabel")}
                </label>
                <Input
                  placeholder="Es: Cibo, Trasporto..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="flex gap-4 items-end">
                <IconPicker
                  value={formData.icon}
                  onChange={(icon) => setFormData({ ...formData, icon })}
                />

                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">
                    {t("categories.colorLabel")}
                  </label>
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
              </div>

              {editingId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    {t("categories.active")}
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => resetForm()}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleSaveCategory}
                  className="flex-1"
                  disabled={!formData.name.trim()}
                >
                  {editingId
                    ? t("categories.updateButton")
                    : t("categories.createButton")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        {categoryDocs.map((cat, index) => (
          <Card
            key={cat.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 hover:shadow-lg transition-all group border border-input"
            style={{
              opacity: cat.is_active ? 1 : 0.6,
              animationDelay: `${index * 50}ms`,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color || "#3B82F6" }}
                  >
                    {renderCategoryIcon(cat.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded truncate">
                        {cat.type === "expense" && t("categories.type.expense")}
                        {cat.type === "income" && t("categories.type.income")}
                        {cat.type === "investment" &&
                          t("categories.type.investment")}
                      </span>
                      {!cat.is_active && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded whitespace-nowrap">
                          {t("categories.archiveButton")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
