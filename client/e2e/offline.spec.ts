import { randomUUID } from 'node:crypto'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const ITEM_IDS = [
  'greenhouses',
  'engineering-design',
  'cybersecurity',
  'residential-units',
  'lab-equipment',
]

function readOutbox(page: Page) {
  return page.evaluate(
    () =>
      new Promise<any[]>((resolve, reject) => {
        const open = indexedDB.open('muhaid')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const read = open.result.transaction('outbox').objectStore('outbox').getAll()
          read.onerror = () => reject(read.error)
          read.onsuccess = () => {
            open.result.close()
            resolve(read.result)
          }
        }
      })
  )
}

async function findSaved(request: APIRequestContext, workOrder: string) {
  const response = await request.get('/api/inspections', { params: { workOrder } })
  expect(response.ok()).toBe(true)
  return response.json()
}

async function fillForm(page: Page, workOrder: string) {
  // By id, because the search box on the same page has the same label.
  await page.locator('#work-order').fill(workOrder)
  for (const id of ITEM_IDS) {
    await page.locator(`label[for="${id}-yes"]`).click()
  }
}

test.describe('offline submission', () => {
  let workOrder: string

  test.beforeEach(async ({ context, page }) => {
    // Unique per test, because these rows stay in the real database.
    workOrder = `WO-E2E-${randomUUID()}`

    // Tests run in English. The app defaults to Arabic.
    await page.addInitScript(() => localStorage.setItem('language', 'en'))

    await page.goto('/')
    await fillForm(page, workOrder)

    await context.setOffline(true)
    await page.getByRole('button', { name: 'Submit form' }).click()
    await expect(page.getByText('Saved. It will be sent when the connection returns.')).toBeVisible()
  })

  test('shows the pending message and saves nothing on the server while offline', async ({
    request,
  }) => {
    expect(await findSaved(request, workOrder)).toHaveLength(0)
  })

  test('saves the form in IndexedDB', async ({ page }) => {
    const outbox = await readOutbox(page)

    expect(outbox).toHaveLength(1)
    expect(outbox[0].workOrder).toBe(workOrder)
    expect(outbox[0].answers).toHaveLength(ITEM_IDS.length)
  })

  test('saves the form in the database and empties the outbox when the connection returns', async ({
    context,
    page,
    request,
  }) => {
    const [queued] = await readOutbox(page)

    await context.setOffline(false)

    await expect.poll(() => readOutbox(page)).toHaveLength(0)
    const saved = await findSaved(request, workOrder)
    expect(saved).toHaveLength(1)
    expect(saved[0].id).toBe(queued.id)
    expect(saved[0].answers).toHaveLength(ITEM_IDS.length)
  })
})
