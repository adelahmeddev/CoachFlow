"use client"

import { useState } from "react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { Stethoscope, ChevronDown, ChevronUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

interface ClientHealthSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: FieldErrors<any>
  disabled?: boolean
  defaultOpen?: boolean
}

export function ClientHealthSection({
  register,
  errors,
  disabled = false,
  defaultOpen = false,
}: ClientHealthSectionProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-3.5 text-start transition-colors hover:bg-destructive/10 rounded-xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <Stethoscope className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold leading-tight text-destructive">
                {t.invite.health.sectionTitle}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {t.invite.health.sectionDescription}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-destructive/10 p-3.5 space-y-4 animate-in fade-in-50 duration-200">
          <div className="space-y-1">
            <Label htmlFor="injuries" className="text-xs font-medium">
              {t.invite.health.injuries}
            </Label>
            <Textarea
              id="injuries"
              rows={2}
              placeholder={t.invite.health.injuriesPlaceholder}
              disabled={disabled}
              className="resize-none text-sm"
              {...register("injuries")}
            />
            {errors?.injuries?.message && (
              <p className="text-xs text-destructive">
                {String(errors.injuries.message)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="healthConditions" className="text-xs font-medium">
              {t.invite.health.healthConditions}
            </Label>
            <Textarea
              id="healthConditions"
              rows={2}
              placeholder={t.invite.health.healthConditionsPlaceholder}
              disabled={disabled}
              className="resize-none text-sm"
              {...register("healthConditions")}
            />
            {errors?.healthConditions?.message && (
              <p className="text-xs text-destructive">
                {String(errors.healthConditions.message)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="medications" className="text-xs font-medium">
              {t.invite.health.medications}
            </Label>
            <Textarea
              id="medications"
              rows={2}
              placeholder={t.invite.health.medicationsPlaceholder}
              disabled={disabled}
              className="resize-none text-sm"
              {...register("medications")}
            />
            {errors?.medications?.message && (
              <p className="text-xs text-destructive">
                {String(errors.medications.message)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
