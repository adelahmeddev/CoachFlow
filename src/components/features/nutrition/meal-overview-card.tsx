"use client"

import { Check, ChevronDown, Clock, Flame, UtensilsCrossed } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

export type MealCardStatus = "completed" | "current" | "upcoming"

/**
 * Premium Liquid Glass meal card.
 * Visual-only upgrade — opening the detail drawer is unchanged.
 */
export function MealOverviewCard({
  order,
  title,
  kindLabel,
  kcalLabel,
  kcalValue,
  kcalEstimated,
  altCountLabel,
  complete,
  status,
  itemsDone,
  itemsTotal,
  onOpen,
}: {
  order: number
  title: string
  kindLabel: string
  kcalLabel: string
  kcalValue?: number | null
  kcalEstimated?: boolean
  altCountLabel: string | null
  complete: boolean
  status?: MealCardStatus
  itemsDone?: number
  itemsTotal?: number
  onOpen: () => void
}) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const resolved: MealCardStatus =
    status ?? (complete ? "completed" : "upcoming")
  const isCurrent = resolved === "current"
  const isDone = resolved === "completed"
  const orderLabel = String(order).padStart(2, "0")

  const progress =
    itemsTotal != null && itemsTotal > 0 && itemsDone != null
      ? Math.min(1, itemsDone / itemsTotal)
      : isDone
        ? 1
        : 0

  return (
    <article
      className={cn(
        "glass-card group relative flex flex-col overflow-hidden rounded-3xl p-5",
        "transition-[transform,box-shadow,border-color] duration-300",
        "hover:-translate-y-1",
        isDone &&
          "border-performance-500/25 hover:border-performance-500/40 dark:border-performance-500/25",
        isCurrent && "animate-pulse-glow -translate-y-0.5",
        !isDone &&
          !isCurrent &&
          "hover:border-brand-500/30 dark:hover:border-brand-400/30"
      )}
      style={
        isCurrent
          ? {
              borderColor:
                "color-mix(in srgb, var(--color-brand-500) 40%, transparent)",
            }
          : undefined
      }
    >
      {/* ambient wash per state */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-14 -end-14 size-44 rounded-full blur-3xl transition-opacity duration-300"
        style={{
          background: isDone
            ? "radial-gradient(closest-side, color-mix(in srgb, var(--color-performance-500) 16%, transparent), transparent)"
            : isCurrent
              ? "radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-500) 22%, transparent), transparent)"
              : "radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-500) 10%, transparent), transparent)",
          opacity: isCurrent ? 1 : 0.8,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background: isDone
            ? "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-performance-500) 50%, transparent), transparent)"
            : "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-brand-500) 45%, transparent), transparent)",
        }}
      />

      {/* header: order + status */}
      <div className="relative flex items-center gap-2.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-black tabular-nums text-white shadow-soft dark:from-brand-500 dark:to-brand-600">
          {orderLabel}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {isAr ? `الوجبة ${orderLabel}` : `Meal ${orderLabel}`} · {kindLabel}
          </p>
          <h3
            className={cn(
              "mt-0.5 truncate text-base font-extrabold tracking-tight",
              isAr && "font-[var(--font-arabic)]"
            )}
          >
            {title}
          </h3>
        </div>
        <MealStatusBadge status={resolved} />
      </div>

      {/* luminous calories */}
      <div className="relative mt-4 flex flex-col items-center py-1 text-center">
        <span
          className={cn(
            "text-4xl font-black tabular-nums leading-none tracking-tight",
            isDone
              ? "[text-shadow:0_0_18px_color-mix(in_srgb,var(--color-performance-500)_40%,transparent)]"
              : "[text-shadow:0_0_18px_color-mix(in_srgb,var(--color-brand-500)_35%,transparent)]"
          )}
        >
          {kcalValue != null ? (
            <>
              {kcalEstimated ? "~" : ""}
              {kcalValue}
            </>
          ) : (
            <span className="text-2xl text-muted-foreground">—</span>
          )}
        </span>
        <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {isAr ? "سعرة حرارية" : "Calories"}
        </span>
        <span className="sr-only">{kcalLabel}</span>
      </div>

      {/* meta row */}
      <div className="relative mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.05] px-2.5 py-1 font-semibold tabular-nums dark:bg-white/[0.06]">
          <Flame className="size-3" aria-hidden="true" />
          {kcalLabel}
        </span>
        {itemsTotal != null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.05] px-2.5 py-1 font-semibold tabular-nums dark:bg-white/[0.06]">
            <Clock className="size-3" aria-hidden="true" />
            {itemsDone ?? 0}/{itemsTotal}{" "}
            {isAr ? "عنصر" : "items"}
          </span>
        ) : null}
      </div>

      {/* progress hairline */}
      <div
        className="relative mt-3 h-1 overflow-hidden rounded-full bg-foreground/[0.08] dark:bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.round(progress * 100)}%`,
            background: isDone
              ? "linear-gradient(90deg, var(--color-performance-500), var(--color-performance-400))"
              : "linear-gradient(90deg, var(--color-brand-500), var(--color-energy-500))",
            boxShadow: isDone
              ? "0 0 8px color-mix(in srgb, var(--color-performance-500) 60%, transparent)"
              : "0 0 8px color-mix(in srgb, var(--color-brand-500) 60%, transparent)",
          }}
        />
      </div>

      {/* state line */}
      <div className="relative mt-3 flex min-h-5 items-center justify-center gap-1.5 text-xs font-semibold">
        {isDone ? (
          <span className="inline-flex items-center gap-1 text-performance-600 dark:text-performance-400">
            <Check className="size-3.5" aria-hidden="true" />
            {isAr ? "مكتملة — أحسنت" : "Completed — nice work"}
          </span>
        ) : isCurrent ? (
          <span className="inline-flex items-center gap-1.5 text-brand-700 dark:text-brand-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-beacon rounded-full bg-brand-500" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
            </span>
            {isAr ? "الوجبة الحالية" : "Current meal"}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {isAr ? "وجبة قادمة" : "Upcoming"}
          </span>
        )}
        {altCountLabel ? (
          <span className="inline-flex items-center gap-1 font-medium text-energy-600 dark:text-energy-400">
            · <UtensilsCrossed className="size-3" aria-hidden="true" />
            {altCountLabel}
          </span>
        ) : null}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "relative mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-bold",
          "border backdrop-blur-md transition-all duration-200",
          "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
          isDone
            ? "border-performance-500/30 bg-performance-500/10 text-performance-700 hover:bg-performance-500/15 hover:shadow-[0_0_20px_-4px_color-mix(in_srgb,var(--color-performance-500)_50%,transparent)] dark:text-performance-300"
            : "border-brand-500/30 bg-brand-500/10 text-brand-700 hover:bg-brand-500/15 hover:shadow-glow dark:border-brand-400/30 dark:text-brand-200"
        )}
      >
        {isAr ? "عرض تفاصيل الوجبة" : "View meal details"}
        <ChevronDown
          className="size-4 rtl:rotate-90 ltr:-rotate-90"
          aria-hidden="true"
        />
      </button>
    </article>
  )
}

function MealStatusBadge({ status }: { status: MealCardStatus }) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  if (status === "completed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-performance-500/30 bg-performance-500/10 px-2.5 py-1 text-[11px] font-bold text-performance-700 dark:text-performance-300">
        <Check className="size-3" aria-hidden="true" />
        {isAr ? "مكتملة" : "Done"}
      </span>
    )
  }
  if (status === "current") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] font-bold text-brand-700 dark:text-brand-200">
        <span
          aria-hidden="true"
          className="size-1.5 animate-pulse rounded-full bg-brand-500"
        />
        {isAr ? "الحالية" : "Now"}
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-foreground/10 bg-foreground/[0.04] px-2.5 py-1 text-[11px] font-bold text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]">
      {isAr ? "قادمة" : "Next"}
    </span>
  )
}
