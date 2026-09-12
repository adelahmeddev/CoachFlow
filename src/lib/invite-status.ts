/**
 * Invitation lifecycle state (pure — safe to unit test).
 *
 * A client row moves: no-invite → pending → accepted.
 * An unaccepted invite whose expiry passed is "expired" and can never
 * authenticate (enforced server-side in getPublicClientByInviteToken).
 */

export type InviteState = "accepted" | "expired" | "pending" | "no-invite"

export interface InviteStateResult {
  state: InviteState
  /** Whole days until expiry (0 = expires today), null when not pending. */
  daysLeft: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

export function getInviteState(
  client: {
    userId: string | null
    inviteToken: string | null
    inviteExpiresAt: Date | string | null
  },
  nowMs: number = Date.now()
): InviteStateResult {
  if (client.userId) return { state: "accepted", daysLeft: null }
  if (!client.inviteToken) return { state: "no-invite", daysLeft: null }
  if (client.inviteExpiresAt && new Date(client.inviteExpiresAt).getTime() < nowMs) {
    return { state: "expired", daysLeft: null }
  }
  if (!client.inviteExpiresAt) return { state: "pending", daysLeft: null }
  // Whole full days remaining (floor): an invite expiring later today
  // reports 0 so the UI can show "Expires today" urgency.
  const daysLeft = Math.max(
    0,
    Math.floor((new Date(client.inviteExpiresAt).getTime() - nowMs) / DAY_MS)
  )
  return { state: "pending", daysLeft }
}
