/**
 * Theme Store - Manages application theme (light/dark) and color scheme
 * Uses localStorage for persistence
 */

export type Theme = "light" | "dark" | "system";
export type ColorScheme =
  | "neutral"
  | "stone"
  | "zinc"
  | "gray"
  | "slate"
  | "red"
  | "blue"
  | "violet"
  | "rose"
  | "orange"
  | "green"
  | "yellow";

interface ThemeConfig {
  theme: Theme;
  colorScheme: ColorScheme;
}

const STORAGE_KEY = "mymoney_theme";
const DEFAULT_CONFIG: ThemeConfig = {
  theme: "system",
  colorScheme: "zinc",
};

/**
 * Get stored theme config or default
 */
function getStoredConfig(): ThemeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to parse theme config:", error);
  }
  return DEFAULT_CONFIG;
}

/**
 * Save theme config to localStorage
 */
function saveConfig(config: ThemeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save theme config:", error);
  }
}

/**
 * Get effective theme considering system preference
 */
function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme, colorScheme: ColorScheme): void {
  const effectiveTheme = getEffectiveTheme(theme);
  const htmlElement = document.documentElement;

  // Set theme class
  if (effectiveTheme === "dark") {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }

  // Set color scheme attribute for CSS variable overrides
  htmlElement.setAttribute("data-color-scheme", colorScheme);

  // Set HTML color-scheme attribute for native elements
  htmlElement.style.colorScheme = effectiveTheme;

  // Dispatch custom event so listeners (PalettePreview) can react
  window.dispatchEvent(
    new CustomEvent("themechange", {
      detail: { theme: effectiveTheme, colorScheme },
    })
  );
}

/**
 * Initialize theme on app startup
 */
export function initTheme(): void {
  const config = getStoredConfig();
  applyTheme(config.theme, config.colorScheme);

  // Listen for system theme changes
  if (config.theme === "system") {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkModeQuery.addEventListener("change", () => {
      applyTheme(config.theme, config.colorScheme);
    });
  }
}

/**
 * Set theme
 */
export function setTheme(theme: Theme): void {
  const config = getStoredConfig();
  config.theme = theme;
  saveConfig(config);
  applyTheme(config.theme, config.colorScheme);
}

/**
 * Set color scheme
 */
export function setColorScheme(colorScheme: ColorScheme): void {
  const config = getStoredConfig();
  config.colorScheme = colorScheme;
  saveConfig(config);
  applyTheme(config.theme, config.colorScheme);
}

/**
 * Get current theme config
 */
export function getThemeConfig(): ThemeConfig {
  return getStoredConfig();
}

/**
 * Get all available color schemes
 */
export const AVAILABLE_COLOR_SCHEMES: { name: string; value: ColorScheme }[] = [
  { name: "Neutral", value: "neutral" },
  { name: "Stone", value: "stone" },
  { name: "Zinc", value: "zinc" },
  { name: "Gray", value: "gray" },
  { name: "Slate", value: "slate" },
  { name: "Red", value: "red" },
  { name: "Blue", value: "blue" },
  { name: "Violet", value: "violet" },
  { name: "Rose", value: "rose" },
  { name: "Orange", value: "orange" },
  { name: "Green", value: "green" },
  { name: "Yellow", value: "yellow" },
];
