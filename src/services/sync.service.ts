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
          // Prima controlla se esiste già
          const { data: existing, error: checkError } = await supabase
            .from("categories")
            .select("*")
            .eq("id", category.id)
            .maybeSingle();

          let error = null;

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 è "not found" - è normal se non esiste
            throw checkError;
          }

          if (existing) {
            // Update
            const result = await supabase
              .from("categories")
              .update({
                name: category.name,
                color: category.color,
                icon: category.icon,
                parent_id: category.parentId || null,
                is_active: category.isActive !== false, // Default true if undefined
                updated_at: category.updatedAt.toISOString(),
              })
              .eq("id", category.id);
            error = result.error;
          } else {
            // Insert
            const result = await supabase.from("categories").insert({
              id: category.id,
              user_id: userId,
              name: category.name,
              color: category.color,
              icon: category.icon,
              parent_id: category.parentId || null,
              is_active: category.isActive !== false, // Default true if undefined
              created_at: category.createdAt.toISOString(),
              updated_at: category.updatedAt.toISOString(),
            });
            error = result.error;
          }

          if (!error) {
            await db.categories.update(category.id, { isSynced: true });
            synced++;
          } else {
            console.error("[Sync] Category error:", error);
            failed++;
          }
        } catch (err) {
          console.error("[Sync] Category exception:", err);
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
              parentId: remote.parent_id || undefined,
              isActive: remote.is_active !== false, // Default true if null/undefined
              isSynced: true,
              createdAt: new Date(remote.created_at || Date.now()),
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
          // Prima controlla se esiste già
          const { data: existing, error: checkError } = await supabase
            .from("expenses")
            .select("*")
            .eq("id", expense.id)
            .maybeSingle();

          let error = null;

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 è "not found" - è normal se non esiste
            // Se c'è un errore diverso, lo registriamo
            throw checkError;
          }

          if (existing) {
            // Update
            const result = await supabase
              .from("expenses")
              .update({
                amount: expense.amount,
                currency: expense.currency,
                category: expense.category,
                description: expense.description,
                date: expense.date.toISOString(),
                deleted_at: expense.deletedAt?.toISOString() || null,
                updated_at: expense.updatedAt.toISOString(),
              })
              .eq("id", expense.id);
            error = result.error;
          } else {
            // Insert
            const result = await supabase.from("expenses").insert({
              id: expense.id,
              user_id: userId,
              group_id: expense.groupId || null,
              amount: expense.amount,
              currency: expense.currency,
              category: expense.category,
              description: expense.description,
              date: expense.date.toISOString(),
              deleted_at: expense.deletedAt?.toISOString() || null,
              created_at: expense.createdAt.toISOString(),
              updated_at: expense.updatedAt.toISOString(),
            });
            error = result.error;
          }

          if (!error) {
            await db.expenses.update(expense.id, { isSynced: true });
            synced++;
          } else {
            console.error("[Sync] Expense error:", error);
            failed++;
          }
        } catch (err) {
          console.error("[Sync] Expense exception:", err);
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
            createdAt: new Date(remote.created_at || Date.now()),
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
    let conflicts = 0;

    try {
      // 1. INVIA: Sincronizza gruppi locali non sincronizzati
      const localUnsync = await db.groups
        .where("ownerId")
        .equals(userId)
        .and((g) => !g.isSynced)
        .toArray();

      for (const group of localUnsync) {
        try {
          // Check if exists
          const { data: existing, error: checkError } = await supabase
            .from("groups")
            .select("*")
            .eq("id", group.id)
            .maybeSingle();

          let error = null;

          if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
          }

          if (existing) {
            // Se esiste, controlla chi è più recente
            const remoteUpdated = new Date(existing.updated_at);
            if (group.updatedAt > remoteUpdated) {
              // Local è più recente, aggiorna remote
              const result = await supabase
                .from("groups")
                .update({
                  name: group.name,
                  description: group.description || null,
                  color: group.color || null,
                  invite_code: group.inviteCode || null,
                  used_by_user_id: group.usedByUserId || null,
                  used_at: group.usedAt ? group.usedAt.toISOString() : null,
                  updated_at: group.updatedAt.toISOString(),
                })
                .eq("id", group.id);
              error = result.error;
            } else {
              // Remote è più recente, conflitto risolto (remote wins per questo caso)
              conflicts++;
            }
          } else {
            // Non esiste, inserisci
            const result = await supabase.from("groups").insert({
              id: group.id,
              name: group.name,
              owner_id: userId,
              description: group.description || null,
              color: group.color || null,
              invite_code: group.inviteCode || null,
              used_by_user_id: group.usedByUserId || null,
              used_at: group.usedAt ? group.usedAt.toISOString() : null,
              created_at: group.createdAt.toISOString(),
              updated_at: group.updatedAt.toISOString(),
            });
            error = result.error;
          }

          if (!error) {
            await db.groups.update(group.id, { isSynced: true });
            synced++;
          } else {
            console.error("[Sync] Group sync error:", error);
            failed++;
          }
        } catch (err) {
          console.error("[Sync] Group exception:", err);
          failed++;
        }
      }

      // 2. RICEVI: Sincronizza gruppi remoti modificati di cui sei owner
      try {
        const ownedGroupIds = await db.groups
          .where("ownerId")
          .equals(userId)
          .primaryKeys();

        if (ownedGroupIds.length > 0) {
          const { data: remoteGroups, error } = await supabase
            .from("groups")
            .select("*")
            .in("id", ownedGroupIds as string[])
            .gt("updated_at", lastSync.toISOString());

          if (!error && remoteGroups) {
            for (const remote of remoteGroups) {
              const localGroup = await db.groups.get(remote.id);

              // Se non esiste localmente o se remote è più recente
              if (
                !localGroup ||
                new Date(remote.updated_at) > localGroup.updatedAt
              ) {
                await db.groups.put({
                  id: remote.id,
                  name: remote.name,
                  ownerId: remote.owner_id,
                  description: remote.description,
                  color: remote.color,
                  inviteCode: remote.invite_code || undefined,
                  usedByUserId: remote.used_by_user_id || undefined,
                  usedAt: remote.used_at ? new Date(remote.used_at) : undefined,
                  isSynced: true,
                  createdAt: new Date(remote.created_at),
                  updatedAt: new Date(remote.updated_at),
                });
                synced++;
              } else {
                // Local è più recente, skip
                conflicts++;
              }
            }
          }
        }
      } catch (err) {
        console.error("[Sync] Fetch remote owned groups error:", err);
      }

      // 3. RICEVI: Sincronizza gruppi di cui sei membro (joined via invite)
      try {
        // Get group IDs where user is member from Supabase
        const { data: memberGroups, error: memberError } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", userId);

        if (!memberError && memberGroups && memberGroups.length > 0) {
          const memberGroupIds = memberGroups.map((m) => m.group_id);

          // Fetch those groups from Supabase
          const { data: remoteGroups, error } = await supabase
            .from("groups")
            .select("*")
            .in("id", memberGroupIds);

          if (!error && remoteGroups) {
            for (const remote of remoteGroups) {
              const localGroup = await db.groups.get(remote.id);

              // Add/update if not exists or remote is newer
              if (
                !localGroup ||
                new Date(remote.updated_at) > localGroup.updatedAt
              ) {
                await db.groups.put({
                  id: remote.id,
                  name: remote.name,
                  ownerId: remote.owner_id,
                  description: remote.description,
                  color: remote.color,
                  inviteCode: remote.invite_code || undefined,
                  usedByUserId: remote.used_by_user_id || undefined,
                  usedAt: remote.used_at ? new Date(remote.used_at) : undefined,
                  isSynced: true,
                  createdAt: new Date(remote.created_at),
                  updatedAt: new Date(remote.updated_at),
                });
                synced++;
              }
            }
          }
        }
      } catch (err) {
        console.error("[Sync] Fetch remote member groups error:", err);
      }
    } catch (error) {
      console.error("[Sync] Groups error:", error);
      failed++;
    }

    return { synced, failed, conflicts };
  }

  private async syncGroupMembers(userId: string, lastSync: Date) {
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // 1. INVIA: Sincronizza membri locali non sincronizzati
      const localUnsync = await db.groupMembers.toArray();
      const unsynced = localUnsync.filter((m) => !m.isSynced);

      // Filtra solo i membri dei gruppi di cui siamo owner
      const ownedGroupIds = await db.groups
        .where("ownerId")
        .equals(userId)
        .primaryKeys();

      for (const member of unsynced) {
        if (!ownedGroupIds.includes(member.groupId)) continue; // Solo i nostri gruppi

        try {
          // Check if exists
          const { data: existing, error: checkError } = await supabase
            .from("group_members")
            .select("*")
            .eq("id", member.id)
            .maybeSingle();

          let error = null;

          if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
          }

          if (existing) {
            // Update
            const result = await supabase
              .from("group_members")
              .update({
                group_id: member.groupId,
                user_id: member.userId,
                role: member.role,
                updated_at: new Date().toISOString(),
              })
              .eq("id", member.id);
            error = result.error;
          } else {
            // Insert
            const result = await supabase.from("group_members").insert({
              id: member.id,
              group_id: member.groupId,
              user_id: member.userId,
              role: member.role,
              created_at: member.joinedAt.toISOString(),
              updated_at: new Date().toISOString(),
            });
            error = result.error;
          }

          if (!error) {
            await db.groupMembers.update(member.id, { isSynced: true });
            synced++;
          } else {
            console.error("[Sync] Group member sync error:", error);
            failed++;
          }
        } catch (err) {
          console.error("[Sync] Group member exception:", err);
          failed++;
        }
      }

      // 2. RICEVI: Sincronizza membri remoti modificati
      if (ownedGroupIds.length > 0) {
        try {
          const { data: remoteMembers, error } = await supabase
            .from("group_members")
            .select("*")
            .in("group_id", ownedGroupIds as string[])
            .gt("updated_at", lastSync.toISOString());

          if (!error && remoteMembers) {
            for (const remote of remoteMembers) {
              const localMember = await db.groupMembers.get(remote.id);

              // Se non esiste localmente o se remote è più recente
              if (
                !localMember ||
                new Date(remote.updated_at) > localMember.joinedAt
              ) {
                await db.groupMembers.put({
                  id: remote.id,
                  groupId: remote.group_id,
                  userId: remote.user_id,
                  role: remote.role,
                  joinedAt: new Date(remote.created_at),
                  isSynced: true,
                });
                synced++;
              } else {
                // Local è più recente, skip
                conflicts++;
              }
            }
          }
        } catch (err) {
          console.error("[Sync] Fetch remote group members error:", err);
        }
      }
    } catch (error) {
      console.error("[Sync] Group members error:", error);
      failed++;
    }

    return { synced, failed, conflicts };
  }

  private async syncSharedExpenses(userId: string, lastSync: Date) {
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // 1. INVIA: Sincronizza spese condivise locali non sincronizzate
      const localUnsync = await db.sharedExpenses
        .where("creatorId")
        .equals(userId)
        .and((se) => !se.isSynced)
        .toArray();

      for (const sharedExp of localUnsync) {
        try {
          // Check if exists
          const { data: existing, error: checkError } = await supabase
            .from("shared_expenses")
            .select("*")
            .eq("id", sharedExp.id)
            .maybeSingle();

          let error = null;

          if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
          }

          if (existing) {
            // Se esiste, controlla chi è più recente
            const remoteUpdated = new Date(existing.updated_at);
            if (sharedExp.updatedAt > remoteUpdated) {
              // Local è più recente, aggiorna remote
              const result = await supabase
                .from("shared_expenses")
                .update({
                  group_id: sharedExp.groupId,
                  expense_id: sharedExp.expenseId,
                  creator_id: sharedExp.creatorId,
                  participants: sharedExp.participants,
                  is_recurring: sharedExp.isRecurring,
                  recurring_rule: sharedExp.recurringRule || null,
                  updated_at: sharedExp.updatedAt.toISOString(),
                })
                .eq("id", sharedExp.id);
              error = result.error;
            } else {
              // Remote è più recente, conflitto
              conflicts++;
            }
          } else {
            // Non esiste, inserisci
            const result = await supabase.from("shared_expenses").insert({
              id: sharedExp.id,
              group_id: sharedExp.groupId,
              expense_id: sharedExp.expenseId,
              creator_id: sharedExp.creatorId,
              participants: sharedExp.participants,
              is_recurring: sharedExp.isRecurring,
              recurring_rule: sharedExp.recurringRule || null,
              created_at: sharedExp.createdAt.toISOString(),
              updated_at: sharedExp.updatedAt.toISOString(),
            });
            error = result.error;
          }

          if (!error) {
            await db.sharedExpenses.update(sharedExp.id, { isSynced: true });
            synced++;
          } else {
            console.error("[Sync] Shared expense sync error:", error);
            failed++;
          }
        } catch (err) {
          console.error("[Sync] Shared expense exception:", err);
          failed++;
        }
      }

      // 2. RICEVI: Sincronizza spese condivise remote modificate
      try {
        const { data: remoteShared, error } = await supabase
          .from("shared_expenses")
          .select("*")
          .gt("updated_at", lastSync.toISOString());

        if (!error && remoteShared) {
          for (const remote of remoteShared) {
            const localShared = await db.sharedExpenses.get(remote.id);

            // Se non esiste localmente o se remote è più recente
            if (
              !localShared ||
              new Date(remote.updated_at) > localShared.updatedAt
            ) {
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
            } else {
              // Local è più recente, skip
              conflicts++;
            }
          }
        }
      } catch (err) {
        console.error("[Sync] Fetch remote shared expenses error:", err);
      }
    } catch (error) {
      console.error("[Sync] Shared expenses error:", error);
      failed++;
    }

    return { synced, failed, conflicts };
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
