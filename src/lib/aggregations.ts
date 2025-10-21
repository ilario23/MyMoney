/**
 * Aggregations - Utility functions per Database Views
 * Queste funzioni interrogano le Views PostgreSQL per statistiche pre-calcolate
 */

import { supabase } from "./supabase";

// ============================================
// TYPES - Corrispondono alle Views SQL
// ============================================

export interface UserExpenseSummary {
  user_id: string;
  total_expenses: number;
  total_amount: number;
  avg_expense: number;
  first_expense_date: string;
  last_expense_date: string;
  unique_categories: number;
}

export interface UserCategoryStats {
  user_id: string;
  category: string;
  expense_count: number;
  total_amount: number;
  avg_amount: number;
  first_expense: string;
  last_expense: string;
}

export interface MonthlyExpenseSummary {
  user_id: string;
  month: string; // YYYY-MM-01
  expense_count: number;
  total_amount: number;
  avg_amount: number;
  unique_categories: number;
}

export interface GroupExpenseSummary {
  group_id: string;
  group_name: string;
  owner_id: string;
  total_expenses: number;
  total_amount: number;
  member_count: number;
  first_expense_date: string;
  last_expense_date: string;
}

export interface SharedExpenseDetails {
  id: string;
  group_id: string;
  expense_id: string;
  creator_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  group_name: string;
  participant_count: number;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryUsageStats {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  icon: string;
  color: string;
  parent_id: string | null;
  is_active: boolean;
  usage_count: number;
  total_amount: number;
  last_used: string | null;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * 1. Riepilogo totale spese utente
 * Usa la view: user_expense_summary
 */
export async function getUserExpenseSummary(
  userId: string
): Promise<UserExpenseSummary | null> {
  const { data, error } = await supabase
    .from("user_expense_summary")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user expense summary:", error);
    return null;
  }

  return data;
}

/**
 * 2. Statistiche per categoria
 * Usa la view: user_category_stats
 */
export async function getUserCategoryStats(
  userId: string,
  orderBy: "total_amount" | "expense_count" | "category" = "total_amount"
): Promise<UserCategoryStats[]> {
  const { data, error } = await supabase
    .from("user_category_stats")
    .select("*")
    .eq("user_id", userId)
    .order(orderBy, { ascending: false });

  if (error) {
    console.error("Error fetching user category stats:", error);
    return [];
  }

  return data || [];
}

/**
 * 3. Spese mensili (ultimi N mesi)
 * Usa la view: monthly_expense_summary
 */
export async function getMonthlyExpenseSummary(
  userId: string,
  monthsCount: number = 12
): Promise<MonthlyExpenseSummary[]> {
  const { data, error } = await supabase
    .from("monthly_expense_summary")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false })
    .limit(monthsCount);

  if (error) {
    console.error("Error fetching monthly expense summary:", error);
    return [];
  }

  return data || [];
}

/**
 * 4. Statistiche gruppi
 * Usa la view: group_expense_summary
 */
export async function getGroupExpenseSummary(
  groupIds: string[]
): Promise<GroupExpenseSummary[]> {
  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from("group_expense_summary")
    .select("*")
    .in("group_id", groupIds);

  if (error) {
    console.error("Error fetching group expense summary:", error);
    return [];
  }

  return data || [];
}

/**
 * 5. Dettagli spese condivise
 * Usa la view: shared_expense_details
 */
export async function getSharedExpenseDetails(
  groupIds: string[]
): Promise<SharedExpenseDetails[]> {
  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from("shared_expense_details")
    .select("*")
    .in("group_id", groupIds)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching shared expense details:", error);
    return [];
  }

  return data || [];
}

/**
 * 6. Statistiche utilizzo categorie
 * Usa la view: category_usage_stats
 */
export async function getCategoryUsageStats(
  userId: string,
  orderBy: "usage_count" | "total_amount" | "last_used" = "usage_count"
): Promise<CategoryUsageStats[]> {
  const { data, error } = await supabase
    .from("category_usage_stats")
    .select("*")
    .eq("user_id", userId)
    .order(orderBy, { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Error fetching category usage stats:", error);
    return [];
  }

  return data || [];
}

/**
 * UTILITY: Top N categorie per spesa
 */
export async function getTopCategories(
  userId: string,
  limit: number = 5
): Promise<UserCategoryStats[]> {
  const { data, error } = await supabase
    .from("user_category_stats")
    .select("*")
    .eq("user_id", userId)
    .order("total_amount", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching top categories:", error);
    return [];
  }

  return data || [];
}

/**
 * UTILITY: Confronto mese corrente vs precedente
 */
export async function getCurrentVsPreviousMonth(userId: string): Promise<{
  current: MonthlyExpenseSummary | null;
  previous: MonthlyExpenseSummary | null;
  percentageChange: number;
}> {
  const months = await getMonthlyExpenseSummary(userId, 2);

  const current = months[0] || null;
  const previous = months[1] || null;

  let percentageChange = 0;
  if (current && previous && previous.total_amount > 0) {
    percentageChange =
      ((current.total_amount - previous.total_amount) / previous.total_amount) *
      100;
  }

  return { current, previous, percentageChange };
}
