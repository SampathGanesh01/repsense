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

- `DATABASE_URL` — Postgres connection string used at runtime.
- `DIRECT_URL` — Postgres connection string used only by `prisma migrate`. Locally these are
  identical (one plain Postgres instance); in production they differ — see below.
- `SESSION_SECRET` — random string, signs the session cookie.
- `CRON_SECRET` — random string, required as a Bearer token on `/api/cron/nudge`.
- `ADMIN_SECRET` — password for `/admin`, the invite-link dashboard (see below).

## Deploying the pilot

1. **Create the database.** In Supabase: Project Settings → Database → Connection string.
   Supabase gives you two: a **pooled** one (port `6543`, host has `pooler` in it) and a
   **direct** one (port `5432`). This matters because Vercel runs your API routes as
   short-lived serverless functions — without pooling, a burst of requests can exhaust
   Postgres's connection limit even with only 15-20 users. Prisma's migration engine, on the
   other hand, needs the direct connection (the pooler doesn't support everything migrations
   need). Neon has the same pooled/direct split under Connection Details.
2. **Push this repo to GitHub and import it into Vercel.** Vercel deploys the frontend and
   all API routes together — no separate backend to host.
3. **Set five environment variables in the Vercel project** (Settings → Environment
   Variables):
   - `DATABASE_URL` = the **pooled** connection string.
   - `DIRECT_URL` = the **direct** connection string.
   - `SESSION_SECRET` / `CRON_SECRET` / `ADMIN_SECRET` = random strings (e.g.
     `openssl rand -hex 32`; `ADMIN_SECRET` can be a memorable phrase instead since you'll
     type it in by hand).
4. **Apply the schema to production** — run this from your machine, pointed at prod (not as
   part of the Vercel build, which avoids migration races across concurrent deploys):
   ```bash
   DATABASE_URL="<pooled-url>" DIRECT_URL="<direct-url>" npx prisma migrate deploy
   ```
5. **Invite people.** Easiest way: visit `/admin` on your deployed URL, sign in with
   `ADMIN_SECRET`, type a name, and copy the generated link — it logs that person straight
   into their dashboard, no code to type in by hand. (The CLI equivalent still works too:
   edit `prisma/seed.ts` and run the migrate-deploy command above with
   `APP_BASE_URL="https://<your-deployed-url>"` and `npx prisma db seed` instead.)
6. **Deploy** (Vercel does this automatically on push once the repo is imported).
   `vercel.json` already schedules `/api/cron/nudge` daily at 13:00 UTC — Vercel Cron sends
   `Authorization: Bearer $CRON_SECRET` automatically once that env var is set. Vercel's free
   Hobby tier supports daily cron frequency, so no paid plan is needed for this.
7. **Smoke-test:** open the deployed URL, log in with one seeded access code, and complete a
   full workout end to end before sending links to real participants.

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
