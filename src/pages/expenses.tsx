import { useMemo, useCallback, useState } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { useQuery } from "@/hooks/useQuery";
import { useExpenseFilters } from "@/hooks/useExpenseFilters";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { ExpenseFilterPanel } from "@/components/expense/expense-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { Sliders, ChevronDown } from "lucide-react";
import type { ExpenseDocType, CategoryDocType } from "@/lib/db-schemas";

export function ExpensesPage() {
  const { user } = useAuthStore();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  // Memoize query function to avoid re-runs
  const expenseQueryFn = useCallback(
    (table: any) =>
      user
        ? table
            .where("user_id")
            .equals(user.id)
            .filter((exp: ExpenseDocType) => !exp.deleted_at)
        : Promise.resolve([]),
    [user?.id]
  );

  const categoryQueryFn = useCallback(
    (table: any) =>
      user
        ? table
            .where("user_id")
            .equals(user.id)
            .filter((cat: CategoryDocType) => !cat.deleted_at)
        : Promise.resolve([]),
    [user?.id]
  );

  // Reactive queries using Dexie with Observable
  const { data: expenseDocs, loading } = useQuery(expenseQueryFn, "expenses");

  const { data: categoryDocs } = useQuery(categoryQueryFn, "categories");

  // Convert to map
  const categories = useMemo(() => {
    const map = new Map();
    categoryDocs.forEach((cat) => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categoryDocs]);

  // Use expense filters hook
  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    filteredExpenses,
  } = useExpenseFilters(expenseDocs, categories);

  // Handle saving filter
  const handleSaveFilter = useCallback(
    (filterName: string) => {
      const savedFilter = {
        name: filterName,
        filters: filters,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage or Dexie
      const savedFilters = JSON.parse(
        localStorage.getItem("saved_filters") || "[]"
      );
      savedFilters.push(savedFilter);
      localStorage.setItem("saved_filters", JSON.stringify(savedFilters));

      // Show success message (opzionale)
      console.log(`Filtro "${filterName}" salvato con successo!`);
    },
    [filters]
  );

  if (!user) {
    return null;
  }

  // Helper: Get semantic classes for transaction type using shadow instead of background
  const getTypeStyle = (type: "expense" | "income" | "investment") => {
    switch (type) {
      case "expense":
        return {
          shadowColor: "shadow-destructive/20",
          textColor: "text-destructive",
          amountColor: "text-destructive",
          badgeColor: "bg-destructive/10 text-destructive",
          icon: "📤",
        };
      case "income":
        return {
          shadowColor: "shadow-primary/20",
          textColor: "text-primary",
          amountColor: "text-primary",
          badgeColor: "bg-primary/10 text-primary",
          icon: "📥",
        };
      case "investment":
        return {
          shadowColor: "shadow-accent/20",
          textColor: "text-accent",
          amountColor: "text-accent",
          badgeColor: "bg-accent/10 text-accent",
          icon: "💰",
        };
    }
  };

  const dateLocale = language === "it" ? it : enUS;

  return (
    <div className="space-y-6 pb-20">
      {/* Header con bottone filtri */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Spese</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredExpenses.length}{" "}
            {filteredExpenses.length === 1 ? "spesa" : "spese"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-muted rounded-lg transition-colors hidden md:block"
            title="Filtri"
          >
            <Sliders className="w-5 h-5" />
          </button>
          <FloatingActionButton href="/expense/new" label="Add expense" />
        </div>
      </div>

      {/* Filter Panel - Desktop only (no drawer) */}
      <div className="hidden md:block">
        <ExpenseFilterPanel
          filters={filters}
          categories={categories}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          resultCount={filteredExpenses.length}
          onSaveFilter={handleSaveFilter}
        />
      </div>

      {/* Mobile Collapsible Filters */}
      <div className="md:hidden space-y-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-lg border border-border/30 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span className="font-medium text-sm">Filtri</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Attivo
              </Badge>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>

        {showFilters && (
          <ExpenseFilterPanel
            filters={filters}
            categories={categories}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={filteredExpenses.length}
            onSaveFilter={handleSaveFilter}
          />
        )}
      </div>

      {/* Expenses List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {t("common.loading") || "Caricamento..."}
            </p>
          </CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {filters.searchQuery || hasActiveFilters
                ? "Nessuna spesa trovata"
                : "Nessuna spesa"}
            </p>
            {!filters.searchQuery && !hasActiveFilters && (
              <Button onClick={() => navigate("/expense/new")}>
                Aggiungi la prima spesa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const category = categories.get(expense.category_id);
            const typeStyle = getTypeStyle(expense.type);

            return (
              <div
                key={expense.id}
                className={`${typeStyle.shadowColor} rounded-lg cursor-pointer hover:shadow-lg transition-all p-4 shadow-md`}
                onClick={() => navigate(`/expense/${expense.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Badge with type */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`${typeStyle.badgeColor} text-xs font-semibold px-2 py-1 rounded`}
                      >
                        {expense.type.charAt(0).toUpperCase() +
                          expense.type.slice(1)}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{category?.icon || ""}</span>
                      <h3 className="font-medium truncate">
                        {expense.description}
                      </h3>
                    </div>

                    {/* Category and date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{category?.name || "Senza categoria"}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(expense.date), "d MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Amount with dynamic color */}
                  <div className="text-right ml-4">
                    <p className={`text-xl font-bold ${typeStyle.amountColor}`}>
                      {expense.type === "income" ? "+" : "-"}
                      {Math.abs(expense.amount).toFixed(2)}€
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
