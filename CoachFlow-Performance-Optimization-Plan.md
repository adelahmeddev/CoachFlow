# CoachFlow — Performance & Lightweight Optimization Plan

Based on the technical audit in `TECHNICAL.md`, this plan turns the documented bottlenecks, technical debt, and scalability risks into a concrete, ordered action list. Steps are grouped by priority (what breaks under load first) and each includes what to do, why, and how to verify it worked.

---

## How to use this plan

Work top to bottom. Priority 0 items are correctness/scalability blockers that cause real bugs today under concurrent load (multiple serverless instances). Priority 1 items are meaningful performance/footprint wins with low risk. Priority 2 items are cleanup that reduces bundle size and maintenance overhead. Each step is safe to ship independently.

---

## Priority 0 — Fix multi-instance state bugs (correctness under load)

Your app currently keeps several critical pieces of state in the memory of a single Node.js process (`message-bus.ts`, `unreadTrainerCache`, the auth rate limiter, and the JWT validation caches). On Vercel, every concurrent request can land on a *different* serverless instance, each with its own isolated memory. This isn't just a performance issue — it silently drops real-time messages, shows stale unread badges, and lets rate limits be bypassed.

### Step 1: Move the SSE message bus to Redis Pub/Sub
- Provision an Upstash Redis instance (serverless-friendly, pay-per-request, works well with Vercel).
- Replace the in-memory `Map`-based emitter in `src/server/realtime/message-bus.ts` with a Redis `PUBLISH`/`SUBSCRIBE` wrapper exposing the same `publish(channel, payload)` / `subscribe(channel, handler)` interface, so calling code (`/api/messages/stream/route.ts`) doesn't need to change.
- Each SSE route handler subscribes to a per-conversation channel (`conversation:{id}`) on connect and unsubscribes on client disconnect.
- **Verify**: Open two chat sessions against two different deployed instances (or simulate with two terminal `curl` streams) and confirm a message sent from one instance arrives on the other's SSE stream.

### Step 2: Move unread message counters to Redis (or compute on demand)
- Replace `unreadTrainerCache` (in-memory `Map`, 10s TTL) in `message.service.ts` with either:
  - **Option A (simpler)**: A Redis `INCR`/`DECR` counter per trainer, updated in `sendMessageAction` and `markMessagesReadAction`.
  - **Option B (no new infra)**: Drop the cache and run the existing indexed COUNT query directly — the query is already cheap since it's indexed; the cache was solving a load problem that Redis or a good index solves better.
- **Verify**: Send messages from two different serverless-simulated instances and confirm badge counts match across sessions/tabs.

### Step 3: Move the login rate limiter to distributed storage
- Replace the in-memory failure counter in `src/server/auth.ts` with `@upstash/ratelimit` (sliding window, 5 attempts / 15 minutes), keyed by identifier + IP.
- This closes a real security gap: right now, an attacker distributing login attempts across serverless instances can bypass the 5-attempt lockout entirely.
- **Verify**: Script 10 rapid failed logins against the deployed app and confirm lockout triggers consistently regardless of which instance handles each request.

### Step 4: Migrate binary media out of Postgres
- `CoachLogoFile` and `PostImageFile` currently store image bytes directly in `BYTEA` columns. This bloats table size, slows backups, and burns through Neon's memory cache with data that doesn't need to be in a relational database at all.
- Set up Cloudflare R2 (or S3), generate presigned upload URLs from a Server Action, and have the client upload directly to object storage rather than through your Next.js function.
- Store only the resulting object key/CDN URL in Postgres.
- Write a one-time migration script that reads existing `BYTEA` rows, uploads them to R2, and replaces the column with a URL. Keep the old columns until the migration is verified, then drop them in a follow-up migration.
- **Verify**: Confirm logo/blog images load from the CDN URL, check `pg_total_relation_size` on the affected tables before/after to confirm the drop, and confirm the app functions with the `sharp` conversion still applied pre-upload.

---

## Priority 1 — Performance and resource-usage wins

### Step 5: Add a Content-Security-Policy
- Define CSP headers in `next.config.ts` restricting script/frame/style origins. This is a security fix rather than a raw performance one, but it's cheap, high-value, and flagged in your own audit as the top scoring deduction under Security.
- **Verify**: Load the app in a browser dev console and confirm no CSP violation warnings appear on core pages (dashboard, chat, nutrition builder).

### Step 6: Add a read replica for analytics-heavy queries
- Provision a Neon read replica.
- Route the heaviest read-only paths — longitudinal InBody charts, strength-history aggregates, and the admin cross-tenant dashboard — to the replica connection string, leaving the primary pool free for transactional writes.
- This directly reduces contention on your primary pool, which is already capped at `max: 5` connections in production.
- **Verify**: Compare primary-pool query latency for write-heavy actions (check-in submission, meal toggling) before and after moving read traffic off, under a simulated load test (e.g., `autocannon` or `k6` hitting the dashboard endpoint concurrently with write actions).

### Step 7: Tighten the Postgres connection pool under load
- Confirm `withDbRetry`'s single 500ms retry is sufficient under your expected concurrency; if cold-start connection spikes persist even after the read replica change, add Neon's built-in pooler in front of both primary and replica endpoints (you may already be using `-pooler`, but confirm both connection strings use it).
- Add basic instrumentation (log or metric) around `withDbRetry` retry counts so you can see how often it's actually firing in production — right now you have no visibility into whether this safety net is rarely used or constantly saturated.
- **Verify**: Check retry-count logs after a day of production traffic; a high retry rate signals you need PgBouncer or increased pool limits rather than just the retry wrapper.

### Step 8: Convert the Multi-Split training builder UI to lazy-load
- Following the pattern you've already applied to Recharts (`next/dynamic`, `ssr: false`), apply the same lazy-loading to `TrainingSplitForm` (23KB) and any other large, conditionally-rendered feature components (blog rich-text editor, media gallery uploader) that aren't needed on first paint.
- **Verify**: Run `next build` and check the per-route JS bundle size in the build output before/after; confirm the coach dashboard's initial bundle shrinks.

### Step 9: Add structured logging in place of `console.error`
- Replace raw `console.error` calls with Pino (or similar) structured JSON logging, and wire up Sentry for error tracing across both frontend and backend.
- This isn't a raw performance change, but it gives you the observability needed to catch regressions from every other step in this plan instead of finding out from users.
- **Verify**: Trigger a deliberate error (e.g., a failed Server Action) and confirm it appears correctly tagged in Sentry with the right stack trace and user/session context.

---

## Priority 2 — Cleanup: reduce bundle size and remove dead weight

### Step 10: Remove the unused `dexie` dependency
- `dexie` (IndexedDB wrapper) is installed and referenced in `src/lib/idb.ts` but no production feature uses offline sync.
- Delete `src/lib/idb.ts`, remove `dexie` from `package.json`, run `npm install` to update the lockfile, and grep the codebase for any stray imports before removing.
- **Verify**: `npm run build` completes cleanly, and the client bundle analyzer (e.g., `@next/bundle-analyzer`) shows the dependency is gone.

### Step 11: Drop the decommissioned `MealItem.groupNumber` column
- This is a legacy field from the old "Option Groups" feature, fully replaced by the Alternative Meals system (`isSpare` / `replacesMealId`).
- Grep the codebase to confirm zero remaining reads/writes of `groupNumber`, then write a Prisma migration to drop the column.
- **Verify**: Run `npx prisma migrate dev` locally against a copy of production data (or a staging DB) and confirm no queries break.

### Step 12: Add a CI pipeline to catch regressions automatically
- Add `.github/workflows/ci.yml` running `npm run typecheck`, `npm run lint`, and `next build` on every pull request.
- This won't reduce runtime resource usage, but it prevents the kind of dead code, unused dependencies, and type errors that accumulate into exactly the debt this plan is fixing.
- **Verify**: Open a test PR with a deliberate lint error and confirm the workflow fails as expected.

### Step 13: Add unit tests for pure calculation logic
- `goalProgress`, `calcStreak`, `week-schedule`, and `exercise-safety` are pure functions with no test coverage. Bugs here are logic errors, not performance ones, but they're cheap to catch and currently unguarded.
- Add a Vitest (lighter weight than Jest, faster in CI) suite covering edge cases: streak resets, goal direction reversal (loss vs. gain), and safety-flag exercise exclusion matching.
- **Verify**: `npm run test` passes and coverage report shows these modules covered.

### Step 14: Prune repository clutter
- Remove `temp.tsx`, `scratch.js`, and the `.pg/` directory from source control (add matching patterns to `.gitignore` so they don't return).
- **Verify**: `git status` is clean after a fresh clone and normal dev workflow.

---

## Suggested execution order

| Order | Step | Why this order |
|---|---|---|
| 1 | Steps 1–3 (Redis migration) | Fixes active correctness bugs affecting real users today |
| 2 | Step 4 (media to object storage) | Removes the single biggest source of database bloat |
| 3 | Steps 5–7 (CSP, read replica, pool tuning) | Security + read-path performance, no user-facing risk |
| 4 | Step 8 (lazy-loading) | Quick bundle-size win, no backend changes needed |
| 5 | Step 9 (observability) | Do this *before* Priority 2 cleanup so you can see the effect of every change that follows |
| 6 | Steps 10–14 (cleanup) | Lowest risk, best done last since none of it is urgent |

Each numbered step above is independently shippable — you don't need to complete a whole priority tier before deploying the next one.
