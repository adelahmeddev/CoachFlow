"use client"

import { Flame, Drumstick, Wheat, Droplet } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

function Ring({
  radius,
  pct,
  color,
  glow,
  stroke = 11,
}: {
  radius: number
  pct: number
  color: string
  glow: string
  stroke?: number
}) {
  const c = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, pct))
  return (
    <circle
      cx={120}
      cy={120}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={c}
      strokeDashoffset={c * (1 - clamped)}
      className="transition-[stroke-dashoffset] duration-700 ease-out"
      style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
    />
  )
}

/**
 * Premium Liquid Glass nutrition overview HUD.
 * Outer ring = consumed kcal vs target (real item calories only).
 * Middle ring = items logged share. Inner ring = meals completed share.
 * Protein / carbs / fats are plan targets — never fabricated consumption.
 */
export function MacroConcentricRing({
  consumedKcal,
  consumedEstimated,
  targetKcal,
  proteinTarget,
  carbsTarget,
  fatsTarget,
  itemsPct,
  mealsPct,
}: {
  consumedKcal: number
  consumedEstimated: boolean
  targetKcal: number | null
  proteinTarget: number | null
  carbsTarget: number | null
  fatsTarget: number | null
  itemsPct: number
  mealsPct: number
}) {
  const { t, locale } = useI18n()
  const n = t.nutrition
  const isAr = locale === "ar"
  const kcalPct = targetKcal && targetKcal > 0 ? consumedKcal / targetKcal : 0
  const remaining =
    targetKcal != null ? Math.max(0, targetKcal - consumedKcal) : null

  const macros = [
    {
      Icon: Drumstick,
      label: n.protein,
      value: proteinTarget ?? "—",
      unit: "g",
      dot: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    },
    {
      Icon: Wheat,
      label: n.carbs,
      value: carbsTarget ?? "—",
      unit: "g",
      dot: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      Icon: Droplet,
      label: n.fat,
      value: fatsTarget ?? "—",
      unit: "g",
      dot: "bg-sky-500",
      text: "text-sky-600 dark:text-sky-400",
    },
  ]

  return (
    <section
      aria-label={n.dailyPlan}
      className={cn(
        "glass-card relative overflow-hidden rounded-3xl p-5 sm:p-6",
        isAr && "font-[var(--font-arabic)]"
      )}
    >
      {/* ambient glow — brand-aware, low intensity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 start-1/4 size-64 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-500) 18%, transparent), transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -end-16 size-52 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--color-energy-500) 14%, transparent), transparent)",
        }}
      />
      {/* top-edge luminous hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-brand-500) 45%, transparent), transparent)",
        }}
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        {/* Luminous calorie visualization */}
        <div className="relative mx-auto w-fit shrink-0 sm:mx-0">
          <svg
            width={220}
            height={220}
            viewBox="0 0 240 240"
            role="img"
            aria-label={n.calories}
            className="block h-auto max-w-full"
          >
            <circle
              cx={120}
              cy={120}
              r={108}
              fill="none"
              stroke="currentColor"
              strokeWidth={11}
              className="text-foreground/[0.07] dark:text-white/[0.08]"
            />
            <circle
              cx={120}
              cy={120}
              r={92}
              fill="none"
              stroke="currentColor"
              strokeWidth={11}
              className="text-foreground/[0.07] dark:text-white/[0.08]"
            />
            <circle
              cx={120}
              cy={120}
              r={76}
              fill="none"
              stroke="currentColor"
              strokeWidth={11}
              className="text-foreground/[0.07] dark:text-white/[0.08]"
            />
            <g transform="rotate(-90 120 120)">
              <Ring
                radius={108}
                pct={kcalPct}
                color="var(--color-brand-500)"
                glow="color-mix(in srgb, var(--color-brand-500) 55%, transparent)"
              />
              <Ring
                radius={92}
                pct={itemsPct}
                color="var(--color-energy-500)"
                glow="color-mix(in srgb, var(--color-energy-500) 55%, transparent)"
              />
              <Ring
                radius={76}
                pct={mealsPct}
                color="var(--color-performance-500)"
                glow="color-mix(in srgb, var(--color-performance-500) 55%, transparent)"
              />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              style={{ letterSpacing: isAr ? 0 : undefined }}
            >
              {isAr ? "المستهلك" : "Consumed"}
            </p>
            <p className="mt-0.5 text-4xl font-black tabular-nums leading-none tracking-tight [text-shadow:0_0_18px_color-mix(in_srgb,var(--color-brand-500)_35%,transparent)]">
              {consumedEstimated ? "~" : ""}
              {consumedKcal}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {n.calories}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300">
              <Flame className="size-3" aria-hidden="true" />
              {isAr ? "الهدف" : "Target"} {targetKcal ?? "—"}
            </p>
          </div>
        </div>

        {/* Summary side */}
        <div className="min-w-0 flex-1 text-center sm:text-start">
          <p className="text-sm font-extrabold tracking-tight">
            {n.dailyPlan}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {remaining != null
              ? isAr
                ? `متبقي ${remaining} سعرة لاستكمال هدف اليوم`
                : `${remaining} kcal remaining to hit today's target`
              : isAr
                ? "سجّل وجباتك أولاً بأول لمتابعة تقدمك"
                : "Log each meal as you eat to track progress"}
          </p>

          {/* progress rows */}
          <div className="mt-4 space-y-2.5">
            <ProgressRow
              label={isAr ? "تقدم السعرات" : "Calorie progress"}
              pct={kcalPct}
              bar="linear-gradient(90deg, var(--color-brand-500), var(--color-energy-500))"
            />
            <ProgressRow
              label={isAr ? "الوجبات المكتملة" : "Meals completed"}
              pct={mealsPct}
              bar="linear-gradient(90deg, var(--color-performance-500), var(--color-performance-400))"
            />
          </div>

          {/* macro glass chips */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {macros.map(({ Icon, label, value, unit, dot, text }) => (
              <div
                key={label}
                className="glass-subtle rounded-2xl px-2 py-2.5 text-center"
              >
                <span className="mx-auto flex items-center justify-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn("size-1.5 rounded-full", dot)}
                  />
                  <Icon
                    className={cn("size-3.5", text)}
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 block text-base font-extrabold tabular-nums leading-none [text-shadow:0_0_12px_color-mix(in_srgb,var(--color-brand-500)_25%,transparent)]">
                  {value}
                  <span className="ms-0.5 text-[10px] font-medium text-muted-foreground">
                    {unit}
                  </span>
                </span>
                <span className="mt-1 block text-[10px] leading-tight text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProgressRow({
  label,
  pct,
  bar,
}: {
  label: string
  pct: number
  bar: string
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct * 100)))
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">{clamped}%</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08] dark:bg-white/10"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${clamped}%`, background: bar }}
        />
      </div>
    </div>
  )
}
