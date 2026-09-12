import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { cleanupCoachWithClient, createCoachWithClient, hasDb, tid } from "./db-setup"

describe("notifications", { skip: !hasDb }, () => {
  let pool: typeof import("../src/lib/db").pool
  let svc: typeof import("../src/server/services/notification.service")
  let ids = { coachUserId: "", trainerId: "", clientUserId: "", clientId: "" }

  before(async () => {
    pool = (await import("../src/lib/db")).pool
    svc = await import("../src/server/services/notification.service")
    ids = await createCoachWithClient(pool as never)
  })

  after(async () => {
    if (hasDb) await cleanupCoachWithClient(pool as never, ids)
  })

  it("creates a notification for an existing user", async () => {
    const r = await svc.createNotification({
      userId: ids.clientUserId,
      type: "WORKOUT_REMINDER",
      titleKey: "workoutReminderTitle",
      bodyKey: "workoutReminderBody",
      params: {},
      link: "/client/workout/today",
    })
    assert.equal(r.ok, true)
    assert.ok(r.ok && "notification" in r && r.notification)
  })

  it("is idempotent on dedupeKey — no duplicate reminder", async () => {
    const key = `test:${tid()}`
    const first = await svc.createNotification({
      userId: ids.clientUserId,
      type: "CHECKIN_REMINDER",
      titleKey: "checkinReminderTitle",
      bodyKey: "checkinReminderBody",
      params: {},
      dedupeKey: key,
    })
    const second = await svc.createNotification({
      userId: ids.clientUserId,
      type: "CHECKIN_REMINDER",
      titleKey: "checkinReminderTitle",
      bodyKey: "checkinReminderBody",
      params: {},
      dedupeKey: key,
    })
    assert.ok(first.ok && "notification" in first && first.notification)
    assert.ok(second.ok && "notification" in second && second.notification === null)
    const count = await pool.query(
      `SELECT COUNT(*)::int c FROM "Notification" WHERE "dedupeKey" = $1`,
      [key]
    )
    assert.equal((count.rows[0] as { c: number }).c, 1)
  })

  it("rejects unknown users", async () => {
    const r = await svc.createNotification({
      userId: "c_doesnotexist000000000000",
      type: "WORKOUT_REMINDER",
      titleKey: "workoutReminderTitle",
      bodyKey: "workoutReminderBody",
      params: {},
    })
    assert.deepEqual(r, { ok: false, error: "USER_NOT_FOUND" })
  })

  it("read/unread works and is scoped per user", async () => {
    const created = await svc.createNotification({
      userId: ids.clientUserId,
      type: "NEW_MESSAGE",
      titleKey: "newMessageTitle",
      bodyKey: "newMessageBody",
      params: { name: "Coach", preview: "hi" },
    })
    assert.ok(created.ok && "notification" in created && created.notification)
    const nid = (created as { notification: { id: string } }).notification.id

    assert.equal(await svc.countUnreadNotifications(ids.clientUserId) >= 1, true)
    // Another user cannot mark it read.
    assert.equal(await svc.markNotificationRead(ids.coachUserId, nid), false)
    assert.equal(await svc.markNotificationRead(ids.clientUserId, nid), true)
    // Second mark is a no-op (already read).
    assert.equal(await svc.markNotificationRead(ids.clientUserId, nid), false)

    // List only returns the owner's rows, newest first, paginated.
    const page = await svc.listNotifications(ids.coachUserId, { limit: 20 })
    assert.ok(!page.notifications.some((n) => n.id === nid))
    const marked = await svc.markAllNotificationsRead(ids.clientUserId)
    assert.ok(marked >= 0)
    assert.equal(await svc.countUnreadNotifications(ids.clientUserId), 0)
  })
})
