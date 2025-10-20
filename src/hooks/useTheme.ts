import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface UseTheme {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

export function useTheme(): UseTheme {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme-preference");
    return (stored as Theme) || "system";
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark: boolean;

      if (theme === "system") {
        shouldBeDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
      } else {
        shouldBeDark = theme === "dark";
      }

      setIsDark(shouldBeDark);

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    updateTheme();

    // Ascolta cambiamenti preferenze di sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => updateTheme();

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme-preference", newTheme);
  };

  return { theme, isDark, setTheme };
}
