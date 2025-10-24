import { useMemo, useCallback, useState } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { renderIcon } from "@/lib/icon-renderer";
import { useQuery } from "@/hooks/useQuery";
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { TransactionFilterPanel } from "@/components/transaction/transaction-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { Sliders, Edit2 } from "lucide-react";
import type { TransactionDocType, CategoryDocType } from "@/lib/db-schemas";

export function TransactionsPage() {
  const { user } = useAuthStore();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  // Memoize query function to avoid re-runs
  const transactionQueryFn = useCallback(
    (table: any) =>
      user
        ? table
            .where("user_id")
            .equals(user.id)
            .filter((trans: TransactionDocType) => !trans.deleted_at)
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
  const { data: transactionDocs, loading } = useQuery(
    transactionQueryFn,
    "transactions"
  );

  const { data: categoryDocs } = useQuery(categoryQueryFn, "categories");

  // Convert to map
  const categories = useMemo(() => {
    const map = new Map();
    categoryDocs.forEach((cat) => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categoryDocs]);

  // Use transaction filters hook
  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    filteredTransactions,
  } = useTransactionFilters(transactionDocs, categories);

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
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header con bottone filtri */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-3xl font-bold">{t("nav.transactions")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTransactions.length === 1
              ? t("transactions.transactionCount").replace("{count}", "1")
              : t("transactions.transactionCountPlural").replace(
                  "{count}",
                  filteredTransactions.length.toString()
                )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-muted rounded-lg transition-colors hidden md:block"
            title={t("transactions.filters")}
          >
            <Sliders className="w-5 h-5" />
          </button>
          {/* Mobile filter drawer button */}
          <Drawer open={showFilters} onOpenChange={setShowFilters}>
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors text-primary"
              title={t("transactions.filters")}
            >
              <Sliders className="w-5 h-5" />
            </button>
            <DrawerContent className="max-h-[80vh]">
              <DrawerHeader className="border-b border-border/30">
                <DrawerTitle>{t("transactions.filters.title")}</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto flex-1 px-4 py-4">
                <TransactionFilterPanel
                  filters={filters}
                  categories={categories}
                  onFilterChange={updateFilter}
                  onReset={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                  resultCount={filteredTransactions.length}
                  onSaveFilter={handleSaveFilter}
                />
              </div>
              <div className="border-t border-border/30 p-4">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    {t("common.close")}
                  </Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
          <FloatingActionButton
            href="/transaction/new"
            label="Add transaction"
          />
        </div>
      </div>

      {/* Filter Panel - Desktop only (no drawer) */}
      <div
        className="hidden md:block overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: showFilters ? "1000px" : "0px",
          opacity: showFilters ? 1 : 0,
        }}
      >
        <div className="pb-4">
          <TransactionFilterPanel
            filters={filters}
            categories={categories}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={filteredTransactions.length}
            onSaveFilter={handleSaveFilter}
          />
        </div>
      </div>

      {/* Mobile Collapsible Filters */}

      {/* Transactions List */}
      {loading ? (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {t("common.loading") || "Caricamento..."}
            </p>
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {filters.searchQuery || hasActiveFilters
                ? t("transactions.noTransactionsFiltered")
                : t("transactions.noTransactions")}
            </p>
            {!filters.searchQuery && !hasActiveFilters && (
              <Button onClick={() => navigate("/transaction/new")}>
                {t("transactions.addFirstTransaction")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {filteredTransactions.map((transaction, index) => {
            const category = categories.get(transaction.category_id);
            const typeStyle = getTypeStyle(transaction.type);

            return (
              <div
                key={transaction.id}
                className={`animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-lg hover:shadow-lg transition-all p-4 border border-input shadow-xs bg-card`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/transaction/${transaction.id}`)}
                  >
                    {/* Badge with type */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`${typeStyle.badgeColor} text-xs font-semibold px-2 py-1 rounded`}
                      >
                        {transaction.type.charAt(0).toUpperCase() +
                          transaction.type.slice(1)}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5">
                        {category?.icon ? renderIcon(category.icon) : ""}
                      </div>
                      <h3 className="font-medium truncate">
                        {transaction.description}
                      </h3>
                    </div>

                    {/* Category and date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{category?.name || "Senza categoria"}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(transaction.date), "d MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="text-right ml-4 flex items-center gap-2">
                    <div>
                      <p
                        className={`text-xl font-bold ${typeStyle.amountColor}`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {Math.abs(transaction.amount).toFixed(2)}€
                      </p>
                    </div>

                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/transaction/${transaction.id}`)}
                      title="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
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
