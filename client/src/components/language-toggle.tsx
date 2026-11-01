import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import type { Language } from "@/lib/translations"

const languages: { value: Language; label: string }[] = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
]

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div role="group" aria-label={t.languageLabel} className="flex gap-1">
      {languages.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          size="sm"
          lang={value}
          variant={language === value ? "default" : "outline"}
          aria-pressed={language === value}
          onClick={() => setLanguage(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
