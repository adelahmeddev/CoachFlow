import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  evaluateClientActions,
  type ClientActionSnapshot,
} from "../src/lib/needs-action"

const NOW = new Date("2026-09-06T12:00:00Z").getTime()
const DAY = 24 * 60 * 60 * 1000
const iso = (daysFromNow: number) => new Date(NOW + daysFromNow * DAY).toISOString()

function healthy(): ClientActionSnapshot {
  return {
    clientId: "c1",
    clientName: "Ahmed",
    isActive: true,
    daysSinceActivity: 1,
    lastActivityAt: iso(-1),
    latestSubscription: { status: "ACTIVE", endDate: iso(30) },
    daysSinceInBody: 5,
    lastInbodyAt: iso(-5),
    pendingProofs: 0,
    lastProofAt: null,
    daysSinceCheckin: 0,
    lastCheckinAt: iso(0),
    pendingMedia: 0,
    lastMediaAt: null,
    nearestGoalDeadline: null,
  }
}

describe("needs-action 2.0", () => {
  it("emits nothing new for a healthy client", () => {
    assert.deepEqual(evaluateClientActions(healthy(), NOW), [])
  })

  it("flags pending media as MEDIUM with count and timestamp", () => {
    const items = evaluateClientActions(
      { ...healthy(), pendingMedia: 2, lastMediaAt: iso(-1) },
      NOW
    )
    const m = items.find((i) => i.kind === "media_pending")
    assert.equal(m?.priority, "MEDIUM")
    assert.equal(m?.count, 2)
    assert.equal(m?.at, iso(-1))
    assert.equal(m?.cta, "/clients/c1?tab=media")
  })

  it("flags a goal deadline within 7 days as LOW with title", () => {
    const items = evaluateClientActions(
      { ...healthy(), nearestGoalDeadline: { deadline: iso(4), title: "Reach 80kg" } },
      NOW
    )
    const g = items.find((i) => i.kind === "goal_deadline")
    assert.equal(g?.priority, "LOW")
    assert.equal(g?.days, 4)
    assert.equal(g?.title, "Reach 80kg")
    // Far deadlines stay quiet.
    assert.ok(
      !evaluateClientActions(
        { ...healthy(), nearestGoalDeadline: { deadline: iso(30), title: "X" } },
        NOW
      ).some((i) => i.kind === "goal_deadline")
    )
  })

  it("nudges once when yesterday's check-in exists but today's is missing", () => {
    const items = evaluateClientActions({ ...healthy(), daysSinceCheckin: 1, lastCheckinAt: iso(-1) }, NOW)
    assert.ok(items.some((i) => i.kind === "checkin_today" && i.priority === "LOW"))
    assert.ok(!items.some((i) => i.kind === "missed_checkin"))
  })

  it("carries event timestamps on every item", () => {
    const items = evaluateClientActions(
      {
        ...healthy(),
        daysSinceActivity: 9,
        lastActivityAt: iso(-9),
        pendingProofs: 1,
        lastProofAt: iso(0),
      },
      NOW
    )
    const inact = items.find((i) => i.kind === "inactive_5d")
    const proof = items.find((i) => i.kind === "payment_pending")
    assert.equal(inact?.at, iso(-9))
    assert.equal(proof?.at, iso(0))
  })

  it("still emits at most one item per kind", () => {
    const items = evaluateClientActions(
      {
        ...healthy(),
        daysSinceActivity: 10,
        pendingMedia: 3,
        nearestGoalDeadline: { deadline: iso(2), title: "G" },
        pendingProofs: 1,
      },
      NOW
    )
    const kinds = items.map((i) => i.kind)
    assert.equal(new Set(kinds).size, kinds.length)
  })
})
