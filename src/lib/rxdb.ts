/**
 * RxDB Database Setup - v3.0
 * Local-first database with reactive queries and Supabase sync
 */

import {
  createRxDatabase,
  addRxPlugin,
  type RxDatabase,
  type RxCollection,
  type RxDumpDatabaseAny,
} from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { dbLogger } from "./logger";

import {
  userSchema,
  categorySchema,
  expenseSchema,
  groupSchema,
  groupMemberSchema,
  sharedExpenseSchema,
  sharedExpenseSplitSchema,
  statsCacheSchema,
} from "./rxdb-schemas";

// Add plugins
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

// Collection types
export type UserCollection = RxCollection;
export type CategoryCollection = RxCollection;
export type ExpenseCollection = RxCollection;
export type GroupCollection = RxCollection;
export type GroupMemberCollection = RxCollection;
export type SharedExpenseCollection = RxCollection;
export type SharedExpenseSplitCollection = RxCollection;
export type StatsCacheCollection = RxCollection;

export type MyMoneyCollections = {
  users: UserCollection;
  categories: CategoryCollection;
  expenses: ExpenseCollection;
  groups: GroupCollection;
  group_members: GroupMemberCollection;
  shared_expenses: SharedExpenseCollection;
  shared_expense_splits: SharedExpenseSplitCollection;
  stats_cache: StatsCacheCollection;
};

export type MyMoneyDatabase = RxDatabase<MyMoneyCollections>;

let dbInstance: MyMoneyDatabase | null = null;

/**
 * Initialize RxDB database
 * This should be called once at app startup
 */
export async function initDatabase(): Promise<MyMoneyDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbLogger.info("Initializing RxDB database...");

  try {
    // Create database with validation
    const db = await createRxDatabase<MyMoneyCollections>({
      name: "mymoney_v3",
      storage: wrappedValidateAjvStorage({
        storage: getRxStorageDexie(),
      }),
      multiInstance: true,
      eventReduce: true,
      cleanupPolicy: {
        minimumDeletedTime: 1000 * 60 * 60 * 24 * 30, // 30 days
        minimumCollectionAge: 1000 * 60, // 1 minute
        runEach: 1000 * 60 * 5, // 5 minutes
        awaitReplicationsInSync: true,
        waitForLeadership: true,
      },
    });

    dbLogger.info("Creating collections...");

    // Add collections
    await db.addCollections({
      users: {
        schema: userSchema,
      },
      categories: {
        schema: categorySchema,
      },
      expenses: {
        schema: expenseSchema,
      },
      groups: {
        schema: groupSchema,
      },
      group_members: {
        schema: groupMemberSchema,
      },
      shared_expenses: {
        schema: sharedExpenseSchema,
      },
      shared_expense_splits: {
        schema: sharedExpenseSplitSchema,
      },
      stats_cache: {
        schema: statsCacheSchema,
      },
    });

    dbLogger.success("RxDB database initialized successfully");

    // Set up leader election
    db.waitForLeadership().then(() => {
      dbLogger.info("This tab is now the leader");
    });

    dbInstance = db;
    return db;
  } catch (error) {
    dbLogger.error("Failed to initialize RxDB:", error);
    throw error;
  }
}

/**
 * Get the database instance
 * Throws error if database is not initialized
 */
export function getDatabase(): MyMoneyDatabase {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.remove();
    dbInstance = null;
    dbLogger.info("Database closed");
  }
}

/**
 * Remove the entire database
 * WARNING: This will delete all local data!
 */
export async function removeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.remove();
    dbInstance = null;
    dbLogger.warn("Database removed - all local data deleted");
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return dbInstance !== null;
}

/**
 * Export database for debugging
 */
export async function exportDatabase(): Promise<any> {
  const db = getDatabase();
  return db.exportJSON();
}

/**
 * Import database from JSON
 */
export async function importDatabase(
  json: RxDumpDatabaseAny<MyMoneyCollections>
): Promise<void> {
  const db = getDatabase();
  await db.importJSON(json);
}
