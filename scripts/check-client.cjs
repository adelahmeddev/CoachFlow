const { PrismaPg } = require("@prisma/adapter-pg")
const { PrismaClient } = require("../../src/generated/prisma/client")

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
p.client
  .findMany({
    where: { id: { in: ["nonexistent123", "cm_test_invite_0001"] } },
    select: { id: true, trainerId: true },
  })
  .then((r) => {
    console.log(JSON.stringify(r))
    return p.$disconnect()
  })
  .catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
