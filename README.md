# CoachFlow — Personal Trainer Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-indigo?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-green)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

## Documentation Index

| Document | Contents |
|---|---|
| [README.md](README.md) | Project overview, tech stack, quick start |
| [SETUP.md](SETUP.md) | Prerequisites, install steps, environment variables, tests |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Folder structure, data flow, design patterns, core module deep-dives |
| [API.md](API.md) | HTTP route handlers and Server Actions reference |
| [DATABASE.md](DATABASE.md) | Full schema, ER diagram, indexes, constraints |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel deployment, CI/CD, configuration files, env differences |
| [KNOWN-ISSUES.md](KNOWN-ISSUES.md) | Known issues, TODOs, technical debt |
| [GLOSSARY.md](GLOSSARY.md) | Domain terms and naming conventions |
| [TECHNICAL.md](TECHNICAL.md) | Legacy deep-dive narrative (feature history, audits) |

## Overview

**CoachFlow** is a production SaaS platform for personal trainers — built specifically for the Egyptian / Middle Eastern online coaching market. It replaces the fragmented WhatsApp + Excel + PDF workflow with one integrated workspace covering the complete athlete lifecycle:

1. **Onboarding** — coaches share a stable invite link (`/invite/[token]`) or public join page (`/join/[slug]`); clients self-register in a 3-step wizard (profile + pain flags → InBody metrics → account credentials).
2. **Program generation** — coaches author reusable **nutrition templates** (with mutually-exclusive alternative meals) and **training split templates** (fixed-weekday or sequential scheduling), then deep-copy them to clients.
3. **Execution** — clients use the mobile-first Arabic (RTL) / English portal to log sets/reps/RPE, check off meals, submit daily wellness check-ins, and upload progress media.
4. **Analytics** — adherence, body-composition deltas, strength progression, and a prioritized **NeedsAction** feed computed on read.
5. **Business** — coaches sell `PERIOD` (time-based) or `SESSIONS` (count-based) packages; clients upload Instapay / Vodafone Cash payment proofs for manual verification (no card gateway, by design).

### Target users

| Role | Purpose |
|---|---|
| `SUPER_ADMIN` | Platform operator: provisions coach accounts, manages coach SaaS licenses (`CoachSubscription`), global branding, cross-tenant monitoring |
| `COACH` (Trainer) | The primary tenant: client CRM, templates, adherence feeds, progress review, in-app messaging, payments |
| `CLIENT` (Athlete) | End user: daily workouts, meal check-ins with alternates, streaks, goals, progress media, messaging |

### High-level architecture (plain language)

A single **Next.js 16 App Router** application deployed on **Vercel**, backed by **Neon Serverless PostgreSQL**. Pages render as React Server Components; all mutations flow through **Server Actions → domain services → parameterized SQL** against a `pg` connection pool. Real-time chat uses **Server-Sent Events** fanned out through a Redis Pub/Sub bus (local in-memory fallback when no Redis is configured). Access is enforced in two places: the edge proxy (`src/proxy.ts`) checks the NextAuth JWT role before routing, and every service query is scoped to the authenticated `trainerId` / `clientId` (tenant isolation).

> **Note:** Prisma 5.22 is used for **schema management and migrations only**. All runtime database access goes through raw, parameterized `pg` pool queries (`src/lib/db.ts`) to leverage Postgres-specific features (`COUNT(*) FILTER (WHERE ...)`, CTEs, window functions). The `PrismaClient` singleton in `src/lib/prisma.ts` is not imported anywhere at runtime.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.3.0 |
| UI runtime | React / React DOM | 19.2.8 |
| Language | TypeScript (strict, `@/*` → `./src/*`) | 5.x |
| Styling | Tailwind CSS + `@tailwindcss/postcss` | 4.x |
| Components | shadcn/ui + Radix UI primitives | shadcn 4.16.1, radix-ui 1.6.7 |
| Auth | NextAuth.js (Credentials provider, JWT sessions) | 4.24.15 |
| Schema / migrations | Prisma (schema + migrations only, no runtime client) | 5.22.0 |
| Database | PostgreSQL 15+ on Neon Serverless | — |
| DB driver | `pg` (node-postgres) connection pool | 8.23.0 |
| Realtime pub/sub | `ioredis` (Redis Pub/Sub + local EventEmitter fallback) | ^6.0.0 |
| Rate limiting | `@upstash/ratelimit` + `@upstash/redis` (memory fallback) | 2.0.8 / 1.38.4 |
| Object storage | `@aws-sdk/client-s3` + `s3-request-presigner` (Cloudflare R2 / S3, Postgres BYTEA fallback) | ^3.1131.0 |
| Validation | Zod + react-hook-form + @hookform/resolvers | 4.4.3 / 7.84.0 / 5.7.1 |
| Charts | Recharts (lazy-loaded) | 3.10.1 |
| Animation | Motion (Framer Motion successor) | 13.2.0 |
| Images | sharp (WebP conversion on the server) | 0.35.4 |
| Icons / toasts / theming | lucide-react, sonner, next-themes | 1.28.0 / 2.0.7 / 0.4.6 |
| Misc | bcryptjs, nanoid, date-fns, clsx, tailwind-merge, class-variance-authority, tw-animate-css | — |
| Test runner | tsx + Node built-in test runner | 4.23.9 |
| Lint / CI | ESLint 9 + eslint-config-next, GitHub Actions | — |

## Quick Start

```bash
npm install
cp .env.example .env        # or .env.local — fill in DATABASE_URL + NEXTAUTH_SECRET
npm run prisma:generate
npx prisma migrate dev       # apply schema to your (fresh) database
npm run db:seed              # SUPER_ADMIN + global templates + exercise library
npm run dev                  # http://localhost:3000
```

Optional: `npm run seed:demo` seeds a realistic Egyptian demo tenant (1 coach, 10 athletes, splits, nutrition).

Verification: `npm run typecheck` · `npm run lint` · `npm run test:unit` (103 tests / 34 suites) · `npm run build`

## License

MIT
