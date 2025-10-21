import Dexie, { type Table } from "dexie";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string; // uuid - primary key
  userId: string; // chi ha creato la spesa
  groupId?: string; // se condivisa, altrimenti undefined
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
  isSynced: boolean; // true = sincronizzata con Supabase
  createdAt: Date;
  updatedAt: Date; // ultimo timestamp di modifica
  deletedAt?: Date; // soft delete
}

export interface Category {
  id: string; // uuid
  userId: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string; // uuid - hierarchical categories (null = top-level)
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string; // uuid
  name: string;
  ownerId: string;
  description?: string;
  color?: string;
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string; // uuid
  groupId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: Date;
  isSynced: boolean;
}

export interface SharedExpense {
  id: string; // uuid
  groupId: string;
  expenseId: string;
  creatorId: string;
  participants: {
    userId: string;
    amount: number;
    settled: boolean;
  }[];
  isRecurring: boolean;
  recurringRule?: string; // rrule format
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncLog {
  id?: number; // auto-increment per DB locale
  userId: string;
  lastSyncTime: Date;
  syncedRecords: number;
}

export class ExpenseTrackerDB extends Dexie {
  users!: Table<User>;
  expenses!: Table<Expense>;
  categories!: Table<Category>;
  groups!: Table<Group>;
  groupMembers!: Table<GroupMember>;
  sharedExpenses!: Table<SharedExpense>;
  syncLogs!: Table<SyncLog>;

  constructor() {
    super("ExpenseTrackerDB");
    this.version(2).stores({
      users: "id, email",
      expenses: "id, userId, [userId+date], groupId, isSynced",
      categories: "id, userId, parentId",
      groups: "id, ownerId",
      groupMembers: "[groupId+userId], groupId",
      sharedExpenses: "id, groupId, creatorId",
      syncLogs: "++id, userId, lastSyncTime",
    });
  }
}

export const db = new ExpenseTrackerDB();
