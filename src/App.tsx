import "./App.css";
import { AppRoutes } from "@/router";
import { LanguageProvider } from "@/lib/language";

export function App() {
  return (
    <LanguageProvider>
      <AppRoutes />
    </LanguageProvider>
  );
}
