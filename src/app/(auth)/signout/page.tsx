"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { signOut } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function SignOutPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/login"

  useEffect(() => {
    signOut({ callbackUrl, redirect: true })
  }, [callbackUrl])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Signing out…</p>
      </div>
    </div>
  )
}