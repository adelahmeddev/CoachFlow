# Adjustment — Reusable Invite Link (Plan B) — Goal required + Stable link

## Decisions locked
- Goal **required** at client signup (select `Goal` enum; no default).
- Coach link **stable until expiry** (same `inviteSlug` shown on refresh; `Regenerate` is explicit).
- Architecture **B: Reusable per-trainer link** `/join/[slug]` (replaces per-client pre-fill).

## Context (why)
Coach wants zero-form link generation; client self-registers with `fullName* + phone* + goal`, assessment later. Per-client empty-token flow works but forces token housekeeping per invite. Reusable slug minimizes coach friction: one permanent link to share everywhere.

## Current state (observed)
- `Client{ trainerId, inviteToken, inviteExpiresAt, status=INVITED }` created per invite via `createClientInvite`.
- `/onboarding` generates token via `InviteCard` + `GenerateInviteButton`, `/invite/[token]` collects full profile (birthDate/height/etc.).
- `TrainerProfile` has no `inviteSlug`; `inviteToken` is per-Client.

## Proposed target — B (`/join/[slug]`)

### Data model delta
- `TrainerProfile.inviteSlug String? @unique`, `inviteSlugCreatedAt DateTime?`, `previousInviteSlug String? @unique`, `previousInviteSlugExpiresAt DateTime?` (grace).
- Keep `Client.inviteToken` for backward compat (deprecated, nullable).
- Migration: backfill `inviteSlug = nanoid(10)` for existing trainers on first access (lazy) or via SQL.

### Coach flow — `/onboarding`
- On first visit, if `inviteSlug == null`, auto-create one server-side (`getOrCreateInviteSlug`).
- UI: card shows `https://app.com/join/[slug]` + `Copy` + `WhatsApp` + `QR` + `Regenerate` (confirm, invalidates old slug with 5-min grace). Same slug on refresh until regenerated.
- Pending clients list now shows *submitted* clients (`PENDING_ASSESSMENT`), not pre-created `INVITED` rows.

### Client flow — `/join/[slug]` (new) + keep `/invite/[token]` for old links
- `GET /join/[slug]` → 404 if slug invalid/disabled. Checks `previousInviteSlug` grace.
- Form: `fullName*` (2-100), `phone*` (E.164), `goal*` (required). No birthDate.
- `POST` → `find TrainerProfile by slug` → phone dedupe per trainer → `create Client{ trainerId, fullName, phone, goal, status=PENDING_ASSESSMENT, basicInfoCompletedAt=now() }`.
- Success: “You’re in — coach will complete assessment.”

### Validation & security
- Server: `goal` required enum; `phone` E.164 per-trainer unique; `fullName` trim 2-100.
- Rate limit `POST /join/[slug]` (5/min/IP) + honeypot.

### Link UX — Stable until expiry
- No auto-rotation on refresh. `Regenerate` explicit with confirm. Old slug grace 5 min.

### Files to touch (B)
- `prisma/schema.prisma` — `TrainerProfile.inviteSlug`
- `src/server/services/invite.service.ts` — `getOrCreateInviteSlug`, `regenerateInviteSlug`, `getTrainerBySlug`, `createClientFromJoin`
- `src/app/(trainer)/onboarding/page.tsx` + `join-link-card.tsx` — stable link UI
- `src/app/join/[slug]/page.tsx` + `join-form-client.tsx` — 3 fields form
- `src/lib/validations/invite.ts` — `joinClientSchema`
- `src/server/actions/invite.ts` — `submitJoinAction`, `regenerateJoinLinkAction`

### Migration & rollout
- `prisma migrate add inviteSlug` + lazy backfill on first onboarding visit.
- Dual-read: accept both `/invite/[token]` and `/join/[slug]` for 1 release.

### Risks & mitigations
- Spam on public slug → rate limit + phone dedupe.
- Global phone uniqueness would block multi-trainer → scope to `trainerId`.

### Verifications
- Coach refresh keeps same link; Regenerate changes it.
- Client submit with missing goal → validation error; duplicate phone → error; new client appears as `PENDING_ASSESSMENT`.

