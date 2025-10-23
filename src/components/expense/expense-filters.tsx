import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { renderIcon } from "@/lib/icon-renderer";
import type { CategoryDocType } from "@/lib/db-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, RotateCcw, Save } from "lucide-react";
import type { ExpenseFilters } from "@/hooks/useExpenseFilters";

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  categories: Map<string, CategoryDocType>;
  onFilterChange: <K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K]
  ) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  onSaveFilter?: (filterName: string) => void;
}

export function ExpenseFilterPanel({
  filters,
  categories,
  onFilterChange,
  onReset,
  hasActiveFilters,
  resultCount,
  onSaveFilter,
}: ExpenseFiltersProps) {
  const { t } = useLanguage();
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filterNameInput, setFilterNameInput] = useState("");

  // Get categories list
  const categoryList = Array.from(categories.values()).filter(
    (cat) => !cat.deleted_at
  );

  // Get unique types from expenses
  const availableTypes = ["expense", "income", "investment"] as const;

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    const updated = filters.selectedCategories.includes(categoryId)
      ? filters.selectedCategories.filter((id) => id !== categoryId)
      : [...filters.selectedCategories, categoryId];
    onFilterChange("selectedCategories", updated);
  };

  // Toggle type selection
  const toggleType = (type: "expense" | "income" | "investment") => {
    const updated = filters.selectedTypes.includes(type)
      ? filters.selectedTypes.filter((t) => t !== type)
      : [...filters.selectedTypes, type];
    onFilterChange("selectedTypes", updated);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "expense":
        return {
          label: t("categories.type.expense"),
          icon: "📤",
          color: "bg-destructive/10 text-destructive",
        };
      case "income":
        return {
          label: t("categories.type.income"),
          icon: "📥",
          color: "bg-primary/10 text-primary",
        };
      case "investment":
        return {
          label: t("categories.type.investment"),
          icon: "💰",
          color: "bg-accent/10 text-accent",
        };
      default:
        return { label: type, icon: "", color: "" };
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with result count */}
      <div className="flex items-center justify-between pb-3 border-b border-border/30">
        <h2 className="font-semibold text-sm">{t("expenses.filters.title")}</h2>
        <span className="text-xs text-muted-foreground">
          {resultCount}{" "}
          {resultCount === 1
            ? t("expenses.filters.results")
            : t("expenses.filters.resultsPlural")}
        </span>
      </div>

      {/* Always visible filters panel */}
      <div className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {t("expenses.filters.search")}
          </label>
          <div className="relative">
            <Input
              placeholder={t("expenses.filters.searchPlaceholder")}
              value={filters.searchQuery}
              onChange={(e) => onFilterChange("searchQuery", e.target.value)}
              className="pr-8"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange("searchQuery", "")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Type filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {t("expenses.filters.type")}
          </label>
          <div className="flex gap-2 flex-wrap">
            {availableTypes.map((type) => {
              const { label, color } = getTypeLabel(type);
              const isSelected = filters.selectedTypes.includes(type);

              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    isSelected
                      ? `${color} border-current`
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category filter - Dropdown style */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {t("expenses.filters.categories")}
          </label>
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border/30 bg-background hover:bg-muted transition-colors text-xs"
            >
              <span className="text-muted-foreground">
                {filters.selectedCategories.length === 0
                  ? t("expenses.filters.selectCategories")
                  : `${filters.selectedCategories.length} categor${
                      filters.selectedCategories.length === 1 ? "ia" : "ie"
                    } selezionate`}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showCategoryDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 border border-border/30 bg-background rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {categoryList.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground italic">
                    {t("expenses.filters.noCategoriesAvailable")}
                  </div>
                ) : (
                  categoryList.map((cat) => {
                    const isSelected = filters.selectedCategories.includes(
                      cat.id
                    );

                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b border-border/30 last:border-b-0 hover:bg-muted ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {renderIcon(cat.icon)}
                        <span className="flex-1 text-left">{cat.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected categories badges */}
          {filters.selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {filters.selectedCategories.map((catId) => {
                const cat = categories.get(catId);
                return cat ? (
                  <Badge
                    key={catId}
                    variant="secondary"
                    className="text-xs pl-2 flex items-center gap-1"
                  >
                    {renderIcon(cat.icon)} {cat.name}
                    <button
                      onClick={() => toggleCategory(catId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Date range filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {t("expenses.filters.period")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">
                {t("expenses.filters.from")}
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  onFilterChange("dateFrom", e.target.value || undefined)
                }
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t("expenses.filters.to")}
              </label>
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) =>
                  onFilterChange("dateTo", e.target.value || undefined)
                }
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Amount range filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {t("expenses.filters.amount")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">
                {t("expenses.filters.min")}
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount || ""}
                onChange={(e) =>
                  onFilterChange(
                    "minAmount",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                step="0.01"
                min="0"
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t("expenses.filters.max")}
              </label>
              <Input
                type="number"
                placeholder="∞"
                value={filters.maxAmount || ""}
                onChange={(e) =>
                  onFilterChange(
                    "maxAmount",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                step="0.01"
                min="0"
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Sort controls */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {t("expenses.filters.sortBy")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={filters.sortBy}
              onValueChange={(val) =>
                onFilterChange("sortBy", val as "date" | "amount" | "category")
              }
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  {t("expenses.filters.sortDate")}
                </SelectItem>
                <SelectItem value="amount">
                  {t("expenses.filters.sortAmount")}
                </SelectItem>
                <SelectItem value="category">
                  {t("expenses.filters.sortCategory")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filters.sortOrder === "asc" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("sortOrder", "asc")}
              className="text-xs"
            >
              ↑
            </Button>

            <Button
              variant={filters.sortOrder === "desc" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("sortOrder", "desc")}
              className="text-xs"
            >
              ↓
            </Button>
          </div>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            {t("expenses.filters.reset")}
          </Button>
        )}

        {/* Save filter button */}
        {hasActiveFilters && onSaveFilter && (
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              {t("expenses.filters.saveFilter")}
            </label>
            <div className="flex gap-2">
              <Input
                placeholder={t("expenses.filters.filterName")}
                value={filterNameInput}
                onChange={(e) => setFilterNameInput(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (filterNameInput.trim()) {
                    onSaveFilter(filterNameInput);
                    setFilterNameInput("");
                  }
                }}
                disabled={!filterNameInput.trim()}
                className="text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                {t("expenses.filters.save")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
