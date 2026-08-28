import { DefaultSession } from "next-auth"
import type { Role } from "@/generated/prisma/enums"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      mustChangePassword?: boolean
      trainerProfileId?: string
      clientProfileId?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    mustChangePassword?: boolean
    trainerProfileId?: string
    clientProfileId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: Role
    mustChangePassword?: boolean
    trainerProfileId?: string
    clientProfileId?: string
  }
}
