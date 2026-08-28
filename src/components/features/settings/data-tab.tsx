"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { useI18n } from "@/lib/i18n/client"
import { deleteAccountAction } from "@/server/actions/settings"

interface DataTabProps {
  clientCount: number
}

export function DataTab({ clientCount }: DataTabProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteAccountAction()
    } catch (e) {
      const err = e as { digest?: string }
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        toast.success(t.settings.data.deletedToast)
        router.push("/login")
        return
      }
      toast.error(t.settings.data.errors.deleteFailed)
      setIsDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.data.exportTitle}</CardTitle>
          <CardDescription>
            {t.settings.data.exportDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t.settings.data.clientsCount.replace(
              "{count}",
              String(clientCount)
            )}
          </p>
          <Button asChild variant="outline">
            <a href="/api/export/clients">
              <Download className="size-4" />
              {t.settings.data.exportButton}
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">
            {t.settings.data.deleteTitle}
          </CardTitle>
          <CardDescription>
            {t.settings.data.deleteDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {t.settings.data.deleteButton}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.data.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.settings.data.deleteConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              {t.settings.data.cancelDelete}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t.settings.data.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
