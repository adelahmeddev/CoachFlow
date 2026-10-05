"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Sparkles, History, GitCompare, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ClientNutritionView,
  type ClientPlanView,
} from "@/components/features/nutrition/client-nutrition-view"
import { PlanCompareView } from "@/components/features/nutrition/plan-compare-view"

interface NutritionPlanSwitcherProps {
  currPlan: ClientPlanView
  prevPlan: ClientPlanView | null
  chosenItemIds: string[]
  updatedAt?: Date | string | null
}

export function NutritionPlanSwitcher({
  currPlan,
  prevPlan,
  chosenItemIds,
  updatedAt,
}: NutritionPlanSwitcherProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const v = t.nutritionVersions
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialView = searchParams.get("view") === "compare" ? "compare" : "current"
  const [activeTab, setActiveTab] = useState<"current" | "previous" | "compare">(
    initialView
  )

  useEffect(() => {
    if (searchParams.get("view") === "compare") {
      setActiveTab("compare")
    }
  }, [searchParams])

  function handleTabChange(tab: "current" | "previous" | "compare") {
    setActiveTab(tab)
    if (tab === "compare") {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("view", "compare")
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
    } else if (searchParams.has("view")) {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete("view")
      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }
  }

  // Calculate if updated recently (within 7 days)
  const isRecentlyUpdated = (() => {
    if (!updatedAt || !prevPlan) return false
    const date = new Date(updatedAt)
    const now = new Date()
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= 7
  })()

  const formattedUpdateDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
      })
    : ""

  if (!prevPlan) {
    return <ClientNutritionView plan={currPlan} chosenItemIds={chosenItemIds} />
  }

  return (
    <div className="space-y-5">
      {/* 7-day updated notice banner */}
      {isRecentlyUpdated && activeTab !== "compare" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-xs">
          <div className="flex items-center gap-2 text-brand-800 dark:text-brand-200">
            <Sparkles className="size-4 shrink-0 text-brand-500" />
            <span>
              {v.planUpdatedBanner.replace("{date}", formattedUpdateDate)}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full text-xs font-bold border-brand-500/30 bg-background/80 hover:bg-brand-500/10"
            onClick={() => handleTabChange("compare")}
          >
            <span>{v.seeWhatChanged}</span>
            <ArrowRight className="ms-1.5 size-3 rtl:rotate-180" />
          </Button>
        </div>
      )}

      {/* Tabs segment switcher */}
      <div className="flex items-center p-1 rounded-2xl bg-muted/60 border border-border/40 backdrop-blur-md">
        <button
          type="button"
          onClick={() => handleTabChange("current")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200",
            activeTab === "current"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-3.5" />
          <span>{v.currentPlan}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("previous")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200",
            activeTab === "previous"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="size-3.5" />
          <span>{v.previousPlan}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("compare")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200",
            activeTab === "compare"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GitCompare className="size-3.5" />
          <span>{v.compareView}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "current" && (
        <ClientNutritionView plan={currPlan} chosenItemIds={chosenItemIds} />
      )}

      {activeTab === "previous" && (
        <ClientNutritionView
          plan={prevPlan}
          chosenItemIds={[]}
          readOnly={true}
        />
      )}

      {activeTab === "compare" && (
        <PlanCompareView prevPlan={prevPlan} currPlan={currPlan} />
      )}
    </div>
  )
}
