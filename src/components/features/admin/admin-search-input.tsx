"use client"

import { useRef, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function AdminSearchInput({
  basePath,
  placeholder,
}: {
  basePath: string
  placeholder: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQ = searchParams.get("q") ?? ""

  function submit() {
    const params = new URLSearchParams(searchParams.toString())
    const value = inputRef.current?.value.trim() ?? ""
    if (value) {
      params.set("q", value)
    } else {
      params.delete("q")
    }
    params.delete("page")
    const qs = params.toString()
    startTransition(() =>
      router.replace(qs ? `${basePath}?${qs}` : basePath)
    )
  }

  return (
    <form
      className="relative flex-1 sm:max-w-xs"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        key={currentQ}
        defaultValue={currentQ}
        placeholder={placeholder}
        className="ps-8"
      />
      {isPending && (
        <Loader2 className="absolute end-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </form>
  )
}
