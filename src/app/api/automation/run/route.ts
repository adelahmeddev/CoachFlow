import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { runAutomationJobs } from "@/server/automation/jobs"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const maxDuration = 300

/**
 * P0 automation trigger (subscription lifecycle + reminders).
 *
 * Auth: CRON_SECRET via `Authorization: Bearer <secret>` (POST, external
 * schedulers) or `?secret=<secret>` (GET, Vercel Cron dashboard jobs).
 * Rejected without a configured secret — automation must never run open.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const header = request.headers.get("authorization")
  if (header?.startsWith("Bearer ")) {
    return safeEqual(header.slice("Bearer ".length), secret)
  }
  const query = new URL(request.url).searchParams.get("secret")
  if (query) return safeEqual(query, secret)
  return false
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }
  try {
    const summary = await runAutomationJobs(new Date())
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    console.error("[automation] job failed", err)
    return NextResponse.json({ ok: false, error: "JOB_FAILED" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}
