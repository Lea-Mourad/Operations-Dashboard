# Operations Command Center

Operations Command Center is split into a dedicated Express backend and a Next.js frontend while preserving the existing workflow engine behavior, Prisma persistence, and UI flows.

## Architecture

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

- Frontend: Next.js App Router on `http://localhost:3000`
- Backend: Express API on `http://localhost:4000`
- Database: Prisma + SQLite

The root `app/` directory remains as a thin Next.js bridge because App Router requires it, but the actual UI implementation lives under `src/frontend`.

## Environment

Create a local `.env` file from `.env.example` if needed:

```bash
DATABASE_URL="file:./dev.db"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## Install and Run

```bash
npm install
npx prisma migrate dev
npm run dev
```

That starts:

- Frontend at [http://localhost:3000](http://localhost:3000)
- Backend at [http://localhost:4000](http://localhost:4000)

## Backend API

- `POST /api/events/submit`
- `GET /api/events`
- `GET /api/events/:id`
- `GET /api/dashboard`
- `GET /api/reviews`
- `POST /api/reviews/:id/resolve`
- `GET /api/audit`

## Useful Commands

```bash
npm run db:push
npm run db:seed
npm test
npm run build
```

## Testing

The workflow tests now run against the extracted backend service layer in `src/backend/services/workflowEngine.js`, preserving the original behavior checks:

1. FinanceOps event succeeds
2. CampaignOps event succeeds
3. GuestOps event succeeds
4. Duplicate `source_event_id` is idempotent
5. Missing required fields go to `review_required`
6. Simulated external failure is auditable and routed to review
