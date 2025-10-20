/**
 * Translations Index
 * Central export point for all translations
 */

import { it, type TranslationKey } from "./it";
import { en } from "./en";

export type { TranslationKey };

export const translations = {
  it,
  en,
} as const;

export type Language = keyof typeof translations;
