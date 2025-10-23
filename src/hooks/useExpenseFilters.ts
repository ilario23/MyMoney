import { useMemo, useState, useCallback } from "react";
import type { ExpenseDocType, CategoryDocType } from "@/lib/db-schemas";

export interface ExpenseFilters {
  searchQuery: string;
  selectedCategories: string[];
  selectedTypes: Array<"expense" | "income" | "investment">;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: "date" | "amount" | "category";
  sortOrder: "asc" | "desc";
}

export const DEFAULT_FILTERS: ExpenseFilters = {
  searchQuery: "",
  selectedCategories: [],
  selectedTypes: [],
  sortBy: "date",
  sortOrder: "desc",
};

export function useExpenseFilters(
  expenses: ExpenseDocType[],
  categories: Map<string, CategoryDocType>
) {
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);

  // Update individual filters
  const updateFilter = useCallback(
    <K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Check if any filter is active (for UI indication)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== "" ||
      filters.selectedCategories.length > 0 ||
      filters.selectedTypes.length > 0 ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined ||
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined
    );
  }, [filters]);

  // Apply filters and sorting
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // 1. Filter by search query (description, category name, amount)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((expense) => {
        const description = expense.description?.toLowerCase() || "";
        const category = categories.get(expense.category_id);
        const categoryName = category?.name?.toLowerCase() || "";
        const amount = expense.amount.toString();

        return (
          description.includes(query) ||
          categoryName.includes(query) ||
          amount.includes(query)
        );
      });
    }

    // 2. Filter by selected categories
    if (filters.selectedCategories.length > 0) {
      result = result.filter((expense) =>
        filters.selectedCategories.includes(expense.category_id)
      );
    }

    // 3. Filter by selected types
    if (filters.selectedTypes.length > 0) {
      result = result.filter((expense) =>
        filters.selectedTypes.includes(expense.type)
      );
    }

    // 4. Filter by date range
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      result = result.filter(
        (expense) => new Date(expense.date).getTime() >= from
      );
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      // Set to end of day
      const toEndOfDay = to + 86400000;
      result = result.filter(
        (expense) => new Date(expense.date).getTime() < toEndOfDay
      );
    }

    // 5. Filter by amount range
    if (filters.minAmount !== undefined) {
      result = result.filter(
        (expense) => Math.abs(expense.amount) >= filters.minAmount!
      );
    }

    if (filters.maxAmount !== undefined) {
      result = result.filter(
        (expense) => Math.abs(expense.amount) <= filters.maxAmount!
      );
    }

    // 6. Sort
    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (filters.sortBy) {
        case "date":
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case "amount":
          aVal = Math.abs(a.amount);
          bVal = Math.abs(b.amount);
          break;
        case "category":
          aVal = categories.get(a.category_id)?.name || "";
          bVal = categories.get(b.category_id)?.name || "";
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return filters.sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return filters.sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [expenses, categories, filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    filteredExpenses,
  };
}
