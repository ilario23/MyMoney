import { Cloud, AlertCircle, CheckCircle2 } from "lucide-react";
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
import type { SyncHealthStatus } from "@/services/sync.service";

export function SyncHealthIndicator() {
  const { healthStatus, isOnline, unsyncedCount, sync, isSyncing } = useSync();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusConfig = (status: SyncHealthStatus) => {
    switch (status) {
      case "synced":
        return {
          icon: CheckCircle2,
          color: "text-green-600 dark:text-green-500",
          bgColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
          title: "Sincronizzato",
          description: "Tutto è sincronizzato tra locale e remoto.",
        };
      case "pending":
        return {
          icon: Cloud,
          color: "text-amber-600 dark:text-amber-500",
          bgColor: "hover:bg-amber-100 dark:hover:bg-amber-900/30",
          title: "Cambiamenti in sospeso",
          description: `Hai ${unsyncedCount} ${unsyncedCount === 1 ? "cambiamento" : "cambiamenti"} non sincronizzati localmente.`,
        };
      case "conflict":
        return {
          icon: AlertCircle,
          color: "text-red-600 dark:text-red-500",
          bgColor: "hover:bg-red-100 dark:hover:bg-red-900/30",
          title: "Dati remoti più recenti",
          description:
            "Il server ha aggiornamenti non presenti localmente. Sincronizza per scaricarli.",
        };
      default:
        return {
          icon: Cloud,
          color: "text-muted-foreground",
          bgColor: "hover:bg-muted",
          title: "Stato sconosciuto",
          description: "Sincronizzazione non disponibile.",
        };
    }
  };

  const config = getStatusConfig(healthStatus);
  const Icon = config.icon;

  const handleSync = async () => {
    if (!isOnline) {
      return;
    }
    await sync();
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className={`gap-2 ${config.bgColor} ${config.color}`}
        disabled={!isOnline || isSyncing}
        onClick={() => setIsOpen(true)}
        title={config.title}
      >
        <Icon className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${config.color}`} />
              <DialogTitle>{config.title}</DialogTitle>
            </div>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {!isOnline && (
              <div className="rounded bg-muted p-3 text-muted-foreground">
                📡 Sei offline. I cambiamenti verranno sincronizzati quando
                tornerai online.
              </div>
            )}
            {isOnline &&
              (healthStatus === "pending" || healthStatus === "conflict") && (
                <div className="rounded bg-muted p-3 text-muted-foreground">
                  {healthStatus === "pending" &&
                    "Sincronizza ora per inviare i tuoi cambiamenti al server."}
                  {healthStatus === "conflict" &&
                    "Sincronizza ora per scaricare gli ultimi aggiornamenti dal server."}
                </div>
              )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Chiudi
            </Button>
            {isOnline &&
              (healthStatus === "pending" || healthStatus === "conflict") && (
                <Button
                  size="sm"
                  onClick={async () => {
                    await handleSync();
                    setIsOpen(false);
                  }}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Sincronizzando..." : "Sincronizza ora"}
                </Button>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
