"use client"

import { Settings as SettingsIcon } from "lucide-react"
import { signOut } from "next-auth/react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MySettingsSection() {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SettingsIcon className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>{lookup(t, "client.profile.settings")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/client/login" })}
        >
          {lookup(t, "client.profile.signOut")}
        </Button>
      </CardContent>
    </Card>
  )
}
