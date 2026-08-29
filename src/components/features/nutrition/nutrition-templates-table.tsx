"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Send, Trash2, Users } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import { interpolate } from "@/lib/i18n/format"
import { getGoalLabel } from "@/lib/i18n/labels"
import type { Goal } from "@/lib/db/enums"
import {
  assignTemplateAction,
  deleteNutritionTemplateAction,
} from "@/server/actions/nutrition"

export interface TemplateRow {
  id: string
  name: string
  isGlobal: boolean
  calories: number | null
  proteinGrams: number | null
  carbsGrams: number | null
  fatsGrams: number | null
  mealsCount: number
}

export interface AssignableClient {
  id: string
  fullName: string
  goal: Goal | null
}

export function NutritionTemplatesTable({
  templates,
  clients,
}: {
  templates: TemplateRow[]
  clients: AssignableClient[]
}) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const n = t.nutrition
  const [assignFor, setAssignFor] = useState<TemplateRow | null>(null)
  const [deleteFor, setDeleteFor] = useState<TemplateRow | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [goalFilter, setGoalFilter] = useState<string>("ALL")
  const [busy, setBusy] = useState(false)

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const matchesSearch = (client.fullName ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesGoal =
          goalFilter === "ALL" || client.goal === goalFilter
        return matchesSearch && matchesGoal
      }),
    [clients, search, goalFilter]
  )

  function goalLabelText(goal: Goal): string {
    return getGoalLabel(goal, locale) ?? goal
  }

  const allVisibleSelected =
    filteredClients.length > 0 &&
    filteredClients.every((c) => selected.has(c.id))

  function toggleClient(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        filteredClients.forEach((c) => next.delete(c.id))
      } else {
        filteredClients.forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  async function confirmAssign() {
    if (!assignFor || selected.size === 0) return
    setBusy(true)
    try {
      const result = await assignTemplateAction(assignFor.id, [...selected])
      if (!result.ok) {
        toast.error(t.toasts.genericError)
        return
      }
      toast.success(interpolate(n.assignedToast, { count: result.count }))
      setAssignFor(null)
      setSelected(new Set())
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleteFor) return
    setBusy(true)
    try {
      const result = await deleteNutritionTemplateAction(deleteFor.id)
      if (!result.ok) {
        toast.error(n.deleteFailed)
        return
      }
      toast.success(n.templateDeletedToast)
      setDeleteFor(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">{n.emptyDescription}</p>
          <Button asChild>
            <Link href="/nutrition-templates/new">{n.newTemplate}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {templates.map((template) => (
          <div key={template.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-medium">{template.name}</p>
              {template.isGlobal && <Badge variant="secondary" className="shrink-0">Global</Badge>}
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {template.calories ? `${template.calories} kcal` : "—"} · {template.mealsCount} {n.meals}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/nutrition-templates/${template.id}/edit`}>
                  <Pencil className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setAssignFor(template); setSelected(new Set()) }}>
                <Users className="size-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteFor(template)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{n.templateName}</TableHead>
              <TableHead className="text-end">{n.calories}</TableHead>
              <TableHead className="text-end">{n.protein}</TableHead>
              <TableHead className="text-end">{n.carbs}</TableHead>
              <TableHead className="text-end">{n.fat}</TableHead>
              <TableHead className="text-end">{n.meals}</TableHead>
              <TableHead className="text-end">—</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id} className="odd:bg-muted/10">
                <TableCell>
                  <span className="font-medium">{template.name}</span>{" "}
                  {template.isGlobal && <Badge variant="secondary">Global</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground text-right">{template.calories ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-right">{template.proteinGrams ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-right">{template.carbsGrams ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-right">{template.fatsGrams ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-right">{template.mealsCount}</TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm" className="size-9">
                      <Link href={`/nutrition-templates/${template.id}/edit`} aria-label={n.editTemplate}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setAssignFor(template); setSelected(new Set()) }}>
                      <Send className="size-4" />{n.assign}
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="size-9 text-destructive" aria-label={t.common.delete} onClick={() => setDeleteFor(template)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Assign dialog */}
      <Dialog open={!!assignFor} onOpenChange={(open) => !open && setAssignFor(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{n.assignToClients}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={n.searchClients} className="min-h-[44px]" />
            <Select value={goalFilter} onValueChange={setGoalFilter}>
              <SelectTrigger className="w-full min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.common.all}</SelectItem>
                {[...new Set(clients.map((c) => c.goal).filter(Boolean))].map((goal) => (
                  <SelectItem key={goal as string} value={goal as string}>{goalLabelText(goal as Goal)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox id="select-all" checked={allVisibleSelected} onCheckedChange={toggleAllVisible} className="size-5" />
              <Label htmlFor="select-all" className="text-sm font-normal">
                {t.common.all}
              </Label>
              <span className="ms-auto text-xs text-muted-foreground">
                {interpolate(n.selectedCount, { count: selected.size })}
              </span>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {filteredClients.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">{n.noClients}</p>
              )}
              {filteredClients.map((client) => (
                <label key={client.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-accent">
                  <Checkbox
                    checked={selected.has(client.id)}
                    onCheckedChange={() => toggleClient(client.id)}
                    className="size-5"
                  />
                  <span className="truncate text-sm">{client.fullName ?? "—"}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFor(null)} disabled={busy}>{t.common.cancel}</Button>
            <Button onClick={confirmAssign} disabled={busy || selected.size === 0}>
              {n.assign}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteFor} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{n.deleteConfirm}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFor(null)} disabled={busy}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
