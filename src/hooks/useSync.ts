import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { syncService } from "@/services/sync.service";

interface UseSync {
  isSyncing: boolean;
  lastSync: Date | null;
  sync: () => Promise<void>;
  hasUnsyncedChanges: boolean;
}

export function useSync(): UseSync {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const { user } = useAuthStore();

  const sync = useCallback(async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncService.sync({ userId: user.id, verbose: true });
      setLastSync(new Date());
      setHasUnsyncedChanges(!result.success);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing]);

  // Auto-sync quando torna online
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        void sync();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [user, sync]);

  return { isSyncing, lastSync, sync, hasUnsyncedChanges };
}
