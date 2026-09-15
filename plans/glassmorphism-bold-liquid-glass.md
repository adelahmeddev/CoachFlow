# Glassmorphism — Bold Liquid Glass, Full Platform (Plan Only — No Changes Made)

> Status: DOCUMENTED ONLY. No code touched. Awaiting approval to implement.

## Decisions locked
- Intensity: **Bold liquid glass** (push beyond current subtle `bg-white/70 + blur 16px`).
- Scope: **Full platform** (shell + primitives + all trainer/client/auth/chat/builder pages).
- Light mode: **Keep light solid** (glass mostly transparent in dark, more opaque in light for WCAG + Arabic readability).

## Context (why)
CoachFlow already has a partial glass system (`glass-card/nav/modal`, `BackgroundOrbs`, `Card=glass-card`, `Dialog=glass-modal`, `TopNav/BottomNav=glass-nav`, dropdown/select/sonner glass). Coverage is inconsistent: ~39 ad-hoc `bg-card/60 + backdrop-blur-sm` one-offs scattered in filters, workout session bars, dashboard action cards, nutrition builder, chat. No specular highlight / inner top-edge light, no per-page orb density, no reduced-transparency handling. Goal is a coherent iOS-26-style liquid glass while preserving contrast, RTL, and mobile perf.

## Current state (observed)
- `src/app/globals.css`: `@theme inline` + plain `@theme` brand scale (BrandingProvider-safe), tokens `--surface*`, `--shadow-glass/glow`, utilities `glass-card` (blur16 saturate1.2), `glass-nav` (blur24), `glass-modal`, `card-fitness/energy/muscle/performance`.
- `src/app/layout.tsx` + `src/components/layout/background-orbs.tsx`: 3 animated orbs (brand/energy/muscle, blur100-120) + mesh overlay, global, `-z-50`.
- Shell: `layout/app-top-nav.tsx` = `glass-nav`; `layout/client-bottom-nav.tsx` = `glass-nav`; `ui/section-nav.tsx` = ad-hoc `bg-background/80 backdrop-blur-xl` (not tokenized).
- Primitives: `ui/card.tsx` = `glass-card`; `ui/dialog.tsx` = `glass-modal`; `dropdown-menu/select/sonner` = `shadow-glass + backdrop-blur-xl`; `button.tsx` solid brand only; `sheet.tsx` overlay only `blur-xs`; `input/table/tabs/badge` mostly solid.
- Pages with one-offs: `features/clients/clients-filters.tsx`, `features/client/workout/today-workout-client.tsx` + `session-mode.tsx`, `features/client/home/DashboardActionCard.tsx` + `weekly-summary-card.tsx`, `features/nutrition/nutrition-builder.tsx`, `features/messages/*`, `(auth)/register/page.tsx` only auth glass, `(trainer)/dashboard/page.tsx` badge glass.
- Stack: Next.js 16.3 App Router, React 19, Tailwind v4, shadcn radix-nova, motion, NextAuth, pg + Prisma, ar/en RTL, next-themes `.dark`.

## Proposed target — Bold liquid glass

### Phase 1: Foundation tokens (`src/app/globals.css` only)
- Strengthen `glass-card/nav/modal`: `blur(24-32px) saturate(1.5)`, 1px inner top highlight (`inset 0 1px 0 rgba(255,255,255,.25)` light / `.12` dark) + dual border (`color-mix(border 40%, transparent)` + white overlay).
- Add `glass-strong` (dialogs/sheets), `glass-subtle` (table rows/filters), `glass-input`, `glass-chip` (badges/pills/streaks).
- Light-solid rule: light `bg-white/85-90`, dark `bg-black/30-45`. Body text only on `surface-strong` or behind `bg-scrim`.
- Per AGENTS.md: edit values in place; remove dead `card-editorial`/`texture-halftone` if unused — no compat aliases.

### Phase 2: Ambient background
- `components/layout/background-orbs.tsx`: 5 orbs (add teal/performance + brand-400), `blur-[140px]`, `animate-ambient`, `motion-reduce:none`, route-density prop (`auth=dense`, `session=minimal`).
- New page-level `GlassBackdrop` for trainer dashboard + client home/week (gradient mesh + noise SVG, `-z-10`, RTL-safe).

### Phase 3: Global shell
- `layout/app-top-nav.tsx`: `glass-nav` + `glass-strong` on scroll (`>8px` adds saturation + shadow-glass); Tier-2 sub-nav `bg-muted/10 blur`.
- `layout/client-bottom-nav.tsx`: floating dock `mx-3 mb-3 rounded-3xl glass-strong border-t-0 shadow-glass`; active icon glass + brand glow.
- `ui/section-nav.tsx`: migrate to `glass-nav`; active pill glass + gradient + inner highlight; keep `layoutId` motion.

### Phase 4: Primitives (full coverage)
- `ui/card.tsx`, `ui/dialog.tsx`, `ui/sheet.tsx` (overlay `backdrop-blur-md bg-black/30`, content `glass-strong`), `ui/dropdown-menu.tsx` + `popover` + `select.tsx`, `ui/input.tsx` + `textarea` + `select`, `ui/button.tsx` (new `glass` + `glass-primary` variants), `ui/tabs.tsx`, `ui/table.tsx` (header `glass-subtle`, sticky), `ui/badge.tsx`, `ui/progress-ring.tsx`, `features/messages/message-bubble.tsx` (own=brand glass, other=surface glass).

### Phase 5: Feature pages
- Auth (`(auth)/login`, `register`, `signout`): centered `glass-strong` + dense orbs.
- Trainer: `dashboard`, `clients-grid`, `client-profile-header`, `nutrition-builder` sticky bars, `training-split` builder, tables/filters → `glass-subtle`.
- Client: `home/DashboardActionCard`, `week/WeekBoard`, `nutrition/client-nutrition-view`, `workout/session-mode` (header/footer glass, restrained for focus), `media/progress/charts`.
- Messages: thread transparent to show orbs; composer `glass-strong` sticky.

### Phase 6: Safety (a11y/perf/RTL)
- `prefers-reduced-motion` + `prefers-reduced-transparency` → blur off, fallback `bg-background`.
- `:focus-visible` ring stays opaque; keep 44px touch rule; keep Arabic `uppercase/tracking/leading-none` guards.
- Mobile perf: limit fixed-blur layers per viewport (orbs `transform-only` animation), session mode minimal orbs.
- No new deps (`motion` + Tailwind only).

## Files to touch (when approved)
- `src/app/globals.css`
- `src/components/layout/background-orbs.tsx` (+ new `GlassBackdrop`)
- `src/components/layout/app-top-nav.tsx`, `client-bottom-nav.tsx`
- `src/components/ui/card.tsx`, `dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `select.tsx`, `popover.tsx`, `input.tsx`, `textarea.tsx`, `button.tsx`, `tabs.tsx`, `table.tsx`, `badge.tsx`, `section-nav.tsx`, `sonner.tsx`
- `src/components/features/clients/*`, `features/nutrition/nutrition-builder.tsx`, `features/client/home/*`, `features/client/workout/*`, `features/messages/*`, `src/app/(auth)/*`, `src/app/(trainer)/dashboard/*`, `src/app/client/*`

## Risks & mitigations
- Light-mode contrast loss → light stays opaque (`/85-90`) + scrim behind text.
- Mobile blur jank → transform-only orb animation, cap blur layers, minimal session orbs.
- Arabic glyph clipping → keep existing card guards; no letter-spacing on glass pills in `ar`.
- Backdrop-filter unsupported → solid `bg-background` fallback via `@supports not`.

## Verifications (when implemented)
- `npm run typecheck`, `lint`, `build` green.
- Manual: light/dark × ar/en × mobile 360px × desktop; `backdrop-filter:none` fallback; reduced-motion/transparency respected; no readability regression on tables/forms/chat.
