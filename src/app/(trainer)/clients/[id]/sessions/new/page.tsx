import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getSessionLogPageData } from "@/server/services/session-log.service"
import { Button } from "@/components/ui/button"
import { SessionLogForm } from "@/components/features/sessions/session-log-form"
import { getI18n } from "@/lib/i18n"

interface NewSessionPageProps {
  params: Promise<{ id: string }>
}

export default async function NewSessionPage({ params }: NewSessionPageProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const { id } = await params
  const data = await getSessionLogPageData(
    id,
    session.user.trainerProfileId
  )

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-2 ps-0 text-muted-foreground"
      >
        <Link href={`/clients/${id}?tab=progress`}>
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t.sessions.backToProgress}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.sessions.newSession}
        </h1>
        <p className="text-muted-foreground">
          {data.client.fullName ?? t.common.none}
        </p>
      </div>

      {data.activeSplit ? (
        <SessionLogForm clientId={data.client.id} split={data.activeSplit} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-sm font-semibold">
            {t.sessions.noActiveSplitTitle}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.sessions.noActiveSplitDescription}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={`/clients/${id}/training-split/new`}>
              {t.sessions.createSplit}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
