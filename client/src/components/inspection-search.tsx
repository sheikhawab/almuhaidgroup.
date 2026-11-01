import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { inspectionItems } from "@/data/inspection-items"
import { getInspections, type SavedInspection } from "@/lib/inspections"

export function InspectionSearch() {
  const { language, t } = useLanguage()
  const [workOrder, setWorkOrder] = useState("")
  const [results, setResults] = useState<SavedInspection[] | null>(null)
  const [searchFailed, setSearchFailed] = useState(false)
  const answerLabels = { yes: t.optionYes, no: t.optionNo, na: t.optionNa }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = workOrder.trim()
    if (!query) return

    setResults(null)
    setSearchFailed(false)
    try {
      setResults(await getInspections(query))
    } catch {
      setSearchFailed(true)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          required
          aria-label={t.workOrderLabel}
          placeholder={t.workOrderLabel}
          value={workOrder}
          onChange={(event) => setWorkOrder(event.target.value)}
        />
        <Button type="submit">{t.search}</Button>
      </form>

      {searchFailed && <p className="text-sm text-destructive">{t.searchError}</p>}
      {results?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.searchEmpty}</p>
      )}

      {results?.map((inspection) => (
        <div key={inspection.id} className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">
            {new Date(inspection.inspectedAt).toLocaleString(language)}
          </p>
          {inspection.answers.map((answer) => (
            <p key={answer.itemId}>
              {inspectionItems.find(({ id }) => id === answer.itemId)?.[language]}{" "}
              <strong>{answerLabels[answer.answer]}</strong>
              {answer.remark && ` (${answer.remark})`}
            </p>
          ))}
        </div>
      ))}
    </section>
  )
}
