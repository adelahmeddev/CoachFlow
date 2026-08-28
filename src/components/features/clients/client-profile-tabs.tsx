"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/client"
import { CLIENT_PROFILE_TABS, type ClientProfileTab } from "@/lib/constants/client-profile-tabs"

interface ClientProfileTabsProps {
  clientId: string
  activeTab: ClientProfileTab
  tabsContent: Record<ClientProfileTab, ReactNode>
}

const TAB_LABEL_MAP = {
  overview: (t: ReturnType<typeof useI18n>["t"]) => t.profile.tabs.overview,
  "body-composition": (t: ReturnType<typeof useI18n>["t"]) => t.profile.tabs.bodyComposition,
  nutrition: (t: ReturnType<typeof useI18n>["t"]) => t.profile.tabs.nutrition,
  "training-split": (t: ReturnType<typeof useI18n>["t"]) => t.profile.tabs.trainingSplit,
  progress: (t: ReturnType<typeof useI18n>["t"]) => t.profile.tabs.progress,
  subscription: (t: ReturnType<typeof useI18n>["t"]) => t.profile.tabs.subscription,
} as const

export function ClientProfileTabs({ clientId, activeTab, tabsContent }: ClientProfileTabsProps) {
  const router = useRouter()
  const { t } = useI18n()

  function handleTabChange(value: string) {
    if (value === "overview") {
      router.replace(`/clients/${clientId}`, { scroll: false })
    } else {
      router.replace(`/clients/${clientId}?tab=${value}`, { scroll: false })
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="!h-auto w-fit max-w-full flex-wrap items-center justify-start gap-2 rounded-full p-1.5">
        {CLIENT_PROFILE_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="!h-11 flex-none px-5 whitespace-nowrap"
          >
            {TAB_LABEL_MAP[tab.value](t)}
          </TabsTrigger>
        ))}
      </TabsList>
      {CLIENT_PROFILE_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-6">
          {tabsContent[tab.value]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
