# CoachFlow — Comprehensive Technical & Architectural Documentation

This document provides a deep, file-by-file analysis and architectural breakdown of **CoachFlow**, a premium SaaS platform for Egyptian online fitness coaches.

---

## 1. Executive Summary & Domain Logic

CoachFlow is an end-to-end athlete lifecycle management platform. It replaces generic messaging apps and spreadsheets with a centralized, data-driven workspace. 

**Core Lifecycle:**
1. **Onboarding**: Coaches share a stable invite link. Clients self-onboard, inputting their goals, physical metrics, and InBody imports.
2. **Program Generation**: Coaches create highly specialized templates for Nutrition (with mutually exclusive alternatives and substitute groups) and Training (fixed or sequential splits).
3. **Execution**: Clients use the mobile-first Arabic/English portal to log workouts (weights/reps/RPE), check off meals, and chat with their coach.
4. **Analytics**: The system tracks adherence, body composition deltas, and strength progression across sessions.
5. **Business**: Coaches sell "PERIOD" (time-based) or "SESSIONS" (count-based) packages.

---

## 2. Deep Project Structure & File Analysis

The project follows a standard Next.js 16.3 App Router architecture but strictly isolates domain logic into `server/services` and `server/actions`.

### `src/app/` (Routing & Pages)
The routing layer heavily utilizes Next.js route groups (`(group)`) to enforce layout and middleware boundaries.
* **`layout.tsx` & `globals.css`**: The root layout injects `LocaleProvider`, `ThemeProvider`, and loads the Geist/Alexandria fonts. `globals.css` defines the robust fitness design tokens (brand, energy, muscle, performance).
* **`(auth)/`**: Contains `login`, `register`, and `signout` pages handling NextAuth credential flows.
* **`(trainer)/`**: The Coach's workspace.
  * `dashboard/page.tsx`: Aggregated statistics, "Needs Attention" clients, and live gym activity.
  * `clients/page.tsx` & `clients/[id]/page.tsx`: The CRM. The client profile uses a sticky `SectionNav` to tab between Summary, Progress, Nutrition, Training, and Subscription.
  * `nutrition-templates/` & `training-split-templates/`: Builders for reusable programs.
  * `onboarding/page.tsx`: Manages the coach's stable invite link (`/invite/[token]`).
* **`client/`**: The Athlete's workspace.
  * `(portal)/home/page.tsx`: The daily dashboard with `TodayWorkoutCard` and `DailyChecklist`.
  * `(portal)/week/page.tsx`: The `WeekBoard` handling Sequential or Fixed-Weekday logic.
  * `(portal)/nutrition/page.tsx`: The `ClientNutritionView`, featuring mutually exclusive meal selections (Main vs. Alternative) and macro progress.
  * `(session)/workout/session/page.tsx`: A focused, distraction-free active workout logger.
* **`api/`**: 
  * `auth/[...nextauth]/route.ts`: NextAuth configuration.
  * `messages/stream/route.ts`: Server-Sent Events (SSE) endpoint for real-time chat.
  * `messages/unread-count/route.ts`: Highly optimized, 10s memory-cached endpoint for notification badges.

### `src/components/` (UI & Features)
Components are strictly divided into domain features and generic UI primitives.
* **`features/clients/`**: Contains `clients-grid.tsx` (visual client cards with streak flames) and `client-profile-header.tsx`.
* **`features/nutrition/`**: 
  * `nutrition-builder.tsx`: The complex coach-side builder with recursive meal blocks and deep array state management.
  * `client-nutrition-view.tsx`: Client side rendering of macros, supplements, and the transactional meal checklist.
* **`features/progress/`**: `charts-client.tsx` (lazy loaded Recharts for weight/strength) and `progress-summary-cards.tsx`.
* **`features/messages/`**: `chat-thread.tsx` (handles optimistic UI, polling fallback, and SSE), `message-bubble.tsx`, and `message-composer.tsx`.
* **`ui/`**: Base shadcn/ui components (`button`, `dialog`, `sheet`) heavily customized with the `radix-nova` aesthetic, alongside bespoke fitness primitives like `progress-ring.tsx` and `streak-badge.tsx`.

### `src/server/` (Backend Logic)
By separating services from actions, the platform keeps server mutations clean and scalable.
* **`services/`**: Direct database interaction.
  * `dashboard.service.ts`: Aggregates active/pending counts in a single `FILTER COUNT` Postgres query to maximize speed.
  * `nutrition.service.ts`: Handles deep copying of Nutrition Templates to Client Plans. Manages the complex UUID mapping for `isSpare` and `replacesMealId` relationships during assignments.
  * `message.service.ts`: Manages the SSE pub/sub system and handles `DISTINCT ON` queries for the conversation list.
* **`actions/`**: Next.js Server Actions invoked by the client.
  * `nutrition.ts`: Exposes `toggleMealChoiceAction`, which runs strict transactional database queries to enforce mutual exclusivity between alternative meals.
  * `messages.ts`: `sendMessageAction` validates via Zod, updates the DB, clears unread caches, and publishes the SSE event.

### `src/lib/` (Core Utilities)
* **`db.ts`**: Configures the `pg` Pool for Neon Serverless. Implements `withDbRetry` for transient cold-start handling and `uselibpqcompat=true` for SSL compatibility.
* **`validations/`**: Comprehensive Zod schemas (`nutrition.ts`, `auth.ts`) securing all incoming data.
* **`i18n/`**: Custom localization engine providing Egyptian fitness terminology (`messages/ar.ts`) and LTR/RTL layout switching.
* **`cache.ts`**: Provides `withCache` wrappers for heavy queries (e.g., 300s cache for trainer dashboards).

---

## 3. Database Schema & Relational Integrity

The project uses PostgreSQL (Neon) and Prisma (`prisma/schema.prisma`) for schema management, though hot-paths use `pg` directly.

### Core Models
* **`User` / `TrainerProfile` / `Client`**: A `User` record acts as the auth root, linking 1-to-1 to either a Coach or Athlete profile. `TrainerProfile` owns templates and clients.
* **Nutrition Models**:
  * `NutritionTemplate` / `ClientNutritionPlan`: Templates act as blueprints; Plans are active snapshots attached to clients.
  * `Meal` / `MealItem`: Meals contain items. A Meal can be a Main Meal (`isSpare: false`) or an Alternative (`isSpare: true`, `replacesMealId: <MainMealID>`).
  * `MealChoice`: Tracks client adherence (`clientId`, `mealItemId`, `date`).
* **Training Models**:
  * `TrainingSplit` -> `TrainingSplitDay` -> `SplitDayExercise`.
  * Tracks schedules (Fixed Weekdays vs. Sequential Days).
* **Progress Models**:
  * `BodyComposition`: Tracks InBody data (Weight, Skeletal Muscle, Visceral Fat).
  * `ExerciseLog`: Stores actual weight/reps/RPE logged during a session.
* **Messaging**:
  * `Conversation` (1-to-1 unique between Coach and Client) -> `Message`.

---

## 4. Technical Architecture & Performance Optimization

### The Request Flow
1. **Middleware**: Intercepts requests, validates the JWT via NextAuth, enforces Role-Based Access Control (Admin/Trainer/Client), and sets the `locale` cookie.
2. **React Server Components (RSC)**: Page components immediately fetch data on the server without client-side loading spinners.
3. **Database Access**: 
   * **Prisma** is used for complex relation queries and typed CRUD.
   * **Direct `pg` Pool** is used for high-frequency hot paths (like unread counts and dashboard stats). This bypasses ORM overhead and allows advanced Postgres features like `COUNT(...) FILTER (WHERE ...)`.
4. **Mutations**: Client-side forms submit to Server Actions. The action validates with Zod, updates the DB, and calls `revalidatePath` to instantly refresh the RSC payload.

### Real-Time Chat (SSE)
Instead of relying on heavy WebSockets (which drain serverless resources), CoachFlow uses **Server-Sent Events (SSE)** via `/api/messages/stream`. 
* **Optimistic UI**: When a user hits "Send", the message appears instantly in the UI with a "pending" state.
* **Pub/Sub**: The server action writes to Postgres, then publishes an event. The SSE stream picks it up and delivers it to the receiver.
* **Smart Polling**: If SSE disconnects, it falls back to polling (3s when tab is visible, 10s when hidden).

### Caching Strategy
* **Memory Cache**: `unreadTrainerCache` holds unread message counts in memory for 10 seconds to prevent hammering the database on every navigation.
* **Redis/KV alternative (`withCache`)**: The Dashboard wraps heavy aggregation queries in a 300-second cache.

---

## 5. UI/UX & Design System

CoachFlow implements a premium "Fitness SaaS" aesthetic natively via Tailwind CSS and `shadcn/ui`.

* **Design Tokens (`globals.css`)**: Defines custom palettes:
  * `--primary`: Brand Orange (`#E85D04`)
  * `--energy`: Amber tones for stamina/snacks.
  * `--muscle`: Red tones for strength/training.
  * `--performance`: Green tones for adherence/progress.
* **Custom Primitives**:
  * `SectionNav`: A sticky, horizontally scrollable navigation bar with a glassmorphism (`backdrop-blur-xl`) effect used in client profiles.
  * `ProgressRing`: SVG-based circular progress indicators used on the dashboard to track macro/workout completion.
  * `FitnessCard`: Extends standard cards with subtle top-border gradients (`bg-gradient-to-br from-brand/10`).
* **Localization**: Fully supports Right-to-Left (RTL) natively. Elements use logical properties (`ms-2`, `pe-4`) instead of directional ones (`ml-2`, `pr-4`) to ensure the layout mirrors flawlessly between Arabic and English.

---

*End of Deep Analysis Document. Compiled from technical audits, database schema reviews, and recent architectural enhancements.*
