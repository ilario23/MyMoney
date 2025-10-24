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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSync } from "@/hooks/useSync";
import { useLanguage } from "@/lib/language";
import type { SyncHealthStatus } from "@/services/sync.service";

export function SyncIndicator() {
  const { healthStatus, isOnline, unsyncedCount, sync, isSyncing } = useSync();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Mappa status a colori - mostra il colore dello stato indipendentemente da online/offline
  // Online/Offline è indicato dall'icona (Cloud vs CloudOff)
  // Il colore indica sempre lo stato di sync: synced (verde), pending (arancione), conflict (rosso)
  const getStatusColor = (status: SyncHealthStatus): string => {
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
  const colorClass = getStatusColor(healthStatus);

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
    <TooltipProvider>
      <div className="relative flex items-center gap-2">
        {/* Testo "Offline" in grigio quando offline - solo su mobile */}
        {!isOnline && (
          <span className="text-xs text-muted-foreground font-medium sm:hidden">
            {t("sync.offline")}
          </span>
        )}

        {/* Desktop: Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 hover:bg-accent hidden sm:inline-flex"
              disabled={isSyncing}
              onClick={() => setIsOpen(true)}
            >
              {isOnline ? (
                <Cloud className={`w-4 h-4 ${colorClass}`} />
              ) : (
                <CloudOff className={`w-4 h-4 ${colorClass}`} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">
                {isOnline ? statusInfo.title : t("sync.offline")}
              </p>
              <p className="text-xs">
                {isOnline ? statusInfo.description : t("sync.offline.message")}
              </p>
              {isOnline &&
                (healthStatus === "pending" || healthStatus === "conflict") && (
                  <p className="text-xs pt-2 border-t">
                    {healthStatus === "pending" &&
                      t("sync.pending.state.message")}
                    {healthStatus === "conflict" &&
                      t("sync.conflict.state.message")}
                  </p>
                )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Mobile: Dialog button */}
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 hover:bg-accent sm:hidden"
          disabled={isSyncing}
          onClick={() => setIsOpen(true)}
          title={getTooltipText()}
        >
          {isOnline ? (
            <Cloud className={`w-4 h-4 ${colorClass}`} />
          ) : (
            <CloudOff className={`w-4 h-4 ${colorClass}`} />
          )}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-2xl border-border shadow-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className={`w-5 h-5 ${colorClass}`} />
              ) : (
                <CloudOff className={`w-5 h-5 ${colorClass}`} />
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
                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                  <Cloud className="w-4 h-4 text-muted-foreground" />
                  <span>{t("sync.icons.online")}</span>
                </div>
                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
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
                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                  <Cloud className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span>
                    <strong>{t("sync.colors.green")}:</strong>{" "}
                    {t("sync.colors.synced")}
                  </span>
                </div>
                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                  <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span>
                    <strong>{t("sync.colors.orange")}:</strong>{" "}
                    {t("sync.colors.pending")}
                  </span>
                </div>
                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
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
    </TooltipProvider>
  );
}
