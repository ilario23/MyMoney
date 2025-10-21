import "./App.css";
import { AppRoutes } from "@/router";
import { LanguageProvider } from "@/lib/language";
import { PWAUpdatePrompt } from "@/components/layout/pwa-update-prompt";

export function App() {
  return (
    <LanguageProvider>
      <AppRoutes />
      {import.meta.env.PROD && <PWAUpdatePrompt />}
    </LanguageProvider>
  );
}
