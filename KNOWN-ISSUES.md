# CoachFlow — Known Issues, TODOs & Technical Debt

> Verified against the codebase on 2026-09-21 (code, migrations, git history, test run). The repo contains **zero `TODO`/`FIXME`/`HACK` comments in project source** — the only matches are inside generated Prisma client files.

## 1. Must-Do Before / During Production Ops

| # | Issue | Status / Mitigation |
|---|---|---|
| 1 | **Migration history is drifted vs existing databases.** Shadow-DB validation breaks; `migrate deploy` fails on databases whose history diverged. This is why `migrate deploy` must **not** be added to the build. | Workaround in place: newest additive feature (`SystemSetting`, migration `20260913000000_add_system_setting`) self-heals with `CREATE TABLE IF NOT EXISTS` at runtime. Prefer this pattern for future additive changes; apply migrations to production deliberately with the production `DATABASE_URL` (e.g. pending: `20260912140000_coach_branding_socials` for the social columns). |
| 2 | **Local `.env.local` and tooling `.env` point at different Neon databases.** Schema changes must be applied to both, or dev and tooling diverge silently. | Process fix: pick one canonical dev DB or always run DDL twice; verify with `/api/health`. |
| 3 | Stale session cookies after secret rotation / DB wipe used to cause redirect loops. | Fixed in `src/proxy.ts` (dual cookie fallback + cookie clearing). Keep this behavior covered if auth is refactored. |

## 2. Incomplete / Partial Features

| Area | State |
|---|---|
| Multi-split training (`TrainingSplitTemplate.isMultiSplit`, `splitGroup`) | Schema-ready; coach builder UI only partial (see TECHNICAL.md §26). Single-split flows are complete. |
| `ClientBottomNav` | Component exists (`src/components/layout/`) but is **unmounted** — no route renders it. Client portal relies on `AppTopNav` + in-page navigation. Either mount or delete. |
| Structured audit log | No immutable `AuditLog` table for admin mutations — planned (Phase 3). |
| 2FA | Coach accounts are single-factor — TOTP/SMS planned (Phase 3). |
| Some `UPDATE …` queries don't check `rowCount` | Legacy paths; monitor/standardize on `execute()` + row-count assertions. |

## 3. Dead / Legacy Artifacts (safe to remove)

- `src/generated/prisma/` — legacy client output; **nothing imports it** (runtime imports `@prisma/client` via `src/lib/prisma.ts`, which itself is unreferenced). Delete or regenerate consistently.
- `src/lib/prisma.ts` — `PrismaClient` singleton with zero importers. Either adopt (standard queries) or delete to avoid confusion about the data-access contract (raw `pg` is the real path).
- `wrangler.jsonc`, `.pagesignore`, `.vinext/` — Cloudflare/Vinext experiment; wrangler isn't a dependency. Remove from the deployment story.
- Root `*.bak` files (`.env.demo-neon.bak`, `.env.local.corrupted.bak`) and `diag-*.log`/`.dev-server.log` — gitignored local debris, not tracked issues; clean up locally.
- `prisma.d.ts` — manual shim for the `prisma` config module; harmless, keep with `prisma.config.ts`.

## 4. By-Design Exclusions (not bugs)

- **No Stripe/card gateway** — Egyptian market runs on Instapay / Vodafone Cash manual proofs.
- **No transactional email** — coaches operate via WhatsApp (see `lib/whatsapp.ts` helpers + admin templates).
- **No native push (FCM/APNs)** — in-app notification center only; planned.
- **No offline sync** — legacy `dexie` dependency fully removed; server-authoritative model.

## 5. Doc Drift Fixed by This Doc Set

- README badge claimed Prisma `7.9.1` → actual `5.22.0`.
- Old QUICK START referenced `npm run db:migrate` (script doesn't exist) → replaced with `npx prisma migrate dev`.
- Prior docs cited `src/middleware.ts` → actual gate is `src/proxy.ts`; cited 38 models/23 enums → actual **41 models/28 enums**; cited 98 tests/33 suites → verified **103 tests/34 suites**; cited `ioredis 5.6.1` → `package.json` declares `^6.0.0`.
- Corrected the record that Prisma is **schema/migrations only** — prior text implied runtime Prisma usage.
