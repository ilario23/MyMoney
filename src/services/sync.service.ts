import { supabase } from "@/lib/supabase";
import { db } from "@/lib/dexie";

export interface SyncOptions {
  userId: string;
  force?: boolean;
  verbose?: boolean;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  error?: string;
}

/**
 * Sincronizzazione bidirezionale con Supabase
 * 1. Invia modifiche locali (isSynced = false)
 * 2. Riceve modifiche remote (updated_at > lastSync)
 * 3. Risolve conflitti (local wins se più recente)
 */
export class SyncService {
  private syncing = false;

  async sync(options: SyncOptions): Promise<SyncResult> {
    if (this.syncing) {
      console.log("Sync already in progress");
      return { success: false, synced: 0, failed: 0, conflicts: 0 };
    }

    this.syncing = true;

    try {
      let totalSynced = 0;
      let totalFailed = 0;
      let totalConflicts = 0;

      // Ottieni timestamp ultimo sync
      const lastSync = await this.getLastSyncTime(options.userId);

      if (options.verbose) {
        console.log(`[Sync] Starting sync. Last sync: ${lastSync}`);
      }

      // Sincronizza ogni entità
      const syncCategories = await this.syncCategories(
        options.userId,
        lastSync
      );
      totalSynced += syncCategories.synced;
      totalFailed += syncCategories.failed;

      const syncExpenses = await this.syncExpenses(options.userId, lastSync);
      totalSynced += syncExpenses.synced;
      totalFailed += syncExpenses.failed;
      totalConflicts += syncExpenses.conflicts;

      const syncGroups = await this.syncGroups(options.userId, lastSync);
      totalSynced += syncGroups.synced;
      totalFailed += syncGroups.failed;

      const syncMembers = await this.syncGroupMembers(options.userId, lastSync);
      totalSynced += syncMembers.synced;
      totalFailed += syncMembers.failed;

      const syncShared = await this.syncSharedExpenses(
        options.userId,
        lastSync
      );
      totalSynced += syncShared.synced;
      totalFailed += syncShared.failed;

      // Aggiorna sync log
      await db.syncLogs.add({
        userId: options.userId,
        lastSyncTime: new Date(),
        syncedRecords: totalSynced,
      });

      if (options.verbose) {
        console.log(
          `[Sync] Complete. Synced: ${totalSynced}, Failed: ${totalFailed}, Conflicts: ${totalConflicts}`
        );
      }

      return {
        success: totalFailed === 0,
        synced: totalSynced,
        failed: totalFailed,
        conflicts: totalConflicts,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";
      console.error("[Sync] Error:", errorMessage);
      return {
        success: false,
        synced: 0,
        failed: 1,
        conflicts: 0,
        error: errorMessage,
      };
    } finally {
      this.syncing = false;
    }
  }

  private async getLastSyncTime(userId: string): Promise<Date> {
    const log = await db.syncLogs
      .where("userId")
      .equals(userId)
      .reverse()
      .first();

    return log?.lastSyncTime || new Date(0);
  }

  private async syncCategories(userId: string, lastSync: Date) {
    let synced = 0;
    let failed = 0;

    try {
      // Invia categorie locali non sincronizzate
      const localUnsync = await db.categories
        .where("userId")
        .equals(userId)
        .and((c) => !c.isSynced)
        .toArray();

      for (const category of localUnsync) {
        try {
          const { error } = await supabase.from("categories").upsert(
            {
              id: category.id,
              user_id: userId,
              name: category.name,
              color: category.color,
              icon: category.icon,
              updated_at: category.updatedAt.toISOString(),
            },
            { onConflict: "id" }
          );

          if (!error) {
            await db.categories.update(category.id, { isSynced: true });
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      // Ricevi categorie remote modificate
      const { data: remoteCategories, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .gt("updated_at", lastSync.toISOString());

      if (!error && remoteCategories) {
        for (const remote of remoteCategories) {
          const local = await db.categories.get(remote.id);

          // Risolvi conflitti: local wins se più recente
          if (!local || new Date(remote.updated_at) > local.updatedAt) {
            await db.categories.put({
              id: remote.id,
              userId,
              name: remote.name,
              color: remote.color,
              icon: remote.icon,
              isSynced: true,
              createdAt: new Date(remote.created_at),
              updatedAt: new Date(remote.updated_at),
            });
            synced++;
          }
        }
      }
    } catch (error) {
      console.error("[Sync] Categories error:", error);
      failed++;
    }

    return { synced, failed };
  }

  private async syncExpenses(userId: string, lastSync: Date) {
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // Invia spese locali non sincronizzate
      const localUnsync = await db.expenses
        .where("userId")
        .equals(userId)
        .and((e) => !e.isSynced)
        .toArray();

      for (const expense of localUnsync) {
        try {
          const { error } = await supabase.from("expenses").upsert(
            {
              id: expense.id,
              user_id: userId,
              group_id: expense.groupId || null,
              amount: expense.amount,
              currency: expense.currency,
              category: expense.category,
              description: expense.description,
              date: expense.date.toISOString(),
              deleted_at: expense.deletedAt?.toISOString() || null,
              updated_at: expense.updatedAt.toISOString(),
            },
            { onConflict: "id" }
          );

          if (!error) {
            await db.expenses.update(expense.id, { isSynced: true });
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      // Ricevi spese remote modificate
      const { data: remoteExpenses, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .gt("updated_at", lastSync.toISOString());

      if (!error && remoteExpenses) {
        for (const remote of remoteExpenses) {
          const local = await db.expenses.get(remote.id);
          const remoteDate = new Date(remote.updated_at);

          if (local && remoteDate <= local.updatedAt) {
            // Local è più recente, ignora remote
            conflicts++;
            continue;
          }

          await db.expenses.put({
            id: remote.id,
            userId: remote.user_id,
            groupId: remote.group_id,
            amount: remote.amount,
            currency: remote.currency,
            category: remote.category,
            description: remote.description,
            date: new Date(remote.date),
            deletedAt: remote.deleted_at
              ? new Date(remote.deleted_at)
              : undefined,
            isSynced: true,
            createdAt: new Date(remote.created_at),
            updatedAt: remoteDate,
          });
          synced++;
        }
      }
    } catch (error) {
      console.error("[Sync] Expenses error:", error);
      failed++;
    }

    return { synced, failed, conflicts };
  }

  private async syncGroups(userId: string, lastSync: Date) {
    let synced = 0;
    let failed = 0;

    try {
      // Invia gruppi non sincronizzati
      const localUnsync = await db.groups
        .where("ownerId")
        .equals(userId)
        .and((g) => !g.isSynced)
        .toArray();

      for (const group of localUnsync) {
        try {
          const { error } = await supabase.from("groups").upsert(
            {
              id: group.id,
              name: group.name,
              owner_id: userId,
              description: group.description || null,
              color: group.color || null,
              updated_at: group.updatedAt.toISOString(),
            },
            { onConflict: "id" }
          );

          if (!error) {
            await db.groups.update(group.id, { isSynced: true });
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      // Ricevi gruppi di cui sei membro
      const { data: remoteGroups, error } = await supabase
        .from("groups")
        .select("*")
        .or(`owner_id.eq.${userId},group_members(user_id).eq.${userId}`)
        .gt("updated_at", lastSync.toISOString());

      if (!error && remoteGroups) {
        for (const remote of remoteGroups) {
          await db.groups.put({
            id: remote.id,
            name: remote.name,
            ownerId: remote.owner_id,
            description: remote.description,
            color: remote.color,
            isSynced: true,
            createdAt: new Date(remote.created_at),
            updatedAt: new Date(remote.updated_at),
          });
          synced++;
        }
      }
    } catch (error) {
      console.error("[Sync] Groups error:", error);
      failed++;
    }

    return { synced, failed };
  }

  private async syncGroupMembers(userId: string, lastSync: Date) {
    let synced = 0;
    let failed = 0;

    try {
      // Ricevi membri di gruppi di cui sei owner
      const { data: remoteMembers, error } = await supabase
        .from("group_members")
        .select("*")
        .in(
          "group_id",
          (await db.groups
            .where("ownerId")
            .equals(userId)
            .primaryKeys()) as string[]
        )
        .gt("created_at", lastSync.toISOString());

      if (!error && remoteMembers) {
        for (const remote of remoteMembers) {
          await db.groupMembers.put({
            id: remote.id,
            groupId: remote.group_id,
            userId: remote.user_id,
            role: remote.role,
            joinedAt: new Date(remote.created_at),
            isSynced: true,
          });
          synced++;
        }
      }
    } catch (error) {
      console.error("[Sync] Group members error:", error);
      failed++;
    }

    return { synced, failed };
  }

  private async syncSharedExpenses(_userId: string, lastSync: Date) {
    let synced = 0;
    let failed = 0;

    try {
      // Ricevi spese condivise modificate
      const { data: remoteShared, error } = await supabase
        .from("shared_expenses")
        .select("*")
        .gt("updated_at", lastSync.toISOString());

      if (!error && remoteShared) {
        for (const remote of remoteShared) {
          await db.sharedExpenses.put({
            id: remote.id,
            groupId: remote.group_id,
            expenseId: remote.expense_id,
            creatorId: remote.creator_id,
            participants: remote.participants,
            isRecurring: remote.is_recurring,
            recurringRule: remote.recurring_rule,
            isSynced: true,
            createdAt: new Date(remote.created_at),
            updatedAt: new Date(remote.updated_at),
          });
          synced++;
        }
      }
    } catch (error) {
      console.error("[Sync] Shared expenses error:", error);
      failed++;
    }

    return { synced, failed };
  }

  async uploadOfflineChanges(userId: string): Promise<boolean> {
    try {
      const unsynced = await db.expenses
        .where("userId")
        .equals(userId)
        .and((e) => !e.isSynced)
        .count();

      if (unsynced === 0) {
        return true;
      }

      // Chiedi permesso di sincronizzazione
      const permission = await this.requestSyncPermission();
      if (!permission) {
        return false;
      }

      const result = await this.sync({ userId, force: true, verbose: true });
      return result.success;
    } catch (error) {
      console.error("[Sync] Upload error:", error);
      return false;
    }
  }

  private async requestSyncPermission(): Promise<boolean> {
    // In una vera app, mostrerebbe un dialog o notifica
    return true;
  }
}

export const syncService = new SyncService();
