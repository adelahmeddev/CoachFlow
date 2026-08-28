"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface SettingsTabItem {
  value: string
  label: string
  content: ReactNode
}

export function SettingsTabs({ items }: { items: SettingsTabItem[] }) {
  return (
    <Tabs defaultValue={items[0]?.value ?? "profile"} className="w-full">
      <TabsList className="h-auto w-full max-w-full justify-start overflow-x-auto rounded-full px-1.5 py-1.5 no-scrollbar">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className="min-h-[36px] shrink-0">
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="pt-6">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
