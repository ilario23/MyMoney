/**
 * Dexie Database Schema - Type Definitions
 * Local-first database schema for users, categories, and expenses only
 */

/**
 * User document type
 */
export interface UserDocType {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Category document type
 */
export interface CategoryDocType {
  id: string;
  user_id: string;
  name: string;
  icon: string; // Lucide icon name (e.g., "ShoppingCart", "TrendingUp")
  color?: string | null;
  type: "expense" | "income" | "investment"; // Category type
  parent_id?: string | null;
  is_active: boolean; // true = shown in transaction form, false = archived
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Expense document type
 */
export interface ExpenseDocType {
  id: string;
  user_id: string;
  category_id: string;
  type: "expense" | "income" | "investment"; // Transaction type
  amount: number;
  description?: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Stats cache document type (local-only, not synced with Supabase)
 */
export interface StatsCacheDocType {
  id: string;
  user_id: string;
  period: string; // e.g., '2025-10'
  total_expenses: number;
  expense_count: number;
  top_categories?: Array<{
    category_id: string;
    category_name: string;
    amount: number;
    count: number;
  }>;
  daily_average: number;
  monthly_average: number;
  updated_at: string;
}
