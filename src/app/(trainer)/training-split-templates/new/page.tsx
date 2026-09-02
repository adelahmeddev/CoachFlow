import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { listGlobalExercises } from "@/server/services/exercise.service"
import { Button } from "@/components/ui/button"
import { TemplateForm } from "@/components/features/training-split/template-form"
import { getI18n } from "@/lib/i18n"

export default async function NewTrainingSplitTemplatePage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const exercises = await listGlobalExercises()

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-2 ps-0 text-muted-foreground"
      >
        <Link href="/training-split-templates">
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t.templates.backToList}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.templates.newTemplate}
        </h1>
        <p className="text-muted-foreground">{t.templates.newSubtitle}</p>
      </div>

      <TemplateForm exercises={exercises} />
    </div>
  )
}
