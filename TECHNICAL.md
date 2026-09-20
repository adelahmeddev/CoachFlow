# CoachFlow
## Comprehensive Technical & Architecture Documentation

---

## 1. Executive Summary

### 1.1 Overview & Mission
**CoachFlow** is a production-grade, specialized B2B2C Software-as-a-Service (SaaS) platform architected specifically for Egyptian and Middle Eastern online fitness coaches (فيتنس كوتش). It replaces fragmented workflows reliant on WhatsApp chat threads, manually shared Excel spreadsheets, Google Forms, and static PDF nutrition plans with an integrated, high-performance web application.

### 1.2 The Business Problem
Online fitness coaching in Egypt operates under distinct operational dynamics:
1. **Ad-Hoc Client Communication**: Coaches manage 50–300 athletes simultaneously via WhatsApp, mixing business communication, check-in photos, food diary queries, and workout questions in unindexed chat histories.
2. **Disconnected Billing**: The local market does not rely on automated card subscriptions (Stripe/Recurly) due to low credit card penetration and currency regulations. Instead, billing is handled manually through local payment methods: **Vodafone Cash (فودافون كاش)**, **Instapay (انستاباي)**, and direct bank transfers. Subscriptions are sold as packages (الباقات): either fixed durations (e.g., 3-month package) or fixed session bundles (e.g., 12 in-person/PT sessions).
3. **Safety & Medical Constraints**: Clients frequently exhibit occupational postural issues or joint pains (neck, shoulder, lower back, knee). Nutrition and exercise programs must account for these safety flags without requiring the coach to memorize medical histories during template assignment.
4. **Nutrition Substitutions & Alternate Meals**: Traditional PDF plans give static meals. Egyptian trainees frequently demand alternatives (e.g., "If I cannot eat eggs today, what can I eat instead?"). Without a structured alternative meal system, coaches spend hours answering daily food swap questions.

### 1.3 Target Users & Ecosystem
The platform establishes a strict three-tier role hierarchy:
- **SUPER_ADMIN**: The platform operator who provisions coach accounts, controls platform-level coach subscriptions and manual SaaS license fees, governs global branding defaults, and monitors multi-tenant platform metrics.
- **COACH (Trainer)**: The fitness professional who manages client rosters, authors training and nutrition templates, monitors client adherence through real-time feeds, reviews progress media and check-ins, and communicates directly with athletes.
- **CLIENT**: The athlete who consumes daily workouts, logs actual sets/reps/weights, checks off meals with mutual exclusivity across alternates, submits daily wellness check-ins, tracks body composition goals, and maintains private messaging with their coach.

### 1.4 Complete Platform Lifecycle

```mermaid
flowchart TD
    SA[SUPER_ADMIN] -->|Provisions Account & Sets CoachSubscription| C[COACH]
    C -->|Generates nanoid token or slug link| INV[Client Invitation / Join Slug]
    INV -->|Step 1: Profile & Pain Flags\nStep 2: InBody Entry\nStep 3: Account Credentials| CL[CLIENT Onboarding]
    CL -->|Status: PENDING_ASSESSMENT| C
    C -->|Assigns TrainingSplit & ClientNutritionPlan| CL
    CL -->|Status: ACTIVE| EXEC[Daily Athlete Execution]
    
    subgraph Daily Execution & Feedback
        EXEC -->|1. Check-off Meals & Alternates| MC[MealChoice Logs]
        EXEC -->|2. Log Sets, Reps, RPE, Weights| EL[ExerciseLog & WorkoutLog]
        EXEC -->|3. Submit Energy, Sleep, Mood, Notes| DL[DailyLog Check-in & Streak]
        EXEC -->|4. Upload Photos / Form Videos| PM[ProgressMedia: PENDING]
    end

    MC & EL & DL & PM -->|Batched Feeds & Alerts| NA[Coach NeedsAction Engine]
    C -->|Reviews Media, Provides Feedback, Enters InBody| COMM[Coach Review & Goal Sync]
    COMM -->|SSE Stream & Polling| MSG[In-App Realtime Messaging]
    
    subgraph Subscription Lifecycle
        C -->|Assigns PERIOD or SESSIONS Package| SUB[Client Subscription]
        CL -->|Uploads Proof of Instapay/Vodafone Cash| PP[PaymentProof]
        C -->|Approves Proof & Marks PAID| SUB
        SUB -->|Vercel Cron Automation at T-7, T-3, T-1, T-0| CRON[Automated Expiry & Reminders]
    end
```

---

## 2. Current Technology Stack

The technology stack has been verified directly against `package.json`, configuration files, and imports across the codebase.

### 2.1 Frontend Architecture
- **Framework**: **Next.js 16.3.0** (App Router architecture with React Server Components as the primary data-fetching engine).
- **UI Runtime**: **React 19.2.8** and **React DOM 19.2.8**.
- **Language**: **TypeScript 5.x** running in `strict` mode with path alias `@/*` mapping to `./src/*`.
- **Styling**: **Tailwind CSS 4.x** with PostCSS plugin (`@tailwindcss/postcss`). Custom fitness token extensions are configured in `src/app/globals.css` (lines 62–146) including `brand` (#E85D04), `energy` (amber), `muscle` (red), and `performance` (green) scales.
- **Component Primitives**: **shadcn/ui 4.16.1** (style: `radix-nova`, base: `neutral`, `cssVariables: true`) built on top of **Radix UI 1.6.7** primitives.
- **Icons**: **Lucide React 1.28.0** (`Dumbbell`, `Apple`, `Flame`, `TrendingUp`, `ClipboardCheck`, etc.).
- **Charts & Data Visualization**: **Recharts 3.10.1** (lazy-loaded via `WeightProgressChartLazy` to prevent initial bundle bloat).
- **Lazy-Loaded Heavy Builders**: Heavy form editors (`TrainingSplitForm` and `BlogPostForm`) are dynamically imported via `next/dynamic` (`ssr: false`) with dedicated skeleton fallbacks to minimize initial route bundle sizes.
- **Animation**: **Motion 13.2.0** (formerly Framer Motion) for micro-interactions, scale pickers, and modal animations; CSS keyframe animations for streaks and cards.
- **Form State & Validation**: **React Hook Form 7.84.0** integrated via **@hookform/resolvers 5.7.1** with **Zod 4.4.3**.
- **Theming & Design System**: **next-themes 0.4.6** (class-based dark/light switching with mounted guard to eliminate hydration flash) integrated with a bespoke **Liquid Glass** design system for UI components and navigation.
- **Feedback & Notifications**: **Sonner 2.0.7** for non-blocking toast notifications.
- **Dependency Cleanliness**: Unused offline synchronization libraries (`dexie`) have been completely excised.

### 2.2 Backend Architecture
- **Server Execution**: **Next.js Server Actions** for all state-mutating transactions (Zod-validated, role-gated, returning standardized `{ ok: boolean, error?: string, fieldErrors?: Record }` shapes).
- **Route Handlers**: Next.js App Router route handlers (`src/app/api/*`) dedicated to SSE streaming, file streaming, health checks, automated cron execution, and data exports.
- **Service Layer**: 29 domain-specific server services encapsulating business rules, multi-query transactions, and cross-domain events.
- **Distributed Real-Time Pub/Sub**: **`ioredis 5.6.1`** providing multi-instance Redis Pub/Sub for Server-Sent Events (SSE) message distribution across serverless instances on channel `conversation:{id}` with reference-counted unsubscribe and automated fallback to local EventEmitter when `REDIS_URL` is omitted.
- **Distributed Rate Limiting**: **`@upstash/ratelimit 2.0.8`** + **`@upstash/redis 1.36.0`** implementing a sliding-window rate limiter (5 failed attempts per 15-minute window) against brute-force/credential-stuffing attacks, with automatic in-memory fallback if Upstash credentials are not configured.
- **Cloud Object Storage Integration**: **`@aws-sdk/client-s3 3.978.0`** and **`@aws-sdk/s3-request-presigner 3.978.0`** via `src/lib/storage.ts` supporting Cloudflare R2 / AWS S3 with presigned upload/download URLs and seamless fallback to PostgreSQL binary storage.
- **Observability & Logging**: Structured JSON logger (`src/lib/logger.ts`) emitting production-grade NDJSON for log aggregators (Datadog/Loki/Grafana) and formatted human-readable output in local development.
- **Password Hashing**: **bcryptjs 3.0.3** with **@node-rs/bcrypt** as a high-performance native fallback.
- **ID Generation**: **nanoid 6.0.1** for URL-safe invite tokens (24 chars) and CUIDs for relational entities.
- **Image Processing**: **sharp 0.35.4** for converting coach-uploaded logos and blog images to modern WebP format on the server (EXIF auto-orient via `.rotate()`, 512px logo / 1280px blog caps). Client-side logo cropping is handled with the Canvas API in `src/components/features/settings/logo-editor.tsx`.

### 2.3 Database & Data Access
- **Database Engine**: **PostgreSQL 15+** hosted on **Neon** Serverless Postgres.
- **Connection Architecture**: **Pooled Connection** via Neon's connection pooler endpoint (`-pooler`) with flags `?sslmode=require&channel_binding=require&uselibpqcompat=true`.
- **Database Driver**: **`pg` 8.23.0** (node-postgres) connection pool.
  - Pool limits: `max: 5` connections on Vercel Serverless, `max: 10` in local development.
  - Statement timeout: hard-capped at 15 seconds.
  - Resilience & Instrumentation: custom `withDbRetry` wrapper retrying once on transient cold-start errors (`timeout` or `terminated`) with latency timing, retry failure counters, and exposed `getDbMetrics()`.
- **Read Replica Splitting**: Dedicated `replicaPool` in `src/lib/db.ts` utilizing `DATABASE_URL_REPLICA` (falling back to primary `DATABASE_URL`). Heavy read-intensive operations (`getAdminDashboardStats`, InBody composition analysis, strength series calculations) are routed to the replica to preserve primary transaction throughput.
- **Object-Relational Mapping**: **Prisma 5.22.0** (generator provider `prisma-client-js`) with client output directed to `src/generated/prisma`.
  - Used for schema management, migrations, and typed standard queries.
  - **Direct SQL Execution**: Performance-critical paths (Dashboard KPI aggregates, chat message cursors, and presence checks) use raw, parameterized `pool.query` via `src/lib/db.ts` to leverage Postgres-specific `FILTER (WHERE ...)`, CTEs, and window functions without ORM overhead.

### 2.4 Authentication & Authorization
- **Authentication Provider**: **NextAuth.js 4.24.15** using `CredentialsProvider` exclusively.
- **Session Strategy**: JSON Web Tokens (`jwt`) stored in `HttpOnly` cookies (`next-auth.session-token` / `__Secure-next-auth.session-token`) with 30-day longevity.
- **In-Memory Token Caches**: 60-second in-memory caches (`nameCache`, `trainerValidationCache`, `clientValidationCache`) to prevent repetitive database round-trips during frequent JWT callback evaluations.
- **Role Enforcement**: Edge/Node middleware (`src/middleware.ts`) guarding route groups against unauthenticated sessions or mismatched role permissions.

### 2.5 Infrastructure, Security & CI/CD
- **Deployment Platform**: **Vercel** serverless runtime.
- **Security Headers & CSP**: Strict Content Security Policy (CSP) and HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) enforced in `next.config.ts`.
- **Continuous Integration**: Automated GitHub Actions pipeline (`.github/workflows/ci.yml`) running typecheck (`tsc --noEmit`), linting (`eslint`), unit testing (`tsx --test`), and Next.js production build (`next build`) on every push and PR.
- **Unit Test Suite**: 98 automated unit tests covering core business calculations (week scheduling, streak calculation, exercise safety conflict resolution, and goal progress tracking) in `tests/pure-calculations.test.ts`.
- **Scheduled Tasks**: Vercel Cron pinging `POST /api/automation/run` authorized via `CRON_SECRET`.
- **Static Assets**: Next.js image optimization pipeline with WebP and AVIF formats, caching device sizes up to 1920px.

---

## 3. Complete Project Structure

```
D:\coach/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Automated CI: typecheck, lint, test:unit, build
│
├── prisma/
│   ├── schema.prisma                  # 38 data models, 23 enums (MealItem.groupNumber dropped)
│   ├── seed.ts                        # Seeds initial SUPER_ADMIN from environment
│   └── migrations/                    # Prisma relational migration scripts (includes drop_meal_item_group_number)
│
├── scripts/
│   ├── seed-demo.ts                   # Realistic Egyptian demo: 1 coach, 10 athletes, splits, nutrition
│   └── migrate-media-to-storage.ts    # One-time migration script copying BYTEA images to Cloudflare R2 / S3
│
├── tests/
│   └── pure-calculations.test.ts      # 98 unit tests: week scheduling, streaks, exercise safety, goal progress
│
├── src/
│   ├── app/                           # Next.js App Router routes & layouts
│   │   ├── layout.tsx                 # Root layout (Fonts: Geist & Alexandria; Providers wrapper)
│   │   ├── globals.css                # Tailwind base + CSS variables + fitness design tokens
│   │   ├── page.tsx                   # Root entry redirecting based on auth role
│   │   │
│   │   ├── (auth)/                    # Unauthenticated Authentication Flows
│   │   │   ├── layout.tsx             # Centered aesthetic authentication card layout
│   │   │   ├── login/page.tsx         # Unified Coach & Admin credentials login
│   │   │   ├── register/page.tsx      # Self-registration (when enabled)
│   │   │   └── signout/page.tsx       # Secure session termination
│   │   │
│   │   ├── (admin)/                   # SUPER_ADMIN Restricted Route Group
│   │   │   ├── layout.tsx             # Admin shell layout with system header
│   │   │   └── admin/
│   │   │       ├── page.tsx           # Global platform KPI dashboard
│   │   │       ├── trainers/page.tsx  # Coach management directory (status, creation, suspension)
│   │   │       ├── trainers/[id]/     # Deep coach drilldown & coach-subscription editor
│   │   │       ├── clients/page.tsx   # Cross-tenant client inventory (read-only monitoring)
│   │   │       └── subscriptions/     # Platform SaaS license subscription records
│   │   │
│   │   ├── (trainer)/                 # COACH Restricted Route Group
│   │   │   ├── layout.tsx             # Coach portal shell: app-top-nav.tsx, background-orbs.tsx (Liquid Glass), header, unread badge
│   │   │   ├── dashboard/page.tsx     # Hero stats, NeedsAction feed, Today-in-Gym, Recent clients
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx           # Client CRM: status/goal filters, search, ClientsGrid
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # 6-section athlete profile (SectionNav sticky pills)
│   │   │   │       ├── nutrition/     # Plan assignment, builder, and active plan customization
│   │   │   │       ├── training-split/# Split builder, day editor, and exercise safety checks (lazy-loaded form)
│   │   │   │       ├── sessions/      # In-person training session logger
│   │   │   │       └── subscription/  # Client subscription editor & payment proof approval
│   │   │   ├── messages/
│   │   │   │   ├── page.tsx           # Master conversation list with direct indexed unread counters
│   │   │   │   └── [clientId]/        # Dedicated chat thread (SSE + polling fallback)
│   │   │   ├── notifications/page.tsx # Coach notification feed with cursor pagination
│   │   │   ├── onboarding/page.tsx    # Stable invite links, QR codes, and token lists
│   │   │   ├── settings/page.tsx      # Sections: Branding (logo editor + identity), Profile, Security, Preferences, Data
│   │   │   ├── nutrition-templates/   # Reusable meal templates repository
│   │   │   ├── training-split-templates/ # Reusable workout split repository
│   │   │   ├── subscription-plans/    # Reusable packaging presets (PERIOD vs SESSIONS)
│   │   │   └── blog/                  # Coach educational & transformation publishing system (lazy-loaded editor)
│   │   │
│   │   ├── client/                    # CLIENT Restricted Route Group
│   │   │   ├── login/page.tsx         # Athlete-specific login entry
│   │   │   ├── change-password/       # Forced initial password update
│   │   │   ├── blog/                  # Public read-only feed of coach's articles
│   │   │   ├── (portal)/              # Authenticated Mobile-First Client Experience
│   │   │   │   ├── layout.tsx         # Mobile bottom navigation shell (ClientBottomNav)
│   │   │   │   ├── home/page.tsx      # CoachHeroSection, TodayWorkoutCard, DailyChecklist, QuickStats
│   │   │   │   ├── week/page.tsx      # BentoWeekMatrix: asymmetric bento grid (Fixed vs Sequential scheduling)
│   │   │   │   ├── workout/today/     # Exercise details with set/rep/load targets
│   │   │   │   ├── nutrition/page.tsx # Interactive meal checklist with alternate meal exclusivity
│   │   │   │   ├── messages/page.tsx  # Direct messaging with assigned coach
│   │   │   │   ├── media/page.tsx     # Progress photo & form check video submission gallery
│   │   │   │   ├── notifications/     # Client alert feed
│   │   │   │   └── profile/page.tsx   # Body measurements, goal trackers, package status
│   │   │   └── (session)/
│   │   │       └── workout/session/   # Focused gym mode: set logger, rest timer, RPE
│   │   │
│   │   ├── invite/[token]/            # Public Multi-Step Invitation Registration
│   │   │   ├── page.tsx               # Step 1: Info & Pain flags; Step 2: InBody; Step 3: Account
│   │   │   └── success/page.tsx       # Onboarding confirmation & login transition
│   │   ├── join/[slug]/page.tsx       # Stable Coach Public Landing Page
│   │   ├── subscription/page.tsx      # Coach SaaS Paywall Screen (when license expires)
│   │   │
│   │   └── api/                       # API Route Handlers
│   │       ├── auth/[...nextauth]/    # NextAuth route handler
│   │       ├── messages/              # Messages pagination & unread count
│   │       │   └── stream/route.ts    # SSE (Server-Sent Events) live message stream
│   │       ├── notifications/         # Notification feeds & read markers
│   │       ├── automation/run/        # Protected cron webhook for subscription expiry & reminders
│   │       ├── coach-logo/[coachId]/  # Streams stored binary WebP coach logos
│   │       ├── post-image/[id]/       # Streams stored binary WebP blog transformation photos
│   │       ├── health/route.ts        # Liveness & database connection health check
│   │       └── export/clients/        # CSV export generator for coach client lists
│   │
│   ├── components/
│   │   ├── brand/                     # Dynamic Branding, BrandLogo (SVG/PNG fallback)
│   │   ├── features/                  # Domain-Driven Feature UI Components
│   │   │   ├── admin/                 # Admin KPI cards, trainer lists, license controllers
│   │   │   ├── auth/                  # Credentials forms, password validation indicators
│   │   │   ├── blog/                  # Post creator, rich-content view, image uploader, lazy editor
│   │   │   ├── body-composition/      # InBody data table, delta analysis, trend indicators
│   │   │   ├── checkin/               # ScalePicker (1-5), mood/sleep/notes, CelebrationBurst
│   │   │   ├── client/                # CoachHeroSection, MacroCards, CoachSocialFooter + week/BentoWeekMatrix (bento grid) + week/DayDetailSheet (preview drawer)
│   │   │   ├── clients/               # Coach CRM (ClientsGrid, ClientProfileHeader, SectionNav)
│   │   │   ├── dashboard/             # NeedsActionSection, StatCard, TodayInGym, QuickActionDialog (+)
│   │   │   ├── search/                # GlobalSearchDialog (Cmd+K command palette)
│   │   │   ├── goals/                 # GoalCard, InBody auto-sync indicator, GoalForm
│   │   │   ├── media/                 # MediaGallery, MediaUploadForm, coach feedback dialog
│   │   │   ├── messages/              # ChatThread, ConversationList, MessageComposer, quick chips
│   │   │   ├── notifications/         # NotificationBell, NotificationList with i18n lookup
│   │   │   ├── nutrition/             # NutritionBuilder, ClientNutritionView + MacroConcentricRing (calorie HUD) + MealOverviewCard (meal cards) + MealDetailDrawer (main/alternative sheet)
│   │   │   ├── progress/              # ChartsClient (lazy Recharts), ProgressRing, strength charts
│   │   │   ├── subscription/          # SubscriptionForm, PaymentProofReview, UseSessionButton
│   │   │   └── training-split/        # Liquid Glass Workout Split Builder:
│   │   │       ├── liquid-glass/      # GlassSheen, GlassCard (dynamic focus backlights), GlassConfirmDialog
│   │   │       ├── split-starter-hub.tsx      # 4-path non-destructive starter (Presets, Templates, Clones, Scratch)
│   │   │       ├── template-preview-drawer.tsx # Full template days/exercises inspection before applying
│   │   │       ├── weekday-strip-selector.tsx  # 1-click visual 7-day scheduler with duplicate auto-swap
│   │   │       ├── batch-exercise-picker.tsx   # Large 3-column exercise catalog, video demo inspector, queue tray
│   │   │       ├── live-volume-radar.tsx       # Real-time muscle group set volume & balance telemetry
│   │   │       ├── floating-builder-dock.tsx   # Sticky floating dock with live stats & primary actions
│   │   │       ├── days-editor.tsx             # Collapsible day pods + in-day exercise up/down reordering
│   │   │       ├── training-split-form.tsx     # Safe preset state coordinator & validation engine
│   │   │       ├── template-form.tsx           # Master template authoring form with Liquid Glass
│   │   │       └── safety-warning-dialog.tsx   # Medical contraindication conflict solver
│   │   ├── layout/                    # app-top-nav.tsx, background-orbs.tsx, TrainerBottomNav (Liquid Glass mobile dock), ClientBottomNav (unmounted), WelcomeTicker, LanguageSwitcher, ThemeToggle
│   │   ├── providers.tsx              # SessionProvider, LocaleProvider, Direction, Toaster
│   │   └── ui/                        # Radix primitives & custom fitness widgets (FitnessCard, etc.)
│   │
│   ├── server/                        # Backend Domain Logic (Server-Only)
│   │   ├── auth.ts                    # NextAuth configuration, session resolvers, Upstash sliding-window rate limiter
│   │   ├── actions/                   # 26 Server Action files (includes search.ts for unified global search)
│   │   ├── services/                  # 29 Domain Service files handling business logic & SQL
│   │   ├── automation/
│   │   │   └── jobs.ts                # Advisory-locked cron jobs: expiry, milestones, reminders
│   │   └── realtime/
│   │       └── message-bus.ts         # Redis Pub/Sub multi-instance bus with local EventEmitter fallback
│   │
│   └── lib/                           # Shared Utilities, Validations, & Helpers
│       ├── db.ts                      # Postgres pool instance, replicaPool, query helpers, instrumented withDbRetry
│       ├── storage.ts                 # S3/R2 Cloud Object Storage client with presigned URLs
│       ├── logger.ts                  # Structured JSON/NDJSON logger with development colorized formatting
│       ├── cache.ts                   # unstable_cache wrappers & tag-based invalidation
│       ├── exercise-safety.ts         # Pain flag rule-matrix matching exercises to medical issues
│       ├── checkin.ts                 # Streak calculations, consecutive day algorithms
│       ├── goals.ts                   # Direction-aware goal progress calculator (weight loss vs gain)
│       ├── needs-action.ts            # Pure evaluation engine generating prioritized coach action items
│       ├── logo-image.ts              # Magic byte inspection & Sharp WebP conversion pipelines
│       ├── i18n/                      # Custom internationalization (ar default, en fallback)
│       ├── validations/               # 21 Zod validation schema files
│       └── db/
│           ├── enums.ts               # Mirrored TypeScript const enums for client-side usage
│           └── types.ts               # Relational entity types
```

---

## 4. Application Architecture

CoachFlow adheres to modern Next.js 16 principles, maximizing **React Server Components (RSC)** for initial data retrieval while deploying lightweight interactive **Client Components** at the leaves of the UI tree.

### 4.1 Layered Architecture Overview
1. **Routing & Gating Layer**: `middleware.ts` intercepts inbound HTTP requests, inspects the encrypted NextAuth session token, resolves the user role, and routes unauthorized users to their respective login portals while enforcing locale cookies.
2. **Presentation / RSC Layer**: Page components (`page.tsx`) execute strictly on the server. They resolve the user's session via `getCurrentSession()`, retrieve pre-cached or raw relational data via domain services, and render HTML structures with zero client-side JavaScript overhead.
3. **Interactive UI Layer**: Client components (`"use client"`) manage ephemeral state (active modal dialogs, tab selection, form inputs, optimistic toggle states, and SSE subscriptions).
4. **Action & Validation Layer**: User mutations trigger Server Actions (`src/server/actions/*`). Each action executes inside an isolated Node.js context, verifies user session permissions, runs Zod schema parsing, and dispatches to domain services.
5. **Domain Service Layer**: Pure business logic residing in `src/server/services/*`. Services coordinate database queries, enforce tenant isolation (`trainerId` scoping), and trigger post-mutation side effects.
6. **Data Persistence Layer**: Dual-access database architecture:
   - **Prisma Client**: Deployed for structured schema definitions, migrations, and standard entity updates.
   - **`pg` Connection Pool**: Direct parameterized SQL for high-volume aggregate dashboards, window functions, and real-time cursor queries.
7. **Side-Effect & Cache Revalidation Layer**: Following successful data mutations, services invoke:
   - `invalidateDashboard(trainerProfileId)` to bust Next.js `unstable_cache` tags.
   - `revalidatePath()` to refresh server-rendered pages.
   - `notifySafe()` to record in-app notifications.
   - `messageBus.publish()` to notify connected SSE listeners.

### 4.2 Comprehensive Request Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Athlete as Client / Athlete
    participant UI as Client Component (UI)
    participant Action as Server Action
    participant Zod as Zod Validation
    participant Svc as Domain Service
    participant DB as Neon PostgreSQL (pg Pool)
    participant Cache as Next.js unstable_cache
    participant Bus as SSE Message Bus
    actor Coach as Coach Dashboard

    Athlete->>UI: Toggles Meal Choice / Logs Exercise Set
    UI->>UI: Optimistic UI update (immediate visual feedback)
    UI->>Action: Invokes Server Action (e.g. toggleMealChoiceAction)
    Action->>Action: Verify session & resolve client identity
    Action->>Zod: safeParse(payload)
    Zod-->>Action: Validated input parameters
    Action->>Svc: Dispatches to Service (nutrition.service.ts)
    Svc->>DB: Executes parameterized SQL / CTE in transaction
    DB-->>Svc: Success confirmation & updated rows
    Svc->>Cache: Invalidate related tags (updateTag)
    Svc->>DB: INSERT Notification (notifySafe)
    Svc->>Bus: Publish event if applicable
    Bus-->>Coach: SSE stream delivers update to Coach
    Svc-->>Action: Returns { ok: true, data }
    Action-->>UI: Reconciles optimistic state
```

---

## 5. Role-Based Architecture

### 5.1 SUPER_ADMIN
The platform custodian with overarching system governance.
- **Authentication**: Dedicated credentials verified against `User` table where `role = 'SUPER_ADMIN'`.
- **System Dashboard (`/admin` & `admin.service.ts`)**:
  - Global metric aggregation: executes 11 concurrent queries via `Promise.all` to calculate total coaches, active vs. suspended coaches, total registered athletes, active client subscriptions, pending physical assessments, active coach SaaS subscriptions, expiring coach licenses (within 7 days), and recent audit logs.
- **Coach Directory & Lifecycle (`/admin/trainers`)**:
  - Provisioning: creates new coach accounts (`adminCreateTrainerAction`) including hashing temporary credentials, creating `User`, and generating `TrainerProfile`.
  - Account Governance: toggles coach status between `ACTIVE` and `SUSPENDED`. When a coach is suspended, their JWT callback instantly rejects requests with `ACCOUNT_SUSPENDED`.
- **Platform Subscription Management (`/admin/subscriptions` & `coach-subscription.service.ts`)**:
  - Controls platform access by managing `CoachSubscription` entities.
  - Manual Billing Recording: logs manual fee collections into `PaymentRecord` (amount paid, date, notes).
  - Actions: sets start/end dates, extends subscription periods by N days, or flips status (`ACTIVE`, `EXPIRED`, `SUSPENDED`).
- **Global Branding Administration**: Defines platform-wide defaults for brand name, logo, theme colors, and social links.
  - **`CoachBranding`** (social columns added by migration `20260912140000_coach_branding_socials`; see §20.7):
    - Fields: `id`, `coachId` (unique FK to TrainerProfile), `brandName`, `logoUrl`, `primaryColor`, `whatsappUrl`, `facebookUrl`, `instagramUrl`.

### 5.2 COACH (Trainer)
The primary tenant who operates an independent coaching business on the platform.
- **Dedicated Route Group**: `/(trainer)/*` (Wrapped in a Top Navigation layout using `app-top-nav.tsx` and `background-orbs.tsx` with the Liquid Glass design).
- **Authentication**: `Role.COACH`.
- **KPI Dashboard (`/dashboard` & `dashboard.service.ts`)**:
  - High-performance aggregation using PostgreSQL `COUNT(*) FILTER (WHERE ...)` returning active clients, invited clients, clients awaiting assessment, and recent additions in 2 optimized queries (reduced from 8).
  - **NeedsAction Engine**: Automated real-time prioritized triage identifying clients who have stalled (no workouts logged for 3 or 5 days), have expiring or expired packages, have pending payment receipts, missed daily check-ins, uploaded progress media requiring review, or have upcoming goal deadlines.
  - **Today in Gym**: Shows which athletes have logged workouts or active sessions today.
- **Client CRM (`/clients` & `client.service.ts`)**:
  - Comprehensive client search by name, phone, or goal with server-side pagination.
  - Interactive status filtering (`INVITED`, `PENDING_ASSESSMENT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`).
  - Athlete 360 Profile: 6 unified sections (`Overview`, `Check-ins`, `Workout`, `Nutrition`, `Progress`, `Subscription`).
- **Nutrition Builder (`/nutrition-templates` & `nutrition.service.ts`)**:
  - Creates master nutrition plans and client-specific meal plans.
  - Configures macros (Calories, Protein, Carbs, Fats, Water).
  - **Alternative Meals Architecture**: Links spare meals directly to main meals with database-level mutual exclusivity.
  - Manages bilingual supplement guides and 4-tier food substitution tables.
- **Training Split Builder (`/training-split-templates` & `training-split.service.ts`)**:
  - Builds templates across 5 split types (`FULL_BODY`, `UPPER_LOWER`, `PUSH_PULL_LEGS`, `BRO_SPLIT`, `CUSTOM`).
  - Supports **Fixed Weekday** or **Sequential Day** scheduling modes.
  - Exercise Safety Analysis: automatic cross-referencing of exercises against client medical pain flags.
- **Progress & InBody Tracking (`body-composition.service.ts` & `progress.service.ts`)**:
  - Enters detailed InBody scan metrics (Weight, Muscle mass, Body fat, Visceral fat, BMR, Water).
  - Formulates formal progress reviews and tracks strength trends across exercises.
  - Reviews client-submitted progress photos and form videos with feedback.
- **Business Configuration (`/settings`, `branding.service.ts`, `src/server/actions/branding.ts`)**:
  - Self-service branding: brand name, primary brand color (injected dynamically via CSS custom properties), logo upload through a profile-picture-style editor (zoom/drag/rotate/flip, canvas 512px WebP crop), coach social links (WhatsApp/Instagram/Facebook with phone→`wa.me` and `@handle`→URL normalization), and a dedicated personal coach photo independent from the brand logo. Saves update the whole platform instantly via the `branding:updated` event plus layout revalidation (see §20.5).
  - Working parameters: units (Metric/Imperial), week start day (Saturday default for Egypt, Sunday, or Monday), and timezone.
  - Self-service data export (CSV of all client data).

### 5.3 CLIENT (Athlete)
The end-user trainee consuming coaching services on mobile or desktop.
- **Dedicated Route Group**: `/client/(portal)/*`.
- **Authentication**: `Role.CLIENT` linked 1-to-1 with a `Client` profile record.
- **Home Portal (`/client/home` & `client-portal.service.ts`)**:
  - Sticky welcome ticker under the header (marquee: greeting, streak, date; RTL-aware direction, pauses on hover).
  - Full-bleed coach hero (`CoachHeroSection`): personal photo banner with status badge, three action pills (daily tip dialog, meal-substitute deep link, coach chat), and a social footer with the coach's profiles.
  - **Today's Workout Card**: Immediate access to the scheduled workout for the day.
  - **Daily Checklist**: Quick interactive status tracker for daily tasks (workout, nutrition, check-in).
  - **Quick Stats**: Real-time streak badge, adherence percentage, and active goal countdown.
- **Interactive Training Portal (`/client/workout/today` & `/client/workout/session`)**:
  - Displays ordered exercise cards with prescribed targets (sets, rep ranges, target weights, rest timers, form tips, and YouTube demonstration links).
  - **Active Session Logger**: Dedicated distraction-free gym mode allowing real-time set logging (actual reps, actual weight in kg, RPE 1–10) persisted as JSON arrays.
- **Nutrition Execution Portal (`/client/nutrition`)**:
  - Liquid Glass dashboard: luminous calorie overview HUD (`MacroConcentricRing` — triple SVG rings at `viewBox 240` with radii `108/92/76` so no stroke crosses the center text; consumed-vs-target kcal, items-logged and meals-completed shares; protein/carbs/fats shown as plan targets only, never fabricated) above a responsive meal-card grid (`1 col mobile → 2 sm → 3 xl`).
  - **Meal Cards** (`MealOverviewCard`): order badge, luminous calorie figure from real item-calorie sums (`~` when partial, `—` when unknown), items-done counter, progress hairline, and `completed / current / upcoming` states (performance-green glow, brand breathing glow, soft upcoming) with an explicit view-details CTA.
  - **Meal Detail Sheet** (`MealDetailDrawer`): Main-meal vs Alternative sections kept visually distinct (eat ONE option only), selectable alternative cards with active state, per-item checklist wired to `toggleMealChoiceAction` with group-level mutual exclusivity enforced server-side.
  - Item calories are passed through into the client view (`page.tsx` maps `item.calories`); without this the consumed-kcal HUD reads zero.
  - Educational reference: supplement timing guide and category-based food substitution lookup.
- **Daily Wellness Check-in (`/client/home` & `checkin.service.ts`)**:
  - Interactive 1–5 scale picker with haptic feedback for Energy and Mood.
  - Hours of sleep and optional coach notes.
  - Gamified streak counter with celebratory visual bursts on milestone achievements.
- **Progress Tracking & Media (`/client/profile` & `/client/media`)**:
  - Historical weight and body composition charts.
  - Goal progress cards showing current vs. target metrics.
  - Upload interface for weekly check-in photos and exercise form videos awaiting coach evaluation.
- **Subscription & Payment Submission (`/client/profile` & `payment-proof.service.ts`)**:
  - Visibility into active package type, expiration date, or remaining PT sessions.
  - Payment proof upload: allows client to upload screenshots of Vodafone Cash / Instapay transfers directly to the coach for verification.


---

## 6. Authentication & Authorization

The authentication and authorization architecture is implemented in `src/server/auth.ts`, `src/middleware.ts`, and individual domain services.

### 6.1 Unified Credentials Authentication Flow
CoachFlow does not utilize third-party OAuth providers (Google/Apple) because Egyptian coaches and athletes frequently operate without international email infrastructures. Instead, the platform relies exclusively on **NextAuth.js v4 CredentialsProvider** supporting a multi-identifier login scheme.

```mermaid
sequenceDiagram
    autonumber
    actor User as Coach / Client / Admin
    participant ClientPage as /login or /client/login
    participant API as /api/auth/callback/credentials
    participant Auth as src/server/auth.ts
    participant DB as Postgres (User Table)
    participant JWT as NextAuth JWT Encryptor

    User->>ClientPage: Submits identifier (Username/Phone/Email) + Password
    ClientPage->>API: POST credentials
    API->>Auth: authorize(credentials)
    Auth->>Auth: checkLoginRateLimit(identifier)\n(Upstash Redis / Memory Fallback)
    alt Rate Limited (>5 failures in 15m)
        Auth-->>ClientPage: Error: TOO_MANY_ATTEMPTS (15m lockout)
    end
    Auth->>DB: Query User WHERE username = $1 OR phone = $1 OR email = $1 LIMIT 1
    alt User Not Found
        Auth->>Auth: recordLoginFailure(identifier)
        Auth-->>ClientPage: Error: INVALID_CREDENTIALS
    end
    Auth->>Auth: bcrypt.compare(password, passwordHash)
    alt Password Mismatch
        Auth->>Auth: recordLoginFailure(identifier)
        Auth-->>ClientPage: Error: INVALID_CREDENTIALS
    end
    Auth->>Auth: recordLoginSuccess(identifier)
    
    alt Coach Account Suspended
        Auth->>DB: SELECT accountStatus FROM TrainerProfile WHERE userId = user.id
        alt accountStatus == 'SUSPENDED'
            Auth-->>ClientPage: Error: ACCOUNT_SUSPENDED
        end
    end

    Auth->>JWT: Return User Object (id, role, mustChangePassword)
    JWT-->>User: Set encrypted HttpOnly Cookie (next-auth.session-token)
    ClientPage->>User: Redirect based on role (or /client/change-password)
```

### 6.2 Session Strategy & In-Memory Token Optimization
- **Session Lifespan**: Encrypted JWT with `maxAge: 30 * 24 * 60 * 60` (30 days).
- **In-Memory Cache Architecture**: Every incoming RSC request invokes `getCurrentSession()`. To eliminate redundant database latency on repeated token checks, `src/server/auth.ts` implements three synchronized memory caches with 60-second TTLs:
  - `nameCache`: Stores resolved display names for `User.id` (`TrainerProfile.fullName` or `Client.fullName`).
  - `trainerValidationCache`: Validates that the `trainerProfileId` embedded in the token still exists in PostgreSQL.
  - `clientValidationCache`: Validates `clientProfileId` existence for active client sessions.
- **Ghost Session Invalidation & Self-Healing**: If a user's associated profile (`trainerProfileId` or `clientProfileId`) becomes invalid, the JWT callback attempts to self-heal by querying the database using `userId`. If the user still exists in the `User` table, a missing profile can be re-provisioned dynamically without requiring re-login. However, if the `userId` itself is missing (e.g., due to a hard-delete or a development database reset), the JWT callback strictly sets `token.role = undefined`. The Next.js Edge Middleware (`proxy.ts`) detects this invalidated token, automatically clears the stale session cookies from the browser, and redirects the user to the login screen, thereby preventing broken "ghost sessions" from rendering empty states.

### 6.3 Forced Password Change Flow (`mustChangePassword`)
When coaches invite athletes or provision temporary credentials:
1. The user is created with `User.mustChangePassword = true`.
2. Upon login, NextAuth stamps `mustChangePassword: true` onto the JWT session.
3. The root layout and client portal middleware detect this flag and restrict the athlete to `/client/change-password`.
4. Updating the password invokes `changeClientPasswordAction()`, which updates `passwordHash`, flips `mustChangePassword = false`, and re-signs the active session.

### 6.4 Distributed Rate Limiting (`src/server/auth.ts`)
To protect against distributed credential-stuffing and brute-force attacks across serverless instances:
- **Upstash Redis Sliding Window**: Uses `@upstash/ratelimit` with `Ratelimit.slidingWindow(5, "15 m")` keying on sanitized credentials identifiers (`login:attempts:${normalizedIdentifier}`).
- **Graceful In-Memory Fallback**: When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are omitted in local development or self-hosted deployments, the system falls back seamlessly to an in-memory sliding window tracker without crashing or disabling security.
- **Lockout Enforcement**: If an identifier exceeds 5 failed login attempts within 15 minutes, authentication requests are rejected immediately with `TOO_MANY_ATTEMPTS` before touching the database.

### 6.5 Middleware Protection Rules (`src/middleware.ts`)
The Edge/Node middleware intercepts incoming paths before any layout executes:
- **`/(admin)/*`**: Requires session with `token.role === 'SUPER_ADMIN'`. Otherwise redirects to `/login`.
- **`/(trainer)/*`**: Requires session with `token.role === 'COACH' || token.role === 'SUPER_ADMIN'`. Unauthorized users redirect to `/login`.
- **`/client/(portal)/*`**: Requires session with `token.role === 'CLIENT'`. Unauthorized users redirect to `/client/login`.
- **Locale Cookie**: Checks for `locale` cookie; if missing, sets default cookie `locale=ar`.

### 6.6 Tenant Isolation & IDOR Defense
Insecure Direct Object Reference (IDOR) attacks are defended at the service boundary through strict multi-tenant scoping:
1. **Coach Scoping**: All queries fetching or updating client data, splits, or nutrition plans append `WHERE "trainerId" = $1` matching the verified `session.user.trainerProfileId`.
2. **Assertion Helper**: Services employ `assertClientOwnedByTrainer(clientId, trainerId)` which queries `SELECT id, trainerId FROM Client WHERE id = $1` and verifies ownership before executing mutations. Mismatches return `null` or throw `CLIENT_NOT_FOUND`.
3. **Client Scoping**: Client portal actions pull `session.user.clientProfileId` directly from the validated session, ensuring athletes can only view or mutate their own `DailyLog`, `MealChoice`, or `ExerciseLog` records.

---

## 7. Database Architecture

The data architecture is defined in `prisma/schema.prisma` (956 lines), consisting of **38 relational models** and **23 PostgreSQL enums**.

```mermaid
erDiagram
    User ||--o| TrainerProfile : "has profile"
    User ||--o| Client : "has profile"
    User ||--o{ Notification : "receives"
    User ||--o{ Message : "sends"
    
    TrainerProfile ||--o{ Client : "owns athletes"
    TrainerProfile ||--o| CoachSubscription : "platform license"
    TrainerProfile ||--o| CoachBranding : "branding"
    TrainerProfile ||--o| CoachLogoFile : "stored logo"
    TrainerProfile ||--o{ CoachPost : "publishes"
    TrainerProfile ||--o{ NutritionTemplate : "creates"
    TrainerProfile ||--o{ TrainingSplitTemplate : "creates"
    TrainerProfile ||--o{ SubscriptionPlan : "creates"
    TrainerProfile ||--o{ Conversation : "manages"
    
    CoachSubscription ||--o{ PaymentRecord : "license payments"
    
    Client ||--o{ ClientNutritionPlan : "assigned"
    Client ||--o{ TrainingSplit : "assigned"
    Client ||--o{ BodyComposition : "InBody scans"
    Client ||--o{ DailyLog : "daily entries"
    Client ||--o{ WeeklyCheckIn : "weekly check-in"
    Client ||--o{ ExerciseLog : "workout sets"
    Client ||--o{ ClientGoal : "goals"
    Client ||--o{ ProgressMedia : "media"
    Client ||--o{ Subscription : "packages"
    Client ||--o| Conversation : "chat"
    
    ClientNutritionPlan ||--o{ Meal : "contains"
    Meal ||--o{ MealItem : "food items"
    Meal ||--o| Meal : "replacesMealId (alternate)"
    MealItem ||--o{ MealChoice : "daily toggle"
    ClientNutritionPlan ||--o{ SupplementDef : "supplements"
    ClientNutritionPlan ||--o{ SubstituteGroup : "substitutes"
    SubstituteGroup ||--o{ SubstituteItem : "items"
    
    TrainingSplit ||--o{ TrainingSplitDay : "split days"
    TrainingSplitDay ||--o{ SplitDayExercise : "exercises"
    SplitDayExercise ||--o{ ExerciseLog : "logged sets"
    
    Subscription ||--o{ PaymentProof : "proof receipts"
```

### 7.1 Model Breakdown by Domain

#### 1. Identity & Profiles
- **`User`**: Central credentials entity.
  - Fields: `id` (cuid), `username` (unique), `phone` (unique), `email` (unique), `passwordHash`, `role` (enum: `SUPER_ADMIN`, `COACH`, `CLIENT`), `mustChangePassword` (boolean).
  - Constraints & Indexes: `@@index([role])`.
- **`TrainerProfile`**: Coach business entity.
  - Fields: `id`, `userId` (1:1 with User, cascade delete), `fullName`, `phone`, `email`, `businessName`, `units` (`METRIC`/`IMPERIAL`), `weekStartDay` (`SAT`/`SUN`/`MON`), `accountStatus` (`ACTIVE`/`SUSPENDED`), `inviteSlug` (unique), `previousInviteSlug` (unique), notification preferences (`notifyReassessment`, `notifyInactivity`, `notifySubscription`, `weeklySummary`).
- **`Client`**: Athlete profile.
  - Fields: `id`, `trainerId` (FK to TrainerProfile), `userId` (FK to User, nullable until account created), `fullName`, `birthDate`, `phone`, `goal` (`Goal` enum), `status` (`ClientStatus`: `INVITED`, `PENDING_ASSESSMENT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`), `inviteToken` (unique), `inviteExpiresAt`, `basicInfoCompletedAt`.
  - Medical/Safety Flags: `neckPain`, `shoulderPain`, `backPain`, `kneePain` (booleans).
  - Coaching Preferences: `coachingMode` (`ONLINE`/`IN_PERSON`), `workoutDisplayMode` (`FULL`/`DAY_NAME_ONLY`).
  - Indexes: `@@index([trainerId])`, `@@index([status])`, `@@index([goal])`.

#### 2. Nutrition Architecture
- **`NutritionTemplate`**: Master reusable nutrition program.
  - Fields: `id`, `trainerId` (nullable for global platform templates), `name`, `isGlobal`, `calories`, `proteinGrams`, `carbsGrams`, `fatsGrams`, `waterLiters`, `coachMessage`, `guidelines` (string array), `avoidFoods` (string array), `recommendedFoods` (string array).
- **`ClientNutritionPlan`**: Athlete-assigned nutrition snapshot.
  - Decoupled copy of a template. Ensures modifications to the template do not alter historical or active client plans.
  - Fields: `id`, `clientId` (cascade delete), `templateId` (nullable reference), macro targets, `status` (`PlanStatus`: `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`).
- **`Meal`**: Meal slot belonging either to a `NutritionTemplate` or `ClientNutritionPlan`.
  - Fields: `id`, `templateId`, `planId`, `kind` (`MEAL`/`SNACK`), `order`, `name`, `nameAr`.
  - **Alternative Meal Fields**:
    - `isSpare` (Boolean, default: `false`): Flags meal as an alternative.
    - `replacesMealId` (String, nullable): Points to the parent `Meal.id` this alternative replaces.
  - Indexes: `@@index([templateId])`, `@@index([planId])`, `@@index([replacesMealId])`.
- **`MealItem`**: Food item within a meal.
  - Fields: `id`, `mealId` (cascade delete), `foodName`, `foodNameAr`, `amount` (float), `unit` (`QuantityUnit`: `G`, `ML`, `PCS`), `calories`, `order`. (Legacy `groupNumber` column dropped via migration `20260914100000_drop_meal_item_group_number`).
  - Indexes: `@@index([mealId])`.
- **`MealChoice`**: Athlete's daily meal selection.
  - Fields: `id`, `clientId`, `mealItemId`, `date` (`@db.Date` UTC midnight).
  - Constraints: `@@unique([clientId, mealItemId, date])`, `@@index([clientId, date])`.
- **`SupplementDef`**: Bilingual supplement guide attached to template or plan.
  - Fields: `id`, `name`, `nameAr`, `definition`, `definitionAr`, `importance`, `importanceAr`, `order`.
- **`SubstituteGroup` & `SubstituteItem`**: 4-category substitution tables (`CARB`, `PROTEIN`, `FAT`, `FRUIT`).

#### 3. Training Architecture
- **`TrainingSplitTemplate`**: Master workout template.
  - Fields: `id`, `trainerId`, `name`, `goal`, `level`, `splitType` (`FULL_BODY`, `UPPER_LOWER`, `PUSH_PULL_LEGS`, `BRO_SPLIT`, `CUSTOM`), `daysPerWeek`, `isGlobal`, `isMultiSplit`, `splitGroup`.
- **`TrainingSplitTemplateDay` & `TemplateDayExercise`**: Daily workouts and exercise targets within templates.
- **`TrainingSplit`**: Athlete-assigned workout split.
  - Fields: `id`, `clientId` (cascade delete), `splitType`, `daysPerWeek`, `scheduleMode` (`FIXED_WEEKDAYS` vs `SEQUENTIAL`), `status` (`PlanStatus`).
- **`TrainingSplitDay`**: Individual training day in split.
  - Fields: `id`, `splitId`, `dayNumber`, `focus` (`TrainingDayFocus`), `customFocus`, `weekday` (`Weekday`: `SAT`–`FRI`).
  - Constraint: `@@unique([splitId, dayNumber])`.
- **`SplitDayExercise`**: Prescribed exercise item.
  - Fields: `id`, `splitDayId`, `order`, `exerciseId` (FK to global Exercise, SetNull on delete), `exerciseName` (text snapshot), `targetSets`, `targetReps`, `targetWeightKg`, `restSeconds`, `notes`, `videoUrl`.
- **`ExerciseLog`**: Athlete's logged performance.
  - Fields: `id`, `splitDayExerciseId` (Restrict delete), `clientId`, `date`, `actualSets`, `actualReps`, `actualWeightKg`, `rpe`, `notes`, `setData` (JSON field storing set-by-set arrays: `[{ set: 1, reps: 10, weight: 80, rpe: 8 }]`).
  - Indexes: `@@index([clientId])`, `@@index([clientId, date])`, `@@index([date])`.
- **`Exercise`**: Global exercise dictionary.
  - Fields: `id`, `name` (unique), `nameAr`, `muscleGroup`, `equipment`, `tags`, `defaultSets`, `defaultReps`, `defaultRestSeconds`, `youtubeUrl`.

#### 4. Progress, Goals, & Daily Tracking
- **`BodyComposition`**: InBody scan data.
  - Fields: `id`, `clientId`, `date` (`@db.Date`), `source` (`COACH`/`CLIENT`), `weightKg`, `muscleMassKg`, `bodyFatKg`, `bodyWaterPct`, `fatControlKg`, `bmrKcal`, `fitnessScore`, `waistHipRatio`, `visceralFatLevel`, `notes`.
  - Indexes: `@@index([clientId])`, `@@index([date])`.
- **`DailyLog`**: Daily wellness and compliance report.
  - Fields: `id`, `clientId`, `date` (`@db.Date`), `weightKg`, `sleepHours`, `waterLiters`, `energyLevel` (1–10), `moodLevel` (1–10), `nutritionCompliant` (boolean), `notes`.
  - Constraint: `@@unique([clientId, date])`.
- **`WeeklyCheckIn`**: Weekly weight check-in with optional photo.
  - Fields: `id`, `clientId`, `date` (`@db.Date`), `weightKg`, `photoUrl`, `notes`.
  - Constraint: `@@unique([clientId, date])`.
- **`ClientGoal`**: Athlete goal targets.
  - Fields: `id`, `clientId`, `trainerId`, `type` (`GoalType`: `WEIGHT`, `BODY_FAT`, `MUSCLE`, `MEASUREMENT`, `STRENGTH`, `CUSTOM`), `title`, `startValue`, `currentValue`, `targetValue`, `unit`, `deadline`, `status` (`GoalStatus`: `ACTIVE`, `ACHIEVED`, `PAUSED`, `CANCELLED`).
  - Indexes: `@@index([clientId, status])`, `@@index([trainerId, status])`.
- **`ProgressMedia`**: Photos and videos submitted for review.
  - Fields: `id`, `clientId`, `trainerId`, `type` (`PROGRESS_PHOTO`, `FORM_VIDEO`, `OTHER`), `storageUrl`, `title`, `note`, `status` (`PENDING`, `REVIEWED`), `feedback`, `reviewedBy`, `reviewedAt`.
  - Indexes: `@@index([clientId, createdAt(sort: Desc)])`, `@@index([trainerId, status])`.
- **`ProgressReview`**: Formal evaluation written by coach.

#### 5. Subscriptions & Billing
- **`CoachSubscription`**: Platform SaaS license for coaches (managed by Super Admin).
  - Fields: `id`, `coachId` (unique FK to TrainerProfile), `startDate`, `endDate`, `amountPaid` (Decimal), `paymentDate`, `status` (`CoachSubscriptionStatus`: `ACTIVE`, `EXPIRED`, `SUSPENDED`), `notes`.
- **`PaymentRecord`**: Platform revenue records for coach licenses.
- **`Subscription`**: Athlete coaching package (managed by Coach).
  - Fields: `id`, `clientId`, `planId` (nullable reference to SubscriptionPlan), `planName`, `planType` (`PERIOD` vs `SESSIONS`), `status` (`SubscriptionStatus`: `NONE`, `ACTIVE`, `EXPIRED`, `PAUSED`, `TRIAL`), `startDate`, `endDate`, `durationDays`, `sessionsCount`, `remainingSessions`, `paymentStatus` (`PaymentStatus`: `PAID`, `PENDING`, `FAILED`, `NOT_REQUIRED`).
- **`PaymentProof`**: Athlete receipt upload.
  - Fields: `id`, `clientId`, `trainerId`, `subscriptionId`, `amount`, `proofUrl`, `status` (`PaymentProofStatus`: `PENDING`, `APPROVED`, `REJECTED`), `reviewedBy`, `reviewedAt`.

#### 6. Communication, Realtime, & Content
- **`Conversation`**: 1:1 chat room between Coach and Client.
  - Fields: `id`, `trainerId`, `clientId` (unique), `lastMessageAt`, `lastMessagePreview`.
  - Constraints: `@@unique([trainerId, clientId])`, `@@index([trainerId, lastMessageAt])`.
- **`Message`**: Chat entry.
  - Fields: `id`, `conversationId`, `senderId`, `senderRole` (`Role`), `body`, `readAt`.
  - Indexes: `@@index([conversationId, createdAt])`, `@@index([senderId])`.
- **`Notification`**: System alert.
  - Fields: `id`, `userId`, `type` (`NotificationType`), `titleKey`, `bodyKey`, `params` (JSON), `link`, `dedupeKey` (unique), `readAt`.
  - Indexes: `@@index([userId, createdAt(sort: Desc)])`, `@@index([userId, readAt])`.
- **`PresenceSession`**: Real-time online heartbeat tracker.
  - Fields: `id`, `clientId`, `trainerId`, `lastHeartbeatAt`, `expiresAt`.
- **`CoachBranding`**: Custom tenant styling (brand name, primary color, logo URL, social links). Partial-upsert writes only provided keys (see §20.4).
- **`CoachLogoFile`**: Direct binary storage for coach WebP logos (Postgres fallback; S3/R2 cloud storage abstraction supported via `src/lib/storage.ts`).
- **`CoachPost` & `PostImageFile`**: Coach blog articles and stored binary transformation images (Postgres fallback; S3/R2 cloud storage abstraction supported via `src/lib/storage.ts`).
- **`SystemSetting`**: Generic admin key-value store (`key` unique, `value` text) for platform configuration such as WhatsApp templates (see §8.3).

---

## 8. Admin System

The administration engine is implemented in `src/server/services/admin.service.ts` (561 lines) and `src/server/actions/admin.ts`.

### 8.1 Administrative Dashboard Analytics
The admin dashboard (`/admin`) delivers high-level operational intelligence across all platform tenants. The query execution relies on `getAdminDashboardStats()` wrapped in Next.js `withCache`:
- Executes 11 queries in parallel via `Promise.all`:
  1. `totalTrainers`: `SELECT COUNT(*)::int FROM TrainerProfile`
  2. `activeTrainers`: `SELECT COUNT(*)::int FROM TrainerProfile WHERE accountStatus = 'ACTIVE'`
  3. `suspendedTrainers`: `SELECT COUNT(*)::int FROM TrainerProfile WHERE accountStatus = 'SUSPENDED'`
  4. `totalClients`: `SELECT COUNT(*)::int FROM Client`
  5. `activeSubscriptions`: `SELECT COUNT(*)::int FROM Subscription WHERE status IN ('ACTIVE', 'TRIAL')`
  6. `pendingAssessments`: `SELECT COUNT(*)::int FROM Client WHERE status = 'PENDING_ASSESSMENT'`
  7. `activeCoachSubs`: `SELECT COUNT(*)::int FROM CoachSubscription WHERE status = 'ACTIVE'`
  8. `expiredCoachSubs`: `SELECT COUNT(*)::int FROM CoachSubscription WHERE status = 'EXPIRED'`
  9. `expiringSoonCoachSubs`: `SELECT COUNT(*)::int FROM CoachSubscription WHERE status = 'ACTIVE' AND endDate BETWEEN NOW() AND NOW() + INTERVAL '7 days'`
  10. `recentTrainers`: 5 latest coach profiles with creation timestamp and status
  11. `recentClients`: 5 latest athletes with assigned coach full names

### 8.2 Coach Management & Lifecycle Controls
- **Coach Directory (`/admin/trainers`)**: Lists coaches with search by name, phone, or email, with pagination and account status filtering.
- **Coach Provisioning (`adminCreateTrainerAction`)**:
  - Validates input against `createTrainerSchema`.
  - Hashes credentials with bcrypt.
  - In a single database transaction: inserts `User` record with `role = 'SUPER_ADMIN'` or `'COACH'`, creates `TrainerProfile`, generates default `CoachBranding`, and initializes trial `CoachSubscription`.
- **Account Suspension & Reactivation**:
  - `adminSuspendCoachAction(trainerId)`: Flips `accountStatus = 'SUSPENDED'`. The coach's active JWT session is terminated on its next request, redirecting to an account suspended lock screen.
  - `adminActivateCoachAction(trainerId)`: Restores access to `'ACTIVE'`.
- **Coach Removal**: Cascade-deletes all associated templates, athlete links, and conversations.

### 8.3 Coach SaaS Subscription Administration (`coach-subscription.service.ts`)
Controls platform monetization and SaaS license enforcement:
- **Set/Extend Subscription (`setCoachSubscriptionAction`, `extendCoachSubscriptionAction`)**:
  - Admin assigns license duration (e.g., 30, 90, 365 days).
  - Calculates expiration timestamp: `calculateEndDate(startDate, durationDays)`.
  - Status transitions: `ACTIVE`, `EXPIRED`, `SUSPENDED`.
- **Manual Payment Recording**:
  - Records manual offline payments in `PaymentRecord` table (`amount`, `paymentDate`, `notes`).
- **Paywall Enforcement (`subscription-guard.service.ts`)**:
  - Coach operations check `checkCoachSubscriptionAccess(coachId)`. If expired or suspended, coaches are redirected to `/subscription`, locking their ability to edit plans, invite clients, or message athletes until renewed.
- **WhatsApp Expiry Reminders (`system-settings.service.ts`, `/admin/trainers/[id]`)**:
  - An amber banner renders when a subscription is `EXPIRED` or `ACTIVE` with ≤ 7 days left (hidden otherwise), offering reminder / follow-up sends and template editing.
  - Preview/edit dialogs launch `wa.me` links with interpolated `{coach_name}` / `{end_date}` / `{days_left}`; helpers in `src/lib/whatsapp.ts` (`normalizeEgyptianPhone`, `interpolateTemplate`, `buildWhatsAppUrl`) handle Egyptian → international normalization and URL encoding.
  - Templates persist in the generic `SystemSetting` key-value table (`admin_whatsapp_templates` key; migration `20260913000000_add_system_setting`). The service self-heals via `CREATE TABLE IF NOT EXISTS` on first use and falls back to built-in defaults if the table is absent, because the repo migration pipeline cannot be relied on (broken shadow-DB validation, drifted histories — `migrate deploy` must NOT be added to the build for this reason).
  - Note: local dev (`.env.local`) and tooling (`.env`) point at *different* Neon databases — schema changes must be applied to both.


---

## 9. Coach Management System

The coach management system forms the core operational hub in `src/server/services/dashboard.service.ts`, `src/server/services/needs-action.service.ts`, and `src/server/services/client.service.ts`.

### 9.1 Dashboard Architecture (`dashboard.service.ts`)
The coach dashboard (`/dashboard`) aggregates business metrics while mitigating database strain:
- **Collapsed Aggregation Queries**: Historical implementations executed 8 independent queries to calculate dashboard cards. The current engine consolidates metrics into **2 parameterized queries**:
  ```sql
  -- Query 1: Total & Status Breakdown via Postgres FILTER
  SELECT 
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE "status" = 'ACTIVE')::int AS active,
    COUNT(*) FILTER (WHERE "status" = 'PENDING_ASSESSMENT')::int AS pending,
    COUNT(*) FILTER (WHERE "status" = 'INVITED')::int AS invited,
    COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days')::int AS recently_added
  FROM "Client"
  WHERE "trainerId" = $1;

  -- Query 2: Recent Clients List
  SELECT "id", "fullName", "status", "goal", "createdAt"
  FROM "Client"
  WHERE "trainerId" = $1
  ORDER BY "createdAt" DESC LIMIT 5;
  ```
- **Caching Layer**: Results are cached via Next.js `withCache` for 300 seconds under the tag `trainer:[trainerId]:dashboard`. Any mutation (client creation, invite completion, plan assignment, or deletion) invokes `invalidateDashboard(trainerId)` via `updateTag` for immediate cache busting.
- **Resilient Fallback**: In the event of cold-start timeouts on serverless Postgres, queries catch errors, log warnings, and return zeroed defaults without crashing the dashboard shell.

### 9.2 NeedsAction Engine (`src/server/services/needs-action.service.ts` & `src/lib/needs-action.ts`)
Rather than maintaining an asynchronous, stale "Alerts" table that requires background cleanup, CoachFlow computes actionable client items **dynamically on read** through 7 batched queries.

```mermaid
flowchart LR
    subgraph 7 Batched Queries
        Q1[1. Last ExerciseLog date]
        Q2[2. Active Subscriptions & Expiry]
        Q3[3. Last InBody scan date]
        Q4[4. Pending Payment Proofs]
        Q5[5. Last Daily Check-in date]
        Q6[6. Pending Progress Media]
        Q7[7. Nearest Active Goal Deadlines]
    end
    
    Q1 & Q2 & Q3 & Q4 & Q5 & Q6 & Q7 --> Agg[ClientActionSnapshot Map]
    Agg --> Pure[evaluateClientActions Engine]
    Pure --> Sorted[Sorted NeedsAction Feed: HIGH > MEDIUM > LOW]
```

#### Rule Evaluation Matrix (`src/lib/needs-action.ts`)

| Action Kind | Priority | Trigger Condition | Call to Action (CTA) |
|-------------|----------|-------------------|----------------------|
| `inactive_5d` | **HIGH** | Active client has not logged a workout for ≥ 5 days | Send message / Check athlete status |
| `sub_expired` | **HIGH** | Client's coaching subscription has passed its `endDate` | Renew package / Record payment |
| `payment_pending` | **HIGH** | Client submitted a Vodafone Cash/Instapay receipt awaiting review | Review & approve receipt |
| `inactive_3d` | **MEDIUM** | Active client has not logged a workout for 3–4 days | Send workout encouragement |
| `sub_expiring` | **MEDIUM** | Client's subscription ends within 7 days | Initiate renewal discussion |
| `missed_checkin` | **MEDIUM** | Active client missed daily check-in for ≥ 2 consecutive days | Reminder message |
| `media_pending` | **MEDIUM** | Client uploaded progress photos/form check videos awaiting coach feedback | Review media & give feedback |
| `goal_deadline` | **MEDIUM** | Active goal deadline is within 7 days | Review goal progression |
| `no_inbody` | **LOW** | Active client has no InBody composition logged for ≥ 30 days | Schedule InBody scan |
| `checkin_today` | **LOW** | Client completed check-in today | View daily feedback |

### 9.3 Client CRM & Athlete 360 Profile (`client.service.ts`)
- **Clients Directory (`/clients`)**: Searchable by name, Egyptian phone number, or fitness goal. Server-side pagination with visual cards (`ClientsGrid`) displaying gamified streak flame badges, active package status, and avatar initials.
- **SectionNav Navigation**: When opening an athlete profile (`/clients/[id]`), `SectionNav` renders a sticky, backdrop-blurred pill bar allowing instant switching across 6 functional domains:
  1. **Overview**: Key metrics, quick actions, pain flags, and contact links.
  2. **Check-ins**: Daily wellness logs (energy, sleep, mood) and streak analysis.
  3. **Workout**: Active training split, split history, and exercise performance logs.
  4. **Nutrition**: Assigned nutrition plan, active meals, alternates, and supplement guidelines.
  5. **Progress**: InBody trends, strength progressions, and media submissions.
  6. **Subscription**: Active package terms, remaining PT sessions, and payment receipts.

### 9.4 Global Command Palette & Unified Search (`Cmd+K` / `Ctrl+K`)
- **Engine (`src/server/actions/search.ts`)**: Server Action `globalSearchAction(query)` executing parallelized, tenant-isolated parameterized SQL queries across 5 core entities:
  1. **Clients**: matched against `fullName`, `phone`, and `email` (`WHERE "trainerProfileId" = $1 AND ...`).
  2. **Global & Custom Exercises**: matched against `name`, `nameAr`, `muscleGroup`, and `equipment`.
  3. **Workout Templates**: matched against `name` and `description` scoped to the authenticated coach.
  4. **Nutrition Templates**: matched against `name` and `description`.
  5. **Blog & Transformation Posts**: matched against `title` and `category`.
- **Command Dialog (`src/components/features/search/global-search-dialog.tsx`)**:
  - Global keyboard listener (`Meta+K` on macOS, `Ctrl+K` on Windows/Linux).
  - Liquid Glass modal shell with `backdrop-blur-2xl`, auto-focused input, keyboard arrow navigation, and category filter pills.
  - Direct routing: selecting an item navigates immediately to the relevant sub-route (e.g. `/clients/[id]?tab=workout` or `/training-split-templates/[id]/edit`).

### 9.5 Quick Action Floating Trigger (`+`)
- **Implementation (`src/components/features/dashboard/quick-action-dialog.tsx`)**:
- High-velocity modal launcher accessible from the coach dashboard and mobile navigation.
- Provides direct 1-click navigation shortcuts to eliminate repetitive multi-step menu traversals:
  - **Add Client**: instant jump to invite token generator (`/onboarding`).
  - **New Workout Split**: instant jump to workout split template builder (`/training-split-templates/new`).
  - **New Nutrition Plan**: instant jump to meal template builder (`/nutrition-templates/new`).
  - **Compose Message**: instant jump to client conversations hub (`/messages`).
  - **Publish Educational Post**: instant jump to transformation blog creator (`/blog/new`).

### 9.6 Coach Mobile Liquid Glass Navigation Dock
- **Implementation (`src/components/layout/trainer-bottom-nav.tsx`)**:
- Specialized floating bottom dock active on mobile viewports (`md:hidden`) engineered with iOS 26 Liquid Glass design language:
  - **Glass Material**: `rounded-[2rem] border border-white/10 bg-background/70 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55 dark:border-white/5`.
  - **Core Route Hubs**: Dashboard, Clients CRM, Messages, and More (Drawer opening Settings, Templates, Subscriptions, Blog).
  - **Central Elevated Action (+)**: Opens the `QuickActionDialog` with glowing brand accent.
  - **Real-Time Unread Badge**: Subscribed to `useUnreadCount` to display live message badges without polling.

---

## 10. Client Onboarding

CoachFlow supports two distinct onboarding vectors: **Token-Based Single-Use Invitations** and **Permanent Coach Public Join Slugs**.

### 10.1 Multi-Step Onboarding Architecture (`invite.service.ts`)

```mermaid
sequenceDiagram
    autonumber
    actor Coach
    actor Athlete
    participant App as CoachFlow App
    participant DB as Postgres DB

    Coach->>App: Clicks "+ Invite Client"
    App->>DB: INSERT Client (status: INVITED, inviteToken: nanoid(24), inviteExpiresAt: +7d)
    App-->>Coach: Returns https://app.coachflow.me/invite/a1b2c3d4...
    
    Coach->>Athlete: Shares invite link via WhatsApp
    Athlete->>App: GET /invite/[token]
    App->>DB: Validates token expiration & status != ACTIVE
    App-->>Athlete: Renders Step 1: Physical Assessment Form
    
    Athlete->>App: Submits Step 1 (Name, Phone, Birthdate, Goal, Pain Flags)
    App->>DB: UPDATE Client (basicInfoCompletedAt = NOW(), status = PENDING_ASSESSMENT)
    App-->>Athlete: Renders Step 2: InBody Entry (Optional)
    
    Athlete->>App: Submits Step 2 (Weight, Fat, Muscle) or Skips
    opt If InBody provided
        App->>DB: INSERT BodyComposition (source: CLIENT)
    end
    App-->>Athlete: Renders Step 3: Account Credentials Form
    
    Athlete->>App: Submits Step 3 (Username, Password)
    App->>DB: INSERT User + UPDATE Client (userId = user.id, inviteToken = NULL, status = ACTIVE)
    App-->>Athlete: Redirects to /invite/success -> /client/login
```

### 10.2 Token Handling, Security, & Expiration
- **Token Generation**: Uses `nanoid(24)`, providing 140 bits of entropy, rendering brute-force attacks computationally infeasible.
- **Expiry Lifecycle**: Default expiration is set to 7 days (`DEFAULT_INVITE_EXPIRY_DAYS = 7`). Coaches can extend expired invites via `extendClientInviteAction()`, which updates `inviteExpiresAt = NOW() + 7 days`.
- **Single-Use Guarantee**: Once Step 3 (account creation) completes, the `inviteToken` is cleared (`NULL`), preventing re-use.
- **Manual Client Provisioning**: Coaches can bypass the public invite flow and provision an athlete account directly through `createLoginForClientAction()`, which assigns temporary credentials and sets `mustChangePassword = true`.

### 10.3 Stable Public Join Slugs (`/join/[slug]`)
- Coaches can configure a permanent, memorable public handle (e.g., `https://app.coachflow.me/join/coach-kamel`).
- **Slug Rotation Safety**: When a coach updates their handle, the previous handle is retained in `TrainerProfile.previousInviteSlug` for 24 hours (`previousInviteSlugExpiresAt`), ensuring existing marketing materials or Instagram bio links do not break immediately.
- Visitors to `/join/[slug]` dynamically generate an underlying `Client` record with an ephemeral invite token and enter the 3-step registration wizard.

---

## 11. Training Architecture

The workout engine is governed by `src/server/services/training-split.service.ts` (16,196 bytes) and `src/server/services/week.service.ts` (10,457 bytes).

### 11.1 Master Templates vs. Client Splits
- **`TrainingSplitTemplate`**: Master routines defined by coaches (e.g., "5-Day Push Pull Legs Hypertrophy").
- **Deep-Copy Assignment (`applyTemplateToClient`)**: Assigning a template clones the entire hierarchy:
  `TrainingSplitTemplate` → `TrainingSplitTemplateDay` → `TemplateDayExercise`
  into:
  `TrainingSplit` → `TrainingSplitDay` → `SplitDayExercise`.
  The client's split becomes completely independent; subsequent adjustments to the master template never corrupt active athlete programs.

### 11.2 Scheduling Modes: Fixed Weekday vs. Sequential

```mermaid
flowchart TD
    subgraph Mode 1: FIXED_WEEKDAYS
        F1[Saturday: Push] --> F2[Sunday: Pull]
        F2 --> F3[Monday: Legs]
        F3 --> F4[Tuesday: REST]
        F4 --> F5[Wednesday: Upper]
        F5 --> F6[Thursday: Lower]
        F6 --> F7[Friday: REST]
    end
    
    subgraph Mode 2: SEQUENTIAL
        S1[Day 1: Full Body A] --> S2[Day 2: Full Body B]
        S2 --> S3[Day 3: Full Body C]
        S3 -.->|Rotates continuously regardless of calendar day| S1
    end
```

1. **`FIXED_WEEKDAYS`**:
   - Each training day is bound to an explicit `Weekday` enum (`SAT`, `SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`).
   - The week board displays a rigid 7-day calendar view reflecting Egyptian fitness cycles (typically starting Saturday).
2. **`SEQUENTIAL`**:
   - Training days are numbered (`dayNumber: 1, 2, 3...`).
   - `week.service.ts` inspects the athlete's latest `ExerciseLog` entry to calculate which workout is up next in the cycle, accommodating athletes with irregular work or travel schedules.

### 11.3 Medical Safety Matrix (`src/lib/exercise-safety.ts`)
During client onboarding or profile editing, coaches record medical pain flags:
- `neckPain`, `shoulderPain`, `backPain`, `kneePain`.

When the coach opens the Training Split Builder (`training-split-form.tsx`), the form runs `findConflicts(exercises, clientPainFlags)` against an internal safety rule matrix:

| Pain Flag | High-Risk Exercise Keywords | Suggested Safe Alternatives |
|-----------|----------------------------|-----------------------------|
| **Knee Pain** | Squat, Lunge, Leg Extension, Hack Squat | Box Squat, Romanian Deadlift, Glute Bridge, Leg Curl |
| **Lower Back Pain** | Conventional Deadlift, Barbell Row, Good Morning | Chest-Supported Row, Belt Squat, Dumbbell RDL |
| **Shoulder Pain** | Behind-Neck Press, Barbell Bench Press, Upright Row | Neutral-Grip Dumbbell Press, Floor Press, Incline DB Press |
| **Neck Pain** | Shrugs, Behind-the-Head Lat Pulldown | Low Cable Row, Chest-Supported Shrug, Standard Pulldown |

If conflicts exist, the UI triggers a `SafetyWarningDialog`, highlighting contraindicated movements and offering one-click alternative substitutions before saving.

### 11.4 Workout Execution & Session Logger (`client-portal.service.ts`)
- **Daily View (`/client/workout/today`)**: Displays ordered exercise cards with prescribed targets (sets, reps, target load in kg, rest timer seconds, notes, and video demonstrations).
- **Active Session Mode (`/client/workout/session`)**: A distraction-free mobile screen for execution in the gym:
  - Supports live set logging.
  - Actual values are persisted to `ExerciseLog` with `setData` stored as a structured JSON array:
    ```json
    [
      { "set": 1, "reps": 12, "weightKg": 70, "rpe": 7 },
      { "set": 2, "reps": 10, "weightKg": 75, "rpe": 8 },
      { "set": 3, "reps": 8, "weightKg": 80, "rpe": 9.5 }
    ]
    ```

### 11.5 Client Week Matrix (`BentoWeekMatrix`, `/client/week`)
- **Layout**: summary glass banner (compliance `done/planned` + emerald adherence pill + range label) above an asymmetric bento grid (`1 col mobile → 2 sm → 4 lg`, `transform-gpu`); hero tile double-spans, remaining entries render as day/rest tiles, and tapping any tile opens the `DayDetailSheet` preview drawer (lazy exercise fetch via `getMyDayDetailAction`, no page reload).
- **State-aware Today hero** (visual mapping only — source of truth stays `BoardEntry.done` / `status` / `dateKey` from `getClientWeekBoard`, nothing invented):
  - `TODAY`/`CURRENT` + not done → crimson hero (ring, aura, radial emission, `LIVE` pill, crimson CTA → `/client/workout/session?dayId=`).
  - `TODAY` + done → emerald success hero (emerald aura/ring/emission, `done • today` badge, emerald status block instead of the start CTA).
  - Today is `REST` (FIXED slot whose `dateKey` equals `toDateKey(new Date())`; falls back to first rest slot) → calm highlighted glass (`ring-white/20`, `TODAY • REST` badge), clearly above muted `opacity-60` smoke rest tiles.
  - Hero shows live set progress (actual vs target sets from the day detail); completed/other-done tiles use restrained emerald, upcoming tiles clean glass.
- **`DAY_NAME_ONLY` enforcement** (`Client.workoutDisplayMode`, set by coach in client settings): mode is threaded through `getClientWeekBoard` / `getDayDetail` / `getTodayWorkout` payloads; `getMyDayDetailAction` sanitizes previews to `exercises: []`; bento hero/tiles/sheet and `TodayWorkoutCard` hide counts, set bars, lineups, and start CTAs (sheet shows a day-name-only glass notice); `/workout/today` renders a locked day-name view and `/workout/session` redirects to `/client/week` — execution logging stays fully available in `FULL` mode only. Coach-side `updateClientInfoAction` busts `client:{id}:workout` cache so toggles apply immediately.
- **Files**: `src/components/features/client/week/bento-week-matrix.tsx` (matrix + `GlassSheen` specular helper), `day-detail-sheet.tsx`, `rest-day-card.tsx`. Obsolete `week-board.tsx` / `day-card.tsx` were removed (focus icon/label maps moved into the matrix).

### 11.6 Liquid Glass Workout Split Builder Architecture
The Training Split Builder (`src/components/features/training-split/`) has been completely overhauled with a state-of-the-art **iOS 26 Liquid Glass & Glassmorphism design system** and an ergonomic, high-velocity creation workflow.

```mermaid
flowchart TD
    Hub[SplitStarterHub] -->|1. Presets PPL, UL, FB, Bro| S[State Coordinator: TrainingSplitForm]
    Hub -->|2. Template Preview Drawer| S
    Hub -->|3. Client Split Clone| S
    Hub -->|4. Blank Canvas| S
    
    S --> W[1-Click Visual Weekday Strip]
    S --> DP[Collapsible Day Pods: DaysEditor]
    
    DP --> BP[BatchExercisePicker: 3-Col Grid + Inspector]
    DP --> RE[In-Day Exercise Reordering]
    
    S --> VR[LiveVolumeRadar: Muscle Set Telemetry]
    S --> DOCK[FloatingBuilderDock: Sticky Actions & Stats]
    S --> CONFIRM[GlassConfirmDialog: Zero Work Overwrite]
```

### 11.7 Non-Destructive Split & Template Starter Hub
- **Component (`src/components/features/training-split/split-starter-hub.tsx`)**:
  - Houses 4 distinct starting vectors: Curated Presets (PPL 6-Day, Upper/Lower 4-Day, Full Body 3-Day, Bro Split 5-Day), Coach Templates, Client Clones, and Blank Custom Days.
  - Segmented mode switcher with live counts and collapsible tray for maximum screen conservation.
- **Template Preview Drawer (`template-preview-drawer.tsx`)**:
  - Slide-over sheet allowing coaches to inspect the complete day-by-day lineup, target sets, reps, and exercise notes of any template before deciding to apply it.
- **Safe Switching Protection (`GlassConfirmDialog`)**:
  - Unlike legacy implementations where changing split types or templates silently destroyed coach progress, the engine detects existing exercises (`hasExistingExercises`).
  - If exercises are populated, an animated Liquid Glass confirmation modal (`GlassConfirmDialog`) guards the action, preventing accidental work loss.
  - Completely replaces deprecated browser-blocking `window.confirm()`.

### 11.8 High-Velocity Batch Exercise Catalog & Video Demo Inspector
- **Component (`src/components/features/training-split/batch-exercise-picker.tsx`)**:
  - **Viewport-Filling Modal**: Overrides narrow defaults with `sm:max-w-6xl lg:max-w-7xl w-[96vw] h-[92vh]` in deep frosted Liquid Glass (`bg-neutral-950/95 backdrop-blur-3xl border-white/20`).
  - **Rich Header**: Auto-focused search bar with instant keyword matching across English/Arabic names, equipment, and target muscles.
  - **Muscle Group Filter Bar**: Horizontal scrollable pill strip with live exercise counts and categorical color dots (Chest, Back, Quads, Hamstrings, Glutes, Shoulders, Arms, Core, Cardio).
  - **3-Column Exercise Card Grid**: Interactive glass cards displaying bilingual titles, muscle badges, equipment tags, default volume pills (`3 × 10 · 90s`), and custom checkbox indicators with spring feedback.
  - **Master-Detail Desktop Inspector**:
    - **Video Mode**: Embedded YouTube demonstration player with exercise technique guides and target muscle metadata.
    - **Selected Tray Mode**: Itemized queue selected exercises with one-click deletion and live total planned set counter (`~M Planned Sets`).
  - **Bulk Insertion**: One-click "Add (N) to Day X" instantly inserts all chosen movements with pre-configured default sets and rest timers.

### 11.9 Visual 7-Day Weekday Scheduling Matrix & Auto-Swap
- **Component (`src/components/features/training-split/weekday-strip-selector.tsx`)**:
  - Replaces cumbersome `<Select>` dropdowns on each day card with an interactive horizontal 7-day pill strip (`Sat` through `Fri`).
  - **Smart Duplicate Resolution**: If a coach taps a weekday already claimed by another workout day, the system executes an automated two-way swap, maintaining a conflict-free weekly schedule with zero friction.

### 11.10 Real-Time Weekly Volume Radar & Floating Action Dock
- **Live Volume Radar (`src/components/features/training-split/live-volume-radar.tsx`)**:
  - Real-time client-side telemetry aggregating total planned sets across every muscle group.
  - Renders color-coded badges indicating weekly set volume (e.g., Chest: 14 sets, Back: 16 sets, Legs: 18 sets) to ensure balanced hypertrophy programming.
- **Floating Builder Dock (`src/components/features/training-split/floating-builder-dock.tsx`)**:
  - Pinned floating glass dock at the bottom of the viewport with hairline specular highlight (`GlassSheen`).
  - Houses real-time telemetry metrics (Days count, Total exercises, Safety conflict indicator) and sticky primary Save / Discard buttons, eliminating the need to scroll to the page bottom.
- **Template Form Alignment**:
  - The master template editor (`/training-split-templates/new` and edit) utilizes the identical `DaysEditor`, `LiveVolumeRadar`, and `GlassCard` primitives for unified coach ergonomics.

---

## 12. Nutrition Architecture

The nutrition engine is implemented in `src/server/services/nutrition.service.ts` (34,204 bytes) and `src/components/features/nutrition/`.

### 12.1 Program Structure & Deep-Copy Pipeline
- **`NutritionTemplate`**: Authoring environment for coaches to establish reusable baseline meal plans.
- **Deep-Copy Assignment (`copyTemplateToPlanInTx`)**:
  Assigning a template to one or more athletes invokes `copyTemplateToPlanInTx()`. This creates an isolated `ClientNutritionPlan` with complete copies of all `Meal` records, `MealItem` records, `SupplementDef` entries, and `SubstituteGroup` items.

### 12.2 Alternative Meals Architecture (`isSpare` & `replacesMealId`)
A frequent challenge for Egyptian coaches is prescribing flexible options (e.g., Breakfast Option 1 vs. Breakfast Option 2).

```mermaid
flowchart TD
    subgraph Meal Group: Breakfast
        M1["Breakfast (Main Meal)\n• isSpare = false\n• replacesMealId = null\n• 4 Eggs, 1 Baladi Bread, Salad"]
        A1["Breakfast Alt 1 (Spare)\n• isSpare = true\n• replacesMealId = M1.id\n• 150g Cottage Cheese, 2 Toast"]
        A2["Breakfast Alt 2 (Spare)\n• isSpare = true\n• replacesMealId = M1.id\n• 40g Oats, 1 Scoop Whey, Banana"]
    end

    M1 --- A1
    M1 --- A2

    subgraph Client Selection Behavior
        SEL["Client Toggles Item in Alt 1"] --> DEL["Mutual Exclusivity CTE Executes:\nDELETE MealChoices for M1 & Alt 2\nKEEP choices in Alt 1"]
    end
```

1. **Coach Builder UI (`nutrition-builder.tsx`)**:
   - Every Main Meal exhibits a visible **[+ Add Alternative Meal]** button.
   - Clicking it automatically spawns an alternative meal directly under the parent, with `isSpare = true` and `replacesMealId` mapped to the parent meal.
   - No confusing parent selection dropdowns are required.
2. **Client Portal Experience (`client-nutrition-view.tsx`)**:
   - The athlete views a unified section for "Breakfast".
   - Alternatives are displayed clearly labeled as alternatives.
   - The athlete can select items from **only one meal in the group**.
3. **Mutual Exclusivity Engine (`toggleMealChoiceAction` in `nutrition.service.ts`)**:
   When an athlete checks off an item, a Common Table Expression (CTE) finds all sibling meals in the cluster and clears selections for all other meals in that cluster, while allowing multiple items to be checked off within the chosen meal:
   ```sql
   -- Find all sibling meal IDs in the group (parent and all alternates)
   WITH target_cluster AS (
     SELECT m.id, m.planId, COALESCE(m."replacesMealId", m.id) AS main_id
     FROM "MealItem" mi JOIN "Meal" m ON mi."mealId" = m.id
     WHERE mi.id = $4
   ),
   cluster_meals AS (
     SELECT m2.id
     FROM "Meal" m2, target_cluster tc
     WHERE m2."planId" = tc.planId
       AND (m2.id = tc.main_id OR m2."replacesMealId" = tc.main_id)
   )
   -- Delete choices from all other meals in the group, preserving choices in current meal
   DELETE FROM "MealChoice"
   WHERE "clientId" = $1 AND "date" = $2
     AND "mealItemId" IN (
       SELECT mi.id FROM "MealItem" mi
       JOIN cluster_meals cm ON mi."mealId" = cm.id
       WHERE mi."mealId" != (SELECT "mealId" FROM "MealItem" WHERE "id" = $4)
     );
   ```

### 12.3 Two-Pass UUID Remapping (`insertMealsForPlan`)
When copying a template containing Alternative Meals to a client plan, new database records are generated for all meals. If `replacesMealId` copied the old template meal ID, it would create broken relational foreign keys.

To prevent orphan relationships, `insertMealsForPlan()` executes a **Two-Pass Algorithm**:
```typescript
// Pass 1: Generate new IDs for all meals and populate a translation map
const idMap = new Map<string, string>();
for (const meal of templateMeals) {
  const newMealId = generateId();
  idMap.set(meal.id, newMealId);
}

// Pass 2: Insert meals, translating replacesMealId to the new copied parent ID
for (const meal of templateMeals) {
  const newMealId = idMap.get(meal.id)!;
  const newReplacesMealId = meal.replacesMealId 
    ? (idMap.get(meal.replacesMealId) ?? null) 
    : null;

  await tx.query(
    `INSERT INTO "Meal" ("id", "planId", "kind", "order", "name", "nameAr", "isSpare", "replacesMealId")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [newMealId, planId, meal.kind, meal.order, meal.name, meal.nameAr, meal.isSpare, newReplacesMealId]
  );
  // Insert associated MealItems for this meal...
}
```

### 12.4 Decommissioning & Schema Removal of Option Groups
Historical versions of CoachFlow utilized an item-level "Option Groups" feature (`MealItem.groupNumber`) which caused confusion alongside the whole-meal Alternative Meals system. This legacy attribute has been fully removed from the codebase and database:
- **Database Migration**: Executed migration `20260914100000_drop_meal_item_group_number` dropping the `groupNumber` column from `MealItem`.
- **Codebase Cleanup**: Removed `groupNumber` across the nutrition builder UI (`src/components/features/nutrition/nutrition-builder.tsx`), client meal detail drawer (`src/components/features/nutrition/client/meal-detail-drawer.tsx`), server action schemas (`src/lib/validations/nutrition.ts`), and database service insertion/update queries.


---

## 13. Progress & Analytics

The progress analytics pipeline is implemented in `src/server/services/body-composition.service.ts`, `src/server/services/progress.service.ts`, and `src/server/services/media.service.ts`.

### 13.1 InBody & Body Composition Tracking
- **Entity**: `BodyComposition` provides an append-only longitudinal time-series of physical metrics.
- **Tracked Parameters**:
  - `weightKg`, `muscleMassKg`, `bodyFatKg`, `bodyWaterPct`, `fatControlKg`
  - Metabolic indicators: `bmrKcal` (Basal Metabolic Rate), `fitnessScore`
  - Health risk indicators: `waistHipRatio`, `visceralFatLevel` (1–20 scale)
- **Data Source Scoping**: Tagged as `COACH` (professional clinic scan entry) or `CLIENT` (home scale entry).
- **Delta Analysis**: The UI automatically computes delta metrics (Δ kg weight, Δ kg muscle, Δ% body fat) between the latest two entries, coloring progress green (hypertrophy or fat loss) or red (adverse trends).

### 13.2 Strength Progression Analytics
- **`getCachedStrengthSeries(clientId)`**: Evaluates historical `ExerciseLog` data to identify an athlete's estimated 1RM and peak weight load across key compound movements (Bench Press, Squat, Deadlift, Overhead Press).
- **Chart Optimization**: Rendered via `ChartsClient` using Recharts. Bundled as dynamic imports (`WeightProgressChartLazy`) with skeleton fallbacks to preserve fast first-contentful-paint (FCP) metrics.

### 13.3 Progress Media Review Lifecycle (`media.service.ts`)

```mermaid
stateDiagram-v2
    [*] --> PENDING: Client uploads photo or form video
    PENDING --> REVIEWED: Coach inspects media & submits written feedback
    PENDING --> [*]: Client deletes media
    REVIEWED --> [*]: Preserved in athlete timeline
```

1. **Submission**: Athlete uploads physique progress photos or movement execution videos (`ProgressMediaType`: `PROGRESS_PHOTO`, `FORM_VIDEO`, `OTHER`). Record is created with `status = 'PENDING'`.
2. **Notification Hook**: Dispatches `notifySafe()` generating a `MEDIA_SUBMITTED` alert to the coach.
3. **Coach Evaluation (`reviewMediaAction`)**: Coach opens the media viewer, records technical critiques in `feedback`, and updates status to `'REVIEWED'` with timestamp and reviewer ID.
4. **Performance Safeguard**: `listMediaForClient()` intentionally overrides `storageUrl` in list queries (`LEFT("storageUrl", 0) AS "storageUrl"`), fetching high-resolution media payloads only when an athlete or coach explicitly clicks into an item.

---

## 14. Goals System

The goals subsystem is implemented in `src/server/services/goal.service.ts` and `src/lib/goals.ts`.

### 14.1 Goal Types & Lifecycle
Coaches define targeted milestones for athletes:
- **`GoalType`**: `WEIGHT`, `BODY_FAT`, `MUSCLE`, `MEASUREMENT`, `STRENGTH`, `CUSTOM`.
- **Status Progression**: `ACTIVE` → `ACHIEVED` | `PAUSED` | `CANCELLED`.
- **Audit Preservation**: Historical goals are never deleted upon achieving a target; they transition status to maintain a permanent motivational record.

### 14.2 Automated InBody Synchronization
For biometric goals, CoachFlow eliminates manual progress logging by synchronizing directly with the `BodyComposition` table:
```typescript
function resolveGoal(goal: ClientGoal, inbody: InBodyLatest): GoalWithProgress {
  let resolvedCurrent = goal.currentValue;
  let autoSynced = false;

  if (goal.type === "WEIGHT" && inbody?.weightKg != null) {
    resolvedCurrent = inbody.weightKg;
    autoSynced = true;
  } else if (goal.type === "BODY_FAT" && inbody?.bodyFatKg != null) {
    resolvedCurrent = inbody.bodyFatKg;
    autoSynced = true;
  } else if (goal.type === "MUSCLE" && inbody?.muscleMassKg != null) {
    resolvedCurrent = inbody.muscleMassKg;
    autoSynced = true;
  }

  return {
    ...goal,
    resolvedCurrent,
    progress: goalProgress(goal.startValue, resolvedCurrent, goal.targetValue),
    autoSynced,
  };
}
```

### 14.3 Direction-Aware Progress Mathematics (`src/lib/goals.ts`)
The `goalProgress()` function dynamically computes completion percentage based on whether the target represents an increase or decrease:
- **Weight Loss / Fat Loss** (`start > target`):
  $$\text{Progress} = \frac{\text{start} - \text{current}}{\text{start} - \text{target}} \times 100$$
- **Muscle Building / Strength** (`target > start`):
  $$\text{Progress} = \frac{\text{current} - \text{start}}{\text{target} - \text{start}} \times 100$$
- Results are clamped between 0% and 100% to handle overshoot or regression cleanly.

---

## 15. Daily Check-in & Streak System

The wellness check-in system is governed by `src/server/services/checkin.service.ts` and `src/lib/checkin.ts`.

### 15.1 Daily Deduplication Guarantee
The underlying storage model `DailyLog` enforces calendar-day uniqueness at the database level:
- Constraint: `@@unique([clientId, date])` where `date` is a PostgreSQL `@db.Date` type (UTC midnight).
- It is physically impossible for an athlete to insert multiple conflicting check-ins for the same day.
- `saveCheckin(clientId, input)` performs an atomic upsert: updating energy, sleep, and mood while leaving existing weight or nutrition compliance flags intact.

### 15.2 Streak Calculation Engine (`src/lib/checkin.ts`)
A day qualifies toward an athlete's streak if the `DailyLog` row meets the `isCheckInRow()` predicate:
$$\text{Qualifies} \iff \text{energyLevel} \neq \text{null} \lor \text{sleepHours} \neq \text{null} \lor \text{moodLevel} \neq \text{null} \lor (\text{notes} \neq \text{null} \land \text{notes} \neq \text{''})$$

- **Algorithm**: `calcStreak(dayKeys, todayKey)` inspects the last 400 daily log records, sorting dates descending. It traverses backward from today (or yesterday, if today's check-in is still pending) and counts unbroken consecutive days.
- **Milestone Burst**: Reaching streak milestones (3, 7, 14, 30, 60, 90, 365 days) triggers `CelebrationBurst` particle animations and displays tailored Egyptian motivational quotes.

### 15.3 Batched Coach Overview (`getCoachCheckinOverview`)
To display who checked in today on the coach dashboard without suffering from N+1 query bottlenecks:
1. Query 1: Retrieves all `ACTIVE` client IDs for the coach.
2. Query 2: Executes a single `GROUP BY` query:
   ```sql
   SELECT "clientId", MAX("date") AS "lastDate"
   FROM "DailyLog"
   WHERE "clientId" = ANY($1)
     AND ("energyLevel" IS NOT NULL OR "sleepHours" IS NOT NULL OR "moodLevel" IS NOT NULL OR "notes" != '')
   GROUP BY "clientId";
   ```
3. In-memory partitioning sorts athletes into `checkedInToday[]` and `missing[]` in $O(N)$ time.

---

## 16. Subscription & Payment Architecture

The commercial subscription architecture is implemented in `src/server/services/subscription.service.ts` and `src/server/services/payment-proof.service.ts`.

### 16.1 The Egyptian Coaching Model
CoachFlow implements package structures matching Egyptian business realities:
- **`PERIOD` Packages**: Time-bound coaching (1 month, 3 months, 6 months). Enforces automated expiration based on calendar days.
- **`SESSIONS` Packages**: PT bundles (e.g., 12 in-person sessions). Tracks `sessionsCount` and `remainingSessions`. Coaches decrement sessions via `consumeOneSessionAction()`.

### 16.2 Subscription Lifecycle States

```mermaid
stateDiagram-v2
    [*] --> NONE: Client Invited
    NONE --> ACTIVE: Coach Assigns Plan
    ACTIVE --> TRIAL: Promotional Period
    TRIAL --> ACTIVE: Payment Confirmed
    ACTIVE --> PAUSED: Medical / Travel Pause
    PAUSED --> ACTIVE: Resumed by Coach
    ACTIVE --> EXPIRED: Automated Expiry (endDate < today)
    EXPIRED --> ACTIVE: Package Renewal
```

### 16.3 Payment Verification Workflow (No Card Gateway)
1. **Receipt Submission**: Client uploads a transaction screenshot (`proofUrl`) after transferring funds via Instapay or Vodafone Cash, specifying amount and notes. Record created in `PaymentProof` as `status = 'PENDING'`.
2. **Coach Alert**: Triggers a high-priority item in the coach's `NeedsAction` feed and sends a `PAYMENT_PROOF_PENDING` notification.
3. **Review Action (`reviewPaymentProofAction`)**:
   - **`APPROVED`**: Automatically updates associated `Subscription.paymentStatus = 'PAID'` and notifies athlete.
   - **`REJECTED`**: Prompts athlete to resubmit with coach notes.

### 16.4 Serverless Automation Engine (`src/server/automation/jobs.ts`)
Automated subscription management runs via Vercel Cron pinging `POST /api/automation/run`.

```mermaid
flowchart TD
    CRON[Vercel Cron: POST /api/automation/run] --> LOCK{pg_try_advisory_xact_lock}
    LOCK -- Busy --> EXIT[Exit with locked: true]
    LOCK -- Acquired --> TX[Execute Automation Transaction]
    
    subgraph Jobs Inside Transaction
        TX --> J1[1. Expire Overdue PERIOD Subscriptions]
        J1 --> N1[Send Expiry Alerts to Client & Coach]
        TX --> J2[2. Milestones: T-7, T-3, T-1 Reminders]
        TX --> J3[3. Same-Day T-0 Expiration Notices]
        TX --> J4[4. Inactivity & Check-in Reminders]
    end
    
    J1 & J2 & J3 & J4 --> DEDUPE[dedupeKey ON CONFLICT DO NOTHING]
    DEDUPE --> COMMIT[Commit Transaction & Release Lock]
```

- **Advisory Transaction Lock**: Executes `SELECT pg_try_advisory_xact_lock(hashtext('coachflow-automation-v1'))`. If a concurrent instance is running, it aborts instantly without duplicate job execution.
- **Idempotent Reminders**: Each reminder generates a unique `dedupeKey` (e.g., `sub:cuid123:c:expiring:7d`). If the cron job re-runs, Postgres skips existing inserts.
- **Milestone Timeline**:
  - **T-7 Days**: Client notification (`SUBSCRIPTION_EXPIRING`).
  - **T-3 Days**: Client and Coach notification (`SUBSCRIPTION_EXPIRING`).
  - **T-1 Day**: Urgent client reminder (`SUBSCRIPTION_EXPIRING`).
  - **T-0 (Expiry)**: Flipped to `EXPIRED`; both parties receive status update notices.

---

## 17. Notifications Architecture

The notification engine is implemented in `src/server/services/notification.service.ts` and `src/components/features/notifications/`.

### 17.1 Comprehensive Notification Event Matrix

| Event Trigger | Notification Type | Recipient | Action Link |
|---------------|-------------------|-----------|-------------|
| New direct message sent | `NEW_MESSAGE` | Other Party | `/messages/[clientId]` or `/client/messages` |
| Nutrition plan assigned or updated | `PLAN_UPDATED` | Client | `/client/nutrition` |
| Workout split assigned or updated | `PLAN_UPDATED` | Client | `/client/workout/today` |
| Progress media reviewed with feedback | `COACH_FEEDBACK` | Client | `/client/media` |
| Progress media submitted for review | `MEDIA_SUBMITTED` | Coach | `/clients/[id]?tab=progress` |
| InBody composition scan recorded | `PROGRESS_UPDATE` | Client | `/client/profile` |
| Daily check-in submitted | `CHECKIN_ACTIVITY` | Coach | `/clients/[id]?tab=checkin` |
| Workout logged by client | `CLIENT_ACTIVITY` | Coach | `/clients/[id]?tab=workout` |
| Payment proof uploaded | `PAYMENT_PROOF_PENDING`| Coach | `/clients/[id]?tab=subscription` |
| Subscription ends in 7, 3, or 1 days | `SUBSCRIPTION_EXPIRING`| Client & Coach | Profile / Subscription tab |
| Subscription reaches expiration date | `SUBSCRIPTION_STATUS` | Client & Coach | Profile / Subscription tab |
| Daily automated workout prompt | `WORKOUT_REMINDER` | Client | `/client/workout/today` |
| Daily automated check-in prompt | `CHECKIN_REMINDER` | Client | `/client/home` |
| Athlete inactive for ≥ 5 days | `CLIENT_INACTIVE` | Coach | `/clients/[id]` |

### 17.2 Internationalized In-App Architecture (i18n on Read)
To support multi-lingual users and dynamic locale switching, notification records do not store pre-rendered text strings. Instead, the database stores:
- `titleKey`: Key under `notifications.items.*` (e.g., `planUpdatedTitle`).
- `bodyKey`: Key under `notifications.items.*` (e.g., `planUpdatedBody`).
- `params`: JSON dictionary containing variables (`{ "coach": "Capt. Mohamed", "plan": "@plan.nutrition" }`).
When rendered in `NotificationList`, keys are translated dynamically according to the viewer's current locale.

### 17.3 Cursor-Based Pagination
Pagination avoids high-offset database scanning:
```sql
SELECT * FROM "Notification"
WHERE "userId" = $1 AND ("createdAt", "id") < ($2, $3)
ORDER BY "createdAt" DESC, "id" DESC
LIMIT 21;
```
The cursor encodes `${createdAt.toISOString()}|${id}`, ensuring deterministic paging even during active notification inserts.


---

## 18. Messaging & Real-Time Architecture

The communication system is implemented in `src/server/services/message.service.ts` (17,102 bytes), `src/server/realtime/message-bus.ts`, and `src/components/features/messages/chat-thread.tsx`.

### 18.1 Conversation Data Model
- **`Conversation`**: Maintains a 1-to-1 relationship between coach and athlete enforced by `@@unique([trainerId, clientId])`.
- **Summary Caching**: Tracks `lastMessageAt` and `lastMessagePreview` on the conversation row, allowing the conversation drawer to render instant lists without expensive subquery joins.
- **`Message`**: Stores `senderId`, `senderRole` (`COACH` or `CLIENT`), `body` (text), and `readAt` (nullable timestamp indicating read status).

### 18.2 Hybrid Real-Time Architecture: SSE + Polling Fallback

```mermaid
sequenceDiagram
    autonumber
    actor Sender
    actor Receiver
    participant UI as ChatThread Component
    participant Action as sendMessageAction
    participant DB as Postgres DB
    participant Bus as message-bus.ts (Redis Pub/Sub / Memory Fallback)
    participant SSE as /api/messages/stream (SSE Route)

    Receiver->>SSE: EventSource connects to /api/messages/stream?conversationId=...
    SSE->>Bus: subscribe(conversationId, listener)
    loop Every 25 seconds
        SSE-->>Receiver: :heartbeat comment (keeps TCP socket open)
    end

    Sender->>UI: Types message and presses Send
    UI->>UI: Injects optimistic message { id: "temp-*", pending: true }
    UI->>Action: Invokes sendMessageAction({ conversationId, body })
    Action->>DB: INSERT Message + UPDATE Conversation(lastMessageAt)
    Action->>Bus: publish(conversationId, messageData)
    Action-->>UI: Returns confirmed { ok: true, message }
    UI->>UI: Replaces temp ID with persistent CUID

    alt Receiver is on the SAME or DIFFERENT Serverless Instance (Redis Connected)
        Bus-->>SSE: Redis Pub/Sub distributes messageData to SSE listener across instances
        SSE-->>Receiver: event: message\ndata: {...}
        Receiver->>Receiver: Appends message to chat thread
    else Standalone / Local Memory Fallback (REDIS_URL unset)
        Bus-->>SSE: Local EventEmitter dispatches if on same instance
        Receiver->>Receiver: Adaptive polling (3s active / 10s idle) retrieves from DB
        Receiver->>DB: GET /api/messages?conversationId=...&cursor=...
        Receiver->>Receiver: Deduplicates via seen Set and appends message
    end
```

### 18.3 Distributed Pub/Sub & Serverless Safeguards
1. **Multi-Instance Redis Pub/Sub (`src/server/realtime/message-bus.ts`)**:
   - Upgraded using `ioredis` to listen on channel `conversation:{id}`.
   - Reference-counted channel management: only one Redis `SUBSCRIBE` command is issued per channel across all local SSE listeners on the instance. When all listeners disconnect, `UNSUBSCRIBE` is invoked to release server resources.
   - **Zero-Config Memory Fallback**: If `REDIS_URL` is omitted, the bus safely defaults to a local in-memory `EventEmitter`, ensuring uninterrupted operation during local development.
2. **Resilience & Dual-Engine Defenses**:
   - **Heartbeat Protection**: The SSE route transmits `:heartbeat\n\n` comments every 25 seconds to prevent intermediate proxy gateways and CDNs from terminating idle TCP sockets.
   - **Adaptive Polling Fallback**: `ChatThread` runs an active polling loop (3s when focused, 10s in background) with automatic visibility triggers.
   - **Deduplication**: `ChatThread` maintains a `seen = new Set<string>()` and a `Map<string, UIMessage>()`, reconciling messages from SSE and polling without UI flickering.

### 18.4 Direct Indexed Unread Counters (`message.service.ts`)
Previously, unread counts relied on process-memory caches (`unreadTrainerCache` and `unreadClientCache`) with a 10-second TTL. This caused badge counts to drift between serverless instances.
- **Resolution**: In-memory caches were deprecated and removed.
- **High-Performance Query**: Unread message counts are computed directly using indexed PostgreSQL queries (`COUNT(*) FILTER (WHERE "senderRole" = 'CLIENT' AND "readAt" IS NULL)`), utilizing the existing compound index `@@index([conversationId, createdAt])`.
- **Zero Cache Drift**: All serverless instances immediately reflect consistent, live unread counts upon message submission or read receipts.

---

## 19. File Upload & Media Architecture

### 19.1 Cloud Object Storage & Hybrid Fallback
CoachFlow features a hybrid media storage architecture supporting **Cloudflare R2 / Amazon S3** via `src/lib/storage.ts` while retaining zero-configuration PostgreSQL binary storage as a fallback.

| Media Category | Primary Storage (Configured) | Fallback Destination | Security & Delivery |
|----------------|-----------------------------|----------------------|---------------------|
| **Coach Branding Logo** | Cloudflare R2 / S3 CDN URL | PostgreSQL `CoachLogoFile.bytes` (BYTEA) | Served via `/api/coach-logo/[coachId]` (versioned `?v=`, immutable 1y cache) |
| **Blog Transformation Images** | Cloudflare R2 / S3 CDN URL | PostgreSQL `PostImageFile.bytes` (BYTEA) | Served via `/api/post-image/[id]` |
| **Progress Photos & Form Videos** | Cloudflare R2 / S3 Presigned URL | Direct Data URI / Storage URL | Inspected by Coach with structured feedback |
| **Payment Receipts (Vodafone/Instapay)**| Cloudflare R2 / S3 Presigned URL | Direct Data URI / Storage URL | Inspected by Coach in Subscription tab |
| **Weekly Check-in Photos** | Cloudflare R2 / S3 CDN URL | Standard URL string | Rendered in progress review gallery |

- **Storage Abstraction (`src/lib/storage.ts`)**: Exposes `uploadBufferToStorage()`, `getPresignedDownloadUrl()`, `getPresignedUploadUrl()`, and `deleteFromStorage()` using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
- **Migration Pipeline (`scripts/migrate-media-to-storage.ts`)**: A one-time executable script that scans `CoachLogoFile` and `PostImageFile`, uploads the binary payloads into R2/S3, and updates database records with public CDN URLs to shrink database bloat.

### 19.2 Server-Side Image Processing Pipeline (`src/lib/logo-image.ts`)
To prevent arbitrary file uploads, malicious scripts, and database bloat:
1. **Magic Byte Inspection**: The server reads the first 16 bytes of the binary buffer (`sniffLogo`, `sniffImage`) to verify genuine file signatures:
   - PNG: `89 50 4E 47 0D 0A 1A 0A`
   - JPEG: `FF D8 FF`
   - WebP: `52 49 46 46 ... 57 45 42 50`
   Client-provided MIME headers are strictly ignored.
2. **Sharp WebP Pipeline**: Validated images are processed using `sharp`:
   - EXIF auto-orient (`.rotate()` with no args): phone photos are stored unrotated with an orientation flag that `<img>` honors but raw pipelines don't — without this the stored file comes out sideways vs. the editor preview (verified: 100×50 px + orientation 6 stored as 100×50 instead of the displayed 50×100).
   - Converted to `image/webp`.
   - Stripped of EXIF metadata.
   - Scaled and compressed to maintain minimal database storage footprints (logos ≤512px, quality 75; blog ≤1280px, quality 80).
3. **Payload Streaming**: Dedicated API routes (`/api/coach-logo/[coachId]`) read bytes directly from Postgres and set `Content-Type: image/webp` with HTTP caching headers:
   `Cache-Control: public, max-age=31536000, immutable`. Logo URLs are versioned (`?v=<Date.now()>` written on every upload), so the immutable cache is always busted on change.

---

## 20. Branding System

The multi-tenant branding engine is implemented in `src/server/services/branding.service.ts` and `src/components/brand/brand-logo.tsx`.

### 20.1 Customization Parameters
Every coach can personalize their portal experience:
- **Brand Name**: Displayed in navigation headers and the client home hero (default: `"Coach Flow"`).
- **Primary Brand Color**: Hex color code overriding platform accents (default: `"#961112"`).
- **Custom Logo**: Uploaded via settings, converted to WebP, and displayed across athlete and coach headers.

### 20.2 Anti-XSS Sanitization Engine
Allowing user-submitted colors and logo URLs poses Cross-Site Scripting (XSS) risks. `branding.service.ts` enforces strict validation rules:
- **Hex Color Verification**: Matches `HEX_COLOR_RE = /^#([0-9A-Fa-f]{6})$/`. Any input containing invalid characters is rejected with `INVALID_COLOR`.
- **CSS Injection Defense**: Any input containing `url(`, `javascript:`, `<style`, or `expression(` is rejected via `FORBIDDEN_RE`.
- **Data URL Length Capping**: Base64 data URLs must match `DATA_IMAGE_RE` and are capped at `DATA_URL_MAX_LEN = 3,500,000` bytes to prevent buffer overflow attacks.

### 20.3 Dynamic Runtime Propagation
1. The coach portal layout (`src/app/(trainer)/layout.tsx`) invokes `getCoachBranding(trainerId)`.
2. The resolved hex code is injected into the root layout container as an inline CSS custom property:
   ```tsx
   <div style={{ "--primary": effectiveBranding.primaryColor } as React.CSSProperties}>
     {children}
   </div>
   ```
3. All Tailwind elements referencing `bg-primary`, `text-primary`, `border-primary`, or gradient overlays (`from-primary to-brand-600`) dynamically reflect the coach's bespoke brand identity.
4. **Resilience**: If the database is unreachable, `getCoachBranding()` catches the error and returns `DEFAULT_BRANDING`, ensuring layout rendering never fails.

### 20.4 Coach Self-Service Branding Actions (`src/server/actions/branding.ts`)

Logo/branding writes were previously `SUPER_ADMIN`-only, so coaches could not change their logo from Settings. Coaches now have tenant-isolated actions that reuse the same storage pipeline, scoped to their own `trainerProfileId` (a non-COACH session gets `UNAUTHORIZED`, so branding can never leak across coaches):

- `coachUploadLogoAction(formData)` — raw raster upload (SVG included).
- `coachUploadCroppedLogoAction(dataUrl)` — saves the editor's canvas-cropped square WebP.
- `coachUpdateBrandingAction({ brandName, primaryColor, ... })` — identity fields only.
- `coachRemoveLogoAction()` — deletes the `CoachLogoFile` row and clears `logoUrl`.

`storeCoachLogoFile()` is the shared core: size cap → magic-byte sniff → `convertLogoToWebp()` → `INSERT … ON CONFLICT ("coachId") DO UPDATE` on `CoachLogoFile` → writes a versioned `logoUrl` (`/api/coach-logo/<coachId>?v=<Date.now()>`) → `revalidatePath()` on `/dashboard`, `/settings`, `/subscription`, `/client` layouts → returns the fresh `BrandingPayload` for optimistic UI.

**Partial-upsert contract** (`upsertBrandingFields`): only the provided keys are ever referenced in SQL — both `UPDATE` (dynamic `SET`) and `INSERT` (dynamic column list). This is load-bearing: the production table has no social columns (see §20.7), so a logo-only first save must not mention them (previously the hardcoded 8-column `INSERT` crashed with `42703`).

### 20.5 Live Synchronization (no duplicate providers)

There is exactly one `BrandingProvider` (`src/components/branding/branding-provider.tsx`); every layout (trainer, client portal/session, join, invite, subscription) seeds it per-request via `getCoachBranding()` + `toBranding()`. A save propagates two ways:

1. **Immediate (same tab):** the action response's `branding` is dispatched as a `branding:updated` window event (`notifyBrandingUpdated()`). The provider applies it via `setLive()` after a `coachId` isolation check, so topnav, sidebar, dashboards, and the Settings preview update with no refresh. Server-driven prop changes are adopted via render-time state adjustment (no sync effects).
2. **Durable (reload/login/logout):** layout `revalidatePath()` calls plus per-request layout fetches (no branding cache anywhere) make the new logo the server-rendered truth on next load. `BrandLogo` keys its `<img>` by URL and ties load-error state to the failing URL, so a new upload always remounts and recovers.

Fallback rule: `/brand/logo.png` renders only when `logoUrl` is null (auth pages, logged-out/public-invalid states, coaches without a custom logo).

### 20.6 Logo Editor (`src/components/features/settings/logo-editor.tsx`, `branding-section.tsx`)

Zero-dependency, Facebook-profile-picture-style editor. Controls: drag-to-reposition (pointer events, touch + mouse), precise zoom 1–4× (slider, ± buttons, mouse-wheel about cursor, double-click toggle, % readout, fit button), rotation (±90° buttons + −180°…180° slider with ° readout), horizontal/vertical flip, one-click reset, and keyboard nudging (arrows, `+`/`−`, `0`). A circular preview replicates the `rounded-full` display treatment.

Placement math guarantees full coverage at any rotation: the wrapper center is clamped in the rotated orthonormal frame where the feasible set is two intervals, and minimum zoom auto-rises with rotation (e.g. a square image at 45° requires 2×). Verified by a 760-case sweep (shapes × angles × zooms × extreme drags, corners-inside-image check). Save reproduces the exact visible transform on canvas (`translate` to wrapper center → `rotate` → `flip` → centered `drawImage`, matching CSS `transform-origin: center`), so stored bytes equal the preview pixel-for-pixel.

EXIF orientation is normalized at pick time (`createImageBitmap(file, { imageOrientation: "from-image" })` → canvas → blob URL, with raw-file fallback), so the editor's preview, natural dimensions, cover math, and crop all operate on the pixels the user sees.

Edit-in-place: the pencil button opens the dialog with `initialImageUrl` (existing logo, `fetch` → blob so canvas never taints) instead of the file picker; a "Change image" ghost button swaps in a different file (dialog remounts fresh). The dialog is reusable via `uploadAction`/`editorTitle`/`savedToast` props (defaults preserve logo behavior) — the coach photo flow reuses it unchanged.

### 20.7 Schema Divergence — RESOLVED (migration `20260912140000_coach_branding_socials`)

`schema.prisma` declared `CoachBranding.whatsappUrl/facebookUrl/instagramUrl`, but no migration had created them, so any `INSERT`/`UPDATE` mentioning them failed with `42703`. Resolved by applying that migration (dev DB verified via `information_schema`); the partial-upsert contract (§20.4) is retained as defense. **Production (`restless-king` per `.env`) still needs `prisma migrate deploy` with the production `DATABASE_URL`.**

Social links are now fully wired: coach self-service inputs in Settings (§20.4), header icons beside the notification bell, and a `CoachSocialFooter` at the bottom of client portal pages. Normalization lives in `src/lib/validations/branding.ts` (Egyptian mobile → `wa.me`, `@handle` → profile URL) and is enforced server-side in `sanitizeBranding`.

### 20.8 Coach Personal Photo (avatar, distinct from logo)

- **Storage**: `TrainerProfile.avatarUrl` (versioned `/api/coach-avatar/<coachId>?v=` URL) + `CoachAvatarFile` bytes table (migration `20260912150000_coach_avatar_photo`; named Prisma relations `CoachLogo`/`CoachAvatar` disambiguate the two files pointing at `TrainerProfile`). Served by `src/app/api/coach-avatar/[coachId]/route.ts` with immutable caching.
- **Actions** (`src/server/actions/branding.ts`): `coachUploadAvatarAction`, `coachUploadAvatarCroppedAction`, `coachRemoveAvatarAction` — same WebP pipeline and revalidation as logos.
- **Read path**: `getCoachBranding()` resolves `avatarUrl` into `effective`, carried through `BrandingPayload` → `BrandingProvider`, so every layout (coach, client, public) receives it with no signature changes.
- **Settings**: dedicated `CoachPhotoSection` (photo/initials display, edit-in-place, remove) reusing `LogoEditorDialog` via its override props; shared EXIF helper `normalize-picked-image.ts`.
- **Display rule**: the avatar feeds the client home hero only; brand-mark slots (`BrandLogo`, headers) never fall back to it and vice versa.

### 20.9 Client Home Hero & Welcome Ticker

- **Hero** (`src/components/features/client/coach-hero-section.tsx`): full-bleed banner (`h-[360px] md:h-[440px]`, negative margins bleeding both padded portal containers) rendering the coach **avatar** via `next/image fill priority unoptimized` (`unoptimized` is required — versioned `?v=` URLs fail the default loader's `localPatterns` check). Single bottom-edge fade (`from-black/85 via-black/20`) so the mid-body stays visible; no status badge, no identity text overlay. Bottom-end dock holds three vertical glass pills: daily-tip dialog (latest post), `/client/nutrition#substitutes` deep link (`useRouter`; anchor with `scroll-mt-24` on the substitutes card), and `/client/messages` chat. Replaced the old `GreetingCard` + `CoachHeroShowcase` card (both deleted).
- **Ticker** (`src/components/layout/welcome-ticker.tsx`): sticky strip pinned inside `AppTopNav` via an optional `ticker` slot (no fragile `top-[header-height]` offsets). Direction-aware marquee (`marquee-ltr/rtl` keyframes + `animate-marquee` utility in `globals.css`, hover-pause, `prefers-reduced-motion` off-switch) cycling four Lucide-icon glass pills — greeting (`Sparkles` + `Dumbbell`), streak (`Flame` + `Trophy`, crimson glass), hydration (`Droplets` + `Target` + `Apple`, cyan glass), date (`CalendarDays` + `Clock`) — with zero raw Unicode emojis (AR + EN variants). Data (client name + `getCheckinStatus` streak) resolved in the client portal layout; `waterLiters` is an optional prop fed best-effort from the cached active nutrition plan, falling back to `3L`.
- **Header notes**: Messages entry points were removed from `AppTopNav` (routes still exist); profile dropdown is desktop-only (`hidden md:flex`); header/bell/social buttons use the liquid-glass capsule treatment. Social capsules carry official platform colors (WhatsApp `#25D366`, Facebook `#1877F2`, Instagram `#E1306C` — icon + tinted glass bg/border + matching glow; gated on configured `*Url`, `target="_blank rel=noopener"`); the notification bell stays neutral. `ClientBottomNav` is defined but currently unmounted anywhere.

---

## 21. Internationalization (i18n)

The internationalization infrastructure resides in `src/lib/i18n/`.

### 21.1 Core Configuration
- **Default Locale**: **`ar`** (Egyptian Arabic).
- **Supported Locales**: `ar`, `en`.
- **Direction**: `dirForLocale(locale)` outputs `'rtl'` for Arabic and `'ltr'` for English.
- **Persistence**: Stored in a browser cookie named `locale`. Middleware initializes missing cookies to `ar`.

### 21.2 Typography & Font Orchestration
The root layout (`src/app/layout.tsx`) configures two specialized Google Font families:
- **Alexandria**: Specifically selected for Egyptian Arabic fitness copy, offering clean geometric legibility across headings, buttons, and badges.
- **Geist**: For Latin alphanumeric characters, code identifiers, and English text.
- High-readability Arabic rules applied via `globals.css`:
  ```css
  html:lang(ar) {
    line-height: 1.7;
  }
  ```

### 21.3 Localized Fitness Terminology
The dictionary in `src/lib/i18n/messages/ar.ts` uses authentic Egyptian gym terminology:
- **الرئيسية** (Home)
- **عملائي** (My Athletes / Clients)
- **المتابعة** (Check-ins & Follow-ups)
- **التمرين** (Workout Routine)
- **التغذية** (Nutrition & Diet)
- **التقدم** (Progress & InBody)
- **الباقة** (Package / Subscription)
- **البدائل** (Substitutions & Alternatives)

### 21.4 RTL Layout Adjustments
- Directional CSS classes: `rtl:-scale-x-100` to mirror directional icons (back buttons, arrows).
- Data isolation: Phone numbers and numerical inputs enforce `tabular-nums dir="ltr"` to prevent inverted Egyptian phone number rendering.

---

## 22. Caching & Performance

The caching architecture is managed via `src/lib/cache.ts` and localized in-memory stores.

### 22.1 Multi-Tier Caching Topology

| Cache Layer | Mechanism | TTL | Scope | Invalidation Trigger |
|-------------|-----------|-----|-------|----------------------|
| **Coach Dashboard KPIs** | Next.js `unstable_cache` | 300 seconds | `trainer:[id]:dashboard` | Invocation of `invalidateDashboard(trainerId)` via `updateTag` |
| **Unread Message Count** | Direct Indexed SQL Query | Real-time | Database-wide | Instant consistency on message insert or read marker |
| **Auth JWT Lookups** | In-Memory `Map` | 60 seconds | Process Memory | Expired by TTL |
| **Strength Series Analytics** | Next.js `unstable_cache` + Read Replica | 3600 seconds | `client:[id]:strength` | Invalidated on `saveExerciseLogAction` |

### 22.2 Performance Optimizations Implemented
1. **SQL Aggregation vs. N+1 Loops**:
   - The trainer dashboard combines multiple metric counts into a single SQL query using `COUNT(*) FILTER (WHERE ...)`.
   - The coach check-in overview uses a single `GROUP BY clientId` query instead of querying each athlete's latest log in a loop.
2. **Defensive Error Boundaries & `allSettled`**:
   `client-profile.service.ts` retrieves body composition, subscriptions, and training splits using `Promise.allSettled`. If a cold-start timeout occurs on one sub-query, the remaining sections render cleanly while the failed section displays a non-blocking degraded state.
3. **Read/Write Replica Splitting**:
   Heavy analytical reporting (`getAdminDashboardStats`, InBody composition analysis, and `getCachedStrengthSeries`) queries the Neon Read Replica via `replicaQuery` in `src/lib/db.ts`, preserving connection pool capacity on the primary database for mutations.
4. **Lazy-Loaded Heavy Visualizations & Builders**:
   - Recharts visualization components are isolated behind `next/dynamic` (`ssr: false`).
   - Heavy administrative and authoring forms (`TrainingSplitForm` in training split pages and `BlogPostForm` in blog publishing) are lazily loaded with skeleton fallbacks, keeping initial route bundles minimal.
5. **Connection Pool Instrumentation**:
   `withDbRetry` captures query execution timings, logs retry durations, and increments failure counters accessible via `getDbMetrics()`.

### 22.3 Architectural Scaling Controls
- **Cross-Instance Synchronization**: Redis Pub/Sub ensures real-time SSE events propagate across serverless instances without partition discrepancies. Unread badge calculations query indexed SQL, eliminating stale counts across distributed workers.
- **Connection Resilience on Neon Serverless**: `pg.Pool` connection attempts during serverless cold starts are protected by `withDbRetry` (retrying with exponential backoff on transient timeout/termination). Neon connection pooler endpoints (`-pooler`) handle horizontal connection multiplexing.


---

## 23. Error Handling

Error handling across CoachFlow follows a structured, contract-driven pattern spanning Server Actions, database queries, and interactive UI states.

### 23.1 Server Action Standard Result Contract
Every mutating Server Action returns a predictable discriminated union, enabling client forms to parse errors without throwing unhandled exceptions:
```typescript
export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
```

### 23.2 Validation Error Mapping
Mutations parse inbound payloads through Zod schemas. On failure, actions invoke `error.flatten().fieldErrors`, returning specific field-level validation messages back to React Hook Form:
```typescript
const parsed = createClientSchema.safeParse(input);
if (!parsed.success) {
  return {
    ok: false,
    error: "VALIDATION_ERROR",
    fieldErrors: parsed.error.flatten().fieldErrors,
  };
}
```

### 23.3 Database Exception Classification (`src/lib/db.ts`)
Raw PostgreSQL errors are classified via dedicated utility functions:
- **`isUniqueViolation(error)`**: Detects error code `23505` (e.g., duplicate phone number, username, or daily check-in date).
- **`isForeignKeyViolation(error)`**: Detects error code `23503` (e.g., referencing a deleted template or client).
- **Transient Connection Retries (`withDbRetry`)**:
  ```typescript
  export async function withDbRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 500): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.message || "";
      if (retries > 0 && (msg.includes("timeout") || msg.includes("terminated"))) {
        await new Promise((r) => setTimeout(r, delayMs));
        return withDbRetry(fn, retries - 1, delayMs * 2);
      }
      throw err;
    }
  }
  ```

### 23.4 UI Loading, Error, & Empty States
- **Route Error Boundaries**: Each route group (`(admin)`, `(trainer)`, `client/(portal)`) defines an `error.tsx` component with user-friendly retry buttons (`reset()`) and error logging.
- **Route Loading States**: `loading.tsx` skeletons provide layout-stable placeholder cards while Server Components resolve async database queries.
- **Optimistic Recovery**: Actions like `toggleMealChoiceAction` apply optimistic UI updates immediately. If the server action returns `{ ok: false }`, the UI reverts the checkbox to its previous state and emits an alert via `sonner`.

---

## 24. Security Audit

A comprehensive code-level audit was conducted across authentication, authorization, data persistence, and input validation layers.

### 24.1 Security Posture & Verified Controls
- **Zero SQL Injection**: 100% of raw queries executed through `pool.query` use parameterized tokens (`$1, $2...`). No dynamic string concatenation exists in SQL execution paths. Prisma queries are validated through Prisma's typed query engine.
- **Input Sanitization**: 21 discrete Zod schemas validate all client inputs. Unrecognized properties are stripped automatically.
- **Strict Role-Based Routing**: Middleware enforces role separation before any server-side layout code executes.
- **Tenant Isolation**: Every database query touching client data enforces `trainerId` matching, preventing cross-tenant data leaks.
- **Cryptographic Security**: Passwords hashed with bcrypt (salt rounds: 10–12). Invite tokens use `nanoid(24)` with 140 bits of entropy.

### 24.2 Security Risk Classification & Resolution Status

| Risk Level | Finding | Status | Impact | Mitigation Implemented |
|------------|---------|--------|--------|------------------------|
| **HIGH** | In-Memory Login Rate Limiter | ✅ **RESOLVED** | Distributed brute-force attacks across serverless instances bypass memory counters | Integrated `@upstash/ratelimit` sliding window (5 req / 15m) with automatic local memory fallback (`src/server/auth.ts`) |
| **HIGH** | Missing Content-Security-Policy (CSP) | ✅ **RESOLVED** | Increased exposure to XSS if an injection vulnerability emerges | Enforced strict CSP and HTTP security headers (`X-Frame-Options`, HSTS, Referrer-Policy) in `next.config.ts` |
| **MEDIUM** | Binary Image Storage in PostgreSQL | ✅ **RESOLVED** | Storing WebP logos and blog images in `BYTEA` columns risks database table bloat | Created S3/R2 cloud object storage client (`src/lib/storage.ts`) with presigned URLs and migration script `scripts/migrate-media-to-storage.ts` |
| **MEDIUM** | Absence of Structured Audit Logs | ⚠️ Planned | No persistent immutable ledger recording administrative mutations | Implement a centralized `AuditLog` table in Phase 3 |
| **LOW** | Missing Multi-Factor Authentication (2FA) | ⚠️ Planned | Coach accounts rely on single-factor credentials | Integrate TOTP / SMS verification for coach logins in Phase 3 |
| **LOW** | Missing `rowCount` Checks on Select Updates | ⚠️ Monitoring | Occasional `pool.query("UPDATE...")` calls do not verify `res.rowCount > 0` | Enforce row-count verification across remaining legacy queries |

---

## 25. UI Architecture

CoachFlow features a polished, mobile-first design system customized for fitness professionals.

### 25.1 Fitness Token Palette (`globals.css`)
Defined as CSS custom properties supporting dynamic tenant brand overrides:
- **`brand`**: Core brand orange (`#E85D04` in light mode, `#FB8A3C` in dark mode).
- **`energy`**: Amber/Yellow scale for daily check-in energy levels and snacks.
- **`muscle`**: Deep Red/Crimson scale for hypertrophy, strength metrics, and workout logs.
- **`performance`**: Emerald Green scale for completed goals, positive streaks, and financial receipts.

### 25.2 Custom Component Primitives (`src/components/ui/`)
- **`SectionNav`**: Sticky, horizontal pill navigation with backdrop blur (`backdrop-blur-xl`). Allows fluid swiping between athlete sub-sections with snap scrolling.
- **`ProgressRing`**: Lightweight SVG circular progress indicator using `strokeDasharray: 283` and `strokeDashoffset` for adherence percentages.
- **`StreakBadge`**: Interactive flame widget displaying active day streaks with subtle pulse animations.
- **`FitnessCard`**: Card wrapper with gradient top borders (`via-primary/60`) and soft elevation shadows (`shadow-glass`).
- **`ScalePicker`**: Animated 1–5 haptic rating buttons built with Motion for daily energy and mood scoring.

### 25.3 Mobile-First Athlete Experience
The client portal (`/client/(portal)/*`) is engineered specifically for mobile viewports:
- **Sticky glass header**: `AppTopNav` (liquid-glass, profile menu desktop-only) with pinned `WelcomeTicker` marquee and coach social icons (platform brand colors) beside the notification bell.
- **`ClientBottomNav`**: defined but currently unmounted — not rendered on any route.
- **Viewport Metas**: Configured with `viewport-fit=cover` and safe-area padding for iOS notch and home-indicator integration.

### 25.4 iOS 26 Liquid Glass Design System Specification
CoachFlow pioneers an advanced **iOS 26 Liquid Glass design language**, providing tactile depth, dynamic refraction, and luminous visual feedback across workout builders, navigation bars, and modals:

1. **Material Architecture (`GlassCard`)**:
   - Multi-layered frosted glass composite: `backdrop-blur-2xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-neutral-950/70 border border-white/15 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.30)]`.
   - GPU hardware acceleration enabled via `transform-gpu` to preserve consistent 60/120fps scrolling.
2. **Specular Light Engine (`GlassSheen`)**:
   - A static, zero-runtime-cost specular lighting primitive (`src/components/features/training-split/liquid-glass/glass-sheen.tsx`).
   - Injects a top-edge hairline gradient (`via-white/40`) and soft corner specular glints (`blur-2xl`) simulating natural optical refraction without WebGL overhead.
3. **Dynamic Workout Focus Backlights**:
   - Workout day pods dynamically project ambient backlights reflecting their training focus:
     - **PUSH**: Amber / Orange radial emission (`rgba(245,158,11,0.18)`).
     - **PULL**: Sky / Cobalt radial emission (`rgba(56,189,248,0.18)`).
     - **LEGS**: Violet / Purple radial emission (`rgba(168,85,247,0.18)`).
     - **UPPER**: Indigo / Blue radial emission (`rgba(99,102,241,0.18)`).
     - **LOWER**: Teal / Emerald radial emission (`rgba(20,184,166,0.18)`).
     - **CARDIO & MOBILITY**: Rose & Emerald radial emissions.
4. **Floating Action Docks**:
   - Screen-pinned translucent docks (`FloatingBuilderDock` and `TrainerBottomNav`) providing elevated controls with backdrop blur (`backdrop-blur-2xl`), live telemetry counters, and glowing primary action triggers.
5. **Non-Blocking Glass Modals**:
   - Modals (`GlassConfirmDialog`, `BatchExercisePicker`, `GlobalSearchDialog`) employ floating rounded-3xl glass containers, replacing native browser alerts and narrow dialogs with spacious, responsive canvases.

---

## 26. Current Feature Inventory

| Domain | Feature | Status | Role | Verification & File Location |
|--------|---------|--------|------|------------------------------|
| **Admin** | KPI Analytics Dashboard | ✅ Implemented | SUPER_ADMIN | `src/server/services/admin.service.ts` |
| **Admin** | Coach Creation & Management | ✅ Implemented | SUPER_ADMIN | `src/app/(admin)/admin/trainers/page.tsx` |
| **Admin** | Coach Suspension & Activation | ✅ Implemented | SUPER_ADMIN | `adminSuspendCoachAction` in `admin.ts` |
| **Admin** | Coach Subscription Duration & Billing | ✅ Implemented | SUPER_ADMIN | `src/server/services/coach-subscription.service.ts` |
| **Admin** | Manual Payment Recording | ✅ Implemented | SUPER_ADMIN | `PaymentRecord` entity in schema |
| **Coach** | Collapsed Dashboard KPIs | ✅ Implemented | COACH | `src/server/services/dashboard.service.ts` |
| **Coach** | NeedsAction Prioritized Feed | ✅ Implemented | COACH | `src/server/services/needs-action.service.ts` |
| **Coach** | Client CRM with Multi-Filter Search | ✅ Implemented | COACH | `src/app/(trainer)/clients/page.tsx` |
| **Coach** | SectionNav 6-Section Profile | ✅ Implemented | COACH | `src/app/(trainer)/clients/[id]/page.tsx` |
| **Coach** | Token & Slug Invite Engine | ✅ Implemented | COACH | `src/server/services/invite.service.ts` |
| **Coach** | Training Split Template Builder | ✅ Implemented | COACH | `src/server/services/training-split-template.service.ts` |
| **Coach** | Fixed vs Sequential Scheduling | ✅ Implemented | COACH / CLIENT | `src/server/services/week.service.ts` |
| **Coach** | Exercise Safety Pain Flag Warnings | ✅ Implemented | COACH | `src/lib/exercise-safety.ts` |
| **Coach** | Nutrition Template Builder | ✅ Implemented | COACH | `src/components/features/nutrition/nutrition-builder.tsx` |
| **Coach** | Alternative / Spare Meal Grouping | ✅ Implemented | COACH | `isSpare` & `replacesMealId` in `nutrition.service.ts` |
| **Coach** | InBody Biometric Data Entry | ✅ Implemented | COACH | `src/server/services/body-composition.service.ts` |
| **Coach** | Progress Media Feedback Review | ✅ Implemented | COACH | `src/server/services/media.service.ts` |
| **Coach** | Today in Gym & Check-in Overview | ✅ Implemented | COACH | `getCoachCheckinOverview` in `checkin.service.ts` |
| **Coach** | Reusable Subscription Plans (PERIOD/SESSIONS)| ✅ Implemented | COACH | `src/server/services/subscription-plan.service.ts` |
| **Coach** | Payment Proof Approval Workflow | ✅ Implemented | COACH | `src/server/services/payment-proof.service.ts` |
| **Coach** | Educational Blog / Post Publisher | ✅ Implemented | COACH | `src/server/services/blog.service.ts` |
| **Coach** | Custom Branding (Color, Name, Logo, Socials, Photo) | ✅ Implemented | COACH | `src/server/services/branding.service.ts`, Settings Branding + Photo sections |
| **Client** | Full-Bleed Coach Hero + Welcome Ticker | ✅ Implemented | CLIENT | `coach-hero-section.tsx`, `welcome-ticker.tsx` |
| **Client** | 3-Step Guided Onboarding Wizard | ✅ Implemented | CLIENT | `src/app/invite/[token]/page.tsx` |
| **Client** | Home Portal with Daily Checklist | ✅ Implemented | CLIENT | `src/app/client/(portal)/home/page.tsx` |
| **Client** | Asymmetric Bento Week Matrix (state-aware Today hero, preview sheet) | ✅ Implemented | CLIENT | `src/components/features/client/week/bento-week-matrix.tsx` |
| **Client** | Today's Workout & Exercise Targets | ✅ Implemented | CLIENT | `src/app/client/(portal)/workout/today/page.tsx` |
| **Client** | Distraction-Free Gym Session Logger | ✅ Implemented | CLIENT | `src/app/client/(session)/workout/session/page.tsx` |
| **Client** | Liquid Glass Nutrition Dashboard (overview HUD, meal cards, detail sheet) | ✅ Implemented | CLIENT | `src/components/features/nutrition/` (`client-nutrition-view`, `macro-concentric-ring`, `meal-overview-card`, `meal-detail-drawer`) |
| **Client** | Supplement & Food Substitution Guides | ✅ Implemented | CLIENT | `SupplementDef` & `SubstituteGroup` tables |
| **Client** | Daily Check-in with Haptic Scale Picker| ✅ Implemented | CLIENT | `src/components/features/checkin/checkin-card.tsx` |
| **Client** | Streak Gamification & Celebrations | ✅ Implemented | CLIENT | `src/lib/checkin.ts` |
| **Client** | Direction-Aware Goal Tracking | ✅ Implemented | CLIENT | `src/lib/goals.ts` |
| **Client** | InBody Goal Auto-Synchronization | ✅ Implemented | CLIENT | `resolveGoal` in `goal.service.ts` |
| **Client** | Progress Photo & Form Video Upload | ✅ Implemented | CLIENT | `src/app/client/(portal)/media/page.tsx` |
| **Client** | Instapay / Vodafone Cash Receipt Upload | ✅ Implemented | CLIENT | `submitPaymentProofAction` in `payment-proof.ts` |
| **Realtime**| Real-Time Messaging (SSE + Polling) | ✅ Implemented | COACH / CLIENT | `src/server/services/message.service.ts` |
| **Realtime**| Heartbeat Presence Tracking | ✅ Implemented | ALL | `src/server/services/presence.service.ts` |
| **Notifs** | 14-Event Notification Engine | ✅ Implemented | ALL | `src/server/services/notification.service.ts` |
| **Automate**| Subscription Expiry & Milestone Cron | ✅ Implemented | SYSTEM | `src/server/automation/jobs.ts` |
| **System** | Liveness Health Check API | ✅ Implemented | SYSTEM | `src/app/api/health/route.ts` |
| **System** | Egyptian Arabic (RTL) & English i18n | ✅ Implemented | ALL | `src/lib/i18n/` |
| **Training**| Multi-Split Training | ⚠️ Partial | COACH | Schema supports `isMultiSplit` & `splitGroup`; UI builder partial |
| **Notifs** | Native Mobile Push Notifications (FCM) | ❌ Not Found | — | In-app notification center implemented; web-push/FCM planned |
| **Email** | Transactional Email Notifications | ❌ Not Found | — | By design: Egyptian coaches operate via WhatsApp / SMS |
| **Payment**| Automated Stripe/Credit Card Gateway | ❌ Not Found | — | By design: Egyptian coaching relies on Instapay / Vodafone Cash |
| **Offline** | Full Offline IndexedDB Sync | ❌ Excluded | — | Legacy `dexie` dependency uninstalled; offline sync out of scope for server-authoritative coaching |
| **Realtime**| Distributed Redis Pub/Sub | ✅ Implemented | ALL | `src/server/realtime/message-bus.ts` (`ioredis` + local fallback) |
| **Storage** | S3 / Cloudflare R2 Object Storage | ✅ Implemented | SYSTEM | `src/lib/storage.ts` + `scripts/migrate-media-to-storage.ts` |
| **Security**| Distributed Login Rate Limiting | ✅ Implemented | SYSTEM | `src/server/auth.ts` (`@upstash/ratelimit` sliding window) |
| **Database**| Read Replica Query Routing | ✅ Implemented | SYSTEM | `replicaPool` / `replicaQuery` in `src/lib/db.ts` |
| **CI/CD**   | Automated CI Quality Pipeline | ✅ Implemented | SYSTEM | `.github/workflows/ci.yml` (typecheck, lint, test, build) |
| **Testing** | Calculation Unit Test Suite | ✅ Implemented | SYSTEM | `tests/pure-calculations.test.ts` (98 tests across 33 suites) |
| **Search**  | Global Command Palette (`Cmd+K`) & Multi-Entity Search | ✅ Implemented | COACH | `src/server/actions/search.ts`, `src/components/features/search/global-search-dialog.tsx` |
| **Coach**   | Quick Action Floating Trigger (`+`) | ✅ Implemented | COACH | `src/components/features/dashboard/quick-action-dialog.tsx` |
| **Coach**   | Mobile Liquid Glass Navigation Dock | ✅ Implemented | COACH | `src/components/layout/trainer-bottom-nav.tsx` |
| **Coach**   | Liquid Glass Workout Split Builder | ✅ Implemented | COACH | `src/components/features/training-split/` (`DaysEditor`, `GlassCard`, `GlassSheen`, `FloatingBuilderDock`) |
| **Coach**   | Non-Destructive Starter Hub & Template Preview | ✅ Implemented | COACH | `split-starter-hub.tsx`, `template-preview-drawer.tsx` |
| **Coach**   | Large Formatted Batch Exercise Catalog | ✅ Implemented | COACH | `batch-exercise-picker.tsx` (3-col grid, YouTube inspector, queue tray) |
| **Coach**   | 1-Click Visual 7-Day Weekday Scheduler | ✅ Implemented | COACH | `weekday-strip-selector.tsx` (with auto-swap) |
| **Coach**   | Live Weekly Muscle Volume Radar | ✅ Implemented | COACH | `live-volume-radar.tsx` (client-side telemetry) |
| **Coach**   | In-Day Exercise Up/Down Reordering | ✅ Implemented | COACH | `days-editor.tsx` (`handleMoveExercise`) |

---

## 27. Technical Debt & Audit Resolutions

All 14 audited technical debt and ergonomics items across P0, P1, and P2 classifications have been **systematically resolved and verified**.

### P0 — Critical Production & Scalability Blockers
1. **In-Memory SSE Message Bus (`message-bus.ts`)**:
   - *Original Issue*: The event emitter relied on a local Node.js `Map` in serverless memory, preventing events from reaching athletes connected to different serverless workers.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Upgraded `src/server/realtime/message-bus.ts` to use `ioredis` Redis Pub/Sub on channel `conversation:{id}` with reference-counted channel subscriptions and seamless fallback to a local in-memory `EventEmitter` when `REDIS_URL` is omitted.
2. **Binary Media in Relational Database (`CoachLogoFile` & `PostImageFile`)**:
   - *Original Issue*: Storing binary images directly in PostgreSQL `BYTEA` columns caused database table bloat and cache exhaustion.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Implemented cloud object storage client in `src/lib/storage.ts` using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` supporting Cloudflare R2 / AWS S3 with presigned upload/download URLs. Created one-time migration script `scripts/migrate-media-to-storage.ts` to offload existing `BYTEA` blobs to cloud storage.
3. **In-Memory Unread Counters (`message.service.ts`)**:
   - *Original Issue*: `unreadTrainerCache` and `unreadClientCache` operated in local process memory with a 10-second TTL, causing badge counts to drift between concurrent serverless instances.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Deprecated and removed in-memory unread caches. Replaced with direct parameterized PostgreSQL queries (`COUNT(*) FILTER (WHERE "readAt" IS NULL)`) taking full advantage of the compound index `@@index([conversationId, createdAt])`, guaranteeing zero cache drift across all instances.

### P1 — High-Priority Enhancements & Workflow Ergonomics
1. **Single-Process Rate Limiter (`src/server/auth.ts`)**:
   - *Original Issue*: Login lockout counters were stored in local process memory, allowing distributed brute-force attacks across serverless instances to bypass lockout rules.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Integrated `@upstash/ratelimit` with `@upstash/redis` in `src/server/auth.ts` enforcing a sliding window of 5 failed attempts per 15-minute window (`login:attempts:${identifier}`). Includes a local memory sliding-window fallback when Upstash credentials are not set.
2. **Lack of Content-Security-Policy (CSP) Headers**:
   - *Original Issue*: `next.config.ts` emitted no CSP headers, increasing vulnerability to script injection escalation.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Added strict CSP and HTTP security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) in `next.config.ts`.
3. **Destructive Split Type Switching & Accidental Work Loss**:
   - *Original Issue*: Changing split type in `TrainingSplitForm` instantly wiped all existing days and exercises without confirmation.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Built `SplitStarterHub` with `GlassConfirmDialog` guarding preset changes when custom exercises are populated, preventing accidental data loss.
4. **Synchronous Blocking `window.confirm()` in React**:
   - *Original Issue*: Re-running weekday auto-assign triggered native browser `window.confirm()`, pausing the JS main thread and failing on mobile WebViews.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Completely excised `window.confirm()`. Replaced with non-blocking Radix-based `GlassConfirmDialog` with animated backdrop blur.
5. **Decommissioned Option Groups Column (`MealItem.groupNumber`)**:
   - *Original Issue*: The legacy "Option Groups" column remained in the schema defaulting to `1`.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Created migration `prisma/migrations/20260914100000_drop_meal_item_group_number` dropping `groupNumber` from `MealItem`. Pruned the property across `prisma/schema.prisma`, nutrition builder UI, meal detail drawer, validation schemas, and database services.
6. **Missing CI/CD Workflow**:
   - *Original Issue*: No automated quality control existed to validate pull requests.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Created `.github/workflows/ci.yml` running TypeScript typecheck (`tsc --noEmit`), ESLint, unit testing (`tsx --test`), and Next.js Turbopack build on every push and pull request.

### P2 — Moderate Maintenance & Coach Quality of Life
1. **In-Day Exercise Order Immutability**:
   - *Original Issue*: Coaches could not reorder exercises within a day; adjusting sequence required deleting and re-entering movements.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Added `handleMoveExercise` with Up/Down buttons in `DaysEditor` enabling instant exercise reordering within any day pod.
2. **Repetitive 6-Click Single-Exercise Addition**:
   - *Original Issue*: Adding an exercise required 6 sequential clicks per movement with no batch selection or muscle group category filters.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Created large formatted `BatchExercisePicker` with 3-column card grid, muscle group filters with counts, YouTube video demo inspector, selected queue tray, and 1-click bulk insertion.
3. **Unused `dexie` Dependency**:
   - *Original Issue*: `dexie 4.4.5` was installed in `package.json` and referenced in `src/lib/idb.ts`, but no features used client-side IndexedDB sync.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Uninstalled `dexie` package, cleaned up `package.json` and lockfile, and excised unused offline wrappers.
4. **Missing Unit Test Suite for Calculation Libraries**:
   - *Original Issue*: Pure mathematical algorithms lacked unit test coverage.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Created `tests/pure-calculations.test.ts` utilizing Node's native test runner (`tsx --test`). Contains 98 automated unit tests across 33 test suites verifying week schedule generators, streak calculators, exercise safety medical conflict detection, and goal progress mathematics.
5. **Repository Cleanliness**:
   - *Original Issue*: Ephemeral debug files (`temp.tsx`, `trace.cjs`, `diff.txt`) remained in the repository root.
   - *Status*: ✅ **RESOLVED**
   - *Implementation*: Deleted temporary artifacts, updated `.gitignore` to ignore local trace scripts and diff logs, and documented all new optional environment variables in `.env.example`.

---

## 28. Scalability Roadmap

A phased engineering roadmap for scaling CoachFlow across three orders of magnitude.

### Phase 1: Current Stage (10–100 Active Coaches / 1,000–5,000 Athletes) — ✅ COMPLETED
- **Database**: Single Neon Serverless Postgres instance with pooled connection endpoint (`-pooler`). Hard statement timeout capped at 15s.
- **State Management**: Next.js `unstable_cache` with tag invalidation (`updateTag`) for dashboard queries.
- **Completed Core Milestones**:
  1. ✅ Integrated `ioredis` Redis Pub/Sub for cross-instance SSE message distribution with local memory fallback.
  2. ✅ Implemented `@upstash/ratelimit` sliding window on credentials authentication with local fallback.
  3. ✅ Added automated GitHub Actions CI pipeline (`.github/workflows/ci.yml`).
  4. ✅ Added 98 automated unit tests for core domain calculations (`tests/pure-calculations.test.ts`).
  5. ✅ Enforced strict Content Security Policy (CSP) and HTTP security headers in `next.config.ts`.
  6. ✅ Dropped deprecated `MealItem.groupNumber` column from database schema and UI builder.

### Phase 2: Growth Stage (100–1,000 Active Coaches / 50,000 Athletes) — 🔄 FOUNDATIONS IMPLEMENTED
- **Object Storage Migration**:
  - ✅ S3/Cloudflare R2 storage client implemented in `src/lib/storage.ts` with presigned URLs.
  - ✅ Media migration script created (`scripts/migrate-media-to-storage.ts`).
  - Next step: deploy custom CDN domain (e.g., `media.coachflow.me`) and execute migration script against production database.
- **Read/Write Splitting**:
  - ✅ Dedicated `replicaPool` and `replicaQuery` implemented in `src/lib/db.ts` utilizing `DATABASE_URL_REPLICA`.
  - ✅ Heavy analytical reporting (`getAdminDashboardStats`, InBody composition analysis, and `getCachedStrengthSeries`) routed to read replica.
  - Next step: provision dedicated Neon Read Replica branch in production Neon console.
- **Observability & Logging**:
  - ✅ Structured JSON logger implemented in `src/lib/logger.ts` for NDJSON log streaming.
  - ✅ Connection pool retry durations and failure metrics tracked via `getDbMetrics()`.
  - Next step: configure Sentry APM DSN for client/server error capture.

### Phase 3: Scale Stage (1,000+ Active Coaches / 200,000+ Athletes)
- **Real-Time Infrastructure**:
  - Transition from custom SSE routes to a dedicated managed real-time cluster (Ably, Pusher, or self-hosted Socket.io cluster on Fly.io/AWS ECS).
- **Background Worker Engine**:
  - Migrate Vercel Cron jobs to a dedicated queue runner (Inngest, Trigger.dev, or BullMQ with Redis).
  - Offload heavy tasks (weekly coach PDF report generation, InBody OCR parsing) to background worker instances.
- **Database Sharding / Multi-Tenancy Partitioning**:
  - Partition high-volume audit tables (`ExerciseLog`, `DailyLog`, `Notification`, `Message`) by `trainerId` or composite date keys.

---

## 29. Recommended Architecture

The production topology supports serverless multi-instance scaling, distributed event fanout, and external media storage.

```mermaid
flowchart TD
    Client[Mobile Athlete / Web Coach Browser] --> CDN[Cloudflare Edge / Vercel CDN]
    CDN --> Next[Next.js 16 App Router\nServerless Compute Instances]
    
    subgraph Data & Persistence
        Next -->|Direct SQL & Prisma Write Queries| Pooler[Neon Connection Pooler]
        Pooler --> MasterDB[(Neon PostgreSQL Primary)]
        MasterDB -.->|Logical Streaming| ReplicaDB[(Neon Read Replica)]
        Next -.->|Heavy Progress & Admin Queries via replicaQuery| ReplicaDB
    end

    subgraph Caching & Real-Time Sync
        Next -->|Pub/Sub Message Bus via ioredis| Redis[(Upstash / Cloud Redis)]
        Next -->|Distributed Rate Limiting via @upstash/ratelimit| Redis
        Next -->|Direct Indexed Queries| MasterDB
    end

    subgraph Object Storage
        Next -->|Presigned Upload/Download URLs| R2[Cloudflare R2 / S3 Storage]
        R2 -->|WebP Images & Form Videos| Client
    end

    subgraph Observability & Background Jobs
        Next -->|Structured JSON Logs| Logger[NDJSON Log Driver]
        Next -->|Job Triggers| Cron[Vercel Cron Automation]
        Cron -->|Scheduled Milestone Reminders| MasterDB
    end
```

---

## 30. Production Readiness Score

An objective evaluation of CoachFlow's current engineering implementation following completion of the performance optimization plan.

| Evaluation Category | Score (out of 10) | Evaluation Justification |
|---------------------|-------------------|--------------------------|
| **Architecture** | **9.0 / 10** | Modern Next.js 16 App Router implementation utilizing RSC for data fetching, clean Server Action mutation patterns, clear separation across 29 domain services, and multi-instance event distribution with zero-config fallbacks. |
| **Security** | **9.5 / 10** | 100% parameterized queries eliminate SQL injection; Zod schema validation across all inputs; robust multi-tenant `trainerId` scoping; strict Content Security Policy (CSP) and HTTP security headers in `next.config.ts`; distributed Upstash Redis sliding-window rate limiting on authentication. |
| **Performance** | **9.0 / 10** | Optimized SQL aggregations with `FILTER COUNT`; read replica query routing; lazy-loaded charting and builder form chunks; connection pool retry instrumentation with `getDbMetrics()`. |
| **Scalability** | **9.0 / 10** | Multi-instance Redis Pub/Sub eliminates serverless node isolation; direct indexed SQL unread counters prevent cache drift; S3/R2 cloud object storage client ready; read replica routing offloads heavy analytical loads. |
| **Maintainability** | **9.5 / 10** | Modular codebase, strict TypeScript enforcement, clean directory structure, automated GitHub Actions CI pipeline, 98 passing unit tests covering pure calculation engines, and zero dead dependencies after removing `dexie`. |
| **User Experience (UX)**| **9.0 / 10** | Cohesive fitness token design system, responsive mobile-first client portal, smooth Motion animations, haptic check-in scale pickers, and native Egyptian Arabic RTL typography. |
| **Business Readiness**| **9.5 / 10** | Deep alignment with the Egyptian fitness coaching market. Accommodates Vodafone Cash/Instapay workflows, bilingual supplement guides, alternative meal grouping, and multi-split scheduling. |
| **OVERALL PRODUCTION READINESS** | **9.3 / 10** | **Enterprise-ready for commercial production scale across hundreds of concurrent coaches and tens of thousands of active athletes.** |

---

## Appendix: Environment Variables Reference

```bash
# =============================================================================
# Database Configuration (Neon Serverless PostgreSQL)
# =============================================================================
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Optional: Neon Read Replica (defaults to DATABASE_URL if omitted)
DATABASE_URL_REPLICA="postgresql://user:password@ep-replica-pooler.region.aws.neon.tech/neondb?sslmode=require"

# =============================================================================
# Realtime Pub/Sub Message Bus (Optional - defaults to in-memory EventEmitter)
# =============================================================================
REDIS_URL="rediss://default:token@region.upstash.io:6379"

# =============================================================================
# Distributed Rate Limiting (Optional - defaults to in-memory sliding window)
# =============================================================================
UPSTASH_REDIS_REST_URL="https://region.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_rest_token"

# =============================================================================
# Cloud Object Storage - Cloudflare R2 / AWS S3 (Optional - defaults to Postgres BYTEA)
# =============================================================================
S3_REGION="auto"
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="your_r2_access_key_id"
S3_SECRET_ACCESS_KEY="your_r2_secret_access_key"
S3_BUCKET="coachflow-media"
S3_PUBLIC_URL="https://media.coachflow.me"

# =============================================================================
# NextAuth.js v4 Authentication
# =============================================================================
NEXTAUTH_URL="https://app.coachflow.me" # Optional on Vercel (uses VERCEL_URL)
NEXTAUTH_SECRET="min-32-characters-secure-random-cryptographic-key"

# =============================================================================
# Public Application Configuration
# =============================================================================
NEXT_PUBLIC_APP_URL="https://app.coachflow.me"

# =============================================================================
# System Cron & Automation
# =============================================================================
CRON_SECRET="secure-webhook-bearer-token-for-automation-cron"

# =============================================================================
# Initial Bootstrap & Database Seeding
# =============================================================================
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="super-secure-initial-admin-password"
SEED_DEMO="false"
```

---

## Appendix: Local Setup & Verification

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/adelahmeddev/CoachFlow.git
cd CoachFlow
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Update DATABASE_URL with Neon credentials and NEXTAUTH_SECRET

# 3. Generate Prisma client & apply database migrations
npm run prisma:generate
npx prisma migrate dev --name init

# 4. Seed Super Admin account
npm run db:seed

# 5. (Optional) Seed Egyptian coaching demo data (1 coach, 10 athletes)
npm run seed:demo

# 6. Run Next.js Turbopack development server
npm run dev

# 7. Verification, type-safety, and test suite checks
npm run typecheck
npm run lint
npm run test:unit
npm run build
```
