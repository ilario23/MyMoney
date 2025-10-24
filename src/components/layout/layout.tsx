import type { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { Navigation } from "./navigation";
import { SyncIndicator } from "./sync-indicator";
import { OfflineIndicator } from "./offline-indicator";
import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: ReactNode;
}

const noLayoutRoutes = ["/login", "/signup", "/"];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const showLayout = !noLayoutRoutes.includes(location.pathname);

  if (!showLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-input bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-0 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-3xl leading-none">
              S
            </div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              <span className="hidden sm:inline">pendix App</span>
              <span className="sm:hidden">pendix</span>
            </h1>
          </Link>

          <div className="flex items-center gap-3">
            <SyncIndicator />
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/12 dark:via-background dark:to-secondary/12">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-screen-2xl px-4 py-6">{children}</div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <Navigation />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
