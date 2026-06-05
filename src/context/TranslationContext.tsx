import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../i18n/translations';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('alhan_pref_lang');
    if (saved === 'en' || saved === 'ar') return saved;
    return 'ar'; // Default to Arabic (as it is a local business in the region)
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('alhan_pref_lang', lang);
  };

  useEffect(() => {
    // Dynamically adjust text direction and language attributes
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add/remove class for styling hooks if needed
    if (language === 'ar') {
      document.body.classList.add('rtl-layout');
      document.body.classList.remove('ltr-layout');
    } else {
      document.body.classList.add('ltr-layout');
      document.body.classList.remove('rtl-layout');
    }
  }, [language]);

  const t = (key: string): string => {
    // Nested path resolution (e.g. t('inventory.sku')) if needed, or simple direct keys
    const langDict = translations[language];
    
    // Type-safe lookup fallback
    if (key in langDict) {
      return (langDict as Record<string, string>)[key];
    }
    
    // Fallback to English if not in current language dict
    const fallbackDict = translations['en'];
    if (key in fallbackDict) {
      return (fallbackDict as Record<string, string>)[key];
    }
    
    return key;
  };

  const isRTL = language === 'ar';

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
