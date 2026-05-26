# Operations Command Center

This is my take-home submission for the Operations Command Center exercise.

I structured it as a separated frontend and backend:
- `src/frontend` contains the Next.js app
- `src/backend` contains the Express API
- Prisma + SQLite handle persistence

The main architectural choice was using one shared workflow engine with stream-specific adapters, instead of building three unrelated flows.

## What it does

The app accepts events from:
- FinanceOps
- CampaignOps
- GuestOps

For each event, it:
- validates the top-level shape and payload fields
- detects the right workflow
- generates actions
- runs mock external services
- stores events, actions, review items, and audit history
- prevents duplicate processing with `source_event_id`
- routes unsafe or incomplete events to human review

## Required pages

The UI is focused on the 5 required pages:
- `Dashboard`
- `Submit Event`
- `Event Inbox`
- `Event Detail`
- `Review Queue`

There is no standalone Audit Trail page anymore. Audit history still exists, but it now appears where it is actually useful:
- recent activity on the dashboard
- the timeline inside each event detail page

## Workflow coverage

### FinanceOps
Event type: `invoice.overdue`

Creates:
- `send_payment_reminder`
- `create_follow_up_task`

Priority becomes `high` when `days_overdue > 14`, otherwise `normal`.

### CampaignOps
Event type: `client_brief.received`

Creates one task per channel and carries the deadline into each generated task.

### GuestOps
Event type: `reservation.change_requested`

Creates:
- `request_reservation_change`
- `generate_guest_message`

If required reservation fields are missing, the event goes to review instead of being auto-completed.

## Review and reprocessing

If an event cannot be completed safely, it goes into the review queue.

From there, an operator can:
- resolve it manually with notes
- edit the event payload
- reprocess the same event without creating a duplicate

During reprocessing, existing valid values stay filled in and missing values stay blank so the operator can correct only what is missing.

## Running the project

Install dependencies:

```bash
npm install
```

Create or update the database:

```bash
npx prisma migrate dev
```

Start frontend and backend together:

```bash
npm run dev
```

Default URLs:
- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`

If one of those ports is already in use, stop the old process first and run `npm run dev` again.

## Useful commands

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

The local SQLite database lives at:

`prisma/dev.db`

Current behavior:
- `npm run dev` keeps your data
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

The frontend only talks to the backend API. There are no Prisma or workflow engine imports in the client UI.

I kept the data flow stable and moved most of the iteration into the UI layer so I could improve the operator experience without changing the workflow behavior underneath.
