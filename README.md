# DryRun

DryRun is a platform connecting students with working professionals for scheduled, scored mock interviews.

Students book time with real industry interviewers, walk through a mock interview, and receive a structured scorecard they can track over time. Interviewers list open slots, accept or decline requests, and build a rating history.

## Stack

- **Backend:** Node.js + Express, raw SQL via [`pg`](https://node-postgres.com/) (no ORM — the booking concurrency logic is easiest to reason about as explicit, atomic SQL), JWT auth, `node-cron` for background jobs.
- **Database:** PostgreSQL.
- **Frontend:** React + Vite, React Router, [Luxon](https://moment.github.io/luxon/) for timezone-safe date handling.

## Project layout

```
server/   Express API, PostgreSQL access, auth, cron jobs
client/   React + Vite frontend ("Aurora Glass" design system)
```

## Local setup

### 1. Database

```
createdb dryrun
cd server
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:init         # applies server/src/db/schema.sql
```

### 2. Backend

```
cd server
npm run dev              # http://localhost:5000
```

### 3. Frontend

```
cd client
npm install
npm run dev               # http://localhost:5173
```

## What's technically interesting here

- **Concurrency-safe slot booking.** Two students hitting "request" on the same slot at the same instant is a real race condition, not a hypothetical. Booking uses a single atomic conditional `UPDATE slots SET status = 'pending' WHERE id = $1 AND status = 'open'` instead of a read-then-write — whichever request the database serializes first wins, the other gets a clean `409 Conflict`. See `server/src/controllers/bookingController.js` and `server/test-concurrency.js`, which fires two simultaneous requests at the same slot and asserts exactly one succeeds.
- **A layered, "honest, not perfect" trust model.** Interviewer identity is never treated as a solved problem. It's a self-declared profile, backed by a best-effort work-email domain check, with a manual LinkedIn-review fallback for anyone who doesn't clear that bar automatically, plus ongoing bidirectional ratings as a live trust signal. This is deliberately not a KYC system — it's the kind of pragmatic layering a small team can actually ship and reason about.

## Status

Built incrementally, feature by feature — see commit history for the build order (schema → auth → interviewer directory → slots → booking flow → meeting links → scorecards → trust layer → edge cases/cron jobs).
