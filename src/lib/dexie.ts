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
  isActive: boolean; // false = hidden from expense form (but visible in hierarchy)
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
  inviteCode?: string; // Reusable invite code (v1.10)
  allowNewMembers: boolean; // Owner can allow/disallow new members (v1.10)
  usedByUserId?: string; // DEPRECATED - kept for backwards compatibility
  usedAt?: Date; // DEPRECATED - kept for backwards compatibility
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

    // v3: Add isActive field to categories
    this.version(3)
      .stores({
        users: "id, email",
        expenses: "id, userId, [userId+date], groupId, isSynced",
        categories: "id, userId, parentId, isActive",
        groups: "id, ownerId",
        groupMembers: "[groupId+userId], groupId",
        sharedExpenses: "id, groupId, creatorId",
        syncLogs: "++id, userId, lastSyncTime",
      })
      .upgrade((tx) => {
        // Set isActive = true for all existing categories
        return tx
          .table("categories")
          .toCollection()
          .modify((category) => {
            category.isActive = true;
          });
      });

    // v4: Add invite code fields to groups
    this.version(4)
      .stores({
        users: "id, email",
        expenses: "id, userId, [userId+date], groupId, isSynced",
        categories: "id, userId, parentId, isActive",
        groups: "id, ownerId, inviteCode",
        groupMembers: "[groupId+userId], groupId",
        sharedExpenses: "id, groupId, creatorId",
        syncLogs: "++id, userId, lastSyncTime",
      })
      .upgrade(() => {
        // No data migration needed - new fields will be undefined for existing groups
        return Promise.resolve();
      });

    // v5: Add userId index to groupMembers for efficient member group lookups
    this.version(5)
      .stores({
        users: "id, email",
        expenses: "id, userId, [userId+date], groupId, isSynced",
        categories: "id, userId, parentId, isActive",
        groups: "id, ownerId, inviteCode",
        groupMembers: "[groupId+userId], groupId, userId",
        sharedExpenses: "id, groupId, creatorId",
        syncLogs: "++id, userId, lastSyncTime",
      })
      .upgrade(() => {
        // No data migration needed - just adding index
        return Promise.resolve();
      });

    // v6: Add allowNewMembers field to groups for reusable invite codes
    this.version(6)
      .stores({
        users: "id, email",
        expenses: "id, userId, [userId+date], groupId, isSynced",
        categories: "id, userId, parentId, isActive",
        groups: "id, ownerId, inviteCode",
        groupMembers: "[groupId+userId], groupId, userId",
        sharedExpenses: "id, groupId, creatorId",
        syncLogs: "++id, userId, lastSyncTime",
      })
      .upgrade((tx) => {
        // Set allowNewMembers = true for all existing groups
        return tx
          .table("groups")
          .toCollection()
          .modify((group) => {
            group.allowNewMembers = true;
          });
      });
  }
}

export const db = new ExpenseTrackerDB();
