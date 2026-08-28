import { CircleCheck } from "lucide-react"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.invite.success.title,
    description: t.invite.success.description,
  }
}

export default async function InviteSuccessPage() {
  const { t } = await getI18n()

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 pt-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CircleCheck className="size-7" />
          </div>
          <CardHeader className="space-y-1 p-0">
            <CardTitle className="text-xl">{t.invite.success.title}</CardTitle>
            <CardDescription>
              {t.invite.success.description}
            </CardDescription>
          </CardHeader>
        </CardContent>
      </Card>
    </div>
  )
}
