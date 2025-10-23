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
  full_name?: string | null;
  avatar_url?: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Category document type
 */
export interface CategoryDocType {
  id: string;
  user_id?: string | null;
  name: string;
  icon?: string | null;
  color?: string | null;
  type: "expense" | "income";
  parent_id?: string | null;
  is_active: boolean;
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
  category_id?: string | null;
  amount: number;
  description?: string | null;
  notes?: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Stats cache document type (local-only, not synced)
 */
export interface StatsCacheDocType {
  id: string;
  user_id: string;
  period: string; // e.g., '2025-10', 'all-time'
  total_expenses: number;
  total_income: number;
  expense_count: number;
  income_count: number;
  top_categories?: Array<{
    category_id: string;
    category_name: string;
    amount: number;
    count: number;
  }>;
  daily_average: number;
  monthly_average: number;
  calculated_at: string;
  updated_at: string;
}
