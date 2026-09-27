# CoachFlow — Glossary & Naming Conventions

## Domain Terms

| Term | Meaning |
|---|---|
| InBody | Bio-impedance body-composition scan (weight, muscle, fat, water, BMR, visceral fat) — the `BodyComposition` series |
| BMR / TDEE | Basal Metabolic Rate / Total Daily Energy Expenditure (kcal) |
| RPE | Rate of Perceived Exertion, 1–10 per logged set |
| 1RM | One-rep max estimate derived from `ExerciseLog` history |
| NeedsAction | Computed-on-read coach triage feed (`inactive_5d`, `sub_expired`, `payment_pending`, …) |
| PERIOD / SESSIONS | Package types: calendar-duration vs counted PT sessions (`Subscription.planType`) |
| PaymentProof vs PaymentRecord | Client-uploaded transfer screenshot (needs review) vs recorded platform license payment |
| Vodafone Cash / Instapay | Egyptian manual payment rails — the reason billing is proof-based, not gateway-based |
| Invite token vs join slug | Single-use `nanoid(24)` invite (`/invite/[token]`, 7-day expiry, nulled on use) vs stable coach handle (`/join/[slug]`, with 24h `previousInviteSlug` grace) |
| Main vs Alternative (spare) meal | Main (`isSpare=false`) vs its options (`isSpare=true`, `replacesMealId`→main); client may log from exactly one per group |
| MealChoice | One row per (client, item, UTC-midnight date) — the adherence primitive |
| Check-in / DailyLog | Daily wellness row (energy, mood, sleep, notes); one per day (unique constraint) |
| Streak | Consecutive qualifying check-in days (milestones 3/7/14/30/60/90/365) |
| FIXED_WEEKDAYS / SEQUENTIAL | Split scheduling: calendar-bound weekdays vs rotation from latest log |
| FULL / DAY_NAME_ONLY | `Client.workoutDisplayMode`: full targets + logging vs redacted day names only |
| ONLINE / IN_PERSON | `Client.coachingMode` |
| Ghost session | JWT surviving its DB rows (deleted/reset) — invalidated via `token.role = undefined` → proxy logout |
| PAYW paywall | `/subscription` lock screen when `checkCoachSubscriptionAccess` fails |
| dedupeKey | Unique notification key making cron inserts idempotent |
| Pooler endpoint | Neon's connection-multiplexing host (`-pooler`); `uselibpqcompat=true` keeps `pg` TLS working |
| Bento matrix | Client `/week` asymmetric grid (state-aware Today hero + `DayDetailSheet` previews) |
| Liquid Glass | iOS-26-style frosted-glass design primitives (`GlassCard`, `GlassSheen`, floating docks) |
| SectionNav | Sticky pill tab bar on the coach's athlete profile (6 sections) |
| WelcomeTicker | Sticky client-home marquee (greeting, streak, hydration, date) |

## Internal Naming Conventions

- **Files:** `*.service.ts` (domain logic + SQL), `src/server/actions/*.ts` (Server Action entry points), `src/lib/validations/*.ts` (Zod gates), `page.tsx` per route, `route.ts` per API handler.
- **Cache tags:** `trainer:{trainerProfileId}:dashboard`, `client:{clientId}:nutrition|profile|workout`; busted via `updateTag` (`invalidateDashboard`).
- **Pub/sub channel:** `conversation:{conversationId}` (Redis) / same key in the local emitter.
- **Session fields:** `session.user.{id, role, trainerProfileId, clientProfileId, mustChangePassword}`.
- **Bilingual columns:** `name`/`nameAr`, `definition`/`definitionAr`, etc. — Arabic is the default locale (`ar`, RTL).
- **IDs:** `generateId()` = `c` + 24 hex (relational rows); `nanoid(24)` for public tokens; cuid-format ids for binary media URLs.
- **Action results:** `{ ok: true, data }` / `{ ok: false, error, fieldErrors? }` — error codes are `SCREAMING_SNAKE` strings (`TOO_MANY_ATTEMPTS`, `ACCOUNT_SUSPENDED`, `VALIDATION_ERROR`, `UNAUTHORIZED`…).
