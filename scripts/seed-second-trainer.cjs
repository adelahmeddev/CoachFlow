const { PrismaPg } = require("@prisma/adapter-pg")
const { PrismaClient } = require("../src/generated/prisma/client")
const bcrypt = require("bcryptjs")

async function main() {
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

  const user = await p.user.findUnique({ where: { phone: "02001112222" } })
  if (!user) {
    const hash = await bcrypt.hash("password", 10)
    await p.user.create({
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

  const client = await p.client.findFirst({ where: { trainerId: trainer.trainerProfile.id } })
  if (!client) {
    await p.client.create({
      data: {
        trainerId: trainer.trainerProfile.id,
        fullName: "Other Trainer's Client",
        status: "ACTIVE",
        goal: "STRENGTH",
      },
    })
  }

  const otherClient = await p.client.findFirst({ where: { trainerId: trainer.trainerProfile.id } })
  console.log(JSON.stringify({ trainerId: trainer.trainerProfile.id, clientId: otherClient.id }))
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
