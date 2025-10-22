/**
 * PWA Notification Service
 * Handles browser notifications for sync events and updates
 */

import { logger } from "./logger";

type NotificationType =
  | "sync-success"
  | "sync-error"
  | "update-available"
  | "offline"
  | "online";

interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

class NotificationService {
  private permission: NotificationPermission = "default";

  constructor() {
    if ("Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      logger.warn("Notifications not supported in this browser");
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (error) {
      logger.error("Error requesting notification permission:", error);
      return false;
    }
  }

  private async show(config: NotificationConfig): Promise<void> {
    if (this.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon || "/icons/icon-192x192.png",
        badge: config.badge || "/icons/icon-72x72.png",
        tag: config.tag,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      logger.error("Error showing notification:", error);
    }
  }

  async notify(type: NotificationType, customMessage?: string): Promise<void> {
    const configs: Record<NotificationType, NotificationConfig> = {
      "sync-success": {
        title: "Sincronizzazione completata",
        body:
          customMessage || "I tuoi dati sono stati sincronizzati con successo",
        tag: "sync",
      },
      "sync-error": {
        title: "Errore sincronizzazione",
        body:
          customMessage ||
          "Si è verificato un errore durante la sincronizzazione",
        tag: "sync",
      },
      "update-available": {
        title: "Aggiornamento disponibile",
        body: customMessage || "Una nuova versione dell'app è disponibile",
        tag: "update",
      },
      offline: {
        title: "Modalità offline",
        body:
          customMessage ||
          "Sei offline. Le modifiche saranno sincronizzate quando tornerai online",
        tag: "connection",
      },
      online: {
        title: "Connessione ripristinata",
        body:
          customMessage || "Sei di nuovo online. Sincronizzazione in corso...",
        tag: "connection",
      },
    };

    await this.show(configs[type]);
  }

  // Sync notifications
  async notifySyncSuccess(message?: string): Promise<void> {
    await this.notify("sync-success", message);
  }

  async notifySyncError(message?: string): Promise<void> {
    await this.notify("sync-error", message);
  }

  // Update notifications
  async notifyUpdateAvailable(message?: string): Promise<void> {
    await this.notify("update-available", message);
  }

  // Connection notifications
  async notifyOffline(): Promise<void> {
    await this.notify("offline");
  }

  async notifyOnline(): Promise<void> {
    await this.notify("online");
  }
}

export const notificationService = new NotificationService();
