import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { cleanupCoachWithClient, createCoachWithClient, hasDb } from "./db-setup"

describe("progress media auth", { skip: !hasDb }, () => {
  let pool: typeof import("../src/lib/db").pool
  let svc: typeof import("../src/server/services/media.service")
  let ids = { coachUserId: "", trainerId: "", clientUserId: "", clientId: "" }

  before(async () => {
    pool = (await import("../src/lib/db")).pool
    svc = await import("../src/server/services/media.service")
    ids = await createCoachWithClient(pool as never)
  })

  after(async () => {
    if (hasDb) {
      await pool.query(`DELETE FROM "ProgressMedia" WHERE "clientId" = $1`, [ids.clientId])
      await cleanupCoachWithClient(pool as never, ids)
    }
  })

  it("uploads, lists without payload, and reviews with feedback", async () => {
    const media = await svc.uploadMedia({
      clientId: ids.clientId,
      trainerId: ids.trainerId,
      type: "PROGRESS_PHOTO",
      storageUrl: "data:image/png;base64,AAA",
      title: "Front week 1",
      note: null,
    })
    assert.equal(media.status, "PENDING")

    const list = await svc.listMediaForClient(ids.clientId)
    assert.equal(list.length, 1)
    assert.equal(list[0]!.storageUrl, "", "list must not carry the payload")

    const full = await svc.getMediaItem(media.id, { clientId: ids.clientId })
    assert.equal(full?.storageUrl, "data:image/png;base64,AAA")

    const reviewed = await svc.reviewMedia({
      trainerId: ids.trainerId,
      mediaId: media.id,
      reviewerUserId: ids.coachUserId,
      feedback: "Great posture!",
    })
    assert.ok(reviewed.ok)
    assert.equal(reviewed.ok && reviewed.media.status, "REVIEWED")
    assert.equal(reviewed.ok && reviewed.media.feedback, "Great posture!")
  })

  it("blocks cross-client and cross-coach access", async () => {
    const media = await svc.uploadMedia({
      clientId: ids.clientId,
      trainerId: ids.trainerId,
      type: "FORM_VIDEO",
      storageUrl: "data:video/mp4;base64,AAA",
      title: null,
      note: null,
    })
    // Another client id sees nothing.
    assert.equal(await svc.getMediaItem(media.id, { clientId: "c_nope000000000000000000" }), null)
    // Another trainer sees nothing and cannot review.
    const otherList = await svc.listMediaForClientOfTrainer(ids.clientId, "c_nope000000000000000000")
    assert.equal(otherList, null)
    const cross = await svc.reviewMedia({
      trainerId: "c_nope000000000000000000",
      mediaId: media.id,
      reviewerUserId: ids.coachUserId,
      feedback: "hijack",
    })
    assert.deepEqual(cross, { ok: false, error: "NOT_FOUND" })
    // Upload for another trainer's client is refused.
    await assert.rejects(
      svc.uploadMedia({
        clientId: ids.clientId,
        trainerId: "c_nope000000000000000000",
        type: "OTHER",
        storageUrl: "data:image/png;base64,AAA",
      }),
      /CLIENT_NOT_FOUND/
    )
  })
})
