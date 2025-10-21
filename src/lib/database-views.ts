import { supabase } from '@/lib/supabase';

/**
 * Utility per accedere alle Database Views ottimizzate
 * Le viste sono pre-calcolate su Supabase per migliori performance
 */

export interface UserExpenseSummary {
  user_id: string;
  total_expenses: number;
  total_amount: number;
  avg_expense: number;
  first_expense_date: string | null;
  last_expense_date: string | null;
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
  month: string; // ISO date string truncated to month
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
  first_expense_date: string | null;
  last_expense_date: string | null;
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

/**
 * Ottieni riepilogo spese utente
 */
export async function getUserExpenseSummary(userId: string): Promise<UserExpenseSummary | null> {
  const { data, error } = await supabase
    .from('user_expense_summary')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Views] Error fetching user summary:', error);
    return null;
  }

  return data;
}

/**
 * Ottieni statistiche per categoria
 */
export async function getUserCategoryStats(userId: string): Promise<UserCategoryStats[]> {
  const { data, error } = await supabase
    .from('user_category_stats')
    .select('*')
    .eq('user_id', userId)
    .order('total_amount', { ascending: false });

  if (error) {
    console.error('[Views] Error fetching category stats:', error);
    return [];
  }

  return data || [];
}

/**
 * Ottieni spese mensili aggregate
 */
export async function getMonthlyExpenseSummary(
  userId: string,
  months?: number
): Promise<MonthlyExpenseSummary[]> {
  let query = supabase
    .from('monthly_expense_summary')
    .select('*')
    .eq('user_id', userId)
    .order('month', { ascending: false });

  if (months) {
    query = query.limit(months);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Views] Error fetching monthly summary:', error);
    return [];
  }

  return data || [];
}

/**
 * Ottieni statistiche gruppo
 */
export async function getGroupExpenseSummary(groupId: string): Promise<GroupExpenseSummary | null> {
  const { data, error } = await supabase
    .from('group_expense_summary')
    .select('*')
    .eq('group_id', groupId)
    .maybeSingle();

  if (error) {
    console.error('[Views] Error fetching group summary:', error);
    return null;
  }

  return data;
}

/**
 * Ottieni tutte le statistiche dei gruppi dell'utente
 */
export async function getUserGroupsSummary(userId: string): Promise<GroupExpenseSummary[]> {
  const { data, error } = await supabase
    .from('group_expense_summary')
    .select('*')
    .eq('owner_id', userId)
    .order('total_amount', { ascending: false });

  if (error) {
    console.error('[Views] Error fetching user groups summary:', error);
    return [];
  }

  return data || [];
}

/**
 * Ottieni dettagli spese condivise
 */
export async function getSharedExpenseDetails(groupId: string): Promise<SharedExpenseDetails[]> {
  const { data, error } = await supabase
    .from('shared_expense_details')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[Views] Error fetching shared expense details:', error);
    return [];
  }

  return data || [];
}

/**
 * Ottieni statistiche utilizzo categorie
 */
export async function getCategoryUsageStats(
  userId: string,
  includeInactive = false
): Promise<CategoryUsageStats[]> {
  let query = supabase
    .from('category_usage_stats')
    .select('*')
    .eq('user_id', userId);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  query = query.order('usage_count', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[Views] Error fetching category usage stats:', error);
    return [];
  }

  return data || [];
}

/**
 * Ottieni top categorie per spesa totale
 */
export async function getTopCategoriesByAmount(
  userId: string,
  limit = 5
): Promise<CategoryUsageStats[]> {
  const { data, error } = await supabase
    .from('category_usage_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('total_amount', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Views] Error fetching top categories:', error);
    return [];
  }

  return data || [];
}

/**
 * Ottieni categorie più usate
 */
export async function getMostUsedCategories(
  userId: string,
  limit = 5
): Promise<CategoryUsageStats[]> {
  const { data, error } = await supabase
    .from('category_usage_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('usage_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Views] Error fetching most used categories:', error);
    return [];
  }

  return data || [];
}
