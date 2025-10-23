import { useEffect, useState } from "react";

interface Swatch {
  label: string;
  var: string; // CSS variable name (without --)
}

const SWATCHES: Swatch[] = [
  { label: "Background", var: "background" },
  { label: "Foreground", var: "foreground" },
  { label: "Primary", var: "primary" },
  { label: "Primary FG", var: "primary-foreground" },
  { label: "Secondary", var: "secondary" },
  { label: "Accent", var: "accent" },
  { label: "Destructive", var: "destructive" },
  { label: "Muted", var: "muted" },
  { label: "Ring", var: "ring" },
];

export function PalettePreview() {
  const [values, setValues] = useState<Record<string, string>>({});

  const collect = () => {
    const root = document.documentElement;
    const next: Record<string, string> = {};
    SWATCHES.forEach((s) => {
      next[s.var] = getComputedStyle(root)
        .getPropertyValue(`--${s.var}`)
        .trim();
    });
    setValues(next);
  };

  useEffect(() => {
    collect(); // initial
    const handler = () => collect();
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {SWATCHES.map((s) => {
        const raw = values[s.var] || "";
        return (
          <div key={s.var} className="flex flex-col gap-1">
            <div
              className="h-12 w-full rounded-md border border-border shadow-sm flex items-center justify-center text-[10px]"
              style={{
                background: raw.startsWith("oklch") ? raw : `var(--${s.var})`,
                color: "var(--foreground)",
              }}
              title={raw}
            >
              {s.label}
            </div>
            <code className="text-[10px] whitespace-nowrap overflow-hidden text-ellipsis text-muted-foreground">
              {raw.replace(/oklch\(/, "")}
            </code>
          </div>
        );
      })}
    </div>
  );
}
