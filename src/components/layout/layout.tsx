import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation } from './navigation';
import { SyncIndicator } from './sync-indicator';
import { ThemeToggle } from './theme-toggle';
import { OfflineIndicator } from './offline-indicator';
import { useSync } from '@/hooks/useSync';
import { Sidebar } from './sidebar';

interface LayoutProps {
  children: ReactNode;
}

const noLayoutRoutes = ['/login', '/signup', '/'];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const showLayout = !noLayoutRoutes.includes(location.pathname);
  const { isSyncing, lastSync, sync } = useSync();

  if (!showLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-input bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
              S
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Spendix</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <SyncIndicator isSyncing={isSyncing} lastSync={lastSync} onSync={sync} />
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
