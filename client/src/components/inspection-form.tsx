import { useState } from "react"
import { CircleAlertIcon, CircleCheckIcon, ImageIcon } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { inspectionItems } from "@/data/inspection-items"
import { useFileUpload } from "@/hooks/use-file-upload"
import {
  fileToBase64,
  RejectedError,
  submitInspection,
  type InspectionPayload,
} from "@/lib/inspections"
import { removeFromOutbox, saveToOutbox } from "@/lib/outbox"
import { cn } from "@/lib/utils"

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const WORK_ORDER_ID = "work-order"

type AnswerValue = "yes" | "no" | "na"
type ItemState = { answer: AnswerValue | null; remark: string }
type ImageError = "imageTypeError" | "imageSizeError"

const answerOptions = [
  { value: "yes", labelKey: "optionYes" },
  { value: "no", labelKey: "optionNo" },
  { value: "na", labelKey: "optionNa" },
] as const

const emptyItems = (): Record<string, ItemState> =>
  Object.fromEntries(
    inspectionItems.map((item) => [item.id, { answer: null, remark: "" }])
  )

function remarkId(itemId: string) {
  return `${itemId}-remark`
}

export function InspectionForm({ onReset }: { onReset: () => void }) {
  const { language, t } = useLanguage()
  // Stays the same across retries, so a re-sent form can't be saved twice.
  const [inspectionId] = useState(() => crypto.randomUUID())
  const [workOrder, setWorkOrder] = useState("")
  const [items, setItems] = useState(emptyItems)
  const [showErrors, setShowErrors] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isQueued, setIsQueued] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)
  const [imageError, setImageError] = useState<ImageError | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [{ files }, { addFiles, clearFiles, removeFile, openFileDialog, getInputProps }] =
    useFileUpload({ accept: "image/*", maxSize: MAX_IMAGE_SIZE })
  const image = files[0]

  const workOrderMissing = !workOrder.trim()
  const isAnswerMissing = (itemId: string) => !items[itemId].answer
  const isRemarkMissing = (itemId: string) =>
    items[itemId].answer === "no" && !items[itemId].remark.trim()

  function updateAnswer(itemId: string, answer: AnswerValue) {
    setItems((current) => ({
      ...current,
      [itemId]: {
        answer,
        remark: answer === "no" ? current[itemId].remark : "",
      },
    }))
  }

  function updateRemark(itemId: string, remark: string) {
    setItems((current) => ({
      ...current,
      [itemId]: { ...current[itemId], remark },
    }))
  }

  // Validated here because the hook's errors are English only and an invalid
  // pick would also drop the image that is already attached.
  function pickImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setImageError("imageTypeError")
    } else if (file.size > MAX_IMAGE_SIZE) {
      setImageError("imageSizeError")
    } else {
      setImageError(null)
      addFiles([file])
    }
  }

  function findFirstErrorId() {
    if (workOrderMissing) return WORK_ORDER_ID
    for (const { id } of inspectionItems) {
      if (isAnswerMissing(id)) return id
      if (isRemarkMissing(id)) return remarkId(id)
    }
    return null
  }

  async function buildPayload(): Promise<InspectionPayload> {
    const payload: InspectionPayload = {
      id: inspectionId,
      workOrder: workOrder.trim(),
      inspectedAt: new Date().toISOString(),
      answers: inspectionItems.map(({ id }) => {
        const { answer, remark } = items[id]
        return answer === "no"
          ? { itemId: id, answer, remark: remark.trim() }
          : { itemId: id, answer: answer as "yes" | "na" }
      }),
    }

    if (image?.file instanceof File) {
      payload.image = await fileToBase64(image.file)
      payload.imageType = image.file.type
    }

    return payload
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setShowErrors(true)

    const firstErrorId = findFirstErrorId()
    if (firstErrorId) {
      const element = document.getElementById(firstErrorId)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
      element?.focus({ preventScroll: true })
      return
    }

    setIsSubmitting(true)
    setSubmitFailed(false)
    try {
      const payload = await buildPayload()
      // Saved before sending, so closing the tab mid-request can't lose the form.
      await saveToOutbox(payload)
      try {
        await submitInspection(payload)
        await removeFromOutbox(payload.id)
      } catch (error) {
        // The form is still on screen to fix, so the saved copy isn't needed.
        if (error instanceof RejectedError) {
          await removeFromOutbox(payload.id)
          throw error
        }
        setIsQueued(true)
      }
      setIsComplete(true)
      window.scrollTo({ top: 0 })
    } catch {
      setSubmitFailed(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleNewForm() {
    clearFiles()
    onReset()
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Alert>
          <CircleCheckIcon />
          <AlertTitle>{isQueued ? t.pendingTitle : t.successTitle}</AlertTitle>
          <AlertDescription>
            <p>
              {t.successWorkOrder} <bdi>{workOrder.trim()}</bdi>
            </p>
          </AlertDescription>
        </Alert>
        <Button type="button" onClick={handleNewForm}>
          {t.newForm}
        </Button>
      </div>
    )
  }

  const workOrderInvalid = showErrors && workOrderMissing

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <Field data-invalid={workOrderInvalid}>
            <FieldLabel htmlFor={WORK_ORDER_ID}>
              {t.workOrderLabel}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input
              id={WORK_ORDER_ID}
              required
              value={workOrder}
              placeholder="WO-2026-0142"
              aria-invalid={workOrderInvalid}
              aria-describedby={workOrderInvalid ? `${WORK_ORDER_ID}-error` : undefined}
              onChange={(event) => setWorkOrder(event.target.value)}
            />
            {workOrderInvalid && (
              <FieldError id={`${WORK_ORDER_ID}-error`}>{t.workOrderRequired}</FieldError>
            )}
          </Field>
        </CardContent>
      </Card>

      <section aria-labelledby="items-title" className="flex flex-col gap-3">
        <h2 id="items-title" className="text-lg font-semibold">
          {t.itemsTitle}
        </h2>
        {inspectionItems.map((item, index) => {
          const { answer, remark } = items[item.id]
          const answerInvalid = showErrors && isAnswerMissing(item.id)
          const remarkInvalid = showErrors && isRemarkMissing(item.id)

          return (
            <Card key={item.id}>
              <CardContent>
                <FieldSet id={item.id} tabIndex={-1} className="outline-none">
                  <FieldLegend className="flex gap-2 leading-relaxed">
                    <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
                    <span>{item[language]}</span>
                  </FieldLegend>
                  <RadioGroup
                    name={item.id}
                    value={answer}
                    aria-invalid={answerInvalid}
                    aria-describedby={answerInvalid ? `${item.id}-error` : undefined}
                    className="grid-cols-1 sm:grid-cols-3"
                    onValueChange={(value) => updateAnswer(item.id, value as AnswerValue)}
                  >
                    {answerOptions.map((option) => {
                      const optionId = `${item.id}-${option.value}`
                      return (
                        <FieldLabel key={option.value} htmlFor={optionId}>
                          <Field orientation="horizontal" data-invalid={answerInvalid}>
                            <RadioGroupItem
                              id={optionId}
                              value={option.value}
                              aria-invalid={answerInvalid}
                              className="border-muted-foreground/60"
                            />
                            <FieldTitle>{t[option.labelKey]}</FieldTitle>
                          </Field>
                        </FieldLabel>
                      )
                    })}
                  </RadioGroup>
                  {answerInvalid && (
                    <FieldError id={`${item.id}-error`}>{t.answerRequired}</FieldError>
                  )}
                  {answer === "no" && (
                    <Field data-invalid={remarkInvalid}>
                      <FieldLabel htmlFor={remarkId(item.id)}>
                        {t.remarkLabel}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Textarea
                        id={remarkId(item.id)}
                        required
                        value={remark}
                        placeholder={t.remarkPlaceholder}
                        aria-invalid={remarkInvalid}
                        aria-describedby={
                          remarkInvalid ? `${remarkId(item.id)}-error` : undefined
                        }
                        onChange={(event) => updateRemark(item.id, event.target.value)}
                      />
                      {remarkInvalid && (
                        <FieldError id={`${remarkId(item.id)}-error`}>
                          {t.remarkRequired}
                        </FieldError>
                      )}
                    </Field>
                  )}
                </FieldSet>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card>
        <CardContent>
          <Field data-invalid={Boolean(imageError)}>
            <FieldTitle>{t.imageLabel}</FieldTitle>
            <div
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : imageError
                    ? "border-destructive"
                    : "border-muted-foreground/40"
              )}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false)
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                pickImage(event.dataTransfer.files[0])
              }}
            >
              {image ? (
                <img
                  src={image.preview}
                  alt={t.imagePreviewAlt}
                  className="max-h-48 max-w-full rounded-md object-contain"
                />
              ) : (
                <ImageIcon aria-hidden="true" className="size-8 text-muted-foreground" />
              )}
              {image ? (
                <p className="max-w-full truncate text-sm text-foreground" aria-live="polite">
                  <bdi>{image.file.name}</bdi>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t.imageHint}</p>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={openFileDialog}>
                  {image ? t.changeImage : t.uploadImage}
                </Button>
                {image && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setImageError(null)
                      removeFile(image.id)
                    }}
                  >
                    {t.removeImage}
                  </Button>
                )}
              </div>
              <input
                {...getInputProps()}
                className="sr-only"
                tabIndex={-1}
                aria-label={t.imageLabel}
                onChange={(event) => {
                  pickImage(event.target.files?.[0])
                  event.target.value = ""
                }}
              />
            </div>
            {imageError && <FieldError>{t[imageError]}</FieldError>}
          </Field>
        </CardContent>
      </Card>

      {submitFailed && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{t.submitError}</AlertTitle>
        </Alert>
      )}

      <Button type="submit" size="lg" className="self-start" disabled={isSubmitting}>
        {isSubmitting ? t.submitting : t.submit}
      </Button>
    </form>
  )
}
