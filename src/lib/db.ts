/**
 * Dexie Database Setup - Local First
 * Uses IndexedDB via Dexie for offline-first functionality
 */

import Dexie, { type Table } from "dexie";
import { dbLogger } from "./logger";
import type {
  UserDocType,
  CategoryDocType,
  TransactionDocType,
  StatsCacheDocType,
} from "./db-schemas";

/**
 * MyMoneyDB - Main database class
 * Local-first with Dexie.Observable for reactivity
 */
export class MyMoneyDB extends Dexie {
  users!: Table<UserDocType>;
  categories!: Table<CategoryDocType>;
  transactions!: Table<TransactionDocType>;
  stats_cache!: Table<StatsCacheDocType>;

  constructor() {
    super("mymoney_local");
    this.version(1).stores({
      users: "id, email, updated_at",
      categories: "id, user_id, updated_at",
      transactions: "id, user_id, category_id, date, updated_at",
      stats_cache: "id, user_id, period, updated_at",
    });
  }
}

// Global database instance
let dbInstance: MyMoneyDB | null = null;

/**
 * Initialize database
 */
export async function initDatabase(): Promise<MyMoneyDB> {
  if (dbInstance) {
    return dbInstance;
  }

  dbLogger.info("Initializing Dexie database...");

  try {
    dbInstance = new MyMoneyDB();

    // Test if database is accessible
    const userCount = await dbInstance.users.count();
    dbLogger.success(
      `Dexie database initialized successfully (${userCount} users)`
    );

    return dbInstance;
  } catch (error) {
    dbLogger.error("Failed to initialize Dexie database:", error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getDatabase(): MyMoneyDB {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    dbLogger.info("Database closed");
  }
}

/**
 * Clear all data from database
 * WARNING: This will delete all local data!
 */
export async function clearDatabase(): Promise<void> {
  const db = getDatabase();
  try {
    await db.delete();
    dbInstance = null;
    dbLogger.warn("Database cleared - all local data deleted");
  } catch (error) {
    dbLogger.error("Failed to clear database:", error);
    throw error;
  }
}

/**
 * Export database to JSON
 */
export async function exportDatabaseJSON(): Promise<Record<string, any[]>> {
  const db = getDatabase();
  const result: Record<string, any[]> = {};

  result.users = await db.users.toArray();
  result.categories = await db.categories.toArray();
  result.transactions = await db.transactions.toArray();
  result.stats_cache = await db.stats_cache.toArray();

  return result;
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return dbInstance !== null;
}
