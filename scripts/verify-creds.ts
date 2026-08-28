import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../src/lib/prisma"

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, phone: true, role: true } })
  console.log("users:", JSON.stringify(users, null, 2))

  const u = await prisma.user.findUnique({ where: { username: "nuttest_1" } })
  if (!u) {
    console.log("nuttest_1 NOT FOUND")
    return
  }
  console.log("found:", u.username, u.role)
  const ok = await bcrypt.compare("test1234", u.passwordHash)
  console.log("password test1234 matches:", ok)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())