"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function SignOutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get("callbackUrl") || "/login"

  useEffect(() => {
    router.push(callbackUrl)
  }, [callbackUrl, router])

  return null
}