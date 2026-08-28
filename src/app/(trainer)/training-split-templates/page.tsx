import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getTrainerTemplateData } from "@/server/services/training-split-template.service"
import { Button } from "@/components/ui/button"
import { TemplatesTable } from "@/components/features/training-split/templates-table"
import { getI18n } from "@/lib/i18n"

export default async function TrainingSplitTemplatesPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const data = await getTrainerTemplateData(session.user.trainerProfileId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.templates.title}
          </h1>
          <p className="text-muted-foreground">{t.templates.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/training-split-templates/new">
            <Plus className="me-1 h-4 w-4" />
            {t.templates.newTemplate}
          </Link>
        </Button>
      </div>

      <TemplatesTable own={data.own} global={data.global} />
    </div>
  )
}
