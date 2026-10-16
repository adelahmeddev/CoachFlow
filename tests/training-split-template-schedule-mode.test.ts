import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { trainingSplitTemplateSchema } from "@/lib/validations/training-split-template"
import { ScheduleMode, SplitType, TrainingDayFocus, Weekday } from "@/lib/db/enums"

describe("trainingSplitTemplateSchema scheduleMode & weekday validation", () => {
  it("defaults scheduleMode to FIXED_WEEKDAYS when omitted", () => {
    const data = {
      name: "Strength Template",
      splitType: SplitType.FULL_BODY,
      daysPerWeek: 3,
      days: [
        {
          focus: TrainingDayFocus.FULL_BODY,
          exercises: [],
        },
      ],
    }
    const parsed = trainingSplitTemplateSchema.parse(data)
    assert.equal(parsed.scheduleMode, ScheduleMode.FIXED_WEEKDAYS)
  })

  it("accepts SEQUENTIAL scheduleMode", () => {
    const data = {
      name: "Sequential Template",
      splitType: SplitType.FULL_BODY,
      daysPerWeek: 3,
      scheduleMode: ScheduleMode.SEQUENTIAL,
      days: [
        {
          focus: TrainingDayFocus.FULL_BODY,
          exercises: [],
        },
      ],
    }
    const parsed = trainingSplitTemplateSchema.parse(data)
    assert.equal(parsed.scheduleMode, ScheduleMode.SEQUENTIAL)
  })

  it("accepts FLEXIBLE scheduleMode", () => {
    const data = {
      name: "Flexible On-Demand Template",
      splitType: SplitType.FULL_BODY,
      daysPerWeek: 3,
      scheduleMode: ScheduleMode.FLEXIBLE,
      days: [
        {
          focus: TrainingDayFocus.FULL_BODY,
          exercises: [],
        },
      ],
    }
    const parsed = trainingSplitTemplateSchema.parse(data)
    assert.equal(parsed.scheduleMode, ScheduleMode.FLEXIBLE)
  })

  it("persists optional weekday in template days", () => {
    const data = {
      name: "Fixed Days Template",
      splitType: SplitType.UPPER_LOWER,
      daysPerWeek: 2,
      scheduleMode: ScheduleMode.FIXED_WEEKDAYS,
      days: [
        {
          focus: TrainingDayFocus.UPPER,
          weekday: Weekday.SAT,
          exercises: [],
        },
        {
          focus: TrainingDayFocus.LOWER,
          weekday: Weekday.MON,
          exercises: [],
        },
      ],
    }
    const parsed = trainingSplitTemplateSchema.parse(data)
    assert.equal(parsed.days[0]?.weekday, Weekday.SAT)
    assert.equal(parsed.days[1]?.weekday, Weekday.MON)
  })
})
