import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getInviteState } from "../src/lib/invite-status"

const NOW = new Date("2026-09-06T12:00:00Z").getTime()
const DAY = 24 * 60 * 60 * 1000

describe("getInviteState", () => {
  it("is accepted once a user account is linked, regardless of token", () => {
    assert.deepEqual(
      getInviteState({ userId: "u1", inviteToken: "t", inviteExpiresAt: new Date(NOW + DAY) }, NOW),
      { state: "accepted", daysLeft: null }
    )
  })

  it("is no-invite when no token was ever issued", () => {
    assert.deepEqual(
      getInviteState({ userId: null, inviteToken: null, inviteExpiresAt: null }, NOW),
      { state: "no-invite", daysLeft: null }
    )
  })

  it("is expired when the expiry passed and never authenticates", () => {
    assert.deepEqual(
      getInviteState(
        { userId: null, inviteToken: "t", inviteExpiresAt: new Date(NOW - 1000) },
        NOW
      ),
      { state: "expired", daysLeft: null }
    )
  })

  it("is pending with whole days left", () => {
    const r = getInviteState(
      { userId: null, inviteToken: "t", inviteExpiresAt: new Date(NOW + 3 * DAY) },
      NOW
    )
    assert.equal(r.state, "pending")
    assert.equal(r.daysLeft, 3)
  })

  it("reports full days remaining", () => {
    const r = getInviteState(
      { userId: null, inviteToken: "t", inviteExpiresAt: new Date(NOW + 2 * DAY + 60_000) },
      NOW
    )
    assert.equal(r.state, "pending")
    assert.equal(r.daysLeft, 2)
  })

  it("reports 0 days left for an invite expiring later today", () => {
    const r = getInviteState(
      { userId: null, inviteToken: "t", inviteExpiresAt: new Date(NOW + 60_000) },
      NOW
    )
    assert.deepEqual(r, { state: "pending", daysLeft: 0 })
  })
})
