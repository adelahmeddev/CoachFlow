"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import {
  MealKind,
  QuantityUnit,
  SubstituteCategory,
} from "@/lib/db/enums"
import {
  SUPPLEMENT_DEFS_SEED,
  SUBSTITUTE_GROUPS_SEED,
} from "@/lib/nutrition-fixed"

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

export interface BuilderSupplementDef {
  name: string
  nameAr: string | null
  definition: string | null
  definitionAr: string | null
  importance: string | null
  importanceAr: string | null
}

export interface BuilderSubstituteItem {
  name: string
  nameAr: string | null
  amount: number | null
  unit: QuantityUnit
}

export interface BuilderSubstituteGroup {
  category: SubstituteCategory
  caloriesLabel: string | null
  items: BuilderSubstituteItem[]
}

export interface BuilderMealItem {
  foodName: string
  foodNameAr: string | null
  amount: number | null
  unit: QuantityUnit
  calories: number | null
  groupNumber: number
}

export interface BuilderMeal {
  kind: MealKind
  name: string
  nameAr: string | null
  items: BuilderMealItem[]
}

export interface NutritionBuilderData {
  name: string
  isGlobal?: boolean
  calories: number | null
  proteinGrams: number | null
  carbsGrams: number | null
  fatsGrams: number | null
  waterLiters: number | null
  coachMessage: string | null
  guidelines: string[]
  avoidFoods: string[]
  recommendedFoods: string[]
  supplementDefs: BuilderSupplementDef[]
  substituteGroups: BuilderSubstituteGroup[]
  meals: BuilderMeal[]
}

type SubmitResult =
  | { ok: true; id?: string }
  | { ok: false; error?: string }

interface NutritionBuilderProps {
  mode: "template" | "plan"
  initial: NutritionBuilderData
  templateId?: string
  planId?: string
  clientId?: string
}

function numOrNull(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const next = [...arr]
  const target = index + dir
  if (target < 0 || target >= next.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

const UNIT_OPTIONS: QuantityUnit[] = ["G", "ML", "PCS"]
const CATEGORY_ORDER: SubstituteCategory[] = ["CARB", "PROTEIN", "FAT", "FRUIT"]

export function NutritionBuilder({
  mode,
  initial,
  templateId,
  planId,
  clientId,
}: NutritionBuilderProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const n = t.nutrition
  const isAr = locale === "ar"

  const [name, setName] = useState(initial.name)
  const [calories, setCalories] = useState(initial.calories?.toString() ?? "")
  const [protein, setProtein] = useState(initial.proteinGrams?.toString() ?? "")
  const [carbs, setCarbs] = useState(initial.carbsGrams?.toString() ?? "")
  const [fats, setFats] = useState(initial.fatsGrams?.toString() ?? "")
  const [water, setWater] = useState(initial.waterLiters?.toString() ?? "")
  const [coachMessage, setCoachMessage] = useState(initial.coachMessage ?? "")

  const [guidelines, setGuidelines] = useState<string[]>(initial.guidelines)
  const [guidelineDraft, setGuidelineDraft] = useState("")
  const [avoidFoods, setAvoidFoods] = useState<string[]>(initial.avoidFoods)
  const [avoidDraft, setAvoidDraft] = useState("")
  const [recommended, setRecommended] = useState<string[]>(initial.recommendedFoods)
  const [recommendedDraft, setRecommendedDraft] = useState("")

  const [supplementDefs, setSupplementDefs] = useState<BuilderSupplementDef[]>(
    initial.supplementDefs.length
      ? initial.supplementDefs.map((d) => ({ ...d }))
      : SUPPLEMENT_DEFS_SEED.map((def) => ({
          name: def.name,
          nameAr: def.nameAr ?? "",
          definition: def.definition ?? "",
          definitionAr: def.definitionAr ?? "",
          importance: def.importance ?? "",
          importanceAr: def.importanceAr ?? "",
        }))
  )
  const [groups, setGroups] = useState<BuilderSubstituteGroup[]>(
    initial.substituteGroups.length
      ? initial.substituteGroups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i })) }))
      : SUBSTITUTE_GROUPS_SEED.map((group) => ({
          category: group.category,
          caloriesLabel: group.caloriesLabel ?? null,
          items: group.items.map((item) => ({
            name: item.name,
            nameAr: item.nameAr ?? null,
            amount: item.amount ?? null,
            unit: item.unit,
          })),
        }))
  )
  const [meals, setMeals] = useState<BuilderMeal[]>(
    initial.meals.map((m) => ({ ...m, items: m.items.map((i) => ({ ...i })) }))
  )

  const [saving, setSaving] = useState(false)

  function addToList(
    list: string[],
    setList: (v: string[]) => void,
    draft: string,
    setDraft: (v: string) => void
  ) {
    const value = draft.trim()
    if (!value) return
    setList([...list, value])
    setDraft("")
  }

  async function onSubmit() {
    if (!name.trim()) {
      toast.error(n.templateName)
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        calories,
        proteinGrams: protein,
        carbsGrams: carbs,
        fatsGrams: fats,
        waterLiters: water,
        coachMessage: coachMessage || null,
        guidelines,
        avoidFoods,
        recommendedFoods: recommended,
        supplementDefs: supplementDefs.map((d) => ({
          ...d,
          nameAr: d.nameAr || null,
          definition: d.definition || null,
          definitionAr: d.definitionAr || null,
          importance: d.importance || null,
          importanceAr: d.importanceAr || null,
        })),
        substituteGroups: groups.map((g) => ({
          category: g.category,
          caloriesLabel: g.caloriesLabel || null,
          items: g.items
            .filter((i) => i.name.trim() || i.nameAr?.trim())
            .map((i) => ({
              name: i.name || i.nameAr || "",
              nameAr: i.nameAr || null,
              amount: i.amount,
              unit: i.unit,
            })),
        })),
        meals: meals
          .filter((m) => m.name.trim() || m.nameAr?.trim())
          .map((m) => ({
            kind: m.kind,
            name: m.name || m.nameAr || "",
            nameAr: m.nameAr || null,
            items: m.items
              .filter((i) => i.foodName.trim() || i.foodNameAr?.trim())
              .map((i) => ({
                groupNumber: i.groupNumber,
                foodName: i.foodName || i.foodNameAr || "",
                foodNameAr: i.foodNameAr || null,
                amount: i.amount,
                unit: i.unit,
                calories: i.calories,
              })),
          })),
      }

      const { createNutritionTemplateAction, updateNutritionTemplateAction, savePlanContentAction } =
        await import("@/server/actions/nutrition")

      let result: SubmitResult
      if (mode === "template" && templateId) {
        result = await updateNutritionTemplateAction(templateId, payload)
      } else if (mode === "template") {
        result = await createNutritionTemplateAction(payload)
      } else if (planId && clientId) {
        result = await savePlanContentAction(planId, clientId, payload)
      } else {
        result = { ok: false, error: "MISSING_IDS" }
      }

      if (!result.ok) {
        toast.error(result.error === "UNAUTHORIZED" ? t.toasts.unauthorized : t.nutrition.genericError)
        return
      }

      toast.success(
        mode === "plan"
          ? n.updatedToast
          : templateId
            ? n.templateUpdatedToast
            : n.templateCreatedToast
      )
      if (mode === "template") {
        router.push("/nutrition-templates")
      } else {
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  /* ---------------- meal helpers ---------------- */

  function addMeal(kind: MealKind) {
    setMeals([
      ...meals,
      {
        kind,
        name: kind === MealKind.MEAL ? `${n.meal} ${meals.length + 1}` : `${n.snack} ${meals.length + 1}`,
        nameAr: "",
        items: [],
      },
    ])
  }

  function updateMeal(index: number, patch: Partial<BuilderMeal>) {
    setMeals(meals.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  function addItem(mealIndex: number, groupNumber: number) {
    const meal = meals[mealIndex]
    updateMeal(mealIndex, {
      items: [
        ...meal.items,
        {
          foodName: "",
          foodNameAr: "",
          amount: null,
          unit: "G" as QuantityUnit,
          calories: null,
          groupNumber,
        },
      ],
    })
  }

  function nextGroup(meal: BuilderMeal): number {
    return meal.items.reduce((max, item) => Math.max(max, item.groupNumber), 0) + 1
  }

  function groupCounts(meal: BuilderMeal): Map<number, number> {
    const counts = new Map<number, number>()
    for (const item of meal.items) {
      counts.set(item.groupNumber, (counts.get(item.groupNumber) ?? 0) + 1)
    }
    return counts
  }

  const unitLabel = (unit: QuantityUnit) =>
    unit === "G" ? n.weightG : unit === "ML" ? n.volumeMl : n.countPcs

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>{n.basicInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "template" && (
            <div className="space-y-2">
              <Label>{n.templateName}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={n.templateNamePlaceholder} className="min-h-[44px]" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>{n.calories}</Label>
              <Input type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label>{n.protein}</Label>
              <Input type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label>{n.carbs}</Label>
              <Input type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label>{n.fat}</Label>
              <Input type="number" inputMode="decimal" value={fats} onChange={(e) => setFats(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label>{n.water}</Label>
              <Input type="number" inputMode="decimal" value={water} onChange={(e) => setWater(e.target.value)} className="min-h-[44px]" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{n.coachMessage}</Label>
            <Textarea rows={4} value={coachMessage} onChange={(e) => setCoachMessage(e.target.value)} placeholder={n.coachMessagePlaceholder} />
          </div>

          {/* Guidelines */}
          <div className="space-y-2">
            <Label>{n.guidelines}</Label>
            <ul className="space-y-1">
              {guidelines.map((line, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 break-words">{line}</span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={n.remove} onClick={() => setGuidelines(guidelines.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={guidelineDraft}
                onChange={(e) => setGuidelineDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addToList(guidelines, setGuidelines, guidelineDraft, setGuidelineDraft)
                  }
                }}
                placeholder={n.addGuideline}
                className="min-h-[44px]"
              />
              <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" onClick={() => addToList(guidelines, setGuidelines, guidelineDraft, setGuidelineDraft)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Avoid / Recommended */}
          {([
            [n.avoidFoods, avoidFoods, setAvoidFoods, avoidDraft, setAvoidDraft],
            [n.recommendedFoods, recommended, setRecommended, recommendedDraft, setRecommendedDraft],
          ] as const).map(([label, list, setList, draft, setDraft], idx) => (
            <div key={idx} className="space-y-2">
              <Label>{label}</Label>
              <div className="flex flex-wrap gap-1">
                {list.map((item, i) => (
                  <Badge key={`${item}-${i}`} variant="secondary" className="gap-1">
                    <button type="button" onClick={() => setList(list.filter((_, j) => j !== i))}>×</button>
                    {item}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToList(list, setList, draft, setDraft)
                    }
                  }}
                  placeholder={n.addItemTag}
                  className="min-h-[44px]"
                />
                <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" onClick={() => addToList(list, setList, draft, setDraft)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Supplement definitions (FIXED) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{n.supplementsDefinitions}</CardTitle>
          <Badge variant="secondary">{n.fixedSection}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {supplementDefs.map((def, index) => (
            <div key={index} className="rounded-xl border p-3 space-y-3">
              <div className="space-y-1.5">
                <Label>{n.supplementName}</Label>
                <Input value={isAr ? (def.nameAr ?? "") : def.name} onChange={(e) => setSupplementDefs(supplementDefs.map((d, i) => (i === index ? { ...d, ...(isAr ? { nameAr: e.target.value } : { name: e.target.value }) } : d)))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label>{n.definition}</Label>
                <Textarea rows={2} value={isAr ? (def.definitionAr ?? "") : (def.definition ?? "")} onChange={(e) => setSupplementDefs(supplementDefs.map((d, i) => (i === index ? { ...d, ...(isAr ? { definitionAr: e.target.value } : { definition: e.target.value }) } : d)))} />
              </div>
              <div className="space-y-1.5">
                <Label>{n.importance}</Label>
                <Textarea rows={2} value={isAr ? (def.importanceAr ?? "") : (def.importance ?? "")} onChange={(e) => setSupplementDefs(supplementDefs.map((d, i) => (i === index ? { ...d, ...(isAr ? { importanceAr: e.target.value } : { importance: e.target.value }) } : d)))} />
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setSupplementDefs(supplementDefs.filter((_, i) => i !== index))}>
                  <Trash2 className="size-4" />{n.remove}
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setSupplementDefs([...supplementDefs, isAr ? { name: "", nameAr: "", definition: null, definitionAr: "", importance: null, importanceAr: "" } : { name: "", nameAr: null, definition: "", definitionAr: null, importance: "", importanceAr: null }])}>
            <Plus className="size-4" />{n.supplementName}
          </Button>
        </CardContent>
      </Card>

      {/* Substitutes (FIXED) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{n.substitutes}</CardTitle>
          <Badge variant="secondary">{n.fixedSection}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {CATEGORY_ORDER.map((category) => {
            const group = groups.find((g) => g.category === category)
            if (!group) return null
            const groupIndex = groups.indexOf(group)
            return (
              <div key={category} className="rounded-xl border p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{category}</Badge>
                  <Input value={group.caloriesLabel ?? ""} onChange={(e) => setGroups(groups.map((g, i) => (i === groupIndex ? { ...g, caloriesLabel: e.target.value } : g)))} placeholder={n.caloriesLabelLabel} className="h-9 w-auto flex-1 min-w-[160px]" />
                </div>
                <div className="space-y-2">
                  {group.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex flex-wrap items-center gap-2">
                      <Input value={isAr ? (item.nameAr ?? "") : item.name} onChange={(e) => setGroups(groups.map((g, i) => (i === groupIndex ? { ...g, items: g.items.map((it, j) => (j === itemIndex ? { ...it, ...(isAr ? { nameAr: e.target.value } : { name: e.target.value }) } : it)) } : g)))} placeholder={n.substituteItem} className="min-w-[140px] flex-1 min-h-[44px]" />
                      <Input type="number" inputMode="decimal" value={item.amount ?? ""} onChange={(e) => setGroups(groups.map((g, i) => (i === groupIndex ? { ...g, items: g.items.map((it, j) => (j === itemIndex ? { ...it, amount: numOrNull(e.target.value) } : it)) } : g)))} placeholder={n.quantity} className="w-24 min-h-[44px]" />
                      <Select value={item.unit} onValueChange={(v) => setGroups(groups.map((g, i) => (i === groupIndex ? { ...g, items: g.items.map((it, j) => (j === itemIndex ? { ...it, unit: v as QuantityUnit } : it)) } : g)))}>
                        <SelectTrigger className="h-11 w-auto min-w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (<SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={n.remove} className="size-10" onClick={() => setGroups(groups.map((g, i) => (i === groupIndex ? { ...g, items: g.items.filter((_, j) => j !== itemIndex) } : g)))}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setGroups(groups.map((g, i) => (i === groupIndex ? { ...g, items: [...g.items, { name: "", nameAr: null, amount: null, unit: "G" as QuantityUnit }] } : g)))}>
                  <Plus className="size-4" />{n.addItem}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Meals & Snacks */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{n.meals}</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => addMeal(MealKind.MEAL)}>
              <Plus className="size-4" />{n.addMeal}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addMeal(MealKind.SNACK)}>
              <Plus className="size-4" />{n.addSnack}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {meals.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{n.meals}: 0</p>}
          {meals.map((meal, mealIndex) => {
            const counts = groupCounts(meal)
            return (
              <div key={mealIndex} className="rounded-xl border p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={meal.kind === MealKind.SNACK ? "secondary" : "default"}>
                    {meal.kind === MealKind.SNACK ? n.snack : n.meal}
                  </Badge>
                  <Input value={isAr ? (meal.nameAr ?? "") : meal.name} onChange={(e) => updateMeal(mealIndex, isAr ? { nameAr: e.target.value } : { name: e.target.value })} placeholder={n.foodName} className="h-10 min-w-[160px] flex-1" />
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" className="size-10" aria-label={n.moveUp} disabled={mealIndex === 0} onClick={() => setMeals(move(meals, mealIndex, -1))}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" className="size-10" aria-label={n.moveDown} disabled={mealIndex === meals.length - 1} onClick={() => setMeals(move(meals, mealIndex, 1))}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" className="size-10 text-destructive" aria-label={n.remove} onClick={() => setMeals(meals.filter((_, i) => i !== mealIndex))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {meal.items.map((item, itemIndex) => {
                    const count = counts.get(item.groupNumber) ?? 0
                    return (
                      <div key={itemIndex} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2">
                        {count > 1 && <Badge variant="secondary" className="shrink-0">{n.chooseOne}</Badge>}
                        <Input value={isAr ? (item.foodNameAr ?? "") : item.foodName} onChange={(e) => updateMeal(mealIndex, { items: meal.items.map((it, j) => (j === itemIndex ? { ...it, ...(isAr ? { foodNameAr: e.target.value } : { foodName: e.target.value }) } : it)) })} placeholder={n.foodName} className="min-w-[130px] flex-1 min-h-[40px]" />
                        <Input type="number" inputMode="decimal" value={item.amount ?? ""} onChange={(e) => updateMeal(mealIndex, { items: meal.items.map((it, j) => (j === itemIndex ? { ...it, amount: numOrNull(e.target.value) } : it)) })} placeholder={n.quantity} className="w-20 min-h-[40px]" />
                        <Select value={item.unit} onValueChange={(v) => updateMeal(mealIndex, { items: meal.items.map((it, j) => (j === itemIndex ? { ...it, unit: v as QuantityUnit } : it)) })}>
                          <SelectTrigger className="h-10 w-auto min-w-[100px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((u) => (<SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <Input type="number" inputMode="numeric" value={item.calories ?? ""} onChange={(e) => updateMeal(mealIndex, { items: meal.items.map((it, j) => (j === itemIndex ? { ...it, calories: numOrNull(e.target.value) === null ? null : Math.trunc(numOrNull(e.target.value)!) } : it)) })} placeholder={n.caloriesOpt} className="w-24 min-h-[40px]" />
                        <Select
                          value={String(item.groupNumber)}
                          onValueChange={(v) => updateMeal(mealIndex, { items: meal.items.map((it, j) => (j === itemIndex ? { ...it, groupNumber: Number(v) } : it)) })}
                        >
                          <SelectTrigger className="h-10 w-auto min-w-[92px]" aria-label={n.makeAlternative}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[...counts.keys()].sort((a, b) => a - b).map((gNum) => (
                              <SelectItem key={gNum} value={String(gNum)}>
                                {gNum === 1 && count === 1 ? "—" : `G${gNum}`}
                              </SelectItem>
                            ))}
                            <SelectItem value={String(nextGroup(meal))}>+ G</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-0.5">
                          <Button type="button" variant="ghost" size="icon-sm" className="size-9" aria-label={n.moveUp} disabled={itemIndex === 0} onClick={() => updateMeal(mealIndex, { items: move(meal.items, itemIndex, -1) })}>
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" className="size-9" aria-label={n.moveDown} disabled={itemIndex === meal.items.length - 1} onClick={() => updateMeal(mealIndex, { items: move(meal.items, itemIndex, 1) })}>
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" className="size-9 text-destructive" aria-label={n.remove} onClick={() => updateMeal(mealIndex, { items: meal.items.filter((_, j) => j !== itemIndex) })}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addItem(mealIndex, nextGroup(meal))}>
                    <Plus className="size-4" />{n.addItem}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateMeal(mealIndex, { items: [...meal.items, { foodName: "", foodNameAr: null, amount: null, unit: "G", calories: null, groupNumber: nextGroup(meal) }] })}>
                    <Plus className="size-4" />{n.newOptionGroup}
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/95 p-4 backdrop-blur safe-bottom md:static md:m-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button type="button" onClick={onSubmit} disabled={saving} className="w-full min-h-[48px] md:w-auto md:min-w-[180px]">
          {saving ? n.saving : n.save}
        </Button>
      </div>
    </div>
  )
}
