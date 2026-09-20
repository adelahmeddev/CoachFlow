"use client"

import React, { useState } from "react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "./liquid-glass/glass-card"
import { TemplatePreviewDrawer, type TemplatePreviewData } from "./template-preview-drawer"
import { SplitType, TrainingDayFocus } from "@/lib/db/enums"
import {
  Sparkles,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface SplitStarterHubProps {
  templates: TemplatePreviewData[]
  cloneSources: {
    id: string
    client: { fullName: string | null }
    splitType: SplitType
    days: {
      focus: TrainingDayFocus
      customFocus?: string | null
      exercises: unknown[]
    }[]
  }[]
  activeSplitType?: SplitType
  hasExistingExercises: boolean
  onSelectPreset: (splitType: SplitType) => void
  onSelectTemplate: (template: TemplatePreviewData) => void
  onSelectClone: (splitId: string) => void
}

const PRESET_OPTIONS = [
  {
    type: SplitType.PUSH_PULL_LEGS,
    labelKey: "pushPullLegs",
    days: 6,
    glow: "PUSH",
    tagline: "High Frequency & Hypertrophy",
  },
  {
    type: SplitType.UPPER_LOWER,
    labelKey: "upperLower",
    days: 4,
    glow: "UPPER",
    tagline: "Balanced Strength & Recovery",
  },
  {
    type: SplitType.FULL_BODY,
    labelKey: "fullBody",
    days: 3,
    glow: "FULL_BODY",
    tagline: "Maximum Efficiency & Consistency",
  },
  {
    type: SplitType.BRO_SPLIT,
    labelKey: "broSplit",
    days: 5,
    glow: "SHOULDERS_ARMS",
    tagline: "Targeted Single-Muscle Focus",
  },
]

export function SplitStarterHub({
  templates,
  cloneSources,
  activeSplitType,
  hasExistingExercises,
  onSelectPreset,
  onSelectTemplate,
  onSelectClone,
}: SplitStarterHubProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<"presets" | "templates" | "clone">("presets")
  const [isCollapsed, setIsCollapsed] = useState(hasExistingExercises)
  const [previewTemplate, setPreviewTemplate] = useState<TemplatePreviewData | null>(null)

  return (
    <div className="space-y-3">
      <TemplatePreviewDrawer
        template={previewTemplate}
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onApply={onSelectTemplate}
      />

      <GlassCard variant="neutral" className="p-4 sm:p-5" showSheen={true}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 border border-brand-500/25">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {t.trainingSplit.startFromTemplate} &amp; Presets
              </h3>
              <p className="text-xs text-muted-foreground">
                Quick-load a science-based split preset, saved template, or past client schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            {/* Segmented Mode Selector */}
            <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("presets")
                  setIsCollapsed(false)
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-medium transition-all",
                  activeTab === "presets"
                    ? "bg-brand-500 text-white shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Presets
              </button>
              {templates.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("templates")
                    setIsCollapsed(false)
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-medium transition-all",
                    activeTab === "templates"
                      ? "bg-brand-500 text-white shadow-glow"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Templates ({templates.length})
                </button>
              )}
              {cloneSources.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("clone")
                    setIsCollapsed(false)
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-medium transition-all",
                    activeTab === "clone"
                      ? "bg-brand-500 text-white shadow-glow"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Clone ({cloneSources.length})
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
              className="rounded-lg text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-white/10">
            {activeTab === "presets" && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {PRESET_OPTIONS.map((preset) => {
                  const isSelected = activeSplitType === preset.type
                  const label = lookup(t, `trainingSplit.splitTypes.${preset.labelKey}`) ?? preset.type

                  return (
                    <button
                      key={preset.type}
                      type="button"
                      onClick={() => onSelectPreset(preset.type)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-xl border p-3.5 text-start transition-all duration-200",
                        "hover:-translate-y-0.5 active:scale-[0.98]",
                        isSelected
                          ? "border-brand-400/60 bg-brand-500/15 ring-1 ring-brand-400/40 shadow-glow"
                          : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground group-hover:text-brand-300 transition-colors">
                          {label}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-white/15">
                          {preset.days} Days
                        </Badge>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
                        {preset.tagline}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}

            {activeTab === "templates" && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-start hover:border-white/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pe-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">{template.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                          {template.daysPerWeek}D
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {template.days.length} Days · {lookup(t, `trainingSplit.splitTypes.${template.splitType.toLowerCase()}`) ?? template.splitType}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPreviewTemplate(template)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-primary"
                        title="Preview template"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => onSelectTemplate(template)}
                        className="rounded-lg text-xs h-7 px-2.5"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "clone" && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {cloneSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-start hover:border-white/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pe-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">
                          {source.client.fullName ?? t.common.none}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                          {source.days.length}D
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {lookup(t, `trainingSplit.splitTypes.${source.splitType.toLowerCase()}`) ?? source.splitType}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => onSelectClone(source.id)}
                      className="rounded-lg text-xs h-7 px-2.5 shrink-0"
                    >
                      <Copy className="size-3 me-1" />
                      Clone
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
