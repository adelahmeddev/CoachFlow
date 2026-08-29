import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { newPassword } = body as { newPassword?: string }

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 6 characters" },
      { status: 400 }
    )
  }

  const userRes = await pool.query(`SELECT "id", "mustChangePassword" FROM "User" WHERE "id" = $1 LIMIT 1`, [session.user.id])
  const user = userRes.rows[0] as { id: string; mustChangePassword: boolean } | undefined

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 })
  }

  const passwordHash = await hashPassword(newPassword)
  await pool.query(`UPDATE "User" SET "passwordHash" = $1, "mustChangePassword" = false, "updatedAt" = NOW() WHERE "id" = $2`, [passwordHash, user.id])

  return NextResponse.json({ ok: true })
}
