"use client"

import { Check, Crown, Repeat2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { ClientMealView } from "@/components/features/nutrition/client-nutrition-view"

interface MealDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  main: ClientMealView | null
  alternatives: ClientMealView[]
  activeId: string | null
  onActivate: (mealId: string) => void
  chosen: Set<string>
  pending: boolean
  onToggle: (itemId: string) => void
  formatAmount: (amount: number | null, unit: ClientMealView["items"][number]["unit"]) => string
}

/** Premium bottom sheet: main meal vs alternatives kept visually distinct. */
export function MealDetailDrawer({
  open,
  onOpenChange,
  main,
  alternatives,
  activeId,
  onActivate,
  chosen,
  pending,
  onToggle,
  formatAmount,
}: MealDetailDrawerProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  if (!main) return null

  const options = [main, ...alternatives]
  const active = options.find((m) => m.id === activeId) ?? main
  const nameOf = (m: ClientMealView) => (isAr && m.nameAr ? m.nameAr : m.name)
  const kcalOf = (m: ClientMealView) => {
    if (m.items.length === 0) return null
    if (m.items.some((i) => i.calories == null)) return null
    return m.items.reduce((s, i) => s + (i.calories ?? 0), 0)
  }
  const activeKcal = kcalOf(active)
  const doneCount = active.items.filter((i) => chosen.has(i.id)).length
  const allDone = active.items.length > 0 && doneCount === active.items.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-modal mx-auto max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border-x border-t pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="text-start">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
            <Crown className="size-3.5" aria-hidden="true" />
            {isAr ? "الوجبة الأساسية" : "Main meal"}
          </p>
          <SheetTitle
            className={cn("text-lg", isAr && "font-[var(--font-arabic)]")}
          >
            {nameOf(main)}
          </SheetTitle>
        </SheetHeader>

        <div
          className={cn(
            "-mt-2 space-y-5 px-4 pb-6",
            isAr && "font-[var(--font-arabic)]"
          )}
        >
          {/* Active option summary */}
          <div className="glass-subtle relative overflow-hidden rounded-2xl p-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 start-1/3 size-40 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-500) 16%, transparent), transparent)",
              }}
            />
            <div className="relative flex items-center gap-3">
              <p className="text-3xl font-black tabular-nums leading-none [text-shadow:0_0_16px_color-mix(in_srgb,var(--color-brand-500)_35%,transparent)]">
                {activeKcal ?? "—"}
                <span className="ms-1 text-xs font-semibold text-muted-foreground">
                  kcal
                </span>
              </p>
              <div className="ms-auto text-end">
                <p className="text-xs font-bold tabular-nums">
                  {doneCount}/{active.items.length}{" "}
                  <span className="font-medium text-muted-foreground">
                    {isAr ? "مكتمل" : "done"}
                  </span>
                </p>
                <div
                  className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-foreground/[0.08] dark:bg-white/10"
                  role="progressbar"
                  aria-valuenow={
                    active.items.length
                      ? Math.round((doneCount / active.items.length) * 100)
                      : 0
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${
                        active.items.length
                          ? Math.round(
                              (doneCount / active.items.length) * 100
                            )
                          : 0
                      }%`,
                      background: allDone
                        ? "linear-gradient(90deg, var(--color-performance-500), var(--color-performance-400))"
                        : "linear-gradient(90deg, var(--color-brand-500), var(--color-energy-500))",
                    }}
                  />
                </div>
              </div>
            </div>
            <p className="relative mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {isAr
                ? "اختر وجبة واحدة فقط — الأساسية أو بديل واحد. ضع علامة على كل صنف بعد تناوله."
                : "Eat ONE option only — the main meal or a single alternative. Tick each item as you eat it."}
            </p>
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <Repeat2 className="size-3.5" aria-hidden="true" />
                {isAr
                  ? "الوجبات البديلة — اختر واحدة فقط"
                  : "Alternative meals — pick one only"}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x no-scrollbar">
                {options.map((opt, idx) => {
                  const isActive = opt.id === active.id
                  const isMainOpt = idx === 0
                  const optKcal = kcalOf(opt)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onActivate(opt.id)}
                      aria-pressed={isActive}
                      className={cn(
                        "w-44 shrink-0 snap-start rounded-2xl border p-3 text-start backdrop-blur-md transition-all duration-200",
                        "hover:-translate-y-0.5 active:scale-[0.98]",
                        isActive
                          ? "border-brand-500/50 bg-brand-500/[0.08] shadow-glow dark:border-brand-400/50"
                          : "border-foreground/10 bg-foreground/[0.03] hover:border-brand-500/30 hover:bg-brand-500/[0.05] dark:border-white/10 dark:bg-white/[0.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isMainOpt
                            ? "bg-brand-500/15 text-brand-700 dark:text-brand-200"
                            : "bg-energy-500/15 text-energy-700 dark:text-energy-300"
                        )}
                      >
                        {isMainOpt
                          ? isAr
                            ? "الوجبة الأساسية"
                            : "Main"
                          : isAr
                            ? "بديل"
                            : "Alternative"}
                      </span>
                      <p className="mt-1.5 truncate text-xs font-bold">
                        {nameOf(opt)}
                      </p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                        {optKcal ?? "—"} kcal · {opt.items.length}{" "}
                        {isAr ? "عنصر" : "items"}
                      </p>
                      <span
                        className={cn(
                          "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                          isActive
                            ? "bg-brand-600 text-white shadow-soft dark:bg-brand-500"
                            : "bg-foreground/[0.06] text-muted-foreground dark:bg-white/10"
                        )}
                      >
                        {isActive && (
                          <Check className="size-3" aria-hidden="true" />
                        )}
                        {isActive
                          ? isAr
                            ? "المختارة حالياً"
                            : "Selected"
                          : isAr
                            ? "اختر هذه الوجبة"
                            : "Select meal"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active option checklist */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {isAr ? "أصناف الوجبة المختارة" : "Selected meal items"}
            </p>
            <ul className="space-y-1.5">
              {active.items.map((item) => {
                const isChosen = chosen.has(item.id)
                const label =
                  isAr && item.foodNameAr ? item.foodNameAr : item.foodName
                return (
                  <li key={item.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => !pending && onToggle(item.id)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && !pending) {
                          e.preventDefault()
                          onToggle(item.id)
                        }
                      }}
                      className={cn(
                        "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-start backdrop-blur-md transition-all duration-200",
                        "hover:-translate-y-px active:scale-[0.99]",
                        pending && "pointer-events-none opacity-50",
                        isChosen
                          ? "border-performance-500/50 bg-performance-500/10 shadow-[0_0_16px_-4px_color-mix(in_srgb,var(--color-performance-500)_45%,transparent)]"
                          : "border-foreground/10 bg-foreground/[0.03] hover:border-brand-500/30 hover:bg-brand-500/[0.05] dark:border-white/10 dark:bg-white/[0.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                          isChosen
                            ? "border-performance-500 bg-performance-500 text-white shadow-soft"
                            : "border-foreground/25 dark:border-white/25"
                        )}
                        aria-hidden="true"
                      >
                        {isChosen && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm font-medium">
                        {label}
                        {item.amount !== null && (
                          <span className="ms-1 font-normal text-muted-foreground">
                            ({formatAmount(item.amount, item.unit)})
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground dark:bg-white/[0.07]">
                        {item.calories != null ? `${item.calories}` : "—"}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
