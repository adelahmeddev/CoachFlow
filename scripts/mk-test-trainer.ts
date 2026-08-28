import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../src/lib/prisma"

async function main() {
  const username = "nuttest"
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    console.log("user exists, deleting", existing.id)
    await prisma.user.delete({ where: { id: existing.id } })
  }
  const passwordHash = await bcrypt.hash("test1234", 10)
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: "TRAINER",
    },
  })
  const profile = await prisma.trainerProfile.create({
    data: {
      userId: user.id,
      fullName: "Nutrition Test Trainer",
      phone: "01000000000",
    },
  })
  console.log("created user", user.id, "profile", profile.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())