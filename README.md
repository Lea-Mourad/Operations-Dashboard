# Operations Command Center

This is my take on the Operations Command Center assignment.

I built it as a separated frontend/backend app:
- `Next.js` for the frontend
- `Express` for the backend API
- `Prisma + SQLite` for persistence

The goal was to keep the workflow logic shared and adapter-based instead of building three unrelated flows.

## What’s in the app

- Dashboard
- Submit Event
- Event Inbox
- Review Queue
- Audit Trail
- Event Detail view

The backend currently handles:
- FinanceOps overdue invoices
- CampaignOps client briefs
- GuestOps reservation change requests
- review-required fallbacks for invalid, unsupported, or failed events

## Project structure

```text
src/
  backend/
    app.js
    server.js
    routes/
    controllers/
    middleware/
    services/
    workflows/
    repositories/
    db/
  frontend/
    app/
    components/
    hooks/
    lib/
    types/
prisma/
tests/
```

A small root `app/` folder still exists because Next App Router expects it, but the actual frontend implementation lives under `src/frontend`.

## Run locally

Install dependencies:

```bash
npm install
```

Set up the database:

```bash
npx prisma migrate dev
```

Start both frontend and backend:

```bash
npm run dev
```

Default ports:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:4000](http://localhost:4000)

If one of those ports is already in use, stop the old process first and rerun.

## Environment

Use a local `.env` file like this:

```bash
DATABASE_URL="file:./dev.db"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## API routes

- `POST /api/events/submit`
- `GET /api/events`
- `GET /api/events/:id`
- `GET /api/dashboard`
- `GET /api/reviews`
- `POST /api/reviews/:id/resolve`
- `POST /api/reviews/:id/reprocess`
- `GET /api/audit`

## Useful commands

```bash
npm run db:push
npm run db:seed
npm test
npm run build
```

## Notes on persistence

The app data lives in [prisma/dev.db](/Users/leamurad/mokeytribe assesment/prisma/dev.db).

Important behavior:
- `npm run dev` keeps existing data
- `npm run db:seed` is non-destructive and only inserts the sample events if they are missing
- `npm test` backs up and restores `prisma/dev.db`, so tests should not wipe app data

## Testing

I added workflow tests around:

1. successful FinanceOps processing
2. successful CampaignOps processing
3. successful GuestOps processing
4. duplicate protection on `source_event_id`
5. invalid payloads going to review
6. failed mock execution staying auditable
7. review queue reprocessing for corrected payloads

## A couple of implementation choices

- I kept Prisma as the persistence layer, but moved the request handling into a real Express backend instead of Next route handlers.
- The workflow engine is still the center of the backend design. Each stream has its own adapter, but the intake / validation / persistence / audit flow is shared.
- On the frontend, I tried to keep the UI more operator-friendly than developer-heavy, so raw JSON is mostly hidden behind detail sections instead of being the primary interface.
