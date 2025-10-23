import { Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSync } from "@/hooks/useSync";
import { useLanguage } from "@/lib/language";
import type { SyncHealthStatus } from "@/services/sync.service";

export function SyncIndicator() {
  const { healthStatus, isOnline, unsyncedCount, sync, isSyncing } = useSync();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Mappa status a colori (solo se online)
  const getStatusColor = (
    status: SyncHealthStatus,
    isOnline: boolean
  ): string => {
    if (!isOnline) {
      return "text-muted-foreground"; // Grigio quando offline
    }

    switch (status) {
      case "synced":
        return "text-green-600 dark:text-green-500";
      case "pending":
        return "text-amber-600 dark:text-amber-500";
      case "conflict":
        return "text-red-600 dark:text-red-500";
      default:
        return "text-green-600 dark:text-green-500";
    }
  };

  const getStatusInfo = (status: SyncHealthStatus) => {
    switch (status) {
      case "synced":
        return {
          title: t("sync.title.synced"),
          description: t("sync.description.synced"),
        };
      case "pending":
        return {
          title: t("sync.title.pending"),
          description: t("sync.description.pending").replace(
            "{count}",
            String(unsyncedCount)
          ),
        };
      case "conflict":
        return {
          title: t("sync.title.conflict"),
          description: t("sync.description.conflict"),
        };
      default:
        return {
          title: "Stato sconosciuto",
          description: "Sincronizzazione non disponibile.",
        };
    }
  };

  const statusInfo = getStatusInfo(healthStatus);
  const colorClass = getStatusColor(healthStatus, isOnline);

  const handleSync = async () => {
    if (!isOnline) {
      return;
    }
    await sync();
  };

  // Tooltip per desktop
  const getTooltipText = (): string => {
    if (!isOnline) return t("sync.offline");
    if (healthStatus === "pending")
      return t("sync.pending")
        .replace("{count}", String(unsyncedCount))
        .replace("{singular}", unsyncedCount === 1 ? "" : "i")
        .replace("{plural}", unsyncedCount === 1 ? "" : "i");
    if (healthStatus === "conflict") return t("sync.conflict");
    return t("sync.synced");
  };

  return (
    <>
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 hover:bg-accent"
          disabled={!isOnline || isSyncing}
          onClick={() => setIsOpen(true)}
          title={getTooltipText()}
        >
          {isOnline ? (
            <Cloud className={`w-4 h-4 ${colorClass}`} />
          ) : (
            <CloudOff className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>

        {/* Badge mobile - visibile solo su mobile con pending/conflict */}
        {isOnline &&
          (healthStatus === "pending" || healthStatus === "conflict") && (
            <div className="sm:hidden absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold">
              {healthStatus === "pending" ? unsyncedCount : "!"}
            </div>
          )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className={`w-5 h-5 ${colorClass}`} />
              ) : (
                <CloudOff className="w-5 h-5 text-muted-foreground" />
              )}
              <DialogTitle>
                {isOnline ? statusInfo.title : t("sync.offline")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {isOnline ? statusInfo.description : t("sync.offline.message")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stato attuale */}
            {!isOnline && (
              <div className="rounded bg-muted p-3 text-base text-muted-foreground">
                📡 <strong>{t("sync.offline")}.</strong>{" "}
                {t("sync.offline.message")}
              </div>
            )}
            {isOnline &&
              (healthStatus === "pending" || healthStatus === "conflict") && (
                <div className="rounded bg-muted p-3 text-base text-muted-foreground">
                  {healthStatus === "pending" &&
                    t("sync.pending.state.message")}
                  {healthStatus === "conflict" &&
                    t("sync.conflict.state.message")}
                </div>
              )}

            {/* Legenda icone */}
            <div className="border-t pt-3">
              <p className="font-semibold mb-2 text-sm">
                {t("sync.icons.title")}
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-muted-foreground" />
                  <span>{t("sync.icons.online")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CloudOff className="w-4 h-4 text-muted-foreground" />
                  <span>{t("sync.icons.offline")}</span>
                </div>
              </div>
            </div>

            {/* Legenda colori */}
            <div className="border-t pt-3">
              <p className="font-semibold mb-2 text-sm">
                {t("sync.colors.title")}
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span>
                    <strong>{t("sync.colors.green")}:</strong>{" "}
                    {t("sync.colors.synced")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span>
                    <strong>{t("sync.colors.orange")}:</strong>{" "}
                    {t("sync.colors.pending")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-red-600 dark:text-red-500" />
                  <span>
                    <strong>{t("sync.colors.red")}:</strong>{" "}
                    {t("sync.colors.conflict")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              {t("sync.close")}
            </Button>
            {isOnline && (
              <Button
                size="sm"
                onClick={async () => {
                  await handleSync();
                  setIsOpen(false);
                }}
                disabled={isSyncing}
              >
                {isSyncing ? t("sync.syncing") : t("sync.syncNow")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
