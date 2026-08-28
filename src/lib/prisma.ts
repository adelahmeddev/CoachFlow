import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaCtor?: unknown
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

// Recreate the client whenever the generated PrismaClient class changes
// (e.g. after `prisma migrate dev` / `prisma generate` during `next dev`),
// otherwise the cached instance keeps missing newly added models.
export const prisma =
  globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient
    ? globalForPrisma.prisma
    : createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaCtor = PrismaClient
}
