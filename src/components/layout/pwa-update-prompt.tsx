import { AlertCircle, Download, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { useLanguage } from '@/lib/language';

export const PWAUpdatePrompt = () => {
  const { t } = useLanguage();
  const { needRefresh, offlineReady, updateSW, isChecking, lastChecked, error, checkForUpdates } =
    usePWAUpdate();
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
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            : needRefresh
              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
              : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {error ? (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {error
                ? t('pwa.updateError') || 'Update Error'
                : needRefresh
                  ? t('pwa.newVersionAvailable') || 'New version available'
                  : t('pwa.offlineReady') || 'App ready for offline use'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {error
                ? error
                : needRefresh
                  ? t('pwa.updateDescription') ||
                    'A new version of Spendix is available. Update now to get the latest features and improvements.'
                  : t('pwa.offlineDescription') || 'Spendix is now ready to work offline.'}
            </p>
            {lastChecked && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                {t('pwa.lastChecked') || 'Last checked'}: {lastChecked.toLocaleTimeString()}
              </p>
            )}
            <div className="flex gap-2">
              {needRefresh && (
                <Button
                  onClick={handleUpdate}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t('pwa.updateNow') || 'Update Now'}
                </Button>
              )}
              {error && (
                <Button
                  onClick={handleRetry}
                  disabled={isChecking}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? (t('pwa.retrying') || 'Retrying...') : (t('pwa.retry') || 'Retry')}
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="text-gray-600 dark:text-gray-400"
              >
                <X className="h-4 w-4 mr-1" />
                {t('common.dismiss') || 'Dismiss'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
