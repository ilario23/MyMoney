import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { syncService, type SyncHealthStatus } from "@/services/sync.service";

interface UseSync {
  isSyncing: boolean;
  lastSync: Date | null;
  sync: () => Promise<void>;
  hasUnsyncedChanges: boolean;
  isOnline: boolean;
  triggerBackgroundSync: () => void;
  unsyncedCount: number;
  healthStatus: SyncHealthStatus;
}

export function useSync(): UseSync {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(syncService.isAppOnline());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState<SyncHealthStatus>("synced");
  const { user } = useAuthStore();

  // Update unsynced count
  const updateUnsyncedCount = useCallback(async () => {
    if (!user) {
      setUnsyncedCount(0);
      return;
    }

    try {
      const count = await syncService.getUnsyncedCount(user.id);
      setUnsyncedCount(count);
      setHasUnsyncedChanges(count > 0);
    } catch (error) {
      console.error("Error updating unsynced count:", error);
    }
  }, [user]);

  const sync = useCallback(async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncService.startSync(user.id);
      setLastSync(new Date());
      setHasUnsyncedChanges(false);
      setUnsyncedCount(0);
      await updateUnsyncedCount();
    } catch (error) {
      console.error("Sync error:", error);
      setHasUnsyncedChanges(true);
      await updateUnsyncedCount();
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, updateUnsyncedCount]);

  const triggerBackgroundSync = useCallback(() => {
    if (!user || !isOnline) return;

    syncService
      .syncAfterChange(user.id)
      .then(() => updateUnsyncedCount())
      .catch((error) => {
        console.error("Background sync error:", error);
        updateUnsyncedCount();
      });
  }, [user, isOnline, updateUnsyncedCount]);

  // Auto-sync quando torna online
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        void sync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, sync]);

  // Subscribe to sync state changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setIsSyncing(state.status === "syncing");
      if (state.lastSync) {
        setLastSync(state.lastSync);
      }
      setHealthStatus(state.healthStatus);
    });

    return () => unsubscribe();
  }, []);

  // Update unsynced count on mount and when user changes
  useEffect(() => {
    updateUnsyncedCount();
  }, [user, updateUnsyncedCount]);

  return {
    isSyncing,
    lastSync,
    sync,
    hasUnsyncedChanges,
    isOnline,
    triggerBackgroundSync,
    unsyncedCount,
    healthStatus,
  };
}
