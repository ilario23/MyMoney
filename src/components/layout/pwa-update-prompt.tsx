import { AlertCircle, Download, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { useLanguage } from "@/lib/language";

export const PWAUpdatePrompt = () => {
  const { t } = useLanguage();
  const {
    needRefresh,
    offlineReady,
    updateSW,
    isChecking,
    lastChecked,
    error,
    checkForUpdates,
  } = usePWAUpdate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (needRefresh || offlineReady || error) {
      setIsVisible(true);
    }
  }, [needRefresh, offlineReady, error]);

  const handleUpdate = () => {
    updateSW();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleRetry = () => {
    checkForUpdates();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 md:bottom-4">
      <Card
        className={`p-4 shadow-lg border-2 ${
          error
            ? "border-destructive/40 bg-destructive/10"
            : needRefresh
              ? "border-primary/40 bg-primary/10"
              : "border-accent/40 bg-accent/10"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {error ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {error
                ? t("pwa.updateError") || "Update Error"
                : needRefresh
                  ? t("pwa.newVersionAvailable") || "New version available"
                  : t("pwa.offlineReady") || "App ready for offline use"}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {error
                ? error
                : needRefresh
                  ? t("pwa.updateDescription") ||
                    "A new version of Spendix is available. Update now to get the latest features and improvements."
                  : t("pwa.offlineDescription") ||
                    "Spendix is now ready to work offline."}
            </p>
            {lastChecked && (
              <p className="text-xs text-muted-foreground mb-3">
                {t("pwa.lastChecked") || "Last checked"}:{" "}
                {lastChecked.toLocaleTimeString()}
              </p>
            )}
            <div className="flex gap-2">
              {needRefresh && (
                <Button
                  onClick={handleUpdate}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t("pwa.updateNow") || "Update Now"}
                </Button>
              )}
              {error && (
                <Button
                  onClick={handleRetry}
                  disabled={isChecking}
                  size="sm"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${isChecking ? "animate-spin" : ""}`}
                  />
                  {isChecking
                    ? t("pwa.retrying") || "Retrying..."
                    : t("pwa.retry") || "Retry"}
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t("common.dismiss") || "Dismiss"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
