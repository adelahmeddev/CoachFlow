import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getCurrentSession } from "@/server/auth"
import { prisma } from "@/lib/prisma"

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, mustChangePassword: true },
  })

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  })

  return NextResponse.json({ ok: true })
}
