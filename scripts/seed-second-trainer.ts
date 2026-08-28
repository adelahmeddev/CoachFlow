import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"
import bcrypt from "bcryptjs"

async function main() {
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

  let user = await p.user.findUnique({ where: { phone: "02001112222" } })
  if (!user) {
    const hash = await bcrypt.hash("password", 10)
    user = await p.user.create({
      data: {
        phone: "02001112222",
        passwordHash: hash,
        role: "TRAINER",
        trainerProfile: {
          create: { fullName: "Second Trainer", phone: "02001112222" },
        },
      },
    })
  }

  const trainer = await p.user.findUnique({
    where: { phone: "02001112222" },
    include: { trainerProfile: true },
  })
  if (!trainer?.trainerProfile) throw new Error("no profile")

  let client = await p.client.findFirst({ where: { trainerId: trainer.trainerProfile.id } })
  if (!client) {
    client = await p.client.create({
      data: {
        trainerId: trainer.trainerProfile.id,
        fullName: "Other Trainer's Client",
        status: "ACTIVE",
        goal: "STRENGTH",
      },
    })
  }

  console.log(JSON.stringify({ trainerProfileId: trainer.trainerProfile.id, clientId: client.id }))
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
