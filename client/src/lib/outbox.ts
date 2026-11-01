import Dexie, { type EntityTable } from "dexie"

import {
  RejectedError,
  submitInspection,
  type InspectionPayload,
} from "@/lib/inspections"

const db = new Dexie("muhaid") as Dexie & {
  outbox: EntityTable<InspectionPayload, "id">
}
db.version(1).stores({ outbox: "id" })

export function saveToOutbox(payload: InspectionPayload) {
  return db.outbox.put(payload)
}

export function removeFromOutbox(id: string) {
  return db.outbox.delete(id)
}

let isSyncing = false

export async function syncOutbox() {
  if (isSyncing) return
  isSyncing = true
  try {
    for (const payload of await db.outbox.toArray()) {
      try {
        await submitInspection(payload)
        await removeFromOutbox(payload.id)
      } catch (error) {
        // A rejected form is kept so its data isn't lost, and it must not hold up the others.
        // Any other failure means the server can't be reached, so the rest would fail too.
        if (!(error instanceof RejectedError)) return
      }
    }
  } finally {
    isSyncing = false
  }
}
