// Stats Service v3.0 - Local statistics calculation
import { getDatabase } from "@/lib/db";
import type { ExpenseDocType, StatsCacheDocType } from "@/lib/db-schemas";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface StatsData {
  period: string;
  totalExpenses: number;
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
      .where("id")
      .equals(`${userId}-${periodKey}`)
      .first();

    if (cached && this.isCacheValid(cached.updated_at)) {
      return this.mapCacheToStats(cached);
    }

    // Calculate from local data
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const expenses = await db.expenses
      .where("user_id")
      .equals(userId)
      .filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= start && expDate <= end && !exp.deleted_at;
      })
      .toArray();

    const stats = this.processExpenses(expenses, periodKey);

    // Update cache
    await this.updateCache(userId, stats);

    return stats;
  }

  private processExpenses(
    expenses: ExpenseDocType[],
    period: string
  ): StatsData {
    let totalExpenses = 0;
    const categoryMap = new Map();

    for (const expense of expenses) {
      totalExpenses += expense.amount;

      const catId = expense.category_id || "uncategorized";
      const existing = categoryMap.get(catId) || {
        count: 0,
        amount: 0,
        name: "Uncategorized",
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
      expenseCount: expenses.length,
      topCategories,
      dailyAverage,
      monthlyAverage: totalExpenses,
    };
  }

  private isCacheValid(updatedAt: string): boolean {
    const cacheAge = Date.now() - new Date(updatedAt).getTime();
    const maxAge = 1000 * 60 * 30; // 30 minutes
    return cacheAge < maxAge;
  }

  private mapCacheToStats(cached: StatsCacheDocType): StatsData {
    const topCategories = (cached.top_categories || []).map((cat: any) => ({
      categoryId: cat.category_id,
      categoryName: cat.category_name,
      amount: cat.amount,
      count: cat.count,
    }));

    return {
      period: cached.period,
      totalExpenses: cached.total_expenses,
      expenseCount: cached.expense_count,
      topCategories,
      dailyAverage: cached.daily_average,
      monthlyAverage: cached.monthly_average,
    };
  }

  private async updateCache(userId: string, stats: StatsData): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.stats_cache.put({
      id: `${userId}-${stats.period}`,
      user_id: userId,
      period: stats.period,
      total_expenses: stats.totalExpenses,
      expense_count: stats.expenseCount,
      top_categories: stats.topCategories.map((cat) => ({
        category_id: cat.categoryId,
        category_name: cat.categoryName,
        amount: cat.amount,
        count: cat.count,
      })),
      daily_average: stats.dailyAverage,
      monthly_average: stats.monthlyAverage,
      updated_at: now,
    });
  }

  async invalidateCache(userId: string, period?: string): Promise<void> {
    const db = getDatabase();

    if (period) {
      const cached = await db.stats_cache
        .where("id")
        .equals(`${userId}-${period}`)
        .first();
      if (cached) {
        await db.stats_cache.delete(cached.id);
      }
    } else {
      await db.stats_cache.where("user_id").equals(userId).delete();
    }
  }
}

export const statsService = new StatsService();
