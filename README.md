# Operations Command Center

This is my take-home submission for the Operations Command Center prompt.

I built it as a small operations app with a separate frontend and backend:
- `src/frontend` holds the Next.js UI
- `src/backend` holds the Express API
- Prisma + SQLite handle persistence

The core idea is a shared workflow engine with stream-specific adapters, so FinanceOps, CampaignOps, and GuestOps all go through the same processing flow instead of being treated as unrelated forms.

## What the app does

- accepts events from FinanceOps, CampaignOps, and GuestOps
- validates the incoming shape and required fields
- routes each event to the correct workflow adapter
- generates actions based on the event type
- runs mock external services
- writes events, actions, review items, and audit logs to SQLite
- prevents duplicate processing by `source_event_id`
- sends unsupported or incomplete events to the review queue

## Main screens

- `Dashboard` for the high-level view
- `Submit Event` for guided event submission
- `Event Inbox` for all saved events
- `Review Queue` for blocked items that need operator input
- `Audit Trail` for event history
- `Event Detail` for the full record of one event

## Workflow coverage

### FinanceOps
Supports `invoice.overdue`.

It creates:
- a payment reminder
- a follow-up task

Priority is marked `high` when `days_overdue > 14`, otherwise `normal`.

### CampaignOps
Supports `client_brief.received`.

It creates one campaign task per channel and carries the deadline through to each task.

### GuestOps
Supports `reservation.change_requested`.

It creates:
- a reservation change action
- a guest confirmation message

If key reservation fields are missing, the event goes to review instead of being completed automatically.

## Review and reprocessing

If an event cannot be completed safely, it moves to the review queue.

From there, an operator can:
- resolve it manually with notes
- edit the payload
- reprocess the same event without creating a duplicate record

When reprocessing succeeds, the event is completed, new actions are saved, and the review item is resolved. If it still cannot be completed, it stays in review with updated history.

## Running the project

Install dependencies:

```bash
npm install
```

Create or update the local database:

```bash
npx prisma migrate dev
```

Start both apps:

```bash
npm run dev
```

URLs:
- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`

## Helpful commands

Run frontend only:

```bash
npm run dev:frontend
```

Run backend only:

```bash
npm run dev:backend
```

Run tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

Open the database in Prisma Studio:

```bash
npx prisma studio
```

## Data persistence

App data is stored in:

`prisma/dev.db`

I set it up so normal development keeps your data:
- `npm run dev` does not clear the database
- `npm run db:seed` only adds sample records if they are missing
- `npm test` preserves the local database by backing it up and restoring it after the test run

## API endpoints

- `POST /api/events/submit`
- `GET /api/events`
- `GET /api/events/:id`
- `GET /api/dashboard`
- `GET /api/reviews`
- `POST /api/reviews/:id/resolve`
- `POST /api/reviews/:id/reprocess`
- `GET /api/audit`

## Notes

I kept the backend logic and workflow behavior separate from the UI so the frontend only talks to the API. That made it easier to clean up the UX without changing how events are processed.
