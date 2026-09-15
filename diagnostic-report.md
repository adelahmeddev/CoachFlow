# CoachFlow — Diagnostic Report: Coach Navigation Bug + Console TypeError

Date: 2026-09-10. App: Next.js 16.3 App Router + NextAuth credentials + Neon Postgres.

## 1. Navigation bug — "ends up on /dashboard"

### 1.1 Root cause (4 defects, no single redirect)
No code path auto-redirects an authenticated COACH from any listed page to
`/dashboard` (proven by repo-wide search + live 200s on all 11 coach routes).
The symptom came from defects in the navigation shell:

1. **Role-blind `/dashboard` fallback** — `src/app/(auth)/register/page.tsx`
   sent *every* authenticated session to `/dashboard`, including CLIENT and
   SUPER_ADMIN sessions.
2. **Unguarded trainer route** — `/subscription` is linked from the top nav
   (Business → My Membership) but was missing from `TRAINER_PATHS` in
   `src/proxy.ts`, bypassing role gating.
3. **Unreachable destinations** — the `app-top-nav.tsx` rewrite dropped the
   direct Messages/Notifications shortcuts the old sidebar had; the mobile
   drawer had zero links to Messages/Notifications/Settings.
4. **Fragile destination** — `src/app/(trainer)/notifications/page.tsx` threw
   on any DB timeout (Neon cold starts observed at 30s+ in server logs) into
   `error.tsx`, whose only exit is a `/dashboard` button.

### 1.2 Why `prefetch={false}` did not fix it
Prefetch never changes the browser URL. The `/dashboard` 307s in the logs are
normal Next.js RSC normalization (`Location: /dashboard?_rsc=...`), verified
live with `RSC`/`Next-Router-Prefetch` headers. Disabling prefetch only made
real navigations slower. The four `prefetch={false}` overrides were removed,
restoring framework-default prefetch.

### 1.3 Fix (4 files)
- `src/app/(auth)/register/page.tsx` — role-aware home redirect
  (`/admin`, `/dashboard`, `/client/home`; role-less ghost session → `/login`).
- `src/proxy.ts` — added `/subscription` to `TRAINER_PATHS`
  (prefix match is exact-segment safe: `/subscription-plans` unaffected).
- `src/components/layout/app-top-nav.tsx` — restored Messages icon-button
  (unread badge + active state) and `NotificationBell` for COACH/CLIENT only
  (SUPER_ADMIN owns no such routes, so shortcuts stay hidden instead of
  bouncing to `/admin`); added Messages/Notifications/Settings to the mobile
  drawer; removed `prefetch={false}`.
- `src/app/(trainer)/notifications/page.tsx` — degraded empty-feed fallback
  on DB failure (same pattern as the dashboard page).

### 1.4 Verification (live server, real `coach.karim` COACH session)
- `npm run typecheck` — clean.
- All coach destinations return 200 and render: `/dashboard`, `/clients`,
  `/messages`, `/notifications`, `/onboarding`, `/settings`,
  `/nutrition-templates`, `/training-split-templates`, `/subscription-plans`,
  `/blog`, `/subscription`.
- Redirect targets (`Location` header): coach `/register`→`/dashboard`,
  coach `/`→`/dashboard`; client `/register`→`/client/home`,
  client `/subscription`→`/client/home`, client `/`→`/client/home`;
  anonymous `/settings`, `/subscription`, `/`→`/login`.
- SSR HTML of `/dashboard` now contains `href="/messages"` and
  `href="/notifications"` (previously absent; Settings stays portal-rendered
  via the avatar dropdown by Radix design).
- Redirect audit: the only remaining `/dashboard` producers are intentional
  (`/` root for COACH, logged-in COACH on auth pages, logo/Overview links,
  click-to-recover buttons in `error.tsx`/`not-found.tsx`).

## 2. Core issue — every page shows only "No clients yet" (lone empty card)

### 2.1 Symptom
Logged-in coach ("Adel Ahmed") sees only the `DashboardEmpty` card
("No clients yet / Invite your first client / Invite Client") on every page —
no dashboard hero, no stats, no real content.

### 2.2 Root cause: profile-less COACH session never self-heals
The lone-card render is exactly one branch:
`src/app/(trainer)/dashboard/page.tsx` → `if (!trainerProfileId) return <DashboardEmpty/>`
(no hero/stats above it — matches the screenshot pixel for pixel). It requires
`session.user.role === "COACH"` (otherwise the trainer layout bounces to
`/login`) **with** `session.user.trainerProfileId` falsy. Same state explains
the other pages: `/clients` → header + "no-clients" empty state, `/messages` →
`return null` (blank), `/onboarding` → empty invites.

DB evidence: every creation path (`registerTrainer`, `createTrainer`) and both
login-time/`stale-id` heal paths provision `TrainerProfile`, but the jwt
callback's `else` branch (`src/server/auth.ts`, token carries **no**
`trainerProfileId`) only *adopted* an existing row and never *created* one.
So a coach whose profile row was lost (manual DB edit, Neon branch
switch/restore, reseed) is stuck in this state permanently — re-login heals
only if `authorize()`'s heal succeeds at that moment, and the 30-day JWT
otherwise preserves the broken session Morgue. Related schema fact found
during the audit: `.env.local` carries a malformed
`DATABASE_URL_DATABASE_URL` key (Vercel-CLI prefix duplication), so local dev
resolves `DATABASE_URL` from `.env` (Neon) — worth renaming to avoid pointing
a future session at the wrong (empty) database.

### 2.3 Fix
`src/server/auth.ts` — the `else` branch now self-heals exactly like
`authorize()` and the stale-id branch: look up by `userId`, adopt if found,
else `INSERT` a new `TrainerProfile` (with race-safe reselect fallback and
dashboard cache bust). Runs only for profile-less COACH tokens; healthy
sessions never enter it; DB errors still fall through to the existing
"leave token as-is" catch. No `User` row → token untouched → proxy clears the
cookie → `/login` (unchanged ghost handling). CLIENT branch intentionally
untouched (missing `Client` row correctly shows "No longer subscribed").

### 2.4 Proof (live E2E against dev server + Neon)
Crafted a JWE session for a temp COACH user with **no** profile row and no
`trainerProfileId` in the token (Adel's exact token shape):
- Before request: `TrainerProfile` rows for user = `[]`.
- One `GET /dashboard` → 200, page rendered the subscription guard view
  ("No Active Subscription") instead of the lone "No clients yet" card, and
  the profile row was auto-created (`fullName` from the user record).
- Pre-fix code renders the lone empty card and creates nothing on the same
  input (verified by code path: old `else` only `SELECT`s).
- Temp user deleted afterwards (cascade); leftover check = 0 rows.
- Regression: `coach.karim` healthy session still 200 on
  `/dashboard` (full 293KB page with coach name), `/clients`, `/messages`,
  `/settings`; `npm run typecheck` clean.

### 2.5 Conclusive server-side proof (the actual account is gone)
Temporary dev-only tracing (`[diag-auth]`, since removed) captured the live
browser session hitting the dev server:
`userId=cb3e9c1f6b5f54dfe813891a0 hadProfileId=none resolvedProfileId=none
role=undefined` (×3) — the token is a **ghost**: that `User` row and its
`TrainerProfile` do not exist anywhere in the database (verified by direct
query), and a login attempt with the old credentials failed with 401. The
account was wiped (reseed/branch switch) while the 30-day JWT survived in the
browser, so the name "Adel Ahmed" (stale JWT claim) rendered with zero data
behind it. A companion fix was added for this second dead-state: a COACH
token whose `User` row is absent is now invalidated (`role=undefined`) so the
proxy clears the cookie and routes to `/login` instead of stranding the user
in the empty shell. Live proof on the restarted server: crafted user-less
token → `307 Location: /login`, zero rows created.
**Recovery (required, no code can log you into a deleted account):** sign out
(or clear localhost cookies) to drop the stale JWT, then either re-register
at `/register` (admin must then create your `CoachSubscription`, else you will
see the legitimate "No Active Subscription" view), restore the database from
a Neon point-in-time/branch that still holds your rows, or verify the app end
to end with `coach.karim` / `Demo@123` (healthy session confirmed: full
317KB dashboard, all coach routes 200).
**Update:** the real database was found (1 admin + 14 coaches + 6 clients;
Adel `01017645950` intact: profile ok, ACTIVE sub, 1 client). Local dev still
points at the demo Neon DB. Prepared the switch: current demo `.env` backed
up to `.env.demo-neon.bak` (gitignored), placeholder added in `.env.local`.
Pending: user pastes the real pooled `DATABASE_URL`, restarts dev, re-logs.
**Update 2:** real DB identified via Neon CLI as project `CoachFlow`
(`polished-math-97968370`), branch `production`
(`ep-jolly-cherry-ae919r4w`, pooled endpoint wired into `.env.local`;
temp secrets deleted). Safety snapshot of the expiring demo DB taken with
`pg_dump` to `backups/demo-neon-20260911.dump` (144KB, gitignored via new
`/backups/` rule) — everything reproducible via seeds, plus a byte-level
restore point if ever needed.
**Cleanup done:** local portable Postgres (`./.pg`, started only for inspection)
was dumped first (`backups/local-coach-nanoush-20260911.dump`, 141KB,
verified via `pg_restore --list`, 209 entries) and then the unused local
databases were dropped (`coach` old Nanoush-era data, empty `coachflow`,
orphaned Prisma migrate shadow DB); server stopped afterwards. The demo Neon
DB cannot be deleted via API (not in the account) — it expires on its own Sep
13. The empty Prisma `postgres` DB was left alone (only DB in its project,
costs nothing). Dataset confirmed: 1 SUPER_ADMIN + 14 COACH + 6
clients, 14 profiles, Adel (`01017645950`, ACTIVE) present — the ghost token
`cb3e9c…` was never a ghost against this DB. Proven live: crafted profile-less
Adel token → session resolves to the real profile and the full dashboard
renders (no lone empty card). Remaining step is operational: the dev server
on :3000 predates the env switch (its ghost-kill firing with "user missing"
proves it still reads the demo DB), so it must be restarted to load the new
`DATABASE_URL`; only one dev server should run at a time (shared `.next`
cache).

## 2.6 DB audit + second DB-level fix (demo client logins)
Full integrity audit of the Neon database: zero orphans across all relations
(profiles, clients, subs, convos, messages, notifications), all hot-path
indexes present (`Notification_userId_createdAt`, `Message_conversationId_createdAt`,
etc.), karim fully linked (10 clients, ACTIVE sub to 2027). One real defect:
`scripts/seed-demo.ts` created demo client `User` rows but never set
`Client.userId`, so every demo client login resolved no `clientProfileId` and
the portal rendered "No longer subscribed". Fixed in the seed (link by phone,
idempotent) and backfilled live (8 rows linked; the 2 remaining unlinked rows
are `INVITED`/`PENDING_ASSESSMENT` athletes with no login yet — correct by
design). Proven: `client01` session now carries a real `clientProfileId` and
`/client/home` renders the full 161KB portal. Typecheck clean.

## 2.7 Mojibake Arabic names (UTF-8 decoded as Latin-1/CP1252)
Symptom: athlete names render as `Ø£Ø­Ù…Ø¯…` everywhere (needs-action feed,
clients grid, profiles). Root cause is **data, not pipeline**: the pool uses
default UTF-8 (verified in `src/lib/db.ts`), but `scripts/seed-demo.ts` itself
contained 214 mojibake literal hits (same incident class as the earlier
`ar.ts` encoding-corruption fix) — the DB faithfully stored garbage, e.g.
`D9 85` (م) mangled to U+2026 (…), which only a CP1252-aware repair reverses.
Fix: repaired all 23 literals in the seed file (byte-verified: 0 hits left)
and repaired 18 live cells (`Client.fullName` ×10, `Subscription.planName`
×8) with the same algorithm — every repair round-tripped with zero `�`,
i.e. nothing was irreversibly lost. Verified in rendered HTML: `/dashboard`
and `/clients` contain clean Arabic (`أحمد`, `مريم`) with zero mojibake
markers. Typecheck clean. No other repo file contains mojibake (full
`src`/`scripts`/`prisma` byte scan).

## 2.8 Missing admin account (`admin` / `admin123` login failed)
The `.env` credentials are only *inputs* to `npm run db:seed`
(`prisma/seed.ts`), which had never been run against this database — no
`SUPER_ADMIN` row existed, so login correctly rejected with
`INVALID_CREDENTIALS`. Ran `db:seed` (with `SEED_DEMO=false` override so no
extra demo data): created `admin` (SUPER_ADMIN), 3 global nutrition templates,
46 exercise-library rows, 4 global split templates — all idempotent, nothing
wiped. Verified: `admin` session has `role=SUPER_ADMIN`, `/admin` → 200.

## 2.9 Hunt for the "other DB" (admin + 14 trainers)
Audited every reachable database — none matches: Neon = 1 coach + 8 clients;
local `coach` (Postgres 17.5 in `.pg/`, started/inspected/stopped) = old
Nanoush-era schema with 14 *users* (1 ADMIN + 2 trainers + 11 clients), which
the current app cannot use without a migration; local `coachflow` and Prisma
`db.prisma.io` (single `postgres` DB) are both empty. Vercel production
`DATABASE_URL` is a Sensitive secret and cannot be pulled via CLI (by design),
and there is no `NEON_API_KEY`/dump to reach it another way — so the only
unseen dataset is whatever production points at. If that dataset (admin +
14 trainers + Adel) still exists, recovery is via Neon console
(branches/point-in-time restore within retention) or the Vercel Storage tab.

## 3. Console error — `Cannot read properties of undefined (reading 'startTime')`

### 3.1 Diagnosis: external browser-extension script, NOT CoachFlow code
- The frames are `VM943:2` fully-anonymous minified code reached via
  `requestIdleCallback`/`setTimeout`. `VM*` in Chrome DevTools means an
  evaluated/injected script (extension content script / userscript), never our
  webpack dev bundle (which reports real paths such as `app-top-nav.tsx`).
- `reportAllChanges` + `startTime` is the signature of a Web-Vitals INP
  measurement (`reportAllChanges: true`) crashing on a missing interaction
  entry — typical of Web-Vitals/overlay extensions re-running on every Fast
  Refresh rebuild (matches the log: one throw per rebuild).
- Repo search: zero hits in `src/` for `requestIdleCallback`,
  `reportAllChanges`, `PerformanceObserver`, `performance.getEntries`,
  `web-vitals`, `reportWebVitals`; no web-vitals dependency in
  `package.json`. Nothing in our code can throw this.
- `forward-logs-shared.ts:120` lines are Next.js internal devtools log
  forwarding (`next/dist/.../next-devtools/shared/forward-logs-shared.js`) —
  only the transport that surfaced the extension's error in the terminal.

### 3.2 Fix / action
No code change required or made — per repo policy, no speculative guard is
added for code we do not own. To confirm on your machine:
1. Open the app in an Incognito window (extensions disabled) and reproduce
   the rebuild — the TypeError must be gone.
2. If gone, re-enable extensions one by one (start with Web-Vitals /
   performance / session-replay extensions) to identify the thrower, then
   disable or update it.
3. The error is dev-only noise: it cannot occur in the production build
   (no `VM*` injection target, no Fast Refresh), and it does not affect
   navigation, auth, or data.
