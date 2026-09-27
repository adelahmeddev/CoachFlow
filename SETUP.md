# CoachFlow — Setup & Installation

## 1. Prerequisites

| Requirement | Details |
|---|---|
| **Node.js** | **20.x** (CI pins `node-version: 20`) |
| **npm** | Ships with Node; `npm ci` used in CI |
| **Database** | PostgreSQL 15+ — production runs on [Neon](https://neon.tech) Serverless Postgres; any Postgres 15+ works locally |
| **Git** | For cloning |
| *Optional* Upstash Redis account | Enables **distributed** SSE pub/sub (`REDIS_URL`) and **distributed** login rate limiting (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`). Without them the app falls back to in-memory implementations (fine for local dev, single-instance deploys) |
| *Optional* Cloudflare R2 / AWS S3 account | Enables cloud object storage for coach logos / blog images (`S3_*` vars). Without it, images are stored as Postgres `BYTEA` and served via API routes |
| *Optional* Vercel account | Production hosting + Vercel Cron |

No other external services are required. There is no Stripe/email/push dependency (by design — see [KNOWN-ISSUES.md](KNOWN-ISSUES.md)).

## 2. Step-by-Step Local Setup

```bash
# 1. Clone
git clone https://github.com/adelahmeddev/CoachFlow.git
cd CoachFlow

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
#   → set DATABASE_URL (Neon console → project → connection string)
#   → set NEXTAUTH_SECRET (min 32 chars, e.g. `openssl rand -hex 32`)

# 4. Generate the Prisma client (required by `npm run build`; kept in sync with schema)
npm run prisma:generate

# 5. Apply the schema to your database (fresh database)
npx prisma migrate dev --name init
```

> ⚠️ **Migration caveat:** this repo's migration history is known to be drifted (broken shadow-DB validation against existing databases — see [KNOWN-ISSUES.md](KNOWN-ISSUES.md)). `prisma migrate dev` works on a **fresh** database. For an existing/production database, apply schema changes carefully (e.g. `prisma migrate deploy` with the correct `DATABASE_URL`, or targeted `CREATE TABLE IF NOT EXISTS` migrations like `20260913000000_add_system_setting`) and **do not add `migrate deploy` to the build**.

```bash
# 6. Seed (SUPER_ADMIN from ADMIN_USERNAME/ADMIN_PASSWORD, 3 global nutrition
#    templates, ~45-exercise bilingual library, 4 global split templates)
npm run db:seed

# 7. (Optional) Seed the Egyptian demo tenant (coach "trainer1" / "demo123",
#    10 athletes, splits, nutrition, logs) — see scripts/seed-demo.ts
npm run seed:demo

# 8. Run the dev server
npm run dev          # http://localhost:3000  (Turbopack)
npm run dev:lan      # expose on LAN at http://192.168.1.9:3000 (webpack, see next.config.ts allowedDevOrigins)
```

First login: use the seeded `ADMIN_USERNAME`/`ADMIN_PASSWORD` at `/login` (lands on `/admin`). Create a coach under `/admin/trainers`, or log in as a demo coach (`trainer1` / `demo123`, lands on `/dashboard`).

## 3. Environment Variables

Reference file: `.env.example`. Loaded via `next dev` / `next build` (Next.js loads `.env` and `.env.local` automatically) and `dotenv/config` in `prisma.config.ts` and seed scripts.

### Required

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string. Pooled (`-pooler`) endpoint recommended; `uselibpqcompat=true` is auto-appended if missing (see `src/lib/db.ts`) | `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require&uselibpqcompat=true` |
| `NEXTAUTH_SECRET` | JWT signing/encryption key (min 32 chars). CI injects a dummy value for build/test | `your-secret-key-minimum-32-characters-long` |

### Optional (graceful fallbacks)

| Variable | Purpose | Fallback when unset | Example |
|---|---|---|---|
| `NEXTAUTH_URL` | Canonical app URL for auth callbacks. On Vercel, `VERCEL_URL` is used automatically (`src/server/auth.ts:14`) | `https://$VERCEL_URL` | `https://your-custom-domain.com` |
| `DATABASE_URL_REPLICA` | Neon read replica; heavy analytical reads (`getAdminDashboardStats`, InBody analysis, strength series) route here via `replicaQuery` | Primary `DATABASE_URL` | `postgresql://...@ep-replica-xxx.region.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true` |
| `REDIS_URL` | Redis Pub/Sub (ioredis) for cross-instance SSE message distribution | Local in-memory EventEmitter (`src/server/realtime/message-bus.ts`) | `rediss://default:password@xxx.upstash.io:6379` |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint for distributed login rate limiting | In-memory sliding window (`src/server/auth.ts`) | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST auth token | In-memory sliding window | `your-upstash-rest-token` |
| `S3_ENDPOINT` | Cloudflare R2 / S3 endpoint for media storage | Postgres `BYTEA` storage + `/api/coach-logo/[coachId]` / `/api/post-image/[imageId]` streaming | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | Target bucket | — | `coachflow-media` |
| `S3_REGION` | AWS region (R2 uses `auto`) | — | `auto` |
| `S3_ACCESS_KEY_ID` | Storage credential | — | `your-access-key-id` |
| `S3_SECRET_ACCESS_KEY` | Storage credential | — | `your-secret-access-key` |
| `S3_PUBLIC_URL` | Public CDN base URL written into `logoUrl`/`storageUrl` | — | `https://media.yourdomain.com` |
| `CRON_SECRET` | Bearer/query secret guarding `POST /api/automation/run` (Vercel Cron). **Rejected when unset — automation never runs open** | Automation endpoint returns 401 | random 64-char hex |
| `ADMIN_USERNAME` | Bootstrap admin username (`prisma/seed.ts`) | `admin` | `admin` |
| `ADMIN_PASSWORD` | Bootstrap admin password | `admin123` (dev default — change it) | `change-this-to-a-secure-password` |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@coach.local` | `admin@coach.local` |
| `SEED_DEMO` | Set to `"true"` for `db:seed` to also seed demo tenant data | `false` | `false` |

### Implicit / runtime-detected (do not set manually)

| Variable | Set by | Used for |
|---|---|---|
| `VERCEL`, `VERCEL_URL` | Vercel runtime | Pool sizing (`max: 5` on serverless vs `10` local), secure-cookie decision, `NEXTAUTH_URL` default |
| `AWS_LAMBDA_FUNCTION_NAME` | Lambda runtime | Pool sizing detection |
| `NODE_ENV` | Next.js / CI | Dev vs prod behavior (CSP `unsafe-eval`, Prisma query logging, pool limits) |

> ⚠️ Local dev (`.env.local`) and tooling (`.env`) in this working copy point at **different Neon databases** — schema changes must be applied to both (see [KNOWN-ISSUES.md](KNOWN-ISSUES.md)).

## 4. npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Turbopack dev server |
| `dev:lan` | `cross-env HOST=0.0.0.0 PORT=3000 NEXTAUTH_URL=http://192.168.1.9:3000 next dev --webpack` | LAN-accessible dev (webpack mode, matches `allowedDevOrigins`) |
| `build` | `prisma generate && next build` | Production build (regenerates the Prisma client first) |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Lint |
| `typecheck` | `tsc --noEmit` | Type check |
| `test:unit` | `tsx --test tests/*.test.ts` | Unit tests (103 tests / 34 suites) |
| `db:seed` | `tsx prisma/seed.ts` | Seed admin + global templates + exercise library (+ demo if `SEED_DEMO=true`) |
| `seed:demo` | `tsx scripts/seed-demo.ts` | Seed the demo tenant explicitly |
| `prisma:generate` | `prisma generate` | Regenerate Prisma client |

## 5. Tests

```bash
npm run test:unit     # tsx --test tests/*.test.ts
npm run typecheck
npm run lint
```

- **17 test files** in `tests/`, executed by Node's built-in runner via `tsx`. Current count: **103 tests / 34 suites, all passing**.
- `tests/pure-calculations.test.ts` covers pure domain math: week scheduling, streak calculation, exercise safety conflict resolution, goal progress.
- Other files cover service-level logic with a database connection (`tests/db-setup.ts`): `automation.test.ts`, `blog.test.ts`, `branding.test.ts`, `checkin-streak.test.ts`, `goals-crud.test.ts`, `goals.test.ts`, `invite-status.test.ts`, `logo-image.test.ts`, `media-auth.test.ts`, `media.test.ts`, `needs-action*.test.ts`, `notifications.test.ts`, `split-versioning.test.ts`.
- `tests/*.test.ts` require a reachable `DATABASE_URL` for the service-level files; the pure-calculation suites run anywhere.
- CI (`.github/workflows/ci.yml`) runs typecheck → lint → unit tests (with `NODE_ENV=test` + dummy `NEXTAUTH_SECRET`) → production build (with dummy `DATABASE_URL`).

There is no E2E test suite in this repo.
