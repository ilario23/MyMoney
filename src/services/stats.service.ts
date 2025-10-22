// Stats Service v3.0 - Local statistics calculation
import { getDatabase } from "@/lib/rxdb";
import type { ExpenseDocType } from "@/lib/rxdb-schemas";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface StatsData {
  period: string;
  totalExpenses: number;
  totalIncome: number;
  expenseCount: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    count: number;
  }>;
  dailyAverage: number;
  monthlyAverage: number;
}

class StatsService {
  async calculateMonthlyStats(userId: string, date: Date): Promise<StatsData> {
    const db = getDatabase();
    const periodKey = format(date, "yyyy-MM");

    // Check cache first
    const cached = await db.stats_cache
      .findOne({
        selector: {
          user_id: userId,
          period: periodKey,
        },
      })
      .exec();

    if (cached && this.isCacheValid(cached.calculated_at)) {
      return this.mapCacheToStats(cached);
    }

    // Calculate from local data
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const expenses = await db.expenses
      .find({
        selector: {
          user_id: userId,
          date: {
            $gte: start.toISOString(),
            $lte: end.toISOString(),
          },
          deleted_at: null,
        },
      })
      .exec();

    const stats = this.processExpenses(expenses, periodKey);

    // Update cache
    await this.updateCache(userId, stats);

    return stats;
  }

  private processExpenses(
    expenses: Array<ExpenseDocType & { category_name?: string }>,
    period: string
  ): StatsData {
    let totalExpenses = 0;
    let totalIncome = 0;
    const categoryMap = new Map();

    for (const expense of expenses) {
      if (expense.amount > 0) {
        totalExpenses += expense.amount;
      } else {
        totalIncome += Math.abs(expense.amount);
      }

      const catId = expense.category_id || "uncategorized";
      const existing = categoryMap.get(catId) || {
        count: 0,
        amount: 0,
        name: expense.category_name || "Uncategorized",
      };
      existing.count++;
      existing.amount += expense.amount;
      categoryMap.set(catId, existing);
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const daysInPeriod = 30; // Approximate
    const dailyAverage = totalExpenses / daysInPeriod;

    return {
      period,
      totalExpenses,
      totalIncome,
      expenseCount: expenses.length,
      topCategories,
      dailyAverage,
      monthlyAverage: totalExpenses,
    };
  }

  private isCacheValid(calculatedAt: string): boolean {
    const cacheAge = Date.now() - new Date(calculatedAt).getTime();
    const maxAge = 1000 * 60 * 30; // 30 minutes
    return cacheAge < maxAge;
  }

  private mapCacheToStats(cached: {
    period: string;
    total_expenses: number;
    total_income: number;
    expense_count: number;
    top_categories: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
      count: number;
    }>;
    daily_average: number;
    monthly_average: number;
  }): StatsData {
    return {
      period: cached.period,
      totalExpenses: cached.total_expenses,
      totalIncome: cached.total_income,
      expenseCount: cached.expense_count,
      topCategories: cached.top_categories,
      dailyAverage: cached.daily_average,
      monthlyAverage: cached.monthly_average,
    };
  }

  private async updateCache(userId: string, stats: StatsData): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.stats_cache.upsert({
      id: `${userId}-${stats.period}`,
      user_id: userId,
      period: stats.period,
      total_expenses: stats.totalExpenses,
      total_income: stats.totalIncome,
      expense_count: stats.expenseCount,
      top_categories: stats.topCategories,
      daily_average: stats.dailyAverage,
      monthly_average: stats.monthlyAverage,
      calculated_at: now,
      updated_at: now,
    });
  }

  async invalidateCache(userId: string, period?: string): Promise<void> {
    const db = getDatabase();

    if (period) {
      await db.stats_cache
        .find({
          selector: {
            user_id: userId,
            period,
          },
        })
        .remove();
    } else {
      await db.stats_cache
        .find({
          selector: {
            user_id: userId,
          },
        })
        .remove();
    }
  }
}

export const statsService = new StatsService();
