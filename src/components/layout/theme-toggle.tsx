"use client"

import { useRef } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = ["light", "dark", "system"] as const
type ThemeOption = (typeof THEME_OPTIONS)[number]

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const

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
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const triggerRef = useRef<HTMLButtonElement>(null)

  function handleSelect(next: ThemeOption) {
    if (next === theme) return
    const apply = () => setTheme(next)
    if (triggerRef.current) {
      startCircleTransition(triggerRef.current, apply)
    } else {
      apply()
    }
    updateThemeColor(next)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label={t.common.theme.toggleTheme}
          title={t.common.theme.toggleTheme}
        >
          <Sun className="size-4 dark:hidden" aria-hidden="true" />
          <Moon className="hidden size-4 dark:block" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {THEME_OPTIONS.map((option) => {
          const Icon = THEME_ICONS[option]
          return (
            <DropdownMenuItem
              key={option}
              onSelect={() => handleSelect(option)}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="flex-1">{t.common.theme[option]}</span>
              {theme === option ? (
                <span className="size-1.5 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 dark:from-brand-500 dark:to-brand-600" />
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
