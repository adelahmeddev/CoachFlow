import NextAuth from "next-auth"
import { authOptions } from "@/server/auth"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

const handler = NextAuth(authOptions)

async function authHandler(
  req: NextRequest,
  context: { params: Promise<{ nextauth?: string[] }> | { nextauth?: string[] } }
) {
  const params = context.params instanceof Promise ? await context.params : context.params
  return handler(req, { params })
}

export { authHandler as GET, authHandler as POST }
