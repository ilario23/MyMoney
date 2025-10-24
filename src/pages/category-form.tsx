import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { useQuery } from "@/hooks/useQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySelector } from "@/components/category-selector";
import { ArrowLeft, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import type { CategoryDocType } from "@/lib/db-schemas";
import { getDatabase } from "@/lib/db";
import { syncService } from "@/services/sync.service";
import { syncLogger } from "@/lib/logger";

export function CategoryFormPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "ShoppingCart",
    color: null as string | null,
    type: "expense" as "expense" | "income" | "investment",
    is_active: true,
    parent_id: null as string | null,
  });

  // Query to get all categories
  const { data: categoryDocs } = useQuery(
    (table) =>
      user
        ? table
            .where("user_id")
            .equals(user.id)
            .filter((cat: CategoryDocType) => !cat.deleted_at)
        : Promise.resolve([]),
    "categories"
  );

  // Load category if editing
  useEffect(() => {
    if (isEditing && id && categoryDocs.length > 0) {
      const category = categoryDocs.find((c) => c.id === id);
      if (category) {
        setFormData({
          name: category.name,
          icon: category.icon,
          color: category.color || null,
          type: category.type,
          is_active: category.is_active,
          parent_id: category.parent_id || null,
        });
      }
    }
  }, [isEditing, id, categoryDocs]);

  const handleSaveCategory = async () => {
    if (!user || !formData.name.trim()) return;

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      if (isEditing && id) {
        // Update existing
        await db.categories.update(id, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          type: formData.type,
          is_active: formData.is_active,
          parent_id: formData.parent_id,
          updated_at: now,
        });
        syncLogger.success("Category updated locally - syncing with server");
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
          parent_id: formData.parent_id,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });
        syncLogger.success("Category created locally - syncing with server");
      }

      // Mark that local data has changed
      syncService.markLocalChangesAsChanged();

      // Trigger background sync if online
      if (syncService.isAppOnline()) {
        syncService.syncAfterChange(user.id).catch((error) => {
          syncLogger.error("Background sync error:", error);
        });
      } else {
        syncLogger.info("Offline - data saved locally, will sync when online");
      }

      // Navigate back to categories
      navigate("/categories");
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderCategoryIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/categories")}
          className="p-2 hover:bg-muted rounded transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">
          {isEditing
            ? t("categories.editCategoryTitle")
            : t("categories.newCategoryTitle")}
        </h1>
      </div>

      {/* Form Card */}
      <Card className="flex-1">
        <CardContent className="p-8 space-y-6">
          {/* Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("categories.typeLabel")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                  formData.type === "expense"
                    ? "bg-destructive text-destructive-foreground shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {renderCategoryIcon("TrendingDown")}
                {formData.type === "expense" && (
                  <span className="animate-in fade-in duration-300">
                    Expense
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "income" })}
                className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                  formData.type === "income"
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {renderCategoryIcon("TrendingUp")}
                {formData.type === "income" && (
                  <span className="animate-in fade-in duration-300">
                    Income
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "investment" })}
                className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                  formData.type === "investment"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {renderCategoryIcon("Zap")}
                {formData.type === "investment" && (
                  <span className="animate-in fade-in duration-300">
                    Investment
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Category Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t("categories.nameLabel")}
            </label>
            <Input
              id="name"
              placeholder="e.g., Groceries"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Icon and Color - Together */}
          <div className="space-y-2">
            <div className="flex gap-3 items-end">
              {/* Icon Picker */}
              <div className="flex-1">
                <IconPicker
                  value={formData.icon}
                  onChange={(icon) => setFormData({ ...formData, icon })}
                  color={formData.color}
                />
              </div>
              {/* Color Picker */}
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">
                  {t("categories.colorLabel")}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={
                      formData.color === null ||
                      formData.color === "transparent"
                        ? "#3B82F6"
                        : formData.color
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="hidden"
                    id="color-input"
                  />
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("color-input")?.click()
                      }
                      className="w-full px-3 py-2 rounded border border-input bg-background text-sm hover:bg-accent transition-colors cursor-pointer pr-9"
                    >
                      {formData.color === null ? "default" : formData.color}
                    </button>
                    {formData.color !== null && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, color: null })
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-destructive transition-colors"
                        title="Clear"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parent Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("categories.parentCategory")}
            </label>
            <CategorySelector
              categories={categoryDocs}
              categoryType={formData.type}
              selectedCategoryId={formData.parent_id}
              onSelectCategory={(categoryId) =>
                setFormData({ ...formData, parent_id: categoryId })
              }
              currentEditingCategoryId={id}
              dialogTitle={t("categories.parentCategory")}
              dialogDescription={t("categories.description")}
              selectButtonLabel={t("categories.selectCurrent")}
              cancelButtonLabel={t("common.cancel")}
              rootCategoryLabel={t("categories.rootCategory")}
            />
          </div>

          {/* Active Checkbox (only for editing) */}
          {isEditing && (
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
                {t("categories.active")}
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate("/categories")}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveCategory}
              className="flex-1"
              disabled={!formData.name.trim() || isSaving}
            >
              {isSaving
                ? t("common.loading")
                : isEditing
                  ? t("categories.updateButton")
                  : t("categories.createButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
