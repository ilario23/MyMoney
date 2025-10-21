// PWA utility functions for service worker management

export const registerSW = async () => {
  if ("serviceWorker" in navigator) {
    try {
      // Register the service worker manually
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Set up update listeners
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available
              window.dispatchEvent(
                new CustomEvent("vite-plugin-pwa:update-found")
              );
            }
          });
        }
      });

      // Check for updates periodically (every 30 minutes)
      setInterval(
        () => {
          registration.update();
        },
        30 * 60 * 1000
      );

      return registration;
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }
};

export const checkForUpdates = async () => {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  }
};

export const clearAllCaches = async () => {
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log("All caches cleared");
    } catch (error) {
      console.error("Failed to clear caches:", error);
    }
  }
};

export const getAppVersion = (): string => {
  // Get version from package.json or use timestamp
  return (
    import.meta.env.VITE_APP_VERSION || new Date().toISOString().split("T")[0]
  );
};
