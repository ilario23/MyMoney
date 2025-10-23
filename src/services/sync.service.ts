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
   * Start sync - pulls from Supabase and pushes local changes
   */
  async startSync(userId: string): Promise<void> {
    if (!this.isOnline) {
      syncLogger.warn("Offline - skipping sync");
      return;
    }

    syncLogger.info("Starting sync for user:", userId);
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

      syncLogger.success("Sync completed");
    } catch (error: unknown) {
      this.currentState.status = "error";
      this.currentState.error =
        error instanceof Error ? error.message : "Unknown error";
      this.notifyListeners();
      syncLogger.error("Sync error:", error);
      throw error;
    }
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
      }
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
}

export const syncService = new SyncService();
