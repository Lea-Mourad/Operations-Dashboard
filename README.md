# Operations Command Center

A full-stack operational workflow dashboard built for the Operations Command Center take-home exercise.

The application simulates an internal operations platform that receives events from multiple business systems, generates workflow actions, routes risky cases to human review, and preserves a complete audit trail.

The project was designed around a shared workflow engine with adapter-based stream handling instead of building separate disconnected flows.

---

# Features

## Operational Dashboard
- Workflow metrics
- Event status overview
- Failed/review-required monitoring
- Recent operational activity
- Audit visibility

## Submit Event
Guided operational forms for:
- FinanceOps
- CampaignOps
- GuestOps

Also includes:
- advanced JSON mode
- simulated external failure testing
- inline workflow result preview

## Event Inbox
- Filterable operational event table
- Workflow statuses
- Event detail access
- Audit visibility
- Duplicate-safe event handling

## Human Review Queue
- Review-required workflow handling
- Payload correction + reprocessing
- Manual operator resolution
- Resolution notes
- Human-in-the-loop workflow recovery

## Event Detail View
- Workflow lifecycle visibility
- Generated action rendering
- Payload details
- Audit timeline
- Action execution state

## Audit Trail
- Historical workflow activity
- Event lifecycle tracking
- Operational visibility across all events

---

# Workflow Lifecycle

Each incoming event follows a shared workflow pipeline:

1. Event intake
2. Validation
3. Stream detection
4. Workflow adapter execution
5. Action generation
6. Mock service execution
7. Persistence + audit logging
8. Human review fallback if required

The workflow engine is adapter-based so additional operational streams can be added without changing the shared orchestration flow.

---

# Supported Workflow Streams

## FinanceOps — Overdue Invoice

Handles:
- overdue invoice workflows
- payment reminder generation
- finance follow-up tasks

Features:
- priority escalation (`high` vs `normal`)
- audit logging
- review fallback
- execution failure handling

Generated actions:
- payment reminders
- finance follow-up tasks

---

## CampaignOps — Client Brief Received

Handles:
- client campaign intake
- multi-channel campaign workflows
- operational task generation

Features:
- one task generated per campaign channel
- channel-aware task naming
- deadline propagation

Generated actions:
- campaign tasks
- optional QA workflow support

---

## GuestOps — Reservation Change Request

Handles:
- reservation change requests
- guest communication workflows
- reservation validation

Features:
- guest-facing confirmation generation
- validation-based review escalation
- human correction + reprocessing

Generated actions:
- reservation change requests
- guest confirmation messages

---

# Human Review Flow

Invalid, ambiguous, unsupported, or manually corrected events are routed into a human review queue.

Operators can:
- inspect original events
- edit invalid payload fields
- reprocess events
- resolve review items
- preserve a full audit trail during the workflow lifecycle

If reprocessing succeeds:
- the event transitions to `completed`
- generated actions are persisted
- the review item is resolved automatically

---

# Event Status Lifecycle

| Status | Meaning |
|---|---|
| `received` | Event accepted and stored |
| `processing` | Workflow execution in progress |
| `completed` | Workflow and actions executed successfully |
| `review_required` | Human intervention required |
| `failed` | Valid workflow but execution failed |

Important distinction:

- `review_required` means the system could not safely determine automation behavior.
- `failed` means the workflow was valid, but execution failed during processing.

---

# Architecture

The application is intentionally split into separate frontend and backend layers.

## Frontend
- Next.js
- React
- TypeScript
- Component-based UI architecture

## Backend
- Express
- Prisma
- SQLite
- Shared workflow orchestration engine
- Adapter-based workflow execution

## Persistence
- Prisma ORM
- SQLite local database

---

# Project Structure

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