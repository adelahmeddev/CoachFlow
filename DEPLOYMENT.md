# CoachFlow — Configuration & Deployment

## 1. How the Project Is Deployed

- **Platform:** Vercel (serverless, Node.js runtime). `vercel.json` registers one cron:
  ```json
  { "crons": [{ "path": "/api/automation/run", "schedule": "0 6 * * *" }] }
  ```
  Daily 06:00 UTC ping of the subscription-expiry/reminder jobs (guarded by `CRON_SECRET`; external schedulers may `POST` with `Authorization: Bearer <secret>` instead — see [API.md](API.md)).
- **Build:** `npm run build` → `prisma generate && next build`. CI proves this on every push/PR.
- **CI/CD:** `.github/workflows/ci.yml` (push + PR to `master`/`main`, concurrency-cancel): `npm ci` → `prisma:generate` → `typecheck` → `lint` → `test:unit` (`NODE_ENV=test` + dummy `NEXTAUTH_SECRET`) → production `next build` (`NODE_ENV=production` + dummy secrets + dummy `DATABASE_URL`). Node 20.
- **Database:** Neon Postgres (no migrations run in CI or build — deliberate, see §4).
- **No Dockerfile / containers.** No Cloudflare deployment — `wrangler.jsonc`, `.pagesignore`, `.vinext/` are an un-wired experiment (wrangler isn't even a dependency); the working copy's `.vercel/` dir holds the Vercel project link.

## 2. Configuration Files

| File | Controls |
|---|---|
| `next.config.ts` | `images` (AVIF/WebP, device/image sizes, qualities); `serverActions.bodySizeLimit: "24mb"` (progress media + receipts through actions); `turbopack: {}`; dev-only `infrastructureLogging` workaround for LAN dev; **security headers on `/(.*)`**: CSP (`default-src 'self'`, inline scripts allowed, `unsafe-eval` in dev only, `frame-src` YouTube only, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, `Permissions-Policy: camera/mic/geolocation=()` |
| `vercel.json` | Cron schedule (above) |
| `prisma.config.ts` | Schema/migration paths, `DATABASE_URL` datasource, `seed: tsx prisma/seed.ts` |
| `tailwind.config.ts` + `postcss.config.mjs` + `components.json` | Tailwind 4 + PostCSS plugin; shadcn (`radix-nova`, neutral base, CSS variables) |
| `tsconfig.json` | Strict TS, `@/*` → `./src/*` |
| `eslint.config.mjs` | Flat ESLint 9 + Next config |
| `src/proxy.ts` (`config.matcher`) | Edge routing coverage: everything except `api`, `_next/*`, favicon, static images |
| `.pagesignore`, `wrangler.jsonc` | Legacy experiment — ignore |
| `components.json` | shadcn generator settings |

## 3. Environment-Specific Differences

| Concern | Local dev | Production (Vercel) |
|---|---|---|
| DB pool | `max: 10`, idle 30s, no forced TLS | `max: 5`, idle 10s, `rejectUnauthorized:false` TLS; statement timeout 15s both |
| Cookies | `next-auth.session-token` (http) | `__Secure-next-auth.session-token` (https); proxy tries both names as fallback |
| CSP | `script-src` adds `unsafe-eval` | Strict (no eval) |
| Redis/Upstash/S3/Replica | Usually unset → in-memory bus, memory rate-limit, BYTEA media, primary-only reads | Wire via env vars when available; every subsystem falls back safely |
| `NEXTAUTH_URL` | Set explicitly (esp. `dev:lan`: `http://192.168.1.9:3000`, allow-listed in `allowedDevOrigins`) | Optional — auto-derived from `VERCEL_URL` |
| Logging | Human-readable | NDJSON for aggregators |
| Cron | Manual `curl` to `/api/automation/run` | Vercel Cron daily |

There is no separate staging environment in the repo; branches deploy as Vercel previews with their own env vars.

## 4. Release Checklist

1. `npm run typecheck && npm run lint && npm run test:unit` green (or rely on CI).
2. Confirm `DATABASE_URL` points at the intended Neon branch (local `.env.local` and tooling `.env` **differ** in this working copy — double-check).
3. Apply any new migrations to the target DB (`prisma migrate deploy` with the production URL). **Never add `migrate deploy` to the build** — the repo's migration history is drifted against existing databases (see [KNOWN-ISSUES.md](KNOWN-ISSUES.md)); new additive migrations should prefer `CREATE TABLE IF NOT EXISTS`-style self-healing (cf. `SystemSetting`).
4. Set/rotate secrets (`NEXTAUTH_SECRET` ≥ 32 chars, `CRON_SECRET` 64-hex) per environment.
5. `npm run db:seed` only for fresh tenants (idempotent: skips existing admin/templates/exercises).
6. Verify `/api/health` → `DB_QUERY: OK(1)` post-deploy.
