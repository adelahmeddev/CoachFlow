"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NutritionTemplatesTable } from "@/components/features/nutrition/nutrition-templates-table"
import { useI18n } from "@/lib/i18n/client"
import { useTemplates } from "@/hooks/useTemplates"
import { useClients } from "@/hooks/useClients"
import { useUnreadCount } from "@/hooks/useUnreadCount"
import { useSession } from "next-auth/react"

export default function NutritionTemplatesPage() {
  const { data: session, status } = useSession()
  const { t } = useI18n()

  const trainerProfileId = session?.user?.trainerProfileId ?? ""

  // Loading / auth guards
  if (status === "loading") return <p>Loading…</p>
  if (!trainerProfileId) {
    return (
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const { templates, loading: templatesLoading } = useTemplates(trainerProfileId)
  const { clients, loading: clientsLoading } = useClients(trainerProfileId)
  const { count: unreadCount } = useUnreadCount("TRAINER", trainerProfileId)

  // Optionally display the unread count somewhere (e.g., badge)
  // console.log('Unread messages:', unreadCount)

  if (templatesLoading || clientsLoading) {
    return <p className="mx-auto max-w-7xl p-4 md:p-8">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.nutrition.templates}</h1>
          <p className="text-sm text-muted-foreground">{t.nutrition.templatesDescription}</p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link href="/nutrition-templates/new">
            <Plus className="size-4" />
            {t.nutrition.newTemplate}
          </Link>
        </Button>
      </div>

      <NutritionTemplatesTable templates={templates} clients={clients} />
    </div>
  )
}
