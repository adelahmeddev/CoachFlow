# Technical Documentation — CoachFlow (Coach)

## 1. Project Overview

**What the project does**
CoachFlow is a premium SaaS for Egyptian online fitness coaches. It covers the full athlete lifecycle: pooled invite link → client self-onboarding (goal/phone/birthDate + InBody import) → trainer builds nutrition (ClientNutritionPlan + Meal + SubstituteGroup) and training (TrainingSplit + SplitDayExercise) → client logs workouts (ExerciseLog + DailyLog) and meals (MealChoice) → progress analytics (BodyComposition delta, strength series, adherence) → subscription/session packages → real-time messaging (Conversation/Message + SSE).

**Problem it solves**
Replaces WhatsApp sheets + Excel with one workspace: one stable invite per trainer, InBody-aware training safety (pain flags → alternative suggestion), sequential vs fixed-weekday scheduling, and subscription types (PERIOD vs SESSIONS) that match how Egyptian coaches actually sell (`الباقات`).

**Main users**
* **TRAINER** — owns clients, builds templates, manages splits/nutrition/subscriptions, reviews progress, chats. Routes: `/(trainer)/*`
* **ADMIN** — global trainers/clients/subscriptions overview. Routes: `/(admin)/admin/*`
* **CLIENT** — portal: week board, today workout, nutrition checklist, progress, profile, messages. Routes: `client/(portal)/*` + `client/(session)/workout/session`

High-level: Next.js 16.3 App Router + React 19 RSC, TypeScript, PostgreSQL (Neon pooled) via `pg` Pool + Prisma Client (generated to `src/generated/prisma`), NextAuth 4 credentials, Zod + React Hook Form, Tailwind 4 + shadcn/radix-nova, next-themes, Recharts, Framer Motion (selective), i18n ar(default)/en RTL.

---

## 2. Technology Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Language | TypeScript | 5.x | `strict` |
| Framework | Next.js App Router | 16.3.0 | Turbopack, `serverExternalPackages: ["pg","@node-rs/bcrypt"]` |
| UI Runtime | React / React DOM | 19.2.8 | RSC + Client Components |
| Styling | Tailwind CSS + PostCSS | 4.x `@tailwindcss/postcss` + `tw-animate-css` 1.4 | `shadcn/tailwind.css` |
| Components | shadcn/ui + Radix UI | `shadcn 4.16.1`, `radix-ui 1.6.7` | style `radix-nova`, base `neutral`, `cssVariables:true` |
| Icons | lucide-react | 1.28.0 | fitness set: Dumbbell/Apple/Package/TrendingUp etc |
| Charts | Recharts | 3.10.1 | weight / measurements / strength |
| Forms | React Hook Form + Zod + @hookform/resolvers | 7.84.0 / 4.4.3 / 5.7.1 |  |
| Auth | NextAuth.js | 4.24.15 | Credentials only, `bcryptjs 3.0.3` + `@node-rs/bcrypt 1.10.8` |
| DB | PostgreSQL 15+ (Neon) + `pg 8.23.0` Pool | — | pooled `?sslmode=require&channel_binding=require&uselibpqcompat=true` |
| ORM | Prisma | 5.22.0 | `prisma-client` output `src/generated/prisma`, `adapter-pg` not used; direct `pg` Pool for hot paths |
| i18n | Custom | — | `src/lib/i18n/*`, cookie `locale`, `ar` default, RTL `dirForLocale` |
| Theming | next-themes | 0.4.6 | `class` attribute, dark `0C0A09` / light `FAFAF8` |
| Animations | CSS + Framer Motion selective | — | `tw-animate-css`, manual keyframes in `globals.css` |
| Validation | Zod | 4.4.3 | `src/lib/validations/*` |
| Utils | `clsx 2.1.1`, `tailwind-merge 3.6.0`, `cva 0.7.1`, `date-fns 4.4.0`, `nanoid 6.0.1`, `dexie 4.4.5` (client cache), `dotenv 17.4.2` | — |  |
| Tooling | ESLint 9 (`eslint-config-next 16.3`), TS, `tsx 4.23.9`, `cross-env 10.1`, `rimraf 6.1.3`, `@next/bundle-analyzer 16.3` | — |  |
| Testing | Playwright | 1.62.1 | E2E, no unit suite |
| Runtime | Node 18+ | — | Vercel serverless (pool `max 5`) vs dev `max 10` |

---

## 3. Project Structure

```
src/
  app/
    layout.tsx                # Root + Providers(locale, t) + Geist/Alexandria fonts
    globals.css               # Tailwind + design tokens + fitness utilities
    (admin)/admin/            # /admin, /admin/trainers, /admin/clients, /admin/subscriptions
    (auth)/login|register|signout # Auth pages (credentials)
    (trainer)/
      dashboard/page.tsx      # Trainer hero + stats + Needs-attention + Today-in-gym + RecentClientsVisual
      clients/page.tsx        # Header + ClientsFilters + ClientsGrid (was table) + pagination
      clients/[id]/page.tsx   # ClientProfileHeader + SectionNav (sticky) + 6 sections
      clients/[id]/nutrition/assign|edit, training-split/new|[splitId]/edit, sessions/new, subscription/* 
      messages/page.tsx + [clientId]/page.tsx
      onboarding/page.tsx     # Single stable invite link (InviteCard + InviteList)
      settings/page.tsx       # Tabs: profile/security/preferences/business/data/notifications
      nutrition-templates/*, training-split-templates/*, subscription-plans/*
    client/
      (portal)/               # Authenticated portal layout + bottom-nav
        home/page.tsx         # GreetingCard + TodayWorkoutCard + QuickStats + DailyChecklist
        week/page.tsx         # WeekBoard (Fixed vs Sequential)
        nutrition/page.tsx    # ClientNutritionView (coachMessage + supplements + meals with MealChoice toggle)
        workout/today/page.tsx + workout/session/page.tsx
        messages/page.tsx, profile/page.tsx
      (session)/workout/session/page.tsx
      login/page.tsx, change-password/page.tsx
    invite/[token]/page.tsx + success, join/[slug]/page.tsx
    api/
      auth/[...nextauth]/route.ts
      messages/route.ts, stream/route.ts (SSE), unread-count/route.ts
      clients/[id]/nutrition/assign, export/clients, trainer/clients, trainer/templates, client/change-password
  components/
    brand/brand-logo.tsx      # mark/full, quality 95, dark/light
    features/
      admin/admin-stats-cards.tsx
      clients/                # client-profile-header, client-profile-tabs(now SectionNav), clients-grid (visual), clients-table (legacy), clients-filters, overview-tab (QuickActions light cards), body-composition/*, nutrition/*, training-split/*, progress/*
      progress/               # progress-summary-cards (with ProgressRing), charts-client (lazy Recharts), comparison, logs
      nutrition/client-nutrition-view.tsx # supplement accordion, MealChoice toggle, macro hero
      client/                 # home/*, week/day-card, week/week-board, workout/*, nutrition/macro-cards, profile/*
      messages/               # conversation-list, conversation-item, chat-thread (SSE+polling), message-bubble, message-composer (quick chips + 📎)
    layout/ app-sidebar.tsx (Flame/UserPlus/Dumbbell/Apple/Crown icons, 60s poll + visibility guard) + client-bottom-nav + language-switcher + theme-toggle (mounted guard)
    theme/theme-provider.tsx  # next-themes
    providers.tsx             # SessionProvider + Direction + LocaleProvider + Toaster
    ui/                       # shadcn: button/badge/card/input/select/dialog/sheet/skeleton/tabs/switch + fitness primitives: fitness-card, section-nav, progress-ring, streak-badge, muscle-badge
  lib/
    i18n/{config,client,index,labels,lookup, messages/{ar.ts,en.ts}} # Egyptian fitness copy: الرئيسية/عملائي/المتابعة/التمرين/التقدم/الباقة
    validations/*, constants/*, client-profile-tabs.ts (6 values), calculations/{week-schedule,session-progress,bmi...}, exercise-safety.ts
    db.ts                     # pg Pool (Vercel max5/ dev max10, 10-15s timeout, uselibpqcompat, pool.on error, withDbRetry), generateId, healthCheck
    cache.ts                  # withCache (trainer-dashboard 300s, trainer:*:dashboard)
    utils.ts, format.ts, app-url.ts, idb.ts, nutrition-fixed.ts, prisma.ts
  server/
    auth/{index.ts, config.ts} # NextAuth credentials, getCurrentSession
    services/                 # dashboard, client, client-profile, client-portal, nutrition, training-split, week, progress, message, subscription, subscription-plan, training-split-template, admin, body-composition
    actions/                  # clients, locale, messages (send/markRead), nutrition (toggleMealChoice), client-portal (saveExerciseLog), etc.
  hooks/ , types/ , generated/prisma/
middleware.ts  # role guard for (admin)/(trainer)/client/(portal) + locale cookie
prisma/
  schema.prisma (see §7) + seed.ts (admin) + migrations/
scripts/seed-demo.ts (demo trainer + 10 clients + splits/nutrition)
public/brand/ (logo-mark-*, logo-on-*, favicon.svg, manifest.json)
next.config.ts (image qualities 70,75,85,95,100; formats avif/webp; serverExternalPackages pg/bcrypt)
components.json (radix-nova, RSC, tailwind cssVariables)
```

Entry points: `src/app/layout.tsx` → `(trainer)/dashboard/page.tsx` (hero + stats) and `client/(portal)/home/page.tsx` (GreetingCard + TodayWorkout).

---

## 4. Architecture Overview

Monolith Next.js App Router, RSC for data fetch, Client Components for interactivity, `pg` Pool for hot queries + Prisma Client for typed access.

**Request flow**

```
Browser → Next Middleware (role + locale) → RSC Page (getCurrentSession + withCache) 
  → Server Service (pool.query / Prisma) → Neon Postgres (pooled)
  → RSC render → Client hydration (SectionNav, ChatThread SSE+poll, WeekBoard)

Realtime: Browser EventSource → /api/messages/stream?conversationId= → server publish bus → Message
Mutations: Client action → Server Action (Zod) → Service → pool.query → revalidatePath + bus publish → SSE → ChatThread setMessages
```

**Key decisions**

* Direct `pg` Pool for hot paths (dashboard, messages unread, week) to control `FILTER COUNT`, pooling, and `statement_timeout 15s`; Prisma for typed CRUD elsewhere.
* `withCache` (300s) for `trainer-dashboard`; 10s in-memory for unread counts (`unreadTrainerCache`).
* SSE (`/api/messages/stream`) + polling fallback (3s visible / 10s hidden) + `visibilitychange` / `focus` tick in `ChatThread`.
* `withDbRetry` single retry on `timeout/terminated` for transient Neon cold start.

```mermaid
flowchart TD
  Client[Browser] --> MW[Middleware: auth + locale]
  MW --> Next[Next.js App Router RSC]
  Next --> Auth[NextAuth getCurrentSession]
  Next --> Svc[Server Services]
  Svc --> Pool[pg Pool max5/10 withDbRetry]
  Pool --> Neon[(Neon Postgres pooled)]
  Svc --> Cache[withCache 300s / 10s mem]
  Next --> SSE[/api/messages/stream SSE/]
  SSE --> Bus[message-bus publish]
  Client --> Actions[Server Actions Zod]
  Actions --> Svc
  Svc --> Reval[revalidatePath]
```

---

## 5. Core Modules

**Auth & RBAC** — `src/server/auth/*`, `middleware.ts`, `src/lib/db/enums Role`.
Credentials `username|phone|email + password`, `bcryptjs` hash, `mustChangePassword` flow, `Role ADMIN|TRAINER|CLIENT`. Middleware guards `(admin)`→ADMIN, `(trainer)`→TRAINER|ADMIN, `client/(portal)`→CLIENT. Data scoping via `trainerId` in every service.

**Dashboard** — `src/server/services/dashboard.service.ts:1`.
Aggregated single `COUNT FILTER` query (total/pending/active/recentlyAdded/prev*) + `LIMIT 5` recent (2 queries, was 8) + `withCache 300s` + `try/catch` degraded zeros; `DashboardPage` hero + 4 `StatCard` variants (`brand/muscle/performance/energy`) + `Needs-attention` (`muscle-500/10` fixed from `muscle-950`) + `Today-in-gym`.

**Clients & Profile** — `client.service.ts` (list with `q/goal/status/page/perPage`, `clients-grid` visual cards with `Flame` streak hash, `getTrainerClients`), `client-profile.service.ts` (client + `allSettled` 3 queries for BodyComposition/Subscription/TrainingSplit + `allSettled` days, returns degraded).
`ClientProfileHeader` light `rounded-2xl border bg-card` + `h-px via-brand-500/15` (was heavy `blur-3xl`), avatar `bg-brand-500/10`, 4 metrics `Streak/Package/Program/Last active`. `SectionNav` (`src/components/ui/section-nav.tsx:1`) sticky `bg-background/80 backdrop-blur-xl` icon+label pills.

**Nutrition** — `nutrition.service.ts` (`getCachedActivePlanFull`, `getTodayMealChoices`, `getPlanHistory`, `getTemplatesForTrainer`). Models: `NutritionTemplate` (global or trainer) → `Meal` (MEAL/SNACK) → `MealItem` (`groupNumber` for choose-one) + `SupplementDef` + `SubstituteGroup`/`SubstituteItem`; `ClientNutritionPlan` snapshot (templateId nullable) + same relations; `MealChoice` (`clientId,mealItemId,date` unique). Coach view `NutritionTab` hero `Flame` kcal + macro bar `pPct/cPct/fPct` + `UtensilsCrossed/Capsule→Pill/Shuffle` cards. Client view `ClientNutritionView` accordion supplements (`Pill`), meal toggle (`chosen` Set + `toggleMealChoiceAction` + `useTransition`), macro `Dumbbell/Wheat`.

**Training** — `training-split-template.service.ts`, `training-split.service.ts` (`getClientTrainingSplitData`), `week.service.ts` (`getClientWeekBoard` Fixed vs Sequential), `splitDayExercise` + `TemplateDayExercise`. `ActiveSplitCard` (`muscle-600→brand-500` accent, `focusEmoji`), `DayCard` (`brand-500→600` active, `bg-muted` rest), `WeekBoard` hero + `Progress` streak bar.

**Progress** — `progress.service.ts` (`getClientProgressData`, `getCachedStrengthSeries`), `ExerciseLog` (`setData Json`), `DailyLog`, `BodyComposition` (InBody fields `weightKg…visceralFatLevel`), `ProgressReview`. `ProgressSummaryCards` with `ProgressRing` (brand/performance/muscle/energy), charts lazy `WeightProgressChartLazy`.

**Subscriptions** — `subscription.service.ts` (`pickCurrentSubscription`), `subscription-plan.service.ts`. `PlanType PERIOD|SESSIONS`, `SubscriptionStatus NONE|ACTIVE|EXPIRED|PAUSED|TRIAL`, `PaymentStatus`. UI `SubscriptionTab` + `subscription-plans`.

**Messages** — `message.service.ts` (`enrichConversationWith` 2 parallel, `listConversationsForTrainer` JOIN + `GROUP BY unread`, `countUnreadForTrainer` single sub-select `IN (SELECT id FROM Conversation WHERE trainerId=$1)` + 10s mem cache, `countUnreadForClient` JOIN 1 query, `sendMessage` RBAC + `publish` + bust caches). `ChatThread` handles optimistic `temp-*`, `pending/failed`, 90s timeout, `isOnline` retry, poll `visibilitychange`. `ConversationList`/`ConversationItem` fitness `rounded-xl border` + online dot `performance-500`, `MessageBubble` `from-brand-500 to-brand-600` own vs `bg-card border` other, `MessageComposer` `rounded-2xl bg-muted/30` + `📎` + quick chips.

**i18n** — `src/lib/i18n/config DEFAULT_LOCALE ar`, `messages/ar.ts` Egyptian fitness: `الرئيسية/عملائي/المتابعة/التمرين/الباقة`, `en.ts`, `client.tsx LocaleProvider`, `lookup`, `formatDate`, `useI18n` client.

---

## 6. API Documentation

Base: `/api` + Server Actions (preferred for mutations).

**Route Handlers**

| Method | Path | Auth | Description | Response |
|---|---|---|---|---|
| `GET` | `/api/messages?conversationId=&cursor=` | TRAINER\|CLIENT | paginated messages `take 30`, cursor `createdAt` | `{messages: Message[], nextCursor}` |
| `GET` | `/api/messages/stream?conversationId=` | TRAINER\|CLIENT | SSE `Content-Type: text/event-stream`, `publish` | `event: message` |
| `GET` | `/api/messages/unread-count` | TRAINER\|CLIENT | cached 10s, `Cache-Control private max-age=5` | `{count: number}` (0 on DB error) |
| `GET` | `/api/trainer/clients?q=&goal&status&page` | TRAINER | via `getTrainerClients` | `{clients, total, page, totalPages}` |
| `GET` | `/api/trainer/templates` | TRAINER | split templates |  |
| `GET` | `/api/clients/[id]/nutrition/assign` | TRAINER | assign template |  |
| `POST` | `/api/client/change-password` | CLIENT | change own password |  |
| `GET` | `/api/export/clients` | TRAINER\|ADMIN | CSV export |  |
| `*` | `/api/auth/[...nextauth]` | — | NextAuth |  |

**Server Actions** (`src/server/actions/*`)

* `sendMessageAction({conversationId|clientId+trainerId, body})` — `Zod`, creates `Conversation` if missing, `INSERT Message`, `UPDATE Conversation lastMessage*`, `unreadTrainerCache.clear()`, `publish`, `revalidatePath`
* `markMessagesReadAction(conversationId)` — `UPDATE Message readAt WHERE senderRole opposite AND readAt IS NULL`
* `toggleMealChoiceAction(mealItemId)` — `INSERT/DELETE MealChoice` for today `db.Date`
* `saveExerciseLogAction(splitDayExerciseId, {actualSets,actualReps,actualWeightKg,notes})` — `UPSERT ExerciseLog`
* `clients: createClient, updateClient, deleteClientAction` — inviteToken generation `nanoid`, `inviteExpiresAt`
* `locale: setLocaleAction(next)` — sets `locale` cookie + `window.location.reload()`
* `auth: signIn`, `register` — NextAuth `signIn("credentials")`

Error shape: `{ok:false, error:string}` or `{ok:true, ...}`; Zod `flatten` for field errors; `isUniqueViolation 23505`, `isForeignKeyViolation 23503`.

---

## 7. Data Layer

**ORM & Driver**

* Prisma 5.22.0 Client generated to `src/generated/prisma` (`generator client provider prisma-client output ../src/generated/prisma`), datasource `postgresql env(DATABASE_URL)`.
* Hot paths use `pg Pool` direct `pool.query` with `FILTER COUNT`, not Prisma, for control.

**Key Models & Indexes**

* `User {id(cuid), username? unique, phone? unique, email? unique, passwordHash, role, mustChangePassword, trainerProfile?, clientProfile?, messages[]}` `@@index([role])`
* `TrainerProfile {id, userId unique→User, fullName, phone, email?, businessName?, units METRIC, weekStartDay SAT, timezone?, notifyReassessment/Inactivity/Subscription, weeklySummary, inviteSlug? unique, previousInviteSlug? unique, clients[], nutritionTemplates[], splitTemplates[], subscriptionPlans[], conversations[]}`
* `Client {id, trainerId→TrainerProfile, userId? unique→User, fullName?, birthDate?, phone?, goal? Goal, status INVITED default, inviteToken? unique, inviteExpiresAt?, basicInfoCompletedAt?, neckPain…kneePain false, dailyLogs[], clientNutritionPlans[], trainingSplits[], subscriptions[], progressReviews[], workoutLogs[], exerciseLogs[], bodyCompositions[], mealChoices[], weeklyCheckIns[], conversation?}` `@@index([trainerId],[status],[goal])`
* `BodyComposition {id, clientId→Client, date db.Date, source COACH|CLIENT, weightKg…visceralFatLevel, notes}` `@@index([clientId],[date])`
* `NutritionTemplate {id, trainerId?→TrainerProfile, name, isGlobal, calories…waterLiters, coachMessage, guidelines[], avoidFoods[], recommendedFoods[], supplementDefs[], substituteGroups[], meals[], plans[]}` + `SupplementDef {id, templateId?/planId?, name/nameAr, definition*/importance* order}` + `SubstituteGroup {id, templateId?/planId?, category CARB|PROTEIN|FAT|FRUIT, caloriesLabel, order, items[]}` → `SubstituteItem {id, groupId→Group, name/nameAr, amount?, unit G|ML|PCS default G}`
* `ClientNutritionPlan {id, clientId→Client, templateId? (SetNull), calories…waterLiters, coachMessage, guidelines[], status DRAFT|ACTIVE default ACTIVE, startDate? endDate?, supplementDefs[], substituteGroups[], meals[]}` + `Meal {id, templateId?/planId?, kind MEAL|SNACK, order, name/nameAr, items[]}` → `MealItem {id, mealId→Meal, groupNumber default1, foodName/foodNameAr, amount?, unit, calories?, order}` + `MealChoice {id, clientId→Client, mealItemId→MealItem, date db.Date}` `@@unique([clientId,mealItemId,date]) @@index([clientId,date])`
* `TrainingSplit {id, clientId→Client, splitType FULL_BODY…CUSTOM, daysPerWeek, scheduleMode FIXED_WEEKDAYS default, notes?, status ACTIVE}` → `TrainingSplitDay {id, splitId→Split, dayNumber, focus REST…CUSTOM, customFocus?, weekday? SAT…FRI, notes?}` `@@unique([splitId,dayNumber])` → `SplitDayExercise {id, splitDayId→Day, order, exerciseId?→Exercise SetNull, exerciseName, targetSets/Reps/WeightKg, restSeconds?, notes?, videoUrl?, logs[]}`
* `TrainingSplitTemplate {id, trainerId? , name, goal?, level?, splitType, daysPerWeek, description?, isGlobal}` → `TrainingSplitTemplateDay {id, templateId→Template, dayNumber, focus, customFocus?}` → `TemplateDayExercise {id, templateDayId→Day, order, exerciseId?, exerciseName, targetSets…}`
* `Exercise {id, name unique, nameAr?, muscleGroup, equipment?, tags[], defaultSets/Reps/RestSeconds?, isGlobal, youtubeUrl?, templateDayExercises[], splitDayExercises[]}` `@@index([muscleGroup])`
* `SubscriptionPlan {id, trainerId→Trainer, name, planType SESSIONS|PERIOD, sessionsCount?, durationDays?, notes?, subscriptions[]}` + `Subscription {id, clientId→Client, planId? SetNull, planName, planType PERIOD default, status NONE|ACTIVE|EXPIRED|PAUSED|TRIAL default ACTIVE, startDate? endDate? durationDays? sessionsCount? remainingSessions? paymentStatus NOT_REQUIRED default, autoRenew false, notes?}`
* `Conversation {id cuid, trainerId→TrainerProfile, clientId unique→Client, lastMessageAt?, lastMessagePreview?, messages[]}` `@@unique([trainerId,clientId]) @@index([trainerId,lastMessageAt])` + `Message {id cuid, conversationId→Conversation, senderId→User, senderRole Role, body Text, readAt?, createdAt}` `@@index([conversationId,createdAt],[senderId])`
* `ProgressReview {id, clientId→Client, reviewDate now, trainerNotes?, adherencePct?, energyLevel?, nextAssessmentDate?}` , `WorkoutLog {id, clientId→Client, date now, exerciseName, sets?/reps?/weightKg?/rpe?, notes?}` , `ExerciseLog {id, splitDayExerciseId→SplitDayExercise, clientId→Client, date now, actualSets/Reps/WeightKg, rpe?, notes?, setData Json?}` `@@index([clientId,date])` , `DailyLog {id, clientId→Client, date db.Date unique [clientId,date], weightKg…, nutritionCompliant?}`

**Enums**: `Role ADMIN|TRAINER|CLIENT`, `ClientStatus INVITED|PENDING_ASSESSMENT|ACTIVE|PAUSED|COMPLETED|ARCHIVED`, `Goal WEIGHT_LOSS|MUSCLE_BUILDING|STRENGTH|GENERAL_FITNESS|WEIGHT_GAIN|REHAB`, `PlanStatus DRAFT|ACTIVE|PAUSED|COMPLETED`, `SplitType`, `TrainingDayFocus`, `SubscriptionStatus`, `PlanType`, `PaymentStatus`, `Units`, `WeekStartDay SAT|SUN|MON`, `Weekday`, `ScheduleMode FIXED_WEEKDAYS|SEQUENTIAL`, `BodyCompositionSource`, `SubstituteCategory`, `QuantityUnit`, `MealKind`.

Migrations: `prisma migrate` + `seed.ts` (admin from `ADMIN_USERNAME/PASSWORD`), `scripts/seed-demo.ts` (trainer `trainer@demo.local` + 10 clients + splits/nutrition).

---

## 8. Authentication & Authorization

* **NextAuth 4 Credentials** (`src/server/auth/config.ts`): `authorize` looks up `User` by `username|phone|email`, `bcrypt.compare` (fallback `bcryptjs`), checks `mustChangePassword` → redirect `/client/change-password`.
* Session `strategy: jwt`, `HttpOnly` cookie `next-auth.session-token`, `NEXTAUTH_SECRET` 32+ chars, `NEXTAUTH_URL` optional on Vercel (uses `VERCEL_URL`).
* **Middleware** (`src/middleware.ts` / `src/proxy.ts` legacy): protects `/(admin)`→ADMIN, `/(trainer)`→TRAINER|ADMIN, `client/(portal)`→CLIENT, redirects to `/login` vs `/client/login`.
* **RBAC helpers**: `getCurrentSession()` (server), `ROLE_LABELS`, data scoping `WHERE trainerId = $1` in every service, `trainerProfileId` from session.
* Flaws fixed: `deleteClient` checks `trainerId`, `getClientProfile(id, trainerProfileId)` requires ownership.

---

## 9. Configuration & Environment Variables

`.env.example`:

```
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_URL="https://your-custom-domain.com" # optional on Vercel
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters-long"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-to-a-secure-password"
SEED_DEMO="false"
```

`.env` (Neon pooled, as committed example): `ep-jolly-cherry-ae919r4w-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` + `ADMIN_USERNAME=admin`.

`db.ts` auto appends `&uselibpqcompat=true` if missing to silence `pg-connection-string v3` `prefer/require→verify-full` warning.

**Config files**

* `next.config.ts` — `serverExternalPackages: ["pg","@node-rs/bcrypt"]`, `allowedDevOrigins: ["192.168.1.9"]`, `images {formats avif/webp, deviceSizes [...], imageSizes [...], qualities [70,75,85,95,100], bodySizeLimit 2mb}`.
* `prisma.config.ts` / `prisma/schema.prisma` (see §7)
* `tsconfig.json` path alias `@/*` → `src/*`, `strict`
* `components.json` — `style: "radix-nova"`, `rsc:true`, `tailwind cssVariables:true`, `baseColor neutral`, `iconLibrary lucide`.
* `postcss.config.mjs` — `@tailwindcss/postcss`
* `eslint.config.mjs` — `eslint-config-next 16.3`

---

## 10. Local Setup

Prereq: Node 18+, npm 10+, Git, (optional) Docker for local Postgres or Neon account.

```bash
git clone <repo> && cd coach
npm install
cp .env.example .env  # fill DATABASE_URL (Neon pooled), NEXTAUTH_SECRET (openssl rand -base64 32)
# For local .pg docker: npm run db:start (if script exists) or use Neon
npx prisma generate  # or npm run prisma:generate -> src/generated/prisma
npx prisma migrate dev --name init
npm run db:seed      # tsx prisma/seed.ts -> admin user
npm run seed:demo    # optional demo trainer + 10 clients
npm run dev          # http://localhost:3000 (Turbopack)
```

Common errors:

* `DATABASE_URL is not set` / `P1001 Can't reach DB` — check `uselibpqcompat`, pooled host ends with `-pooler.*.neon.tech`, `sslmode=require`, Neon project resumed (cold start 2-5s, pool retry handles).
* `PrismaClient not generated` — run `prisma:generate`.
* `next-auth` redirect loop — set `NEXTAUTH_URL` or remove on Vercel, ensure `NEXTAUTH_SECRET` same across restarts.
* `LayoutProps<"/"> TS2304` — use `{children: ReactNode}` (fixed in `src/app/layout.tsx:56`).
* `Image quality 100 not configured` — fixed `next.config.ts:10` includes 100, `brand-logo` uses 95.

---

## 11. Scripts & Commands

From `package.json`:

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Turbopack dev, HMR |
| `build` | `next build` | production + Turbopack compile 40-60s |
| `start` | `next start` | prod server |
| `lint` | `eslint` | ESLint 9 |
| `typecheck` | `tsc --noEmit` | type check |
| `db:seed` | `tsx prisma/seed.ts` | seed ADMIN from env |
| `seed:demo` | `tsx scripts/seed-demo.ts` | demo trainer/clients/splits |
| `prisma:generate` | `prisma generate` | gen to `src/generated/prisma` |

Hidden: `npx prisma migrate dev`, `npx prisma studio`, `npx playwright test`.

---

## 12. Testing

* **Playwright 1.62.1** E2E (no `src/**/__tests__` unit suite). Run `npx playwright test`, config maybe `playwright.config.ts`.
* Manual + build `typecheck` + `lint` as CI gates (no CI file yet).
* Known gaps: no unit tests for `calculations/*`, `exercise-safety`, `week-schedule`.

---

## 13. CI/CD & Deployment

* No `.github/workflows`, `Dockerfile` absent; local `.pg/` folder suggests Docker Postgres for dev, but prod uses Neon.
* Current prod: **Vercel** (`NEXTAUTH_URL https://coachflow-fitness-gaceradam-9189s-projects.vercel.app`, `VERCEL=1` pool `max 5` vs dev `max10`, `idle 10s/30s`, `connectionTimeout 15s/10s`, `statement_timeout 15s`, `NEXTAUTH_SECRET` set).
* Build: `next build` Turbopack, output `/.next`, `vercel --prod` manual. No preview CI.
* Env on Vercel: `DATABASE_URL` (pooled), `NEXTAUTH_SECRET`, `ADMIN_*`.

---

## 14. External Integrations

* **DB**: Neon Serverless Postgres (pooled `-pooler`), `pg Pool` + Prisma.
* **Auth**: NextAuth credentials only, no OAuth.
* **Storage**: none (body photos `photoUrl` string, not S3).
* **Email/SMS/Payments**: none (subscriptions are internal `SubscriptionPlan` bookkeeping, no Stripe).
* **AI**: none.
* **Other**: `recharts` for charts, `sonner` toasts, `next-themes`.

---

## 15. Security Notes

Implemented: `bcryptjs` + `@node-rs/bcrypt` hashing, `HttpOnly` JWT cookie, `NextAuth` CSRF, `Zod` server validation, `middleware` RBAC, per-trainer `trainerId` scoping, `isUniqueViolation 23505` / `isForeignKeyViolation 23503` handling, `mustChangePassword` flow, `inviteToken` single-use expiry.

Gaps & recommendations: rate-limiting (login + `sendMessageAction`), `audit logging`, `2FA`, `Content-Security-Policy` headers, `pg` `rowCount` checks, sanitize `coachMessage` HTML, `NEXTAUTH_SECRET` rotation, `ADMIN_PASSWORD` change on first boot.

---

## 16. Performance & Scalability

* **RSC** reduces JS, `dynamic = force-dynamic` only for messages.
* **Caching**: `withCache(['trainer-dashboard', id], ['trainer:id:dashboard'], 300s)` + `unreadTrainerCache` 10s mem (single `COUNT IN (SELECT...)` vs 2 queries, `GROUP BY` for list), `weeklyCheckIns` etc not cached.
* **DB**: `pg Pool` tuning for Neon serverless (above) + `withDbRetry` 1× 500ms on `timeout/terminated` for transient cold start; `dashboard` collapsed 8→2 `COUNT FILTER` queries; `client-profile` `allSettled` + `allSettled` days to avoid total failure; `listConversationsForTrainer` `LIMIT/OFFSET` + `DISTINCT ON`.
* **Messaging**: `SSE + polling fallback` 3s visible / 10s hidden + `visibilitychange` guard halves DB load and `Compiling…` spam; 60s unread poll vs 30s.
* **UI**: `SectionNav` sticky `backdrop-blur-xl` + `overflow-x-auto no-scrollbar snap-x`; CSS `animate-in/slide` `0.2s`, `prefers-reduced-motion` disables; `next/image` `qualities 85,95,100` `avif/webp`; `lazy` Recharts (`WeightProgressChartLazy`).
* Risks: N+1 for `exerciseLogs` grouping (`logsByExercise`), large `Message` history `take 30` per `cursor`, `dexie` client cache not yet used for offline.

---

## 17. Logging & Monitoring

* `console.error("[dashboard] query failed, returning fallback")`, `[client-profile]`, `[pg] pool error`, `[unread-count] failed` etc. Next.js dev logs + `forward-logs-shared.ts:120 [HMR]`.
* No structured logging (Pino), no APM (Sentry/Datadog), no audit table.
* Recommend: `healthCheck()` endpoint (`pool.query SELECT 1`), Vercel Logs + Neon metrics, `withCache` hit logs.

---

## 18. Known Limitations

* `getClientProfile` `Promise.all 3 + days 3` → timeout on Neon free cold start, now `allSettled` + retry but still no skeleton for degraded `null` vs `404`.
* `chat-thread` pending merge dedup via `body+senderId+5s` window + `Map id` may duplicate on rapid send; fixed with `seen Set`.
* `SectionNav` was pill `Tabs` (formal admin), now `SectionNav` icon+label sticky but `body-composition` tab still table-ish `PainFlagsForm`.
* `ClientNutritionView` `MealChoice` `unique [clientId,mealItemId,date]` but no optimistic rollback on `toggleMealChoiceAction` failure.
* No pagination for `BodyComposition` history, `TrainingSplit` history `SplitHistoryTable`.
* `ThemeToggle` hydration needed `mounted` guard (`src/components/layout/theme-toggle.tsx:72`).
* `LayoutProps<"/">` TS error fixed to `{children:ReactNode}`.
* `Image quality 100` fixed, but `brand-logo` still loads two images (dark/light) hidden via `display:none` (2 downloads).

---

## 19. Recommendations

1. Add `React Query/SWR` for server state + `useOptimistic` for messages/meal choices.
2. Unify `FILTER COUNT` pattern across `admin.service` `totalRes` counts.
3. Add `pg` `application_name` + `Neon pooled` `connect_timeout=15` in `DATABASE_URL`.
4. Add `GET /api/health` → `healthCheck()` + `withCache` stats.
5. CI: `lint + typecheck + build + playwright` on PR, `bundle-analyzer` budget.
6. Replace `Message` polling `IN (...)` with `COUNT FILTER` like unread.
7. Virtualize conversation list (`react-window`) when >50.
8. Unit tests for `calculations/week-schedule`, `session-progress`, `exercise-safety`.
9. Document API via `OpenAPI` from Zod schemas, add rate limit (`@upstash/ratelimit`).
10. Migrate `next-auth 4 → Auth.js 5` and `Prisma 5.22 → 7.9` adapter-pg when stable.

---

## 20. Mermaid Diagrams

```mermaid
erDiagram
  User ||--o| TrainerProfile : "1-1"
  User ||--o| Client : "1-1"
  TrainerProfile ||--o{ Client : owns
  TrainerProfile ||--o{ NutritionTemplate : creates
  TrainerProfile ||--o{ TrainingSplitTemplate : creates
  TrainerProfile ||--o{ SubscriptionPlan : creates
  TrainerProfile ||--o{ Conversation : owns
  Client ||--o| Conversation : "1-1 unique"
  Conversation ||--o{ Message : contains
  Client ||--o{ ClientNutritionPlan : has
  ClientNutritionPlan ||--o{ Meal : contains
  Meal ||--o{ MealItem : contains
  MealItem ||--o{ MealChoice : picked
  Client ||--o{ TrainingSplit : has
  TrainingSplit ||--o{ TrainingSplitDay : contains
  TrainingSplitDay ||--o{ SplitDayExercise : contains
  SplitDayExercise ||--o{ ExerciseLog : logs
  Client ||--o{ BodyComposition : tracks
  Client ||--o{ DailyLog : logs
  Client ||--o{ ExerciseLog : logs
  Exercise ||--o{ SplitDayExercise : usedIn
```

```mermaid
flowchart LR
  A[Browser] --> B[Middleware: auth+locale]
  B --> C[RSC Page: getCurrentSession + withCache]
  C --> D[Server Service: pool.query + Prisma]
  D --> E[(Neon Pooled Postgres max5/10)]
  D --> F[withCache 300s / 10s mem]
  C --> G[SSE /api/messages/stream]
  G --> H[message-bus publish]
  I[Client Action: sendMessage/toggleMeal] --> J[Server Action Zod]
  J --> D
  D --> K[revalidatePath + bust unread cache]
  K --> L[Response RSC]
```

```mermaid
flowchart TD
  subgraph UI["Fitness Design System"]
    T[Tokens: brand #E85D04 energy #F59E0B muscle #EF4444 performance #22C55E]
    G[globals.css card-fitness/energy/muscle/performance, progress-ring, flame]
    C[ui/section-nav sticky icon+label backdrop-blur + fitness-card + progress-ring + streak-badge]
  end
  UI --> Header[ClientProfileHeader light bg-card h-px via-brand/15]
  Header --> Nav[SectionNav 6 sections]
  Nav --> Tabs[6 Sections: ملخص/المتابعة/التمرين/التغذية/التقدم/الباقة]
  Tabs --> Messages[Messages: ConversationList rounded-xl border + ChatThread SSE+poll + Composer quick chips]
```

---

## 21. UI/UX Design System (Fitness Premium)

Tokens in `globals.css:62-146`:

* `brand-50 #FFF4EC → 900 #6B290A` primary (`--primary #E85D04` light / `#FB8A3C` dark)
* `energy-50→900` amber, `muscle-50→900` red, `performance-50→900` green
* `surface/surface-strong` + `shadow-soft/medium/glass/card-hover/glow` + `radius 0.5-4xl`

Utilities: `card-fitness` (gradient top `via-primary/60`), `card-energy/muscle/performance` (colored border + glow), `gradient-energy/muscle`, `gradient-text-*`, `glass*`, `section-nav` sticky.

Components: `SectionNav` (icon `LayoutDashboard/ClipboardCheck/Dumbbell/Apple/TrendingUp/Package`), `ProgressRing` (SVG `stroke-dasharray 283`), `StreakBadge` (`Flame` + `animate-flame`), `MuscleBadge`, `FitnessCard`, `ConversationItem` (`rounded-xl border, unread pulse`), `MessageBubble` (`from-brand-500 to-brand-600` own, `bg-card border` other), `MessageComposer` (`rounded-2xl bg-muted/30` + `📎` + quick chips).

Arabic: `dirForLocale`, `html:lang(ar) line-height 1.7`, `rtl:-scale-x-100`, `tabular-nums dir=ltr` for phone, mixed `fa` Latin `fa` Arabic fonts.

---

*Last updated: 2026-09-01 from codebase audit — Next 16.3 + Neon pooled + fitness SectionNav. Re-run `npm run typecheck && npm run build` after schema changes.*

