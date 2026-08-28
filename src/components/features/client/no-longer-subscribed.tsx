"use client"

import { LogOut, ShieldX, MessageCircle } from "lucide-react"
import { signOut } from "next-auth/react"
import { useI18n } from "@/lib/i18n/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand/brand-logo"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export function NoLongerSubscribedCard() {
  const { t } = useI18n()
  const content = t.client.noLongerSubscribed

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-brand-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-brand-500/[0.04] blur-3xl" />
      </div>

      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden border bg-card shadow-medium">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" aria-hidden="true" />
        <CardHeader className="items-center pb-4 pt-8 text-center">
          <div className="mb-2 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-soft ring-1 ring-black/10 dark:from-zinc-800 dark:to-zinc-900 dark:ring-white/10">
            <ShieldX className="size-8" aria-hidden="true" />
          </div>
          <BrandLogo variant="mark" height={24} width={24} className="opacity-60" />
          <CardTitle className="text-balance text-xl font-bold tracking-tight sm:text-2xl">
            {content.title}
          </CardTitle>
          <CardDescription className="text-sm font-medium text-foreground/80">
            {content.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8 text-center">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {content.description}
          </p>

          <div className="rounded-xl border bg-muted/30 p-3 text-start">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              <span>{content.contactTrainer}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() => signOut({ callbackUrl: "/client/login" })}
              className="w-full shadow-soft"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {content.signOut}
            </Button>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/client/login" })}
              className="w-full"
            >
              {content.backToLogin}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60">NANOUSH • {new Date().getFullYear()}</p>
        </CardContent>
      </Card>
    </div>
  )
}
