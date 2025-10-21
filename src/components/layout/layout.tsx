import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation } from './navigation';
import { SyncIndicator } from './sync-indicator';
import { ThemeToggle } from './theme-toggle';
import { OfflineIndicator } from './offline-indicator';
import { useSync } from '@/hooks/useSync';
import { useRealtime } from '@/hooks/useRealtime';
import { Sidebar } from './sidebar';

interface LayoutProps {
  children: ReactNode;
}

const noLayoutRoutes = ['/login', '/signup', '/'];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const showLayout = !noLayoutRoutes.includes(location.pathname);
  const { isSyncing, lastSync, sync } = useSync();
  
  // 🔥 Attiva sincronizzazione real-time
  const { isActive: isRealtimeActive, syncCount } = useRealtime();

  if (!showLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <h1 className="text-2xl font-bold text-primary">Spendix</h1>
          
          <div className="flex items-center gap-3">
            <SyncIndicator isSyncing={isSyncing} lastSync={lastSync} onSync={sync} />
            {isRealtimeActive && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="font-medium">Real-time</span>
                {syncCount > 0 && <span className="text-muted-foreground">({syncCount})</span>}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-screen-2xl px-4 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <Navigation />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
