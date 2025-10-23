import { useEffect, useState } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
      setShowBackOnline(true);

      // Nascondi il messaggio "Sei tornato online" dopo 2 secondi
      setTimeout(() => {
        setShowBackOnline(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
      setShowBackOnline(false);

      // Nascondi il messaggio "Sei offline" dopo 2 secondi
      setTimeout(() => {
        setShowOffline(false);
      }, 2000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Mostra subito se siamo offline
    if (!navigator.onLine) {
      setShowOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Mostra avviso offline persistente (ma chiudibile)
  if (showOffline && !isOnline) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 px-4 pt-4 animate-in slide-in-from-top-5">
        <Alert variant="destructive" className="max-w-screen-2xl mx-auto">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span className="font-medium">
              {t("common.offline") ||
                "Sei offline. Le modifiche verranno sincronizzate quando tornerai online."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive-foreground/10"
              onClick={() => setShowOffline(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mostra messaggio temporaneo "Sei tornato online" (2 secondi)
  if (showBackOnline && isOnline) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 px-4 pt-4 animate-in slide-in-from-top-5">
        <Alert className="max-w-screen-2xl mx-auto border border-primary/40 bg-primary/10">
          <Wifi className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span className="text-primary font-medium">
              {t("common.backOnline") ||
                "Sei tornato online! Sincronizzazione in corso..."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-primary hover:bg-primary/15"
              onClick={() => setShowBackOnline(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
