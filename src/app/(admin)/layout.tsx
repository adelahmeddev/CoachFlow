import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { ADMIN_NAV_ITEMS } from "@/components/layout/nav-items"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar
        name={session.user.name ?? "Admin"}
        role={session.user.role}
        items={ADMIN_NAV_ITEMS}
        homeHref="/admin"
      />
      <main id="main-content" tabIndex={-1} className="scroll-mt-16 md:ms-[272px] outline-none">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
