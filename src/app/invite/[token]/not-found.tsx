import { getI18n } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home } from "lucide-react"

export default async function InviteNotFound() {
  const { t } = await getI18n()

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <CardTitle className="text-xl">{t.common.notFound}</CardTitle>
          <CardDescription>{t.invite.invalidDescription}</CardDescription>
          <Button asChild>
            <Link href="/">
              <Home className="size-4 me-2" />
              {t.nav.dashboard}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}