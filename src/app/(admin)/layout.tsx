import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { AppTopNav } from "@/components/layout/app-top-nav"
import { DEFAULT_BRANDING } from "@/server/services/branding.service"
import { BrandingProvider } from "@/components/branding/branding-provider"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login")
  }

  // Admins are not coaches — they always see the platform default branding.
  // Per-coach branding is managed (not applied) here.
  const branding = { ...DEFAULT_BRANDING, coachId: null as string | null }

  return (
    <BrandingProvider branding={branding}>
      <div className="min-h-dvh bg-background">
        <AppTopNav
          name={session.user.name ?? "Admin"}
          role={session.user.role}
          homeHref="/admin"
        />
        <main id="main-content" tabIndex={-1} className="scroll-mt-16 outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </BrandingProvider>
  )
}
