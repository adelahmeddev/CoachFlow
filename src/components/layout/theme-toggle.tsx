"use client"

import { useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"

function startCircleTransition(origin: HTMLElement, apply: () => void) {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !document.startViewTransition
  ) {
    apply()
    return
  }

  const rect = origin.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const root = document.documentElement
  root.style.setProperty("--vt-origin-x", `${x}px`)
  root.style.setProperty("--vt-origin-y", `${y}px`)
  root.style.setProperty("--vt-radius", `${radius}px`)
  root.classList.add("theme-transition")

  const transition = document.startViewTransition(() => {
    apply()
    return Promise.resolve()
  })
  transition.finished.finally(() => {
    root.classList.remove("theme-transition")
    root.style.removeProperty("--vt-origin-x")
    root.style.removeProperty("--vt-origin-y")
    root.style.removeProperty("--vt-radius")
  })
}

function updateThemeColor(theme: string) {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  )
  if (!meta) return
  meta.content =
    theme === "dark" ? "#242424" : theme === "light" ? "#F7F5F2" : "#242424"
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useI18n()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleToggle() {
    const next = resolvedTheme === "dark" ? "light" : "dark"
    const apply = () => setTheme(next)
    if (triggerRef.current) {
      startCircleTransition(triggerRef.current, apply)
    } else {
      apply()
    }
    updateThemeColor(next)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9" aria-label={t.common.theme.toggleTheme} title={t.common.theme.toggleTheme}>
        <Sun className="size-4" aria-hidden="true" />
      </Button>
    )
  }

  return (
    <Button
      ref={triggerRef}
      variant="ghost"
      size="icon"
      className="size-9 text-muted-foreground hover:text-foreground transition-colors"
      onClick={handleToggle}
      aria-label={t.common.theme.toggleTheme}
      title={t.common.theme.toggleTheme}
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  )
}
