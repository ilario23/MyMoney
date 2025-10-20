import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '@/translations';

export type { Language, TranslationKey };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get from localStorage or browser locale or default to Italian
    const stored = localStorage.getItem('app-language') as Language | null;
    if (stored) return stored;
    
    const browserLang = navigator.language.startsWith('en') ? 'en' : 'it';
    return browserLang as Language;
  });

  // Save to localStorage when language changes
  useEffect(() => {
    localStorage.setItem('app-language', language);
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
