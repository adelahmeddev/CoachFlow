import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calcStreak, isCheckInRow } from "../src/lib/checkin"

describe("calcStreak", () => {
  it("returns zeros when there are no check-ins", () => {
    assert.deepEqual(calcStreak([], "2026-09-06"), {
      current: 0,
      longest: 0,
      lastCheckIn: null,
      checkedInToday: false,
    })
  })

  it("counts consecutive days including today", () => {
    const r = calcStreak(["2026-09-04", "2026-09-05", "2026-09-06"], "2026-09-06")
    assert.equal(r.current, 3)
    assert.equal(r.longest, 3)
    assert.equal(r.lastCheckIn, "2026-09-06")
    assert.equal(r.checkedInToday, true)
  })

  it("keeps the streak alive when today is missing but yesterday exists", () => {
    const r = calcStreak(["2026-09-04", "2026-09-05"], "2026-09-06")
    assert.equal(r.current, 2)
    assert.equal(r.checkedInToday, false)
  })

  it("breaks the streak on a missed day", () => {
    // Last check-in 2 days ago -> gap -> current is 0, longest preserved.
    const r = calcStreak(["2026-09-01", "2026-09-02", "2026-09-04"], "2026-09-06")
    assert.equal(r.current, 0)
    assert.equal(r.longest, 2)
    assert.equal(r.lastCheckIn, "2026-09-04")
  })

  it("ignores duplicates, unsorted input and future dates", () => {
    const r = calcStreak(
      ["2026-09-06", "2026-09-04", "2026-09-05", "2026-09-05", "2026-09-07", "2026-12-01"],
      "2026-09-06"
    )
    assert.equal(r.current, 3)
    assert.equal(r.longest, 3)
  })

  it("tracks the longest run separately from the current one", () => {
    const r = calcStreak(
      ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-09-06"],
      "2026-09-06"
    )
    assert.equal(r.current, 1)
    assert.equal(r.longest, 4)
  })
})

describe("isCheckInRow", () => {
  it("is true when any check-in field is set", () => {
    assert.equal(isCheckInRow({ energyLevel: 3 }), true)
    assert.equal(isCheckInRow({ sleepHours: 7 }), true)
    assert.equal(isCheckInRow({ moodLevel: 4 }), true)
    assert.equal(isCheckInRow({ notes: " sore legs " }), true)
  })

  it("is false for metric-only rows and blank notes", () => {
    assert.equal(
      isCheckInRow({ energyLevel: null, sleepHours: null, moodLevel: null, notes: null }),
      false
    )
    assert.equal(isCheckInRow({ notes: "   " }), false)
    assert.equal(isCheckInRow({}), false)
  })
})
