import { z } from "zod"
import {
  CLIENT_PROFILE_TABS,
  type ClientProfileTab,
} from "@/lib/constants/client-profile-tabs"

export const clientProfileTabSchema = z.enum(
  CLIENT_PROFILE_TABS.map((tab) => tab.value) as [string, ...string[]]
)

export function parseClientProfileTab(value: string | undefined): ClientProfileTab | undefined {
  const parsed = clientProfileTabSchema.safeParse(value)
  return parsed.success ? (parsed.data as ClientProfileTab) : undefined
}
