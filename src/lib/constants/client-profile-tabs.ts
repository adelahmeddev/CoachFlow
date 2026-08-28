export const CLIENT_PROFILE_TABS = [
  { value: "overview" },
  { value: "body-composition" },
  { value: "nutrition" },
  { value: "training-split" },
  { value: "progress" },
  { value: "subscription" },
] as const

export type ClientProfileTab = (typeof CLIENT_PROFILE_TABS)[number]["value"]

export const DEFAULT_CLIENT_PROFILE_TAB: ClientProfileTab = "overview"

export function isClientProfileTab(value: string | undefined): value is ClientProfileTab {
  return CLIENT_PROFILE_TABS.some((tab) => tab.value === value)
}
