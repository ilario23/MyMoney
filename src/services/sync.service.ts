/**
 * Sync Service - Local-First with Dexie
 * Syncs data with Supabase when available, local-first approach
 */

import { supabase } from "@/lib/supabase";
import { getDatabase } from "@/lib/db";
import { syncLogger } from "@/lib/logger";

export type SyncStatus = "idle" | "syncing" | "error" | "completed";

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  error: string | null;
}

class SyncService {
  private listeners: Set<(state: SyncState) => void> = new Set();
  private currentState: SyncState = {
    status: "idle",
    lastSync: null,
    error: null,
  };
  private isOnline = navigator.onLine;

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getCurrentState()));
  }

  getCurrentState(): SyncState {
    return { ...this.currentState };
  }

  constructor() {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true;
      syncLogger.info("App is online");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      syncLogger.warn("App is offline - working locally only");
    });
  }

  /**
   * Initialize app at startup: Load from local Dexie first, then sync with Supabase in background
   * This ensures the app is responsive immediately, showing local data while syncing remotely
   */
  async initializeAtStartup(userId: string): Promise<void> {
    syncLogger.info("Initializing app - loading from local storage first");
    // Local data is already in Dexie from before, ready to use immediately

    // Then start background sync in the background (don't await)
    if (this.isOnline) {
      syncLogger.info("Online detected - starting background sync");
      // Fire and forget - don't block UI
      this.backgroundSync(userId).catch((error) => {
        syncLogger.error("Background sync error:", error);
      });
    } else {
      syncLogger.warn("Offline at startup - will sync when online");
    }
  }

  /**
   * Background sync - doesn't block UI or throw errors
   * Called automatically when coming online or after data changes
   */
  private async backgroundSync(userId: string): Promise<void> {
    if (!this.isOnline) {
      syncLogger.warn("Offline - skipping background sync");
      return;
    }

    syncLogger.info("Starting background sync for user:", userId);
    this.currentState.status = "syncing";
    this.notifyListeners();

    try {
      const collections = ["users", "categories", "expenses"] as const;

      for (const collectionName of collections) {
        await this.syncCollection(collectionName, userId);
      }

      this.currentState.status = "completed";
      this.currentState.lastSync = new Date();
      this.currentState.error = null;
      this.notifyListeners();

      syncLogger.success("Background sync completed");
    } catch (error: unknown) {
      this.currentState.status = "error";
      this.currentState.error =
        error instanceof Error ? error.message : "Unknown error";
      this.notifyListeners();
      syncLogger.error("Background sync error:", error);
      // Don't rethrow - background sync should fail gracefully
    }
  }

  /**
   * Start sync - pulls from Supabase and pushes local changes
   * Can be called manually or triggered automatically
   */
  async startSync(userId: string): Promise<void> {
    if (!this.isOnline) {
      syncLogger.warn("Offline - skipping sync");
      return;
    }

    syncLogger.info("Starting manual sync for user:", userId);
    return this.backgroundSync(userId);
  }

  /**
   * Sync a single collection
   * Note: Users are PULL-ONLY (read from Supabase)
   *       Categories and Expenses are PULL + PUSH (bidirectional sync)
   */
  private async syncCollection(
    collectionName: "users" | "categories" | "expenses",
    userId: string
  ): Promise<void> {
    try {
      // Always pull from Supabase
      await this.pullFromSupabase(collectionName, userId);

      // Only push changes for categories and expenses
      if (collectionName !== "users") {
        await this.pushToSupabase(collectionName, userId);
      }
    } catch (error) {
      syncLogger.error(`Failed to sync ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Pull changes from Supabase
   * Excludes soft-deleted records (deleted_at IS NULL)
   */
  private async pullFromSupabase(
    collectionName: "users" | "categories" | "expenses",
    userId: string
  ): Promise<void> {
    // Get last sync time from localStorage
    const lastSyncKey = `last_sync_${collectionName}`;
    const lastSync = localStorage.getItem(lastSyncKey);
    const minTimestamp = lastSync || new Date(0).toISOString();

    let query = supabase
      .from(collectionName)
      .select("*")
      .gte("updated_at", minTimestamp)
      .is("deleted_at", null) // ← Filter out soft-deleted records
      .order("updated_at", { ascending: true });

    // Filter by user_id for collections that have it
    if (collectionName !== "users") {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return;
    }

    // Upsert data into local database
    const db = getDatabase();
    const table = db[collectionName as keyof typeof db] as any;
    for (const doc of data) {
      await table.put(doc);
    }

    // Update last sync time
    localStorage.setItem(lastSyncKey, new Date().toISOString());
    syncLogger.info(`Pulled ${data.length} items from ${collectionName}`);
  }

  /**
   * Push local changes to Supabase
   * Called only for categories and expenses, never for users
   * Uses INSERT or UPDATE separately to respect RLS policies
   */
  private async pushToSupabase(
    collectionName: "categories" | "expenses",
    userId: string
  ): Promise<void> {
    const db = getDatabase();
    const table = db[collectionName as keyof typeof db] as any;

    // Get all local documents filtered by user_id
    let localDocs = await table.toArray();
    localDocs = localDocs.filter((doc: any) => doc.user_id === userId);

    if (localDocs.length === 0) {
      return;
    }

    // Separate into new (INSERT) and existing (UPDATE) docs
    const newDocs: any[] = [];
    const updateDocs: any[] = [];
    const syncedIds: string[] = [];

    // First, fetch existing IDs from Supabase
    const { data: existing } = await supabase
      .from(collectionName)
      .select("id")
      .eq("user_id", userId);

    const existingIds = new Set(existing?.map((doc: any) => doc.id) || []);

    // Separate docs
    localDocs.forEach((doc: any) => {
      if (existingIds.has(doc.id)) {
        updateDocs.push(doc);
      } else {
        newDocs.push(doc);
      }
    });

    // INSERT new docs
    if (newDocs.length > 0) {
      const { error: insertError } = await supabase
        .from(collectionName)
        .insert(newDocs);

      if (insertError) {
        throw insertError;
      }
      
      newDocs.forEach((doc) => syncedIds.push(doc.id));
    }

    // UPDATE existing docs
    if (updateDocs.length > 0) {
      for (const doc of updateDocs) {
        const { error: updateError } = await supabase
          .from(collectionName)
          .update(doc)
          .eq("id", doc.id);

        if (updateError) {
          throw updateError;
        }
        
        syncedIds.push(doc.id);
      }
    }

    // Mark all synced items in local database
    if (syncedIds.length > 0) {
      await this.markAsSynced(collectionName, syncedIds);
    }

    syncLogger.info(
      `Pushed ${newDocs.length} new and ${updateDocs.length} updated items to ${collectionName}`
    );
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(): Promise<void> {
    if (!this.isOnline) {
      syncLogger.warn("Cannot sync while offline");
      return;
    }
    // Will be called by auth store with userId
  }

  /**
   * Sync specific collections after a change
   * Fast, lightweight sync that doesn't update lastSync time
   * Used for incremental syncs after adding/updating individual items
   */
  async syncAfterChange(userId: string): Promise<void> {
    if (!this.isOnline) {
      syncLogger.info("Offline - data saved locally, will sync when online");
      return;
    }

    syncLogger.info("Syncing changes for user:", userId);

    try {
      // Only push categories and expenses (what the user just changed)
      const collectionsToSync = ["categories", "expenses"] as const;

      for (const collectionName of collectionsToSync) {
        await this.pushToSupabase(collectionName, userId);
      }

      this.currentState.lastSync = new Date();
      this.currentState.error = null;
      this.notifyListeners();

      syncLogger.success("Changes synced successfully");
    } catch (error: unknown) {
      syncLogger.error("Failed to sync changes:", error);
      this.currentState.error =
        error instanceof Error ? error.message : "Unknown error";
      this.notifyListeners();
      // Don't rethrow - app continues to work with local data
    }
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.currentState.status === "syncing";
  }

  /**
   * Check if online
   */
  isAppOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get count of unsynced changes in local database
   * Returns total number of items that have been modified but not yet synced
   */
  async getUnsyncedCount(userId: string): Promise<number> {
    const db = getDatabase();
    
    try {
      const unsyncedCategories = await db.categories
        .where('user_id')
        .equals(userId)
        .filter((cat: any) => {
          // Item is unsynced if:
          // 1. It has never been synced (synced_at is null)
          // 2. Or it was modified after last sync (updated_at > synced_at)
          if (!cat.synced_at) return true;
          return new Date(cat.updated_at) > new Date(cat.synced_at);
        })
        .toArray();

      const unsyncedExpenses = await db.expenses
        .where('user_id')
        .equals(userId)
        .filter((exp: any) => {
          if (!exp.synced_at) return true;
          return new Date(exp.updated_at) > new Date(exp.synced_at);
        })
        .toArray();

      const total = unsyncedCategories.length + unsyncedExpenses.length;
      
      if (total > 0) {
        syncLogger.info(`Found ${total} unsynced items (${unsyncedCategories.length} categories, ${unsyncedExpenses.length} expenses)`);
      }

      return total;
    } catch (error) {
      syncLogger.error("Error counting unsynced items:", error);
      return 0;
    }
  }

  /**
   * Get last successful sync timestamp
   * Used for efficient delta queries to Supabase
   */
  async getLastSuccessfulSyncTime(): Promise<string> {
    const lastSyncKey = 'last_sync_expenses';
    const lastSync = localStorage.getItem(lastSyncKey);
    
    if (lastSync) {
      return lastSync;
    }
    
    // If no sync has happened yet, return epoch
    return new Date(0).toISOString();
  }

  /**
   * Mark items as synced in local database
   * Updates synced_at timestamp for all given items
   */
  private async markAsSynced(
    collectionName: 'categories' | 'expenses',
    itemIds: string[]
  ): Promise<void> {
    if (itemIds.length === 0) return;

    const db = getDatabase();
    const table = db[collectionName as keyof typeof db] as any;
    const now = new Date().toISOString();

    for (const itemId of itemIds) {
      const item = await table.get(itemId);
      if (item) {
        await table.put({
          ...item,
          synced_at: now,
        });
      }
    }

    syncLogger.info(`Marked ${itemIds.length} items as synced in ${collectionName}`);
  }
}

export const syncService = new SyncService();
