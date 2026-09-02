import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getTemplateForEdit } from "@/server/services/training-split-template.service"
import { listGlobalExercises } from "@/server/services/exercise.service"
import { Button } from "@/components/ui/button"
import { TemplateForm } from "@/components/features/training-split/template-form"
import { getI18n } from "@/lib/i18n"

interface EditTemplatePageProps {
  params: Promise<{ templateId: string }>
}

export default async function EditTrainingSplitTemplatePage({
  params,
}: EditTemplatePageProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const { templateId } = await params
  const [template, exercises] = await Promise.all([
    getTemplateForEdit(templateId, session.user.trainerProfileId),
    listGlobalExercises(),
  ])

  if (!template) {
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
        <Link href="/training-split-templates">
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t.templates.backToList}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.templates.editTemplate}
        </h1>
        <p className="text-muted-foreground">{template.name}</p>
      </div>

      <TemplateForm exercises={exercises} template={template} />
    </div>
  )
}
