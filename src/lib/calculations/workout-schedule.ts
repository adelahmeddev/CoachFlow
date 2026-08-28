import type { TrainingSplitDay } from "@/generated/prisma/client"

export function getTodaySplitDay(
  splitDays: TrainingSplitDay[],
  weekStartDay: string
) {
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  const targetDay = daysOfWeek.find((d) => d === weekStartDay) || "SAT"
  const targetIndex = daysOfWeek.indexOf(targetDay)

  const now = new Date()
  const currentDay =
    daysOfWeek[new Date(now).getDay() === 0 ? 6 : new Date(now).getDay() - 1]
  const currentIndex = daysOfWeek.indexOf(currentDay)

  const diff = (currentIndex - targetIndex + 7) % 7

  if (diff >= splitDays.length) {
    return null // Rest day
  }

  return splitDays[diff]
}