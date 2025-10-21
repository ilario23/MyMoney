import { useCallback, useEffect, useState } from "react";

interface PWAUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateSW: () => void;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
  checkForUpdates: () => Promise<void>;
}

export const usePWAUpdate = (): PWAUpdateState => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateSW = useCallback(() => {
    setNeedRefresh(false);
    setError(null);
    window.location.reload();
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setError("Service Worker not supported");
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        setLastChecked(new Date());
      } else {
        setError("No service worker registration found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check for updates"
      );
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleSWUpdate = () => {
      setNeedRefresh(true);
      setError(null);
    };

    const handleSWOfflineReady = () => {
      setOfflineReady(true);
      setError(null);
    };

    const handleSWError = () => {
      setError("Service Worker error occurred");
    };

    window.addEventListener("vite-plugin-pwa:update-found", handleSWUpdate);
    window.addEventListener(
      "vite-plugin-pwa:offline-ready",
      handleSWOfflineReady
    );
    window.addEventListener("vite-plugin-pwa:sw-error", handleSWError);

    // Check for updates on mount
    checkForUpdates();

    return () => {
      window.removeEventListener(
        "vite-plugin-pwa:update-found",
        handleSWUpdate
      );
      window.removeEventListener(
        "vite-plugin-pwa:offline-ready",
        handleSWOfflineReady
      );
      window.removeEventListener("vite-plugin-pwa:sw-error", handleSWError);
    };
  }, [checkForUpdates]);

  return {
    needRefresh,
    offlineReady,
    updateSW,
    isChecking,
    lastChecked,
    error,
    checkForUpdates,
  };
};
