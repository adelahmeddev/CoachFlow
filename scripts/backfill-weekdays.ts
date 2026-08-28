import "dotenv/config"
import { ScheduleMode, type Weekday } from "../src/generated/prisma/enums"
import { prisma } from "../src/lib/prisma"
import { autoAssignWeekdays } from "../src/lib/calculations/week-schedule"

/**
 * One-time idempotent backfill for the My Week feature:
 * - every existing split becomes FIXED_WEEKDAYS
 * - days without a weekday get one via even distribution from SAT
 *   (N days → offsets round(i*7/N))
 *
 * Safe to re-run: explicit weekdays are never overwritten and already-fixed
 * splits are skipped.
 */
async function main() {
  const splits = await prisma.trainingSplit.findMany({
    include: { days: { orderBy: { dayNumber: "asc" as const } } },
  })

  let splitsFixed = 0
  let daysAssigned = 0

  for (const split of splits) {
    if (split.scheduleMode !== ScheduleMode.FIXED_WEEKDAYS) {
      await prisma.trainingSplit.update({
        where: { id: split.id },
        data: { scheduleMode: ScheduleMode.FIXED_WEEKDAYS },
      })
      splitsFixed += 1
    }

    const assigned = autoAssignWeekdays(split.days.length)
    for (const [index, day] of split.days.entries()) {
      if (day.weekday) continue
      const weekday = assigned[index] ?? "SAT"
      await prisma.trainingSplitDay.update({
        where: { id: day.id },
        data: { weekday: weekday as Weekday },
      })
      daysAssigned += 1
    }
  }

  console.log(
    `backfill-weekdays: ${splits.length} split(s) scanned, ${splitsFixed} mode(s) fixed, ${daysAssigned} day(s) assigned`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
