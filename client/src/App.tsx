import { useState } from 'react'
import { InspectionForm } from '@/components/inspection-form'
import { InspectionSearch } from '@/components/inspection-search'
import { useLanguage } from '@/components/language-provider'
import { LanguageToggle } from '@/components/language-toggle'
import { ThemeToggle } from '@/components/theme-toggle'

function App() {
  const { t } = useLanguage()
  const [formKey, setFormKey] = useState(0)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-medium text-muted-foreground">{t.organization}</p>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{t.pageTitle}</h1>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
        <InspectionForm key={formKey} onReset={() => setFormKey((key) => key + 1)} />
        <InspectionSearch />
      </main>
    </div>
  )
}

export default App
