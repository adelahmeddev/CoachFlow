import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../src/lib/prisma"

async function main() {
  const identifier = "nuttest"
  const password = "test1234"

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { phone: identifier }, { email: identifier }] },
  })
  console.log("user:", user ? user.id : null, user?.role)

  if (!user) {
    console.log("RETURN null (user not found)")
    return
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)
  console.log("passwordValid:", passwordValid)
  if (!passwordValid) {
    console.log("RETURN null (bad creds)")
    return
  }

  let trainerProfileId: string | undefined
  let profileFullName: string | undefined
  if (user.role === "TRAINER") {
    const profile = await prisma.trainerProfile.findUnique({ where: { userId: user.id } })
    trainerProfileId = profile?.id
    profileFullName = profile?.fullName
  }
  console.log("authorize result:", JSON.stringify({
    id: user.id,
    name: profileFullName ?? user.username ?? undefined,
    email: user.email ?? undefined,
    role: user.role,
    trainerProfileId,
  }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())