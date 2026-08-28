import type { Metadata } from "next"
import { getTrainerByJoinSlug } from "@/server/services/invite.service"
import { getI18n } from "@/lib/i18n"
import { JoinForm } from "@/components/features/join/join-form"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleX } from "lucide-react"
import { BrandLogo } from "@/components/brand/brand-logo"
import { LanguageSwitcher } from "@/components/layout/language-switcher"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.invite.title }
}

export default async function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { t } = await getI18n()
  const trainer = await getTrainerByJoinSlug(slug)

  if (!trainer) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="absolute top-4 end-4"><LanguageSwitcher /></div>
        <Card className="w-full max-w-md"><CardContent className="pt-6"><Alert variant="destructive"><CircleX className="size-4" /><AlertTitle>{t.invite.invalidTitle}</AlertTitle><AlertDescription>{t.invite.invalidDescription}</AlertDescription></Alert></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 end-4"><LanguageSwitcher /></div>
      <div className="flex w-full max-w-lg flex-col items-center gap-4">
        <BrandLogo height={48} width={82} priority className="mb-4" alt="NANOUSH" />
        <JoinForm slug={slug} trainerName={trainer.trainerName} />
      </div>
    </div>
  )
}
