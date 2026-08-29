"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import type { WorkoutLog } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteWorkoutLogAction } from "@/server/actions/progress"
import { formatDate } from "@/lib/format"

interface WorkoutLogTableProps {
  logs: WorkoutLog[]
  clientId: string
}

export function WorkoutLogTable({ logs, clientId }: WorkoutLogTableProps) {
  const [logToDelete, setLogToDelete] = useState<WorkoutLog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No workout logs yet.</p>
      </div>
    )
  }

  async function handleDelete() {
    if (!logToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteWorkoutLogAction(clientId, logToDelete.id)
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete workout log")
        return
      }
      toast.success("Workout log deleted")
      setLogToDelete(null)
    } catch (e) {
      const err = e as { digest?: string }
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw e
      }
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Exercise</TableHead>
              <TableHead>Sets</TableHead>
              <TableHead>Reps</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>RPE</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(log.date)}
                </TableCell>
                <TableCell className="font-medium">{log.exerciseName}</TableCell>
                <TableCell>{log.sets ?? "—"}</TableCell>
                <TableCell>{log.reps ?? "—"}</TableCell>
                <TableCell>{log.weightKg ?? "—"}</TableCell>
                <TableCell>{log.rpe ?? "—"}</TableCell>
                <TableCell className="max-w-[160px] truncate">
                  {log.notes ?? "—"}
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete workout log for ${log.exerciseName}`}
                    onClick={() => setLogToDelete(log)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{log.exerciseName}</p>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete workout log for ${log.exerciseName}`} onClick={() => setLogToDelete(log)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(log.date)}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <span>Sets: {log.sets ?? "—"}</span>
              <span>Reps: {log.reps ?? "—"}</span>
              <span>{log.weightKg ?? "—"} kg</span>
              <span>RPE: {log.rpe ?? "—"}</span>
              <span className="col-span-2 truncate">{log.notes ?? ""}</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={logToDelete !== null} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete workout log?</DialogTitle>
            <DialogDescription>
              {logToDelete
                ? `This will permanently delete the log for "${logToDelete.exerciseName}" on ${formatDate(logToDelete.date)}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
