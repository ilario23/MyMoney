# Theme Debug & Preview

This guide helps you verify dynamic theming and understand how color schemes map to semantic tokens.

## 1. How It Works

- The store (`lib/theme.store.ts`) sets `data-color-scheme` on the `<html>` element and toggles the `dark` class.
- CSS in `App.css` defines base variables and overrides inside `:root[data-color-scheme="..."]` and `.dark[data-color-scheme="..."]` selectors.
- Tailwind semantic utility classes (e.g. `bg-primary`, `text-muted-foreground`, `border-border`) resolve to those custom properties, enabling live theme switching.

## 2. Quick DevTools Validation

1. Open DevTools Elements panel and select `<html>`.
2. Change scheme via the Theme Selector UI.
3. Confirm `data-color-scheme` attribute updates (e.g. `blue`, `violet`).
4. In the Computed panel search for `--primary` – the OKLCH value should change per scheme.
5. Toggle Light/Dark and verify `.dark` class appears/disappears and variables swap.

## 3. Programmatic Check (optional in console)

```js
getComputedStyle(document.documentElement).getPropertyValue("--primary");
```

Repeat after switching schemes.

## 4. Palette Preview Component

A new `PalettePreview` (embedded in `ThemeSelector`) shows live swatches for key tokens:

- background, foreground, primary (+ foreground), secondary, accent, destructive, muted, ring.
  This helps confirm subtle neutral differences (stone/zinc/gray/slate) and more vivid ones (red/blue/violet).

## 5. Adding / Adjusting Schemes

To create a new scheme:

1. Duplicate one of the existing blocks in `App.css` (within `@layer base`).
2. Name it: `:root[data-color-scheme="emerald"]` + `.dark[data-color-scheme="emerald"]`.
3. Provide OKLCH values (keep contrast: ensure `primary-foreground` is legible on `primary`).
4. Add the scheme to `AVAILABLE_COLOR_SCHEMES`.

Tip: Use https://oklch.com or shadcn curated tokens to pick values with adequate contrast (contrast ratio >= ~4.5 for body text).

## 6. Neutral Schemes Look Similar?

Neutral families differ mainly by chroma and hue subtly. If you need stronger differentiation:

- Increase chroma for `--primary` in each neutral group (e.g. stone vs zinc).
- Slightly vary `--accent` or `--ring`.
- Introduce a `--highlight` token used in key UI pieces.

## 7. Common Pitfalls

| Symptom                                       | Likely Cause                                                           | Fix                                            |
| --------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| Clicking scheme does nothing visually         | Components still use hard-coded palette classes (e.g. `text-blue-600`) | Replace with semantic classes (`text-primary`) |
| Dark mode toggles primary but not backgrounds | Background still `bg-white` somewhere                                  | Change to `bg-background` or `bg-card`         |
| Some buttons ignore scheme                    | They use variant class with color baked (e.g. `bg-red-500`)            | Replace with `bg-primary` or token             |
| Contrast too low in dark mode                 | `primary` too light or `primary-foreground` too dark                   | Adjust OKLCH L and C values                    |

## 8. Suggested Next Improvements

- Add a small “Generate JSON” button to export current palette.
- Introduce a `success` token distinct from `primary` if needed.
- Add automated contrast assertions (utility: measure relative luminance of pairs).
- Provide user-controlled saturation slider for neutral schemes.

## 9. Example OKLCH Guidelines

- Light background: L ≈ 0.98 – 1, low C.
- Dark background: L ≈ 0.14 – 0.16.
- Primary light: L ≈ 0.20 – 0.55 (increase chroma for vivid hues).
- Ensure foreground on primary: difference in L >= 0.6 typically.

## 10. References

- Shadcn UI Themes: https://ui.shadcn.com/themes
- Shadcn Theming Docs: https://ui.shadcn.com/docs/theming
- OKLCH Picker: https://oklch.com

Happy theming! 🎨
