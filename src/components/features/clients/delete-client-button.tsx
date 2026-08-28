"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import { interpolate } from "@/lib/i18n/format"
import { deleteClientAction } from "@/server/actions/clients"

export function DeleteClientButton({
  clientId,
  clientName,
  variant = "ghost",
  size = "sm",
  className,
}: {
  clientId: string
  clientName: string
  variant?: "ghost" | "outline" | "destructive"
  size?: "sm" | "default" | "icon" | "icon-sm"
  className?: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function confirmDelete() {
    setIsDeleting(true)
    const result = await deleteClientAction(clientId)
    setIsDeleting(false)
    if (!result.ok) {
      toast.error(t.clients.deleteClientFailed)
      return
    }
    toast.success(t.clients.deleteClientSuccess)
    setOpen(false)
    router.push("/clients")
    router.refresh()
  }

  return (
    <>
      <Button
        variant={variant === "destructive" ? "destructive" : variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        {t.clients.deleteClient}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.clients.deleteClientTitle}</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>
                {interpolate(t.clients.deleteClientConfirm, { name: clientName })}
              </span>
              <span className="block text-xs">{t.clients.deleteClientDescription}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t.common.loading : t.clients.deleteClient}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DeleteClientIconButton({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function confirmDelete() {
    setIsDeleting(true)
    const result = await deleteClientAction(clientId)
    setIsDeleting(false)
    if (!result.ok) {
      toast.error(t.clients.deleteClientFailed)
      return
    }
    toast.success(t.clients.deleteClientSuccess)
    setOpen(false)
    router.push("/clients")
    router.refresh()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={t.clients.deleteClient}
      >
        <Trash2 className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.clients.deleteClientTitle}</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>{interpolate(t.clients.deleteClientConfirm, { name: clientName })}</span>
              <span className="block text-xs">{t.clients.deleteClientDescription}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t.common.loading : t.clients.deleteClient}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
