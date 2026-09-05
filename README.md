# Fitness Retention Pilot

A lean web app for a 4-6 week, 15-20 user pilot testing whether AI-coach nudging +
camera-based movement tracking sustains a workout habit better than plain logging.

## Stack

- **Next.js (App Router, TypeScript)** — frontend + backend (API routes) in one app, one deploy.
- **MediaPipe Tasks Vision (`PoseLandmarker`)** — off-the-shelf pose estimation, running
  **entirely client-side** in the browser. Video never leaves the device — only derived
  numbers (rep counts, angles, confidence) are sent to the server.
- **Postgres + Prisma** — one database for workouts, sets, nudges, miscount flags, and a
  generic analytics event log.
- **No passwords** — each pilot user gets a private access code (their invite link) that
  logs them into a signed, httpOnly session cookie.
- **Nudges are templated, rules-based, in-app only** — no LLM, no push/SMS/email infra.

## Local setup

```bash
npm install
npx prisma migrate dev   # applies the schema to $DATABASE_URL
npx prisma db seed       # creates pilot users from prisma/seed.ts — edit that list first
npm run dev
```

Copy `.env` and set:

- `DATABASE_URL` — Postgres connection string.
- `SESSION_SECRET` — random string, signs the session cookie.
- `CRON_SECRET` — random string, required as a Bearer token on `/api/cron/nudge`.

## Deploying the pilot

1. Create a Postgres database (Supabase or Neon both work fine — free tier easily covers
   15-20 users for 4-6 weeks).
2. Push this repo to GitHub and import it into Vercel. Vercel deploys the frontend and all
   API routes together — no separate backend to host.
3. Set `DATABASE_URL`, `SESSION_SECRET`, and `CRON_SECRET` in the Vercel project's
   environment variables.
4. Run `npx prisma migrate deploy` against the production database (or let Vercel's build
   step do it — see `package.json` if you wire that up).
5. Edit `prisma/seed.ts` with your real participant names and run `npx prisma db seed`
   against production to generate their access codes, then send each person their code.
6. `vercel.json` already schedules `/api/cron/nudge` daily at 13:00 UTC — Vercel Cron sends
   `Authorization: Bearer $CRON_SECRET` automatically once that env var is set.

## Reviewing pilot data

Everything lives in Postgres — connect with `psql` or a GUI (TablePlus, Supabase's table
editor, etc.) and query directly:

- `"Workout"` / `"Set"` — completions, rep counts, form-cue counts, per-set low-confidence
  seconds.
- `"MiscountFlag"` — every "that count looked wrong" tap, with exercise + timestamp.
- `"Nudge"` — what was shown, when, and whether it was followed by a same-day workout
  (`resultedInWorkout`).
- `"AnalyticsEvent"` — append-only log of `workout_completed` (includes `dayNumber` since
  signup, so day-1/7/28 activity is `WHERE payload->>'dayNumber' IN ('1','7','28')`),
  `nudge_sent`, `nudge_seen`, `nudge_same_day_completion`.

## Known pilot-scope simplifications

These are deliberate — fine for 15-20 known users over 4-6 weeks, called out so they're not
mistaken for oversights:

- Streak "days" are calculated in UTC, not each user's local timezone — a workout right
  around midnight could land on the "wrong" day for some users.
- Consent is asked once per user (stored on `User.consentedAt`), not re-asked every session.
- No camera calibration presets per exercise — the same "is your full body visible" check
  runs before every exercise; push-ups in particular work best with the camera to the side,
  which is only communicated via the exercise label, not enforced.
- The pose model is loaded from Google's hosted model URL rather than self-hosted, so the
  first load of each session needs internet access (the WASM runtime itself is self-hosted
  under `public/mediapipe/`).

None of the above blocks adding push notifications, more exercises, or per-timezone streaks
later — see the nudge/streak modules under `lib/` for where those would plug in.
