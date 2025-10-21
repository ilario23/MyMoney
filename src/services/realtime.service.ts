import { supabase } from "@/lib/supabase";
import { db } from "@/lib/dexie";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

export type TableName =
  | "expenses"
  | "categories"
  | "groups"
  | "group_members"
  | "shared_expenses";

export interface RealtimeOptions {
  userId: string;
  onSync?: (table: TableName, action: string) => void;
  onError?: (error: Error) => void;
  verbose?: boolean;
}

/**
 * Servizio di sincronizzazione real-time con Supabase
 * Ascolta cambiamenti nel database e sincronizza automaticamente IndexedDB
 */
export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private options: RealtimeOptions | null = null;

  /**
   * Avvia la sincronizzazione real-time per tutte le tabelle
   */
  async start(options: RealtimeOptions): Promise<void> {
    this.options = options;

    if (this.options.verbose) {
      console.log(
        "[Realtime] Starting subscriptions for user:",
        options.userId
      );
    }

    // Subscribe a tutte le tabelle
    await this.subscribeToExpenses(options.userId);
    await this.subscribeToCategories(options.userId);
    await this.subscribeToGroups(options.userId);
    await this.subscribeToGroupMembers(options.userId);
    await this.subscribeToSharedExpenses(options.userId);

    if (this.options.verbose) {
      console.log(`[Realtime] ${this.channels.size} subscriptions active`);
    }
  }

  /**
   * Ferma tutte le sottoscrizioni real-time
   */
  async stop(): Promise<void> {
    if (this.options?.verbose) {
      console.log("[Realtime] Stopping all subscriptions...");
    }

    for (const [name, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel);
      this.channels.delete(name);
    }

    this.options = null;
  }

  /**
   * Sottoscrizione alle spese
   */
  private async subscribeToExpenses(userId: string): Promise<void> {
    const channel = supabase
      .channel(`expenses:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "expenses",
          filter: `user_id=eq.${userId}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          await this.handleExpenseChange(payload);
        }
      )
      .subscribe((status) => {
        if (this.options?.verbose) {
          console.log(`[Realtime] Expenses subscription status:`, status);
        }
      });

    this.channels.set("expenses", channel);
  }

  /**
   * Sottoscrizione alle categorie
   */
  private async subscribeToCategories(userId: string): Promise<void> {
    const channel = supabase
      .channel(`categories:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `user_id=eq.${userId}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          await this.handleCategoryChange(payload);
        }
      )
      .subscribe((status) => {
        if (this.options?.verbose) {
          console.log(`[Realtime] Categories subscription status:`, status);
        }
      });

    this.channels.set("categories", channel);
  }

  /**
   * Sottoscrizione ai gruppi (owner_id)
   */
  private async subscribeToGroups(userId: string): Promise<void> {
    const channel = supabase
      .channel(`groups:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "groups",
          filter: `owner_id=eq.${userId}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          await this.handleGroupChange(payload);
        }
      )
      .subscribe((status) => {
        if (this.options?.verbose) {
          console.log(`[Realtime] Groups subscription status:`, status);
        }
      });

    this.channels.set("groups", channel);
  }

  /**
   * Sottoscrizione ai membri gruppo
   */
  private async subscribeToGroupMembers(userId: string): Promise<void> {
    // Get group IDs where user is owner or member
    const ownedGroups = await db.groups
      .where("ownerId")
      .equals(userId)
      .primaryKeys();

    if (ownedGroups.length === 0) return;

    const channel = supabase
      .channel(`group_members:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          // Filter only for our groups
          const groupId =
            (payload.new as any)?.group_id || (payload.old as any)?.group_id;
          if (groupId && ownedGroups.includes(groupId)) {
            await this.handleGroupMemberChange(payload);
          }
        }
      )
      .subscribe((status) => {
        if (this.options?.verbose) {
          console.log(`[Realtime] Group members subscription status:`, status);
        }
      });

    this.channels.set("group_members", channel);
  }

  /**
   * Sottoscrizione alle spese condivise
   */
  private async subscribeToSharedExpenses(userId: string): Promise<void> {
    const channel = supabase
      .channel(`shared_expenses:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_expenses",
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          await this.handleSharedExpenseChange(payload);
        }
      )
      .subscribe((status) => {
        if (this.options?.verbose) {
          console.log(
            `[Realtime] Shared expenses subscription status:`,
            status
          );
        }
      });

    this.channels.set("shared_expenses", channel);
  }

  /**
   * Handler per cambiamenti nelle spese
   */
  private async handleExpenseChange(
    payload: RealtimePostgresChangesPayload<any>
  ): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (this.options?.verbose) {
        console.log(`[Realtime] Expense ${eventType}:`, newRecord || oldRecord);
      }

      switch (eventType) {
        case "INSERT":
        case "UPDATE":
          if (newRecord) {
            // Controlla se è più recente di quello locale
            const local = await db.expenses.get(newRecord.id);
            const remoteUpdated = new Date(newRecord.updated_at);

            if (!local || remoteUpdated > local.updatedAt) {
              await db.expenses.put({
                id: newRecord.id,
                userId: newRecord.user_id,
                groupId: newRecord.group_id,
                amount: newRecord.amount,
                category: newRecord.category,
                description: newRecord.description,
                date: new Date(newRecord.date),
                deletedAt: newRecord.deleted_at
                  ? new Date(newRecord.deleted_at)
                  : undefined,
                isSynced: true,
                createdAt: new Date(newRecord.created_at),
                updatedAt: remoteUpdated,
              });

              this.options?.onSync?.("expenses", eventType);
            }
          }
          break;

        case "DELETE":
          if (oldRecord) {
            await db.expenses.delete(oldRecord.id);
            this.options?.onSync?.("expenses", eventType);
          }
          break;
      }
    } catch (error) {
      console.error("[Realtime] Error handling expense change:", error);
      this.options?.onError?.(error as Error);
    }
  }

  /**
   * Handler per cambiamenti nelle categorie
   */
  private async handleCategoryChange(
    payload: RealtimePostgresChangesPayload<any>
  ): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (this.options?.verbose) {
        console.log(
          `[Realtime] Category ${eventType}:`,
          newRecord || oldRecord
        );
      }

      switch (eventType) {
        case "INSERT":
        case "UPDATE":
          if (newRecord) {
            const local = await db.categories.get(newRecord.id);
            const remoteUpdated = new Date(newRecord.updated_at);

            if (!local || remoteUpdated > local.updatedAt) {
              await db.categories.put({
                id: newRecord.id,
                userId: newRecord.user_id,
                groupId: newRecord.group_id || undefined,
                name: newRecord.name,
                color: newRecord.color,
                icon: newRecord.icon,
                parentId: newRecord.parent_id || undefined,
                isActive: newRecord.is_active !== false,
                isSynced: true,
                createdAt: new Date(newRecord.created_at),
                updatedAt: remoteUpdated,
              });

              this.options?.onSync?.("categories", eventType);
            }
          }
          break;

        case "DELETE":
          if (oldRecord) {
            await db.categories.delete(oldRecord.id);
            this.options?.onSync?.("categories", eventType);
          }
          break;
      }
    } catch (error) {
      console.error("[Realtime] Error handling category change:", error);
      this.options?.onError?.(error as Error);
    }
  }

  /**
   * Handler per cambiamenti nei gruppi
   */
  private async handleGroupChange(
    payload: RealtimePostgresChangesPayload<any>
  ): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (this.options?.verbose) {
        console.log(`[Realtime] Group ${eventType}:`, newRecord || oldRecord);
      }

      switch (eventType) {
        case "INSERT":
        case "UPDATE":
          if (newRecord) {
            const local = await db.groups.get(newRecord.id);
            const remoteUpdated = new Date(newRecord.updated_at);

            if (!local || remoteUpdated > local.updatedAt) {
              await db.groups.put({
                id: newRecord.id,
                name: newRecord.name,
                ownerId: newRecord.owner_id,
                description: newRecord.description,
                color: newRecord.color,
                inviteCode: newRecord.invite_code || undefined,
                allowNewMembers: newRecord.allow_new_members ?? true,
                usedByUserId: newRecord.used_by_user_id || undefined,
                usedAt: newRecord.used_at
                  ? new Date(newRecord.used_at)
                  : undefined,
                isSynced: true,
                createdAt: new Date(newRecord.created_at),
                updatedAt: remoteUpdated,
              });

              this.options?.onSync?.("groups", eventType);
            }
          }
          break;

        case "DELETE":
          if (oldRecord) {
            await db.groups.delete(oldRecord.id);
            this.options?.onSync?.("groups", eventType);
          }
          break;
      }
    } catch (error) {
      console.error("[Realtime] Error handling group change:", error);
      this.options?.onError?.(error as Error);
    }
  }

  /**
   * Handler per cambiamenti nei membri gruppo
   */
  private async handleGroupMemberChange(
    payload: RealtimePostgresChangesPayload<any>
  ): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (this.options?.verbose) {
        console.log(
          `[Realtime] Group member ${eventType}:`,
          newRecord || oldRecord
        );
      }

      switch (eventType) {
        case "INSERT":
        case "UPDATE":
          if (newRecord) {
            await db.groupMembers.put({
              id: newRecord.id,
              groupId: newRecord.group_id,
              userId: newRecord.user_id,
              role: newRecord.role,
              joinedAt: new Date(newRecord.created_at),
              isSynced: true,
            });

            this.options?.onSync?.("group_members", eventType);
          }
          break;

        case "DELETE":
          if (oldRecord) {
            await db.groupMembers.delete(oldRecord.id);
            this.options?.onSync?.("group_members", eventType);
          }
          break;
      }
    } catch (error) {
      console.error("[Realtime] Error handling group member change:", error);
      this.options?.onError?.(error as Error);
    }
  }

  /**
   * Handler per cambiamenti nelle spese condivise
   */
  private async handleSharedExpenseChange(
    payload: RealtimePostgresChangesPayload<any>
  ): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (this.options?.verbose) {
        console.log(
          `[Realtime] Shared expense ${eventType}:`,
          newRecord || oldRecord
        );
      }

      switch (eventType) {
        case "INSERT":
        case "UPDATE":
          if (newRecord) {
            const local = await db.sharedExpenses.get(newRecord.id);
            const remoteUpdated = new Date(newRecord.updated_at);

            if (!local || remoteUpdated > local.updatedAt) {
              await db.sharedExpenses.put({
                id: newRecord.id,
                groupId: newRecord.group_id,
                expenseId: newRecord.expense_id,
                creatorId: newRecord.creator_id,
                participants: newRecord.participants,
                isRecurring: newRecord.is_recurring,
                recurringRule: newRecord.recurring_rule,
                isSynced: true,
                createdAt: new Date(newRecord.created_at),
                updatedAt: remoteUpdated,
              });

              this.options?.onSync?.("shared_expenses", eventType);
            }
          }
          break;

        case "DELETE":
          if (oldRecord) {
            await db.sharedExpenses.delete(oldRecord.id);
            this.options?.onSync?.("shared_expenses", eventType);
          }
          break;
      }
    } catch (error) {
      console.error("[Realtime] Error handling shared expense change:", error);
      this.options?.onError?.(error as Error);
    }
  }

  /**
   * Controlla se le sottoscrizioni sono attive
   */
  isActive(): boolean {
    return this.channels.size > 0;
  }

  /**
   * Ottieni numero di canali attivi
   */
  getActiveChannelsCount(): number {
    return this.channels.size;
  }
}

export const realtimeService = new RealtimeService();
