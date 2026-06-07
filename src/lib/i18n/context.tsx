"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Language, type Translations } from "./translations";

type LanguageContextValue = {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "vi",
  t: translations.vi,
  setLang: () => {},
});

export function LanguageProvider({
  children,
  initialLang = "vi",
}: {
  children: ReactNode;
  initialLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
