"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { adminDeleteTrainerAction } from "@/server/actions/admin"

export function DeleteTrainerButton({ coachId, coachName }: { coachId: string; coachName: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete trainer "${coachName}"? This permanently deletes their clients, subscriptions, branding and all data. This cannot be undone.`)) return
        startTransition(async () => {
          const res = await adminDeleteTrainerAction(coachId)
          if (res.ok) {
            toast.success("Trainer deleted")
            router.push("/admin/trainers")
            router.refresh()
          } else toast.error(res.error)
        })
      }}
      className="gap-1.5"
    >
      <Trash2 className="size-4" />
      Delete Trainer
    </Button>
  )
}
