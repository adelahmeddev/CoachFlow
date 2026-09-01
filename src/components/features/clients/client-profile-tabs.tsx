"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/client"
import { CLIENT_PROFILE_TABS, type ClientProfileTab } from "@/lib/constants/client-profile-tabs"
import { SectionNav } from "@/components/ui/section-nav"

interface ClientProfileTabsProps {
  clientId: string
  activeTab: ClientProfileTab
  tabsContent: Record<ClientProfileTab, ReactNode>
}

export function ClientProfileTabs({ clientId, activeTab, tabsContent }: ClientProfileTabsProps) {
  const router = useRouter()

  function handleTabChange(value: string) {
    const key = value as ClientProfileTab
    if (key === "overview") {
      router.replace(`/clients/${clientId}`, { scroll: false })
    } else {
      router.replace(`/clients/${clientId}?tab=${key}`, { scroll: false })
    }
  }

  return (
    <div className="w-full space-y-4">
      <SectionNav clientId={clientId} active={activeTab as any} onChange={handleTabChange as any} />

      <div className="min-w-0">
        <div
          key={activeTab}
          className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
        >
          {tabsContent[activeTab]}
        </div>
      </div>
    </div>
  )
}
