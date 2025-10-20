import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface SyncIndicatorProps {
  isSyncing: boolean;
  lastSync: Date | null;
  onSync: () => Promise<void>;
}

export function SyncIndicator({ isSyncing, lastSync, onSync }: SyncIndicatorProps) {
  const isOnline = navigator.onLine;

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CloudOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      )}

      {isOnline && lastSync && (
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
