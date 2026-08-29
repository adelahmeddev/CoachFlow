"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, Pencil, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { getGoalLabel, getSplitTypeLabel } from "@/lib/i18n/labels"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  deleteTrainingSplitTemplateAction,
  duplicateTrainingSplitTemplateAction,
} from "@/server/actions/training-split-template"
import type { Goal, SplitType } from "@/lib/db/enums"

export interface TemplateRow {
  id: string
  name: string
  goal: Goal | null
  level: string | null
  splitType: SplitType
  daysPerWeek: number
  description: string | null
  isGlobal: boolean
}

interface TemplatesTableProps {
  own: TemplateRow[]
  global: TemplateRow[]
}

function TemplateCard({
  template,
  own,
  onDuplicate,
  onDelete,
}: {
  template: TemplateRow
  own: boolean
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { t, locale } = useI18n()

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{template.name}</CardTitle>
          {template.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {template.description}
            </p>
          ) : null}
        </div>
        {template.isGlobal ? (
          <Badge variant="secondary" className="shrink-0">
            {t.templates.global}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {template.goal ? (
            <Badge variant="outline">
              {getGoalLabel(template.goal, locale)}
            </Badge>
          ) : null}
          {template.level ? (
            <Badge variant="outline">{template.level}</Badge>
          ) : null}
          <Badge variant="outline">
            {getSplitTypeLabel(template.splitType, locale)}
          </Badge>
          <Badge variant="outline">
            {template.daysPerWeek} {t.templates.daysShort}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {own ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/training-split-templates/${template.id}/edit`}>
                <Pencil className="size-3.5" />
                {t.common.edit}
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(template.id)}
          >
            <Copy className="size-3.5" />
            {t.templates.duplicate}
          </Button>
          {own ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => onDelete(template.id)}
            >
              <Trash2 className="size-3.5" />
              {t.common.delete}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function TemplatesTable({ own, global }: TemplatesTableProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TemplateRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDuplicate(id: string) {
    setBusyId(id)
    const result = await duplicateTrainingSplitTemplateAction(id)
    if (!result.ok) {
      toast.error(result.error ?? t.toasts.genericError)
      setBusyId(null)
      return
    }
    toast.success(t.templates.duplicatedToast)
    setBusyId(null)
    router.push(`/training-split-templates/${result.templateId}/edit`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteTrainingSplitTemplateAction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
    if (!result.ok) {
      toast.error(result.error ?? t.templates.deleteFailed)
      return
    }
    toast.success(t.templates.deletedToast)
    router.refresh()
  }

  function handleDeleteClick(id: string) {
    const target = own.find((item) => item.id === id) ?? null
    setDeleteTarget(target)
  }

  function renderSection(
    title: string,
    items: TemplateRow[],
    emptyMessage: string
  ) {
    if (items.length === 0) {
      return (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            own={!template.isGlobal}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.templates.trainerTemplates}</h2>
        {renderSection(t.templates.trainerTemplates, own, t.templates.ownEmpty)}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.templates.globalTemplates}</h2>
        {renderSection(
          t.templates.globalTemplates,
          global,
          t.templates.globalEmpty
        )}
      </section>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.templates.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{t.templates.deleteConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || busyId !== null}
              onClick={handleDelete}
            >
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
