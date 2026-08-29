import "dotenv/config"
import { ScheduleMode, type Weekday } from "../src/lib/db/enums"
import { pool } from "../src/lib/db"
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
  const splitsRes = await pool.query(`SELECT * FROM "TrainingSplit"`)
  const splits = splitsRes.rows as Array<{ id: string; scheduleMode: string }>

  let splitsFixed = 0
  let daysAssigned = 0

  for (const split of splits) {
    if (split.scheduleMode !== ScheduleMode.FIXED_WEEKDAYS) {
      await pool.query(
        `UPDATE "TrainingSplit" SET "scheduleMode" = $1::"ScheduleMode", "updatedAt" = NOW() WHERE "id" = $2`,
        [ScheduleMode.FIXED_WEEKDAYS, split.id]
      )
      splitsFixed += 1
    }

    const daysRes = await pool.query(
      `SELECT * FROM "TrainingSplitDay" WHERE "splitId" = $1 ORDER BY "dayNumber" ASC`,
      [split.id]
    )
    const days = daysRes.rows as Array<{ id: string; weekday: Weekday | null }>

    const assigned = autoAssignWeekdays(days.length)
    for (const [index, day] of days.entries()) {
      if (day.weekday) continue
      const weekday = assigned[index] ?? "SAT"
      await pool.query(
        `UPDATE "TrainingSplitDay" SET "weekday" = $1::"Weekday", "updatedAt" = NOW() WHERE "id" = $2`,
        [weekday, day.id]
      )
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
    await pool.end()
  })
