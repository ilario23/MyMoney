/**
 * RxDB Schema Definitions - v3.0
 * JSON Schema for all collections in the local database
 */

import type { RxJsonSchema } from "rxdb";

// TypeScript Types for Documents
export type UserDocType = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type CategoryDocType = {
  id: string;
  user_id?: string | null;
  group_id?: string | null;
  name: string;
  icon: string;
  color: string;
  parent_id?: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type ExpenseDocType = {
  id: string;
  user_id: string;
  group_id?: string | null;
  category_id?: string | null;
  amount: number;
  description?: string | null;
  notes?: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type GroupDocType = {
  id: string;
  name: string;
  description?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type GroupMemberDocType = {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type SharedExpenseDocType = {
  id: string;
  expense_id: string;
  group_id: string;
  creator_id: string;
  split_method: "equal" | "percentage" | "custom";
  participants: Array<{
    user_id: string;
    amount: number;
    settled: boolean;
  }>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type SharedExpenseSplitDocType = {
  id: string;
  shared_expense_id: string;
  user_id: string;
  amount: number;
  paid: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type StatsCacheDocType = {
  id: string;
  user_id: string;
  total_expenses: number;
  total_income: number;
  expense_count: number;
  income_count: number;
  top_category?: string | null;
  avg_expense: number;
  cached_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

// User schema
export const userSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    email: {
      type: "string",
    },
    full_name: {
      type: ["string", "null"],
    },
    avatar_url: {
      type: ["string", "null"],
    },
    preferred_language: {
      type: "string",
      default: "en",
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    deleted_at: {
      type: ["string", "null"],
      format: "date-time",
    },
  },
  required: ["id", "email", "created_at", "updated_at"],
  indexes: ["updated_at", "deleted_at"],
};

// Category schema
export const categorySchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    user_id: {
      type: ["string", "null"],
      ref: "users",
    },
    name: {
      type: "string",
    },
    icon: {
      type: ["string", "null"],
    },
    color: {
      type: ["string", "null"],
    },
    type: {
      type: "string",
      enum: ["expense", "income"],
      default: "expense",
    },
    parent_id: {
      type: ["string", "null"],
      ref: "categories",
    },
    is_active: {
      type: "boolean",
      default: true,
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    deleted_at: {
      type: ["string", "null"],
      format: "date-time",
    },
  },
  required: ["id", "name", "created_at", "updated_at"],
  indexes: ["user_id", "parent_id", "updated_at", "deleted_at"],
};

// Expense schema
export const expenseSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    user_id: {
      type: "string",
      ref: "users",
    },
    amount: {
      type: "number",
    },
    description: {
      type: ["string", "null"],
    },
    category_id: {
      type: ["string", "null"],
      ref: "categories",
    },
    date: {
      type: "string",
      format: "date",
    },
    notes: {
      type: ["string", "null"],
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    deleted_at: {
      type: ["string", "null"],
      format: "date-time",
    },
  },
  required: ["id", "user_id", "amount", "date", "created_at", "updated_at"],
  indexes: ["user_id", "category_id", "date", "updated_at", "deleted_at"],
};

// Group schema
export const groupSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
    },
    description: {
      type: ["string", "null"],
    },
    owner_id: {
      type: "string",
      ref: "users",
    },
    invite_code: {
      type: ["string", "null"],
    },
    invite_code_expires_at: {
      type: ["string", "null"],
      format: "date-time",
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    deleted_at: {
      type: ["string", "null"],
      format: "date-time",
    },
  },
  required: ["id", "name", "owner_id", "created_at", "updated_at"],
  indexes: ["owner_id", "invite_code", "updated_at", "deleted_at"],
};

// Group member schema
export const groupMemberSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    group_id: {
      type: "string",
      ref: "groups",
    },
    user_id: {
      type: "string",
      ref: "users",
    },
    role: {
      type: "string",
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    joined_at: {
      type: "string",
      format: "date-time",
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    deleted_at: {
      type: ["string", "null"],
      format: "date-time",
    },
  },
  required: ["id", "group_id", "user_id", "created_at", "updated_at"],
  indexes: ["group_id", "user_id", "updated_at", "deleted_at"],
};

// Shared expense schema (matches Supabase SQL)
export const sharedExpenseSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    expense_id: {
      type: "string",
      ref: "expenses",
    },
    group_id: {
      type: "string",
      ref: "groups",
    },
    creator_id: {
      type: "string",
      ref: "users",
    },
    split_method: {
      type: "string",
      enum: ["equal", "percentage", "custom"],
      default: "equal",
    },
    participants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          amount: { type: "number" },
          settled: { type: "boolean" },
        },
        required: ["user_id", "amount", "settled"],
      },
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    deleted_at: {
      type: ["string", "null"],
      format: "date-time",
    },
  },
  required: [
    "id",
    "expense_id",
    "group_id",
    "creator_id",
    "split_method",
    "participants",
    "created_at",
    "updated_at",
  ],
  indexes: ["expense_id", "group_id", "creator_id", "updated_at", "deleted_at"],
};

// Shared expense split schema
export const sharedExpenseSplitSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    shared_expense_id: {
      type: "string",
      ref: "shared_expenses",
    },
    user_id: {
      type: "string",
      ref: "users",
    },
    amount: {
      type: "number",
    },
    percentage: {
      type: ["number", "null"],
    },
    shares: {
      type: ["integer", "null"],
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    deleted_at: {
      type: ["string", "null"],
      format: "date-time",
    },
  },
  required: [
    "id",
    "shared_expense_id",
    "user_id",
    "amount",
    "created_at",
    "updated_at",
  ],
  indexes: ["shared_expense_id", "user_id", "updated_at"],
};

// Stats cache schema - Local-only, not synced
export const statsCacheSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    user_id: {
      type: "string",
      ref: "users",
    },
    period: {
      type: "string", // e.g., '2025-10', 'all-time'
    },
    total_expenses: {
      type: "number",
    },
    total_income: {
      type: "number",
    },
    expense_count: {
      type: "integer",
    },
    top_categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category_id: { type: "string" },
          category_name: { type: "string" },
          amount: { type: "number" },
          count: { type: "integer" },
        },
      },
    },
    daily_average: {
      type: "number",
    },
    monthly_average: {
      type: "number",
    },
    calculated_at: {
      type: "string",
      format: "date-time",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
  },
  required: ["id", "user_id", "period", "calculated_at", "updated_at"],
  indexes: ["user_id", "period", "updated_at"],
};
