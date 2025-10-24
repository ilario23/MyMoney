// Stats Service v3.0 - Local statistics calculation
import { getDatabase } from "@/lib/db";
import type { TransactionDocType, StatsCacheDocType } from "@/lib/db-schemas";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface StatsData {
  period: string;
  totalTransactions: number;
  transactionCount: number;
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

    const transactions = await db.transactions
      .where("user_id")
      .equals(userId)
      .filter((trx) => {
        const trxDate = new Date(trx.date);
        return trxDate >= start && trxDate <= end && !trx.deleted_at;
      })
      .toArray();

    // Load categories for id->name mapping
    const userCategories = await db.categories
      .where("user_id")
      .equals(userId)
      .toArray();
    const categoryIdMap = new Map(userCategories.map((c) => [c.id, c.name]));

    const stats = this.processTransactions(
      transactions,
      periodKey,
      categoryIdMap
    );

    // Update cache
    await this.updateCache(userId, stats);

    return stats;
  }

  private processTransactions(
    transactions: TransactionDocType[],
    period: string,
    categoryIdMap: Map<string, string>
  ): StatsData {
    // Only consider expenses (amount > 0, type === 'expense') for stats
    const expenses = transactions.filter(
      (trx) => trx.amount > 0 && trx.type === "expense"
    );
    let totalExpenses = 0;
    const categoryMap = new Map();

    for (const transaction of expenses) {
      totalExpenses += transaction.amount;

      const catId = transaction.category_id || "uncategorized";
      const existing = categoryMap.get(catId) || {
        count: 0,
        amount: 0,
        name: categoryIdMap.get(catId) || "Sconosciuta",
      };
      existing.count++;
      existing.amount += transaction.amount;
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
      totalTransactions: totalExpenses,
      transactionCount: expenses.length,
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
      totalTransactions: cached.total_expenses,
      transactionCount: cached.expense_count,
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
      total_expenses: stats.totalTransactions,
      expense_count: stats.transactionCount,
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
