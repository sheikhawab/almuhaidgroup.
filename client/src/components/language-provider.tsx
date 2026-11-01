import { createContext, useContext, useEffect, useState } from "react"

import { DirectionProvider } from "@/components/ui/direction"
import { translations, type Language } from "@/lib/translations"

const STORAGE_KEY = "language"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (typeof translations)[Language]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ar"
  } catch {
    return "ar"
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)
  const direction = language === "ar" ? "rtl" : "ltr"
  const t = translations[language]

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
    document.title = t.pageTitle
  }, [language, direction, t])

  function setLanguage(next: Language) {
    setLanguageState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The choice still applies for this visit when storage is blocked.
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <DirectionProvider direction={direction}>{children}</DirectionProvider>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
