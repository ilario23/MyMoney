import "./App.css";
import { AppRoutes } from "@/router";
import { LanguageProvider } from "@/lib/language";
import { PWAUpdatePrompt } from "@/components/layout/pwa-update-prompt";
import { ErrorBoundary } from "@/components/error-boundary";

export function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppRoutes />
        {import.meta.env.PROD && <PWAUpdatePrompt />}
      </LanguageProvider>
    </ErrorBoundary>
  );
}
