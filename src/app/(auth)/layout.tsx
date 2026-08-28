"use client"

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { BrandLogo } from "@/components/brand/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-background p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-brand-500/[0.07] blur-3xl sm:-top-32 sm:-end-32 sm:h-96 sm:w-96" />
        <div className="absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-brand-500/[0.04] blur-3xl sm:-bottom-32 sm:-start-32 sm:h-96 sm:w-96" />
        <div className="absolute inset-0 opacity-[0.03] texture-halftone" />
      </div>
      <main className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 sm:gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-medium ring-1 ring-brand-600/20 sm:h-20 sm:w-20">
            <BrandLogo variant="mark" height={42} width={64} priority className="drop-shadow-sm" alt="NANOUSH" />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-[28px]">
              NANOUSH
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              نظام إدارة المدرب الشخصي
            </p>
          </div>
        </div>
        <div className="w-full">{children}</div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <span className="text-xs text-muted-foreground/60">•</span>
          <span className="text-xs text-muted-foreground">© 2026 NANOUSH</span>
        </div>
      </main>
    </div>
  )
}