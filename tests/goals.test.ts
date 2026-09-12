import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { daysUntilDeadline, goalProgress, isAutoSynced } from "../src/lib/goals"

describe("goalProgress", () => {
  it("tracks weight loss toward target", () => {
    assert.equal(goalProgress(100, 90, 80), 50)
    assert.equal(goalProgress(100, 80, 80), 100)
    assert.equal(goalProgress(100, 100, 80), 0)
  })

  it("tracks gains toward target", () => {
    assert.equal(goalProgress(60, 70, 80), 50)
    assert.equal(goalProgress(60, 80, 80), 100)
  })

  it("clamps overshoot and regression", () => {
    assert.equal(goalProgress(100, 70, 80), 100)
    assert.equal(goalProgress(100, 110, 80), 0)
  })

  it("returns null without a baseline or current value", () => {
    assert.equal(goalProgress(null, 90, 80), null)
    assert.equal(goalProgress(100, null, 80), null)
  })

  it("handles zero-span goals", () => {
    assert.equal(goalProgress(80, 80, 80), 100)
    assert.equal(goalProgress(80, 81, 80), 0)
  })
})

describe("isAutoSynced", () => {
  it("syncs body metrics from InBody, not manual types", () => {
    assert.equal(isAutoSynced("WEIGHT"), true)
    assert.equal(isAutoSynced("BODY_FAT"), true)
    assert.equal(isAutoSynced("MUSCLE"), true)
    assert.equal(isAutoSynced("STRENGTH"), false)
    assert.equal(isAutoSynced("CUSTOM"), false)
    assert.equal(isAutoSynced("MEASUREMENT"), false)
  })
})

describe("daysUntilDeadline", () => {
  const NOW = new Date("2026-09-06T12:00:00Z").getTime()
  it("returns null without a deadline", () => {
    assert.equal(daysUntilDeadline(null, NOW), null)
  })
  it("rounds up to whole days, negative when overdue", () => {
    const DAY = 24 * 60 * 60 * 1000
    assert.equal(daysUntilDeadline(new Date(NOW + 3 * DAY).toISOString(), NOW), 3)
    assert.equal(daysUntilDeadline(new Date(NOW - DAY).toISOString(), NOW), -1)
  })
})
