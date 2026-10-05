import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { clientsListQuerySchema } from "../src/lib/validations/client"
import { ClientStatus, Goal } from "../src/lib/db/enums"

describe("clients query validation and per-field parsing", () => {
  it("coerces and validates addedWithin parameter", () => {
    const valid = clientsListQuerySchema.safeParse({ addedWithin: "30" })
    assert.ok(valid.success)
    assert.equal(valid.data.addedWithin, 30)

    const invalidNegative = clientsListQuerySchema.safeParse({ addedWithin: "-5" })
    assert.ok(!invalidNegative.success)

    const invalidTooLarge = clientsListQuerySchema.safeParse({ addedWithin: "500" })
    assert.ok(!invalidTooLarge.success)

    const invalidString = clientsListQuerySchema.safeParse({ addedWithin: "abc" })
    assert.ok(!invalidString.success)
  })

  it("per-field parsing isolates invalid values without dropping valid ones", () => {
    const rawParams = {
      q: "  Ahmed  ",
      goal: Goal.WEIGHT_LOSS,
      status: "invalid_status", // invalid enum value
      addedWithin: "14",
      page: "2",
      perPage: "25",
    }

    const qParsed = typeof rawParams.q === "string" ? rawParams.q.trim().slice(0, 100) : undefined
    const goalResult = clientsListQuerySchema.shape.goal.safeParse(rawParams.goal)
    const statusResult = clientsListQuerySchema.shape.status.safeParse(rawParams.status)
    const addedWithinResult = clientsListQuerySchema.shape.addedWithin.safeParse(rawParams.addedWithin)
    const pageResult = clientsListQuerySchema.shape.page.safeParse(rawParams.page)
    const perPageResult = clientsListQuerySchema.shape.perPage.safeParse(rawParams.perPage)

    assert.equal(qParsed, "Ahmed")
    assert.ok(goalResult.success)
    assert.equal(goalResult.data, Goal.WEIGHT_LOSS)
    assert.ok(!statusResult.success, "invalid status should fail")
    assert.ok(addedWithinResult.success)
    assert.equal(addedWithinResult.data, 14)
    assert.ok(pageResult.success)
    assert.equal(pageResult.data, 2)
    assert.ok(perPageResult.success)
    assert.equal(perPageResult.data, 25)
  })
})
