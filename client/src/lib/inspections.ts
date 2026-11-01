export type InspectionAnswer =
  | { itemId: string; answer: "no"; remark: string }
  | { itemId: string; answer: "yes" | "na" }

export type InspectionPayload = {
  id: string
  workOrder: string
  inspectedAt: string
  image?: string
  imageType?: string
  answers: InspectionAnswer[]
}

// The server refused the form, so sending it again would fail the same way.
export class RejectedError extends Error {}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    // The result looks like "data:image/png;base64,AAAA", and the server only wants the part after the comma.
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function submitInspection(payload: InspectionPayload) {
  const response = await fetch("/api/inspections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // On a weak network the request could otherwise hang instead of failing.
    signal: AbortSignal.timeout(30_000),
  })

  // The body isn't read because not every server error is JSON.
  if (response.status >= 400 && response.status < 500) {
    throw new RejectedError(`Inspection rejected with status ${response.status}`)
  }
  if (!response.ok) {
    throw new Error(`Inspection request failed with status ${response.status}`)
  }
}

export type SavedInspection = {
  id: string
  inspectedAt: string
  answers: { itemId: string; answer: "yes" | "no" | "na"; remark: string | null }[]
}

export async function getInspections(workOrder: string) {
  const response = await fetch(`/api/inspections?workOrder=${encodeURIComponent(workOrder)}`)

  if (!response.ok) {
    throw new Error(`Inspections request failed with status ${response.status}`)
  }

  return (await response.json()) as SavedInspection[]
}
