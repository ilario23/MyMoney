import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { realtimeService, type TableName } from "@/services/realtime.service";

interface UseRealtime {
  isActive: boolean;
  lastSync: Date | null;
  syncCount: number;
  error: Error | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Hook per gestire la sincronizzazione real-time
 * Sottoscrive automaticamente ai cambiamenti del database
 */
export function useRealtime(): UseRealtime {
  const { user } = useAuthStore();
  const [isActive, setIsActive] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const start = useCallback(async () => {
    if (!user || isActive) return;

    try {
      await realtimeService.start({
        userId: user.id,
        verbose: true,
        onSync: (table: TableName, action: string) => {
          console.log(`🔄 [Realtime] Synced ${table} (${action})`);
          setLastSync(new Date());
          setSyncCount((prev) => prev + 1);
        },
        onError: (err: Error) => {
          console.error("❌ [Realtime] Error:", err);
          setError(err);
        },
      });

      setIsActive(true);
      setError(null);
      console.log("✅ [Realtime] Subscriptions started");
    } catch (err) {
      console.error("❌ [Realtime] Failed to start:", err);
      setError(err as Error);
    }
  }, [user, isActive]);

  const stop = useCallback(async () => {
    try {
      await realtimeService.stop();
      setIsActive(false);
      console.log("🛑 [Realtime] Subscriptions stopped");
    } catch (err) {
      console.error("❌ [Realtime] Failed to stop:", err);
      setError(err as Error);
    }
  }, []);

  // Auto-start quando l'utente è autenticato e online
  useEffect(() => {
    if (user && navigator.onLine && !isActive) {
      void start();
    }

    // Cleanup solo quando l'utente cambia (logout)
    return () => {
      if (isActive && !user) {
        void stop();
      }
    };
  }, [user, isActive, start, stop]);

  // Riavvia quando torna online
  useEffect(() => {
    const handleOnline = () => {
      if (user && !isActive) {
        console.log("🌐 [Realtime] Back online, restarting subscriptions");
        void start();
      }
    };

    const handleOffline = () => {
      if (isActive) {
        console.log("📴 [Realtime] Going offline, stopping subscriptions");
        void stop();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, isActive, start, stop]);

  return {
    isActive,
    lastSync,
    syncCount,
    error,
    start,
    stop,
  };
}
