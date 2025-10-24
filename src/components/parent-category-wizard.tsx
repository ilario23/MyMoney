import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { CategoryDocType } from "@/lib/db-schemas";

interface ParentCategoryWizardProps {
  categories: CategoryDocType[];
  categoryType: "expense" | "income" | "investment";
  onSelectCategory: (categoryId: string | null) => void;
  currentEditingCategoryId?: string;
  showActions?: boolean;
  onBack?: () => void;
  navigationStack?: (string | null)[];
  onNavigationStackChange?: (stack: (string | null)[]) => void;
}

export function ParentCategoryWizard({
  categories,
  categoryType,
  onSelectCategory,
  currentEditingCategoryId,
  showActions = true,
  onBack,
  navigationStack: externalNavigationStack,
  onNavigationStackChange,
}: ParentCategoryWizardProps) {
  // Use external navigation stack if provided, otherwise use internal state
  const [internalNavigationStack, setInternalNavigationStack] = useState<
    (string | null)[]
  >([null]);
  const navigationStack = externalNavigationStack || internalNavigationStack;

  const setNavigationStack = (stack: (string | null)[]) => {
    if (onNavigationStackChange) {
      onNavigationStackChange(stack);
    } else {
      setInternalNavigationStack(stack);
    }
  };

  // Filter by type and exclude soft-deleted and current editing category
  const availableCategories = useMemo(
    () =>
      categories.filter(
        (cat) =>
          cat.type === categoryType &&
          !cat.deleted_at &&
          cat.is_active &&
          cat.id !== currentEditingCategoryId
      ),
    [categories, categoryType, currentEditingCategoryId]
  );

  // Stack to track navigation: stores the parent_id at each step
  const currentLevel = navigationStack[navigationStack.length - 1];

  // Get categories for current level (children of currentLevel)
  const categoriesAtCurrentLevel = useMemo(() => {
    if (currentLevel === null) {
      // Root level: show categories without parent
      return availableCategories.filter((cat) => !cat.parent_id);
    } else {
      // Show children of currentLevel
      return availableCategories.filter(
        (cat) => cat.parent_id === currentLevel
      );
    }
  }, [availableCategories, currentLevel]);

  // Build breadcrumb path
  const getBreadcrumbPath = (): { id: string | null; name: string }[] => {
    const path: { id: string | null; name: string }[] = [
      { id: null, name: "Root" },
    ];

    // Traverse the stack and add category names
    for (let i = 1; i < navigationStack.length; i++) {
      const parentId = navigationStack[i];
      const category = availableCategories.find((cat) => cat.id === parentId);
      if (category) {
        path.push({ id: parentId, name: category.name });
      }
    }

    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  const renderCategoryIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const handleSelectCategory = (categoryId: string) => {
    const category = availableCategories.find((c) => c.id === categoryId);
    if (!category) return;

    // Check if this category has children
    const hasChildren = availableCategories.some(
      (cat) => cat.parent_id === categoryId
    );

    if (hasChildren) {
      // Go to next level
      setNavigationStack([...navigationStack, categoryId]);
    } else {
      // This is a leaf category, select it
      onSelectCategory(categoryId);
    }
  };

  const handleBreadcrumbClick = (levelIndex: number) => {
    const newStack = navigationStack.slice(0, levelIndex + 1);
    setNavigationStack(newStack);
  };

  const handleSelectAsParent = () => {
    // Select current level as parent (can be null for root)
    onSelectCategory(currentLevel);
  };

  const handleBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(navigationStack.slice(0, -1));
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Breadcrumb Navigation - Custom - Always show */}
      <div className="pb-4 border-b">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              handleBreadcrumbClick(0);
              // If already at root level, select it as parent
              if (navigationStack.length === 1) {
                onSelectCategory(null);
              }
            }}
            className="flex items-center gap-1 hover:text-primary transition-colors text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
          {breadcrumbPath.slice(1).map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => {
                  handleBreadcrumbClick(index + 1);
                  // If clicking on a level, select it as parent
                  if (index + 1 === navigationStack.length - 1) {
                    onSelectCategory(item.id);
                  }
                }}
                className="hover:text-primary transition-colors text-sm truncate max-w-[120px] cursor-pointer"
              >
                {item.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Categories List - Compact */}
      <div className="space-y-1 -mx-4 px-4">
        {categoriesAtCurrentLevel.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {currentLevel === null
              ? "No root categories available"
              : "No subcategories available"}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {categoriesAtCurrentLevel.map((category, index) => {
              const hasChildren = availableCategories.some(
                (cat) => cat.parent_id === category.id
              );

              return (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category.id)}
                  className={`w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-accent/50 transition-colors text-left rounded-sm ${
                    index === 0 ? "" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0 text-sm shadow-sm"
                      style={{ backgroundColor: category.color || "#3B82F6" }}
                    >
                      {renderCategoryIcon(category.icon)}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {category.name}
                    </span>
                  </div>
                  {hasChildren && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons - Only show when navigating or at non-leaf level */}
      {showActions && navigationStack.length > 1 && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onBack || handleBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button onClick={handleSelectAsParent} className="flex-1">
            Select Current Level
          </Button>
        </div>
      )}
    </div>
  );
}
