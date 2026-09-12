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
    latestSubscription: { status: "ACTIVE", endDate: iso(30) },
    daysSinceInBody: 5,
    pendingProofs: 0,
    daysSinceCheckin: 0,
  }
}

const kinds = (s: ClientActionSnapshot) =>
  evaluateClientActions(s, NOW).map((i) => `${i.priority}:${i.kind}`)

describe("evaluateClientActions", () => {
  it("emits nothing for a healthy client", () => {
    assert.deepEqual(evaluateClientActions(healthy(), NOW), [])
  })

  it("flags >5 days inactive as HIGH and 4 days as MEDIUM", () => {
    assert.deepEqual(kinds({ ...healthy(), daysSinceActivity: 6 }), ["HIGH:inactive_5d"])
    assert.deepEqual(kinds({ ...healthy(), daysSinceActivity: 4 }), ["MEDIUM:inactive_3d"])
    assert.deepEqual(kinds({ ...healthy(), daysSinceActivity: null }), ["HIGH:inactive_5d"])
  })

  it("flags expired subscriptions HIGH and <=7d expiry MEDIUM", () => {
    assert.ok(
      kinds({ ...healthy(), latestSubscription: { status: "EXPIRED", endDate: iso(-2) } }).includes(
        "HIGH:sub_expired"
      )
    )
    // Past end date with stale ACTIVE status is treated as expired.
    assert.ok(
      kinds({ ...healthy(), latestSubscription: { status: "ACTIVE", endDate: iso(-1) } }).includes(
        "HIGH:sub_expired"
      )
    )
    const expiring = kinds({
      ...healthy(),
      latestSubscription: { status: "ACTIVE", endDate: iso(3) },
    })
    assert.ok(expiring.includes("MEDIUM:sub_expiring"))
    // Far-future expiry is quiet.
    assert.ok(
      !kinds({ ...healthy(), latestSubscription: { status: "ACTIVE", endDate: iso(30) } }).some(
        (k) => k.includes("sub_")
      )
    )
  })

  it("flags stale InBody and missed check-ins as LOW", () => {
    assert.ok(kinds({ ...healthy(), daysSinceInBody: 45 }).includes("LOW:no_inbody"))
    assert.ok(kinds({ ...healthy(), daysSinceCheckin: 3 }).includes("LOW:missed_checkin"))
    assert.ok(!kinds({ ...healthy(), daysSinceCheckin: 1 }).includes("LOW:missed_checkin"))
  })

  it("flags pending payment proofs HIGH with the count attached", () => {
    const items = evaluateClientActions({ ...healthy(), pendingProofs: 2 }, NOW)
    const proof = items.find((i) => i.kind === "payment_pending")
    assert.equal(proof?.priority, "HIGH")
    assert.equal(proof?.count, 2)
  })

  it("skips activity/InBody/check-in rules for non-active clients", () => {
    const items = evaluateClientActions(
      {
        ...healthy(),
        isActive: false,
        daysSinceActivity: 30,
        daysSinceInBody: 90,
        daysSinceCheckin: 30,
      },
      NOW
    )
    assert.deepEqual(items, [])
  })

  it("emits at most one item per kind and sorts HIGH first", () => {
    const items = evaluateClientActions(
      {
        ...healthy(),
        daysSinceActivity: 10,
        daysSinceInBody: 60,
        pendingProofs: 1,
        latestSubscription: { status: "EXPIRED", endDate: iso(-1) },
      },
      NOW
    )
    const kindList = items.map((i) => i.kind)
    assert.equal(new Set(kindList).size, kindList.length)
    const priorities = items.map((i) => i.priority)
    assert.deepEqual(priorities, [...priorities].sort((a, b) => "HML".indexOf(a[0]!) - "HML".indexOf(b[0]!)))
    assert.equal(items[items.length - 1]?.priority, "LOW")
  })

  it("always points at a client-scoped CTA", () => {
    for (const i of evaluateClientActions({ ...healthy(), daysSinceActivity: 9, pendingProofs: 1 }, NOW)) {
      assert.ok(i.cta.includes("c1"), i.kind)
    }
  })
})
