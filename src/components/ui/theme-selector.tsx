import {
  setTheme,
  setColorScheme,
  getThemeConfig,
  AVAILABLE_COLOR_SCHEMES,
  type Theme,
} from "@/lib/theme.store";
import { useLanguage } from "@/lib/language";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Sun, Moon, Monitor, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { PalettePreview } from "./palette-preview";

/**
 * Theme selector component for profile settings
 * Allows users to choose theme (light/dark/system) and color scheme
 */
export function ThemeSelector() {
  const { t } = useLanguage();
  const [config, setConfig] = useState(getThemeConfig());
  const [mounted, setMounted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    setConfig(getThemeConfig());
  };

  const handleColorSchemeChange = (colorScheme: string) => {
    setColorScheme(colorScheme as any);
    setConfig(getThemeConfig());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="w-5 h-5" />
          {t("theme.appearance")}
        </CardTitle>
        <CardDescription>{t("theme.customize")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">{t("theme.theme")}</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={config.theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("light")}
              className="flex items-center gap-2"
            >
              <Sun className="w-4 h-4" />
              {t("theme.light")}
            </Button>
            <Button
              variant={config.theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("dark")}
              className="flex items-center gap-2"
            >
              <Moon className="w-4 h-4" />
              {t("theme.dark")}
            </Button>
            <Button
              variant={config.theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("system")}
              className="flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              {t("theme.system")}
            </Button>
          </div>
        </div>

        {/* Color Scheme Selection */}
        <Accordion
          type="single"
          collapsible
          defaultValue=""
          className="border border-input rounded-lg"
        >
          <AccordionItem value="color-scheme">
            <AccordionTrigger>{t("theme.colorScheme")}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {/* Neutral Schemes */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("theme.neutral")}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_COLOR_SCHEMES.filter((s) =>
                      ["neutral", "stone", "zinc", "gray", "slate"].includes(
                        s.value
                      )
                    ).map((scheme) => (
                      <button
                        key={scheme.value}
                        onClick={() => handleColorSchemeChange(scheme.value)}
                        className={`h-10 rounded-lg border transition-all text-sm font-medium shadow-xs ${
                          config.colorScheme === scheme.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                        title={scheme.name}
                      >
                        {scheme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vivid Schemes */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("theme.vivid")}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_COLOR_SCHEMES.filter(
                      (s) =>
                        !["neutral", "stone", "zinc", "gray", "slate"].includes(
                          s.value
                        )
                    ).map((scheme) => (
                      <button
                        key={scheme.value}
                        onClick={() => handleColorSchemeChange(scheme.value)}
                        className={`h-10 rounded-lg border transition-all text-sm font-medium shadow-xs ${
                          config.colorScheme === scheme.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                        title={scheme.name}
                      >
                        {scheme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="pt-2 mt-4 border-t space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {t("theme.current")}:{" "}
                    {config.theme === "system"
                      ? t("theme.system")
                      : config.theme.charAt(0).toUpperCase() +
                        config.theme.slice(1)}{" "}
                    {t("theme.mode")} •{" "}
                    {AVAILABLE_COLOR_SCHEMES.find(
                      (s) => s.value === config.colorScheme
                    )?.name || config.colorScheme}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreview((p) => !p)}
                    className="flex items-center gap-2"
                  >
                    {showPreview ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4 rotate-180" />
                    )}
                    {showPreview ? t("theme.hide") : t("theme.show")}{" "}
                    {t("theme.palette")}
                  </Button>
                  {showPreview && <PalettePreview />}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
