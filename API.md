# CoachFlow — API Documentation

> Primary mutation surface = **Server Actions** (same-origin, cookie-authenticated, §3). The 16 HTTP route handlers below (§1) exist for streaming (SSE), binary media, exports, cron, and a few legacy/auth AJAX calls. Every route handler enforces its own session checks — the edge proxy (`src/proxy.ts`) skips `/api/*` entirely.

Authentication model for all routes: NextAuth JWT in `HttpOnly` cookie (`__Secure-next-auth.session-token` over https). Unauthenticated → `401`; wrong tenant → `403`.

## 1. Route Handlers (`src/app/api/`)

### Auth

| Method & Path | File | Purpose |
|---|---|---|
| `GET` / `POST` `/api/auth/[...nextauth]` | `auth/[...nextauth]/route.ts` | NextAuth handler (`authOptions`), `runtime: nodejs` |
| `POST` `/api/client/change-password` | `client/change-password/route.ts` | Client self-service password change (6+ chars), clears `mustChangePassword` |

**Change password** — auth: `CLIENT` session.
```json
// POST body
{ "newPassword": "s3cret!" }
// 200 → { "ok": true }
// 400 → { "ok": false, "error": "Password must be at least 6 characters" }
// 401 → { "ok": false, "error": "Unauthorized" }
// 404 → { "ok": false, "error": "User not found" }
```

### Messaging

| Method & Path | Purpose | Auth |
|---|---|---|
| `GET` `/api/messages?conversationId=&cursor=` | Cursor-paginated history: `{ messages, nextCursor }` (30/page, `take: 30`) | COACH owning the conversation, or CLIENT who is the participant (`400` missing id, `404` unknown, `403` foreign tenant) |
| `GET` `/api/messages/stream?conversationId=` | **SSE** `text/event-stream`: `data:` JSON frames, `: heartbeat` every 25s, `X-Accel-Buffering: no` | Same ownership rules as above (`401/400/404/403`) |
| `GET` `/api/messages/unread-count` | `{ count }` of unread messages; `private, max-age=5, stale-while-revalidate=10`; returns `count: 0` (200) even on DB failure | COACH (via `countUnreadForTrainer`) or CLIENT (via `countUnreadForClient`); unauthenticated → `401` |

Usage: `ChatThread` opens `EventSource(stream)` and falls back to polling `messages` (3s/10s) with client-side dedupe.

### Notifications

| Method & Path | Purpose | Auth |
|---|---|---|
| `GET` `/api/notifications?cursor=&unread=1` | `{ items, nextCursor }`, `limit: 20`, cursor = `${createdAt}\|${id}` tuple | COACH or CLIENT; else `401 { error: "UNAUTHORIZED" }` |
| `GET` `/api/notifications/unread-count` | `{ count }` (200, same cache headers); `count: 0` on failure; `401` for other/unauth roles | COACH or CLIENT |

### Nutrition assignment (legacy route; the builder UI uses Server Actions)

| Method & Path | Purpose | Auth |
|---|---|---|
| `POST` `/api/clients/[id]/nutrition/assign` | Assigns a nutrition template to one client: `assignTemplateToClients(trainerId, templateId, [id])`, then `invalidate([client:{id}:nutrition, client:{id}:profile])` + `revalidatePath` (client profile tab + `/client/nutrition`) | COACH |

```json
// POST /api/clients/abc123/nutrition/assign
{ "templateId": "clx..." }
// 200 → { "ok": true }
// 400 → { "error": "<service message>" }  or  { "error": "templateId required" }
// 401 → { "error": "Unauthorized" }
```

### Lookups (coach pickers)

| Method & Path | Returns | Auth |
|---|---|---|
| `GET` `/api/trainer/clients` | `{ clients: [{ id, fullName, goals }] }` newest-first | COACH |
| `GET` `/api/trainer/templates` | `{ templates }` (via `getTemplatesForTrainer`) | COACH |

### Export

| Method & Path | Returns | Auth |
|---|---|---|
| `GET` `/api/export/clients` | `clients.csv` download (UTF-8 BOM for Excel Arabic): columns `id,fullName,phone,goals,status,createdAt`, proper CSV quoting (`""` escaping) | COACH |

### Binary media (public, immutable)

| Method & Path | Returns | Auth |
|---|---|---|
| `GET` `/api/coach-logo/[coachId]` | WebP bytes from `CoachLogoFile`, `Cache-Control: public, max-age=31536000, immutable` | **none** (renders on public invite/join pages); `404` on missing/oversized id |
| `GET` `/api/coach-avatar/[coachId]` | Same contract for `CoachAvatarFile` | **none** |
| `GET` `/api/post-image/[imageId]` | Same contract for `PostImageFile` (drafts protected by unguessable cuid ids) | **none** |

### Automation & health

| Method & Path | Purpose | Auth |
|---|---|---|
| `POST` / `GET` `/api/automation/run` | Runs `runAutomationJobs(now)` (subscription expiry + T-7/T-3/T-1/T-0 reminders + nudges). `maxDuration: 300`, `force-dynamic` | `CRON_SECRET` via `Authorization: Bearer <s>` (POST) or `?secret=<s>` (GET, Vercel Cron dashboard), timing-safe compare; unset secret ⇒ always `401`. Failure → `500 { ok:false, error:"JOB_FAILED" }` |
| `GET` `/api/health` | Diagnostics JSON: `DATABASE_URL_SET`, `NEXTAUTH_SECRET_SET`, `NODE_ENV`, `VERCEL`, `DB_QUERY: OK(1)` or `DB_ERROR: <msg> (code)`, `AUTH_IMPORT: OK` or `AUTH_IMPORT_ERROR` | **none** (liveness probe; exposes only booleans + DB reachability, no secrets) |

## 2. Example Requests

```bash
# Polling fallback (client cookie required)
curl -b cookies.txt "https://app/api/messages?conversationId=clx...&cursor=2026-01-01T00:00:00.000Z%7Cclx..."

# SSE
curl -N -b cookies.txt "https://app/api/messages/stream?conversationId=clx..."

# Cron (Vercel or external scheduler)
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://app/api/automation/run

# CSV export
curl -b cookies.txt -o clients.csv https://app/api/export/clients
```

## 3. Server Actions (primary mutation API)

26 files under `src/server/actions/`. Contract: `{ ok: true, data } | { ok: false, error, fieldErrors? }`. Groups:

| File(s) | Domain (representative actions) |
|---|---|
| `admin.ts`, `auth.ts`, `settings.ts`, `locale.ts` | Admin provisioning/suspension, login helpers, preferences |
| `invite.ts`, `clients.ts`, `client-management.ts`, `update-client.ts` | Invites (create/resend/extend), client CRUD, forced logins, profile edits incl. pain flags |
| `nutrition.ts` | Template CRUD, `assignTemplateToClients`, `refreshPlanFromTemplate`, `toggleMealChoiceAction` |
| `training-split.ts`, `training-split-template.ts` | Split CRUD + versioning, template authoring/application |
| `client-portal.ts`, `session-log.ts`, `checkin.ts`, `goals.ts`, `progress.ts`, `body-composition.ts`, `media.ts` | Client writes: workouts, sets, check-ins, goals, InBody views, media upload/review |
| `messages.ts`, `notifications.ts` | `sendMessageAction` (Zod → insert → preview update → `publish` + `notifySafe`), read markers |
| `subscription.ts`, `subscription-plan.ts`, `payment-proof.ts` | Package assign/consume/renew, proof submit/review |
| `blog.ts`, `branding.ts` | Post CRUD; coach logo/avatar upload-crop-remove + branding fields |
| `search.ts` | `globalSearchAction(query)` — the Cmd+K engine |

New actions follow the same skeleton: `getCurrentSession()` → tenant assertion → Zod `safeParse` → service call → `invalidateDashboard`/tag updates + `revalidatePath` → return contract.
