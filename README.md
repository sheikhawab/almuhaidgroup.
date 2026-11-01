# Field Inspection Form

An Arabic RTL inspection form that keeps working without a network. It has
5 items (Yes / No / N/A, with a remark required on "No"), a work order number
and one image. Saved forms can be looked up by work order number.

## Run

Requires Docker.

```bash
cp .env.example .env
docker compose up --build
```

Open http://localhost:8080. Tables are created automatically on start.

`server/docker-compose.yml` starts only Postgres, for running the server
outside Docker.

## Stack

React, TypeScript, Vite, Dexie, vite-plugin-pwa, Nginx, Express, Prisma,
PostgreSQL.

## Offline design

Every form is saved on the device before it is sent, so closing the tab
mid-request can't lose it.

| Server response | Result |
|---|---|
| Success, with the form's own id | Removed from the outbox, success screen |
| 4xx | Removed from the outbox, error shown, form stays filled in |
| Network failure, 5xx, or a 200 from something else (such as a Wi-Fi login page) | Stays in the outbox, pending screen |

Queued forms are re-sent on app load, on the `online` event and every 30
seconds. The timer is needed because no browser event fires when only the
server comes back.

After one online visit, a service worker lets the page open with no network.
Service workers need `localhost` or HTTPS.

**No duplicates:** each form gets a UUID on the device. The server upserts on
that id and keeps the first save, so re-sending is safe even if a response was
lost.

**Choices:**

- IndexedDB, because a base64 image can reach 6.7MB and `localStorage` holds
  about 5MB.
- A retry loop instead of Background Sync, which Safari and Firefox don't
  support.

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/inspections` | Save a form (safe to repeat) |
| GET | `/api/inspections?workOrder=WO-1` | Forms for a work order, without image data |

## Database

Migrations are in `server/prisma/migrations`. To open the database:

```bash
docker compose exec db psql -U muhaid -d muhaid
```

## Known limitations

- Requests time out after 30 seconds, so a large image may never send on a very
  slow connection.
- A form that keeps getting 5xx blocks the forms queued behind it.
- A form rejected during a background retry stays queued without telling the
  user.
- In the production build, opening an API URL directly in the browser shows the
  app instead of JSON.
- Search needs the exact work order number and doesn't work offline.
- There is no login, so anyone who can reach the app and knows a work order
  number can read its forms.
