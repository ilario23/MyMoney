import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { getDatabase } from "@/lib/db";
import type { CategoryDocType } from "@/lib/db-schemas";
import { statsService } from "@/services/stats.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PieChart,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";

export function StatisticsPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Map<string, CategoryDocType>>(
    new Map()
  );
  const [topCategories, setTopCategories] = useState<
    Array<{ category: string; total: number; count: number }>
  >([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [avgExpense, setAvgExpense] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      setIsLoading(true);
      try {
        const db = getDatabase();

        // Load categories for icons
        const userCategories = await db.categories
          .where("user_id")
          .equals(user.id)
          .toArray();
        const categoryMap = new Map<string, (typeof userCategories)[0]>(
          userCategories.map((c: (typeof userCategories)[0]) => [c.name, c])
        );
        setCategories(categoryMap);

        // Calculate stats using statsService
        const stats = await statsService.calculateMonthlyStats(
          user.id,
          new Date()
        );

        setTotalExpenses(stats.transactionCount);
        setAvgExpense(stats.dailyAverage);
        setMonthlyTotal(stats.totalTransactions);

        // Get top categories
        const topCats = stats.topCategories.slice(0, 5).map((cat) => ({
          category: cat.categoryName,
          total: cat.amount,
          count: cat.count,
        }));

        setTopCategories(topCats);

        // Calculate percentage change (compare with previous month)
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        const prevStats = await statsService.calculateMonthlyStats(
          user.id,
          previousMonth
        );

        if (prevStats.totalTransactions > 0) {
          const change =
            ((stats.totalTransactions - prevStats.totalTransactions) /
              prevStats.totalTransactions) *
            100;
          setPercentageChange(change);
        }
      } catch (error) {
        console.error("Error loading statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {t("common.loading") || "Caricamento..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {t("statistics.title") || "Statistiche"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("statistics.subtitle") || "Analisi dettagliata delle tue spese"}
          </p>
        </div>
      </div>

      {/* Top Categories Card */}
      {topCategories.length > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary animate-pulse" />
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
                const categoryInfo = categories.get(cat.category);
                const percentage =
                  monthlyTotal > 0 ? (cat.total / monthlyTotal) * 100 : 0;

                return (
                  <div
                    key={cat.category}
                    className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {categoryInfo?.icon || "📌"}
                        </span>
                        <span className="font-medium truncate">
                          {cat.category}
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          {cat.count}{" "}
                          {cat.count === 1
                            ? t("dashboard.expense")
                            : t("dashboard.expenses")}
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
                          €{cat.total.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Stats Card */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle>
              {t("dashboard.overallStats") || "Statistiche Generali"}
            </CardTitle>
          </div>
          <CardDescription>
            {t("dashboard.overallStatsDesc") || "Tutte le tue spese"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Total Expenses */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.totalExpenses") || "Spese Totali"}
                </p>
                <p className="text-2xl font-bold">{totalExpenses}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Average Expense */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.avgExpense") || "Media per Spesa"}
                </p>
                <p className="text-2xl font-bold">€{avgExpense.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Month Comparison */}
            {percentageChange !== 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.vsLastMonth") || "vs Mese Scorso"}
                  </p>
                  <p
                    className={`text-xl font-bold ${percentageChange > 0 ? "text-destructive" : "text-primary"}`}
                  >
                    {percentageChange > 0 ? "+" : ""}
                    {percentageChange.toFixed(1)}%
                  </p>
                </div>
                {percentageChange > 0 ? (
                  <TrendingUp className="h-8 w-8 text-destructive" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-primary" />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
