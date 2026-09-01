import Link from "next/link"
import { getCurrentSession } from "@/server/auth"
import {
  getCachedActivePlanFull,
  getPlanHistory,
  getTemplatesForTrainer,
  getTodayMealChoices,
} from "@/server/services/nutrition.service"
import { AssignTemplateFromClient } from "@/components/features/nutrition/assign-template-from-client"
import { RefreshFromTemplateButton } from "@/components/features/nutrition/refresh-plan-button"
import { ChangePlanDialog } from "@/components/features/nutrition/change-plan-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import { Flame, Wheat, Droplets, GlassWater, Apple, UtensilsCrossed, Pill, Shuffle, CheckCircle2, Clock3, Leaf, Sparkles, Dumbbell } from "lucide-react"

export async function NutritionTab({ clientId }: { clientId: string }) {
  const { t, locale } = await getI18n()
  const isAr = locale === "ar"
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return <p className="text-destructive">{t.toasts.unauthorized}</p>
  }

  const trainerProfileId = session.user.trainerProfileId
  const [plan, todayChoices, history, templates] = await Promise.all([
    getCachedActivePlanFull(clientId),
    getTodayMealChoices(clientId),
    getPlanHistory(clientId),
    getTemplatesForTrainer(trainerProfileId),
  ])

  const itemLabels = new Map<string, string>()
  for (const meal of plan?.meals ?? []) {
    for (const item of meal.items) {
      itemLabels.set(item.id, `${meal.name} · ${item.foodName}`)
    }
  }

  // macro percentages for visual bar
  const protein = plan?.proteinGrams ?? 0
  const carbs = plan?.carbsGrams ?? 0
  const fats = plan?.fatsGrams ?? 0
  const macroTotal = (protein*4) + (carbs*4) + (fats*9)
  const pPct = macroTotal ? Math.round((protein*4)/macroTotal*100) : 0
  const cPct = macroTotal ? Math.round((carbs*4)/macroTotal*100) : 0
  const fPct = macroTotal ? 100 - pPct - cPct : 0

  return (
    <div className="space-y-6">
      {!plan ? (
        <AssignTemplateFromClient
          clientId={clientId}
          templates={templates.map(tpl => ({
            id: tpl.id,
            name: tpl.name,
            calories: tpl.calories,
            mealsCount: tpl._count.meals,
            isGlobal: tpl.isGlobal,
          }))}
        />
      ) : (
        <>
          {/* HERO — Cals + macros + coach message */}
          <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-energy-500/[0.03] to-transparent" aria-hidden="true" />
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br from-brand-500/15 to-energy-500/10 blur-3xl" aria-hidden="true" />
            <div className="relative p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300">
                      <Apple className="size-3.5" />
                      {isAr ? "خطة الأكل النشطة" : "Active Nutrition Plan"}
                    </span>
                    <Badge variant="secondary" className="rounded-full bg-white/80 dark:bg-white/10">
                      {t.nutrition.planFromTemplate.replace("{name}", plan.template?.name ?? t.nutrition.customPlanBadge)}
                    </Badge>
                    {plan.coachMessage && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="size-3 text-energy-500" />
                        {isAr ? "رسالة الكوتش" : "coach note"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft ring-1 ring-white/20">
                        <Flame className="size-7" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.nutrition.calories}</p>
                        <p className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">
                          {plan.calories ?? "—"}
                          <span className="ms-1 text-sm font-medium text-muted-foreground">kcal</span>
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-performance-500/10 px-2.5 py-1 font-semibold text-performance-700 ring-1 ring-performance-500/15">{protein}g P</span>
                      <span className="rounded-full bg-energy-500/10 px-2.5 py-1 font-semibold text-energy-700 ring-1 ring-energy-500/15">{carbs}g C</span>
                      <span className="rounded-full bg-muscle-500/10 px-2.5 py-1 font-semibold text-muscle-700 ring-1 ring-muscle-500/15">{fats}g F</span>
                      <span className="rounded-full bg-sky-500/10 px-2.5 py-1 font-semibold text-sky-700 ring-1 ring-sky-500/15">{plan.waterLiters ?? "—"}L</span>
                    </div>
                  </div>

                  {macroTotal > 0 && (
                    <div className="space-y-2 max-w-xl">
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        <span className="bg-gradient-to-r from-performance-500 to-performance-400" style={{ width: `${pPct}%` }} />
                        <span className="bg-gradient-to-r from-energy-500 to-energy-400" style={{ width: `${cPct}%` }} />
                        <span className="bg-gradient-to-r from-muscle-500 to-muscle-400" style={{ width: `${fPct}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] font-medium">
                        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-performance-500" /> Protein {pPct}%</span>
                        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-energy-500" /> Carbs {cPct}%</span>
                        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-muscle-500" /> Fats {fPct}%</span>
                      </div>
                    </div>
                  )}

                  {plan.coachMessage && (
                    <p className="max-w-2xl rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {plan.coachMessage}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RefreshFromTemplateButton planId={plan.id} clientId={clientId} />
                    <ChangePlanDialog clientId={clientId} templates={templates.map(tpl => ({ id: tpl.id, name: tpl.name, calories: tpl.calories ?? 0, mealsCount: tpl._count.meals, isGlobal: tpl.isGlobal }))} />
                    <Button asChild size="sm" className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600">
                      <a href={`/clients/${clientId}/nutrition/edit?section=basic`} target="_blank">{isAr ? "تعديل" : "Edit"}</a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center lg:text-end">
                    {isAr ? "آخر تحديث" : "Last updated"}: {formatDate(plan.updatedAt ?? plan.createdAt, locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI — macro cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 p-5 pt-0">
            {[
              { icon: Flame, label: t.nutrition.calories, value: plan.calories, unit: "kcal", gradient: "from-brand-500 to-energy-500", bg: "bg-brand-500/10 text-brand-600 dark:text-brand-400" },
              { icon: Dumbbell, label: "Protein", value: plan.proteinGrams, unit: "g", gradient: "from-performance-500 to-performance-600", bg: "bg-performance-500/10 text-performance-600 dark:text-performance-400" },
              { icon: Wheat, label: "Carbs", value: plan.carbsGrams, unit: "g", gradient: "from-energy-500 to-energy-600", bg: "bg-energy-500/10 text-energy-600 dark:text-energy-400" },
              { icon: Droplets, label: "Fats", value: plan.fatsGrams, unit: "g", gradient: "from-muscle-500 to-muscle-600", bg: "bg-muscle-500/10 text-muscle-600 dark:text-muscle-400" },
              { icon: GlassWater, label: "Water", value: plan.waterLiters, unit: "L", gradient: "from-sky-500 to-sky-600", bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
            ].map((k) => (
              <div key={k.label} className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all">
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent opacity-60`} aria-hidden="true" />
                <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${k.bg}`}>
                  <k.icon className="size-5" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-2xl font-extrabold leading-none tabular-nums">
                  {k.value ?? "—"}
                  <span className="ms-1 text-xs font-medium text-muted-foreground">{k.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Meal overview */}
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
                <UtensilsCrossed className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight">{isAr ? "نظرة على الوجبات" : "Meals Overview"}</h3>
              <Badge variant="outline" className="rounded-full">{plan.meals.length} {isAr ? "وجبات" : "meals"}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plan.meals.map((meal) => (
                <div key={meal.id} className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/15 to-transparent" aria-hidden="true" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.items.length} {isAr ? "أصناف" : "items"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{meal.items.length}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {meal.items.slice(0,3).map((item) => (
                      <li key={item.id} className="flex items-center gap-2 truncate text-sm">
                        <span className="size-1.5 rounded-full bg-brand-500/60 shrink-0" aria-hidden="true" />
                        <span className="truncate text-muted-foreground">{item.foodName}</span>
                        {item.amount ? <span className="ms-auto shrink-0 text-xs tabular-nums font-medium">{item.amount}{item.unit}</span> : null}
                      </li>
                    ))}
                    {meal.items.length > 3 && (
                      <li className="text-xs text-muted-foreground">+{meal.items.length - 3} {isAr ? "أصناف كمان" : "more"}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Supplements */}
          <div className="px-5 pb-5">
            <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-performance-500 to-performance-600 text-white shadow-soft">
                    <Pill className="size-4" />
                  </span>
                  <h3 className="text-sm font-bold">{isAr ? "المكملات" : "Supplements"} </h3>
                  <Badge variant="outline" className="rounded-full">{plan.supplementDefs.length}</Badge>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <a href={`/clients/${clientId}/nutrition/edit?section=supplements`} target="_blank">{isAr ? "تعديل" : "Edit"}</a>
                </Button>
              </div>
              <div className="p-4">
                {plan.supplementDefs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{isAr ? "مفيش مكملات متسجلة" : "No supplements defined"}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.supplementDefs.map((def) => (
                      <div key={def.id} className="rounded-xl border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold">{def.name}</p>
                          <Badge variant="secondary" className="rounded-full bg-performance-500/10 text-performance-700 ring-1 ring-performance-500/15 text-[11px]">{def.importance}</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed">{def.definition}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Substitutes */}
          <div className="px-5 pb-5">
            <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-energy-500 to-brand-500 text-white shadow-soft">
                    <Shuffle className="size-4" />
                  </span>
                  <h3 className="text-sm font-bold">{isAr ? "البدائل" : "Substitutes"}</h3>
                  <Badge variant="outline" className="rounded-full">{plan.substituteGroups.length}</Badge>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <a href={`/clients/${clientId}/nutrition/edit?section=substitutes`} target="_blank">{isAr ? "تعديل" : "Edit"}</a>
                </Button>
              </div>
              <div className="p-4">
                {plan.substituteGroups.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{isAr ? "مفيش بدائل" : "No substitutes defined"}</p>
                ) : (
                  <div className="space-y-3">
                    {plan.substituteGroups.map((g) => (
                      <div key={g.id} className="rounded-xl border bg-card p-3">
                        <p className="text-sm font-bold flex items-center gap-2">
                          <Leaf className="size-4 text-performance-500" />
                          {g.category}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {g.items.map((it) => (
                            <span key={it.id} className="inline-flex items-center rounded-full border bg-muted px-2.5 py-1 text-xs font-medium">
                              {it.name} {it.amount ? <span className="ms-1 tabular-nums text-muted-foreground">{it.amount}{it.unit}</span> : null}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meals & Snacks detailed */}
          <div className="px-5 pb-5">
            <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-muscle-500 text-white shadow-soft">
                    <UtensilsCrossed className="size-4" />
                  </span>
                  <h3 className="text-sm font-bold">{isAr ? "الوجبات والتفاصيل" : "Meals & Snacks"}</h3>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <a href={`/clients/${clientId}/nutrition/edit?section=meals`} target="_blank">{isAr ? "تعديل" : "Edit"}</a>
                </Button>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.meals.map((meal) => (
                  <div key={meal.id} className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-sm font-bold">{meal.name}</p>
                    <ul className="mt-2 space-y-1.5">
                      {meal.items.map((it) => (
                        <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate">{it.foodName}</span>
                          <span className="shrink-0 rounded-full bg-card border px-2 py-0.5 text-xs tabular-nums">{it.amount ? `${it.amount}${it.unit}` : "—"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today’s choices */}
          <div className="px-5 pb-5">
            <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
              <div className="flex items-center gap-2 border-b bg-muted/20 p-4">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-performance-500 to-performance-600 text-white shadow-soft">
                  <CheckCircle2 className="size-4" />
                </span>
                <h3 className="text-sm font-bold">{t.nutrition.todayChoices}</h3>
                {todayChoices.length > 0 && <Badge className="rounded-full bg-performance-500 text-white">{todayChoices.length} {isAr ? "اختيار" : "picked"}</Badge>}
              </div>
              <div className="p-4">
                {todayChoices.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Clock3 className="size-6" />
                    </span>
                    <p className="text-sm text-muted-foreground">{t.nutrition.noChoicesYet}</p>
                    <p className="text-xs text-muted-foreground/70">{isAr ? "البطل لسه ماخترش وجبته النهاردة" : "No picks yet today"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {todayChoices.map((itemId) => (
                      <div key={itemId} className="flex min-h-[44px] items-center gap-3 rounded-xl border bg-performance-500/5 px-3 ring-1 ring-performance-500/15">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-performance-500 text-white shadow-soft">✓</span>
                        <span className="text-sm break-words font-medium">{itemLabels.get(itemId) ?? itemId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/20 p-4">
          <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Clock3 className="size-4" />
          </span>
          <h3 className="text-sm font-bold">{t.nutrition.historyTable}</h3>
        </div>
        <div className="p-4">
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.profile.overview.noNutritionYet}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.date}</TableHead>
                    <TableHead>{t.nutrition.plan}</TableHead>
                    <TableHead>{t.admin.subscriptions.columns.status}</TableHead>
                    <TableHead>{t.nutrition.calories}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="tabular-nums">{formatDate(row.startDate ?? row.createdAt, locale)}</TableCell>
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {row.template?.name ?? t.nutrition.customPlanBadge}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"} className="rounded-full">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{row.calories ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
