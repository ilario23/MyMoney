import { useMemo, useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { useQuery } from "@/hooks/useQuery";
import { statsService } from "@/services/stats.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  Target,
  BarChart3,
  Zap,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { it, enUS } from "date-fns/locale";
import type { ExpenseDocType, CategoryDocType } from "@/lib/db-schemas";

export function DashboardPage() {
  const { user } = useAuthStore();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  // Date range
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split("T")[0];
  const monthEnd = endOfMonth(now).toISOString().split("T")[0];

  // Memoize query functions
  const expenseQueryFn = useCallback(
    (table: any) =>
      user
        ? table
            .where("user_id")
            .equals(user.id)
            .filter(
              (exp: ExpenseDocType) =>
                !exp.deleted_at &&
                exp.date >= monthStart &&
                exp.date <= monthEnd
            )
        : Promise.resolve([]),
    [user?.id, monthStart, monthEnd]
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

  // Reactive queries using Dexie
  const { data: expenseDocs } = useQuery(expenseQueryFn, "expenses");

  const { data: categoryDocs } = useQuery(categoryQueryFn, "categories");

  // Stats state
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [avgExpense, setAvgExpense] = useState(0);
  const [topCategories, setTopCategories] = useState<
    Array<{ category: string; total: number; count: number }>
  >([]);
  const [percentageChange, setPercentageChange] = useState(0);

  // Create category map
  const categories = useMemo(() => {
    const map = new Map();
    categoryDocs.forEach((cat) => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categoryDocs]);

  // Calculate monthly totals by type
  const monthlyTotal = useMemo(
    () =>
      expenseDocs
        .filter((e) => e.amount > 0 && e.type === "expense")
        .reduce((sum, e) => sum + e.amount, 0),
    [expenseDocs]
  );

  const monthlyIncome = useMemo(
    () =>
      expenseDocs
        .filter((e) => e.amount < 0 && e.type === "income")
        .reduce((sum, e) => sum + Math.abs(e.amount), 0),
    [expenseDocs]
  );

  const monthlyInvestment = useMemo(
    () =>
      expenseDocs
        .filter((e) => e.amount > 0 && e.type === "investment")
        .reduce((sum, e) => sum + e.amount, 0),
    [expenseDocs]
  );

  // Load stats
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const stats = await statsService.calculateMonthlyStats(user.id, now);
        setTotalExpenses(stats.expenseCount);
        setAvgExpense(stats.dailyAverage);

        const topCats = stats.topCategories.slice(0, 5).map((cat) => ({
          category: cat.categoryName,
          total: cat.amount,
          count: cat.count,
        }));
        setTopCategories(topCats);

        // Calculate percentage change
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        const prevStats = await statsService.calculateMonthlyStats(
          user.id,
          previousMonth
        );

        if (prevStats.totalExpenses > 0) {
          const change =
            ((stats.totalExpenses - prevStats.totalExpenses) /
              prevStats.totalExpenses) *
            100;
          setPercentageChange(change);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();
  }, [user]);

  if (!user) {
    return null;
  }

  const dateLocale = language === "it" ? it : enUS;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t("dashboard.greeting").replace(
              "{name}",
              user.displayName || t("dashboard.welcome")
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: dateLocale })}
          </p>
        </div>
        <FloatingActionButton href="/expense/new" label="Add expense" />
      </div>

      {/* Summary Card */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 hover:shadow-lg transition-all cursor-pointer md:cursor-default"
        onClick={() => navigate("/statistics")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{t("dashboard.monthlySummary")}</CardTitle>
            <CardDescription>
              {format(new Date(), "MMMM yyyy", { locale: dateLocale })}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/statistics");
            }}
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="md:hidden">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span>{t("dashboard.expensesThisMonth")}</span>
                </div>
                <div className="text-4xl font-bold text-destructive">
                  {monthlyTotal.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("dashboard.transactions").replace(
                    "{count}",
                    String(
                      expenseDocs.filter((e: ExpenseDocType) => e.amount > 0)
                        .length
                    )
                  )}
                </p>
              </div>
              <div className="pt-3 border-t text-sm text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>
                  {t("dashboard.tapForStats") || "Tap per vedere statistiche"}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop view */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>{t("dashboard.expensesThisMonth") || "Spese"}</span>
              </div>
              <div className="text-3xl font-bold text-red-500">
                {monthlyTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.transactions").replace(
                  "{count}",
                  String(
                    expenseDocs.filter((e: ExpenseDocType) => e.type === "expense")
                      .length
                  )
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>{t("dashboard.incomeThisMonth") || "Entrate"}</span>
              </div>
              <div className="text-3xl font-bold text-green-500">
                {monthlyIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.transactions").replace(
                  "{count}",
                  String(
                    expenseDocs.filter((e: ExpenseDocType) => e.type === "income")
                      .length
                  )
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>{t("dashboard.investmentsThisMonth") || "Investimenti"}</span>
              </div>
              <div className="text-3xl font-bold text-blue-500">
                {monthlyInvestment.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.transactions").replace(
                  "{count}",
                  String(
                    expenseDocs.filter((e: ExpenseDocType) => e.type === "investment")
                      .length
                  )
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Categories - Desktop only */}
      {topCategories.length > 0 && (
        <div className="hidden md:grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                <CardTitle>
                  {t("dashboard.topCategories") || "Top Categorie"}
                </CardTitle>
              </div>
              <CardDescription>
                {t("dashboard.topCategoriesDesc") || "Dove spendi di più"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((cat, index) => {
                  const categoryInfo = Array.from(categories.values()).find(
                    (c) => c.name === cat.category
                  );
                  const percentage =
                    monthlyTotal > 0 ? (cat.total / monthlyTotal) * 100 : 0;

                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {categoryInfo?.icon || ""}
                          </span>
                          <span className="font-medium truncate">
                            {cat.category}
                          </span>
                          <Badge variant="secondary" className="ml-auto">
                            {cat.count}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground w-16 text-right">
                            {cat.total.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>
                  {t("dashboard.overallStats") || "Statistiche"}
                </CardTitle>
              </div>
              <CardDescription>
                {t("dashboard.overallStatsDesc") || "Panoramica"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.totalExpenses") || "Spese Totali"}
                    </p>
                    <p className="text-2xl font-bold">{totalExpenses}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.avgExpense") || "Media Giornaliera"}
                    </p>
                    <p className="text-2xl font-bold">
                      {avgExpense.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>

                {percentageChange !== 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("dashboard.vsLastMonth") || "vs Mese Scorso"}
                      </p>
                      <p
                        className={`text-xl font-bold ${percentageChange > 0 ? "text-destructive" : "text-green-600"}`}
                      >
                        {percentageChange > 0 ? "+" : ""}
                        {percentageChange.toFixed(1)}%
                      </p>
                    </div>
                    {percentageChange > 0 ? (
                      <TrendingUp className="h-8 w-8 text-destructive" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-green-600" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Expenses */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{t("dashboard.recentExpenses")}</CardTitle>
            <CardDescription>
              {t("dashboard.recentDescription")}
            </CardDescription>
          </div>
          {expenseDocs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/expenses")}
            >
              View All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {expenseDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("dashboard.noExpenses")}</p>
              <Button
                variant="link"
                onClick={() => navigate("/expense/new")}
                className="mt-2"
              >
                {t("dashboard.addFirstExpense")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {expenseDocs.slice(0, 3).map((expense: ExpenseDocType) => {
                const categoryObj = categories.get(expense.category_id);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => navigate(`/expense/${expense.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {categoryObj
                          ? `${categoryObj.icon} ${categoryObj.name}`
                          : "Unknown"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${expense.amount > 0 ? "text-destructive" : "text-green-600"}`}
                      >
                        {expense.amount > 0 ? "-" : "+"}
                        {Math.abs(expense.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), "d MMM", {
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
