// Sync Service v3.0
import { replicateRxCollection } from "rxdb/plugins/replication";
import { Subject } from "rxjs";
import { supabase } from "@/lib/supabase";
import { getDatabase } from "@/lib/rxdb";
import { syncLogger } from "@/lib/logger";

export type SyncStatus = "idle" | "syncing" | "error" | "completed";

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  error: string | null;
}

class SyncService {
  private replications = new Map();
  private syncStateSubject = new Subject();
  private currentState = {
    status: "idle" as SyncStatus,
    lastSync: null as Date | null,
    error: null as string | null,
  };

  get stateObservable() {
    return this.syncStateSubject.asObservable();
  }

  getCurrentState() {
    return { ...this.currentState };
  }

  async startSync(userId: string) {
    syncLogger.info("Starting sync for user:", userId);
    try {
      const db = getDatabase();
      this.currentState.status = "syncing";
      this.syncStateSubject.next(this.currentState);

      const collections = [
        "users",
        "categories",
        "expenses",
        "groups",
        "group_members",
        "shared_expenses",
      ] as const;

      for (const collectionName of collections) {
        const collection = db[collectionName];
        if (!collection) continue;

        const replicationState = replicateRxCollection({
          collection,
          replicationIdentifier: `supabase-${collectionName}-${userId}`,
          live: true,
          pull: {
            async handler(
              checkpoint: { updated_at: string } | undefined,
              batchSize: number
            ) {
              const minTimestamp =
                checkpoint?.updated_at || new Date(0).toISOString();
              const result = await supabase
                .from(collectionName)
                .select("*")
                .gte("updated_at", minTimestamp)
                .order("updated_at", { ascending: true })
                .limit(batchSize);

              if (result.error) throw result.error;
              const documents = result.data || [];
              const lastDoc = documents[documents.length - 1];

              return {
                documents,
                checkpoint: lastDoc
                  ? { updated_at: lastDoc.updated_at }
                  : checkpoint,
              };
            },
            batchSize: 100,
          },
          push: {
            async handler(rows) {
              const documents = rows.map((row) => row.newDocumentState);
              for (const doc of documents) {
                await supabase
                  .from(collectionName)
                  .upsert(doc, { onConflict: "id" });
              }
              return [];
            },
            batchSize: 50,
          },
        });

        this.replications.set(collectionName, replicationState);
      }

      this.currentState.status = "completed";
      this.currentState.lastSync = new Date();
      this.syncStateSubject.next(this.currentState);
    } catch (error: unknown) {
      this.currentState.status = "error";
      this.currentState.error =
        error instanceof Error ? error.message : "Unknown error";
      this.syncStateSubject.next(this.currentState);
      throw error;
    }
  }

  async stopSync() {
    for (const replication of this.replications.values()) {
      await replication.cancel();
    }
    this.replications.clear();
    this.currentState.status = "idle";
    this.syncStateSubject.next(this.currentState);
  }

  async triggerManualSync() {
    for (const replication of this.replications.values()) {
      await replication.reSync();
    }
  }

  isSyncing() {
    return this.currentState.status === "syncing";
  }
}

export const syncService = new SyncService();
