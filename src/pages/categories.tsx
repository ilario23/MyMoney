import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { useQuery } from "@/hooks/useQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import type { CategoryDocType } from "@/lib/db-schemas";
import { getDatabase } from "@/lib/db";
import { syncService } from "@/services/sync.service";
import { syncLogger } from "@/lib/logger";

export function CategoriesPage() {
  // Stato: solo un ramo aperto alla volta
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();

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

  const handleEditCategory = (cat: CategoryDocType) => {
    navigate(`/categories/${cat.id}/edit`);
  };

  const handleDeleteCategory = async (cat: CategoryDocType) => {
    if (!user) return;

    const isUsed = transactionDocs.some(
      (trx: any) => trx.category_id === cat.id
    );
    if (isUsed) {
      alert(t("categories.usedError"));
      return;
    }

    if (!confirm(t("categories.confirmDelete").replace("{name}", cat.name)))
      return;

    try {
      const db = getDatabase();
      await db.categories.update(cat.id, {
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      syncLogger.success("Category deleted locally - syncing with server");
      syncService.markLocalChangesAsChanged();

      if (syncService.isAppOnline()) {
        syncService.syncAfterChange(user.id).catch((error) => {
          syncLogger.error("Background sync error:", error);
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const renderCategoryIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const childrenMap = new Map<string, CategoryDocType[]>();
  const topLevel = categoryDocs.filter((c) => !c.parent_id);

  categoryDocs.forEach((cat) => {
    if (cat.parent_id) {
      if (!childrenMap.has(cat.parent_id)) {
        childrenMap.set(cat.parent_id, []);
      }
      childrenMap.get(cat.parent_id)!.push(cat);
    }
  });

  const renderCategoryTree = (category: CategoryDocType, depth: number = 0) => {
    const children = childrenMap.get(category.id) || [];
    const marginLeft = depth > 0 ? depth * 16 : 0;
    // Più compatto: icona e padding ridotti
    const iconSizeClass =
      depth === 0 ? "w-12 h-12" : depth === 1 ? "w-10 h-10" : "w-8 h-8";
    const textSizeClass =
      depth === 0 ? "text-base" : depth === 1 ? "text-sm" : "text-xs";
    const paddingClass = depth === 0 ? "px-3" : depth === 1 ? "px-2.5" : "px-2";

    // Espansione/collasso: solo un ramo aperto
    const isOpen = openCategoryIds.includes(category.id);
    const hasChildren = children.length > 0;

    return (
      <div key={category.id} style={{ marginLeft }}>
        <Card
          className={
            "hover:shadow-lg transition-all group border border-input" +
            (hasChildren ? " cursor-pointer select-none" : "")
          }
          style={{ opacity: category.is_active ? 1 : 0.6 }}
          onClick={() => {
            if (hasChildren) {
              setOpenCategoryIds((prev) =>
                isOpen
                  ? prev.filter((id) => id !== category.id)
                  : [...prev, category.id]
              );
            }
          }}
        >
          <CardContent className={paddingClass}>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div
                  className={`${iconSizeClass} flex-shrink-0 rounded-lg flex items-center justify-center`}
                  style={{
                    backgroundColor:
                      category.color || "var(--primary-foreground)",
                  }}
                >
                  {renderCategoryIcon(category.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-medium block truncate ${textSizeClass}`}
                  >
                    {category.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded truncate">
                      {category.type === "expense" &&
                        t("categories.type.expense")}
                      {category.type === "income" &&
                        t("categories.type.income")}
                      {category.type === "investment" &&
                        t("categories.type.investment")}
                    </span>
                    {hasChildren && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                        {children.length} sub-categor
                        {children.length === 1 ? "y" : "ies"}
                      </span>
                    )}
                    {!category.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded whitespace-nowrap">
                        {t("categories.archiveButton")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(category);
                  }}
                  className="p-2 hover:bg-primary/15 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category);
                  }}
                  className="p-2 hover:bg-destructive/10 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && isOpen && (
          <div className="mt-2 space-y-2 border-l-2 border-muted pl-3">
            {children.map((child) => renderCategoryTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("categories.title")}</h1>
          <p className="text-muted-foreground">{t("categories.description")}</p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate("/categories/new")}
          title={t("categories.createButton")}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            {t("categories.createButton")}
          </span>
        </Button>
      </div>

      <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        {topLevel.length === 0 && categoryDocs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t("categories.totalCategories")}: 0
            </p>
            <p className="text-sm text-muted-foreground">
              {t("categories.description")}
            </p>
          </div>
        ) : (
          topLevel.map((category, index) => (
            <div
              key={category.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {renderCategoryTree(category, 0)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
