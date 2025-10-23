import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useEffect, useState } from 'react';

interface SyncIndicatorProps {
  isSyncing: boolean;
  lastSync: Date | null;
  onSync: () => Promise<void>;
}

export function SyncIndicator({ isSyncing, lastSync, onSync }: SyncIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  // Ascolta eventi online/offline per aggiornamento immediato
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineMessage(true);
      
      // Nascondi il messaggio "Online" dopo 2 secondi
      setTimeout(() => {
        setShowOnlineMessage(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <div className="flex items-center gap-1 text-xs text-destructive font-semibold">
          <CloudOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      )}

      {showOnlineMessage && isOnline && (
        <div className="flex items-center gap-1 text-xs text-green-600 font-semibold animate-in fade-in duration-300">
          <Cloud className="w-4 h-4" />
          <span>Online</span>
        </div>
      )}

      {isOnline && !showOnlineMessage && lastSync && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Cloud className="w-4 h-4" />
          <span>
            {format(lastSync, 'HH:mm', { locale: it })}
          </span>
        </div>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={onSync}
        disabled={!isOnline || isSyncing}
        className="gap-1"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
