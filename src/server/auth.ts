import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { cache } from "react";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

function getSecureCookie() {
  if (process.env.NODE_ENV === "production") return true;
  const host = process.env.NEXTAUTH_URL || "";
  return host.startsWith("https://");
}

function getCookieName() {
  const secure = getSecureCookie();
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

const RATE_LIMIT_MAX_FAILURES = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_LOCKOUT_MS = 15 * 60 * 1000;

type AttemptRecord = { failures: number; firstFailureAt: number; lockedUntil: number };

// NOTE: In-memory rate limiter — state is per-process and resets on server restart.
// Works correctly for single-instance deployments. For multi-instance or serverless
// (Vercel, AWS Lambda) replace with a Redis-backed or DB-backed store so lockouts
// are shared across all instances.
const loginAttempts = new Map<string, AttemptRecord>();

function cleanupAttempts(now: number) {
  for (const [key, record] of loginAttempts) {
    if (
      now - record.firstFailureAt > RATE_LIMIT_WINDOW_MS &&
      record.lockedUntil < now
    ) {
      loginAttempts.delete(key);
    }
  }
}

export function checkLoginRateLimit(identifier: string):
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupAttempts(now);
  const record = loginAttempts.get(identifier.toLowerCase());
  if (!record) return { allowed: true };
  if (record.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }
  return { allowed: true };
}

export function recordLoginFailure(identifier: string) {
  const now = Date.now();
  const key = identifier.toLowerCase();
  const record = loginAttempts.get(key);
  if (!record || now - record.firstFailureAt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(key, {
      failures: 1,
      firstFailureAt: now,
      lockedUntil: 0,
    });
    return;
  }
  record.failures += 1;
  if (record.failures >= RATE_LIMIT_MAX_FAILURES) {
    record.lockedUntil = now + RATE_LIMIT_LOCKOUT_MS;
  }
}

export function recordLoginSuccess(identifier: string) {
  loginAttempts.delete(identifier.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: getCookieName(),
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: getSecureCookie(),
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username, phone or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        const limit = checkLoginRateLimit(credentials.identifier);
        if (!limit.allowed) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.identifier },
              { phone: credentials.identifier },
              { email: credentials.identifier },
            ],
          },
        });

        if (!user) {
          recordLoginFailure(credentials.identifier);
          return null;
        }

        const passwordValid = await comparePassword(
          credentials.password,
          user.passwordHash
        );
        if (!passwordValid) {
          recordLoginFailure(credentials.identifier);
          return null;
        }

        recordLoginSuccess(credentials.identifier);

        // DUAL AUTH PATH NOTE:
        // CLIENT users always log in via the User table (userId on Client record).
        // The legacy Client.passwordHash / Client.email fields are only used during
        // the invite flow (before a User record is created). Once the client completes
        // account setup, Client.userId is set and those standalone fields are no
        // longer used for auth. Do NOT add Client.passwordHash-based login here —
        // it would create a second, unguarded credential path.
        let trainerProfileId: string | undefined;
        let clientProfileId: string | undefined;

        if (user.role === "TRAINER") {
          let profile = await prisma.trainerProfile.findUnique({
            where: { userId: user.id },
          });
          // Self-healing: auto-create missing TrainerProfile (e.g., after DB reset with stale token, or legacy user)
          if (!profile) {
            try {
              profile = await prisma.trainerProfile.create({
                data: {
                  userId: user.id,
                  fullName: (user as unknown as { username?: string }).username ?? user.phone ?? "Trainer",
                  phone: user.phone ?? "",
                },
              });
            } catch {
              // If creation fails due to race, re-fetch
              profile = await prisma.trainerProfile.findUnique({
                where: { userId: user.id },
              });
            }
          }
          trainerProfileId = profile?.id;
        }

        if (user.role === "CLIENT") {
          const client = await prisma.client.findUnique({
            where: { userId: user.id },
          });
          clientProfileId = client?.id;
        }

        return {
          id: user.id,
          role: user.role as Role,
          mustChangePassword: user.mustChangePassword,
          trainerProfileId,
          clientProfileId,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
        token.trainerProfileId = (user as any).trainerProfileId;
        token.clientProfileId = (user as any).clientProfileId;
      }
      // Re-validate trainerProfileId on every JWT invocation to handle stale tokens after DB reset
      // or deleted profiles. This prevents FK violations in downstream services.
      if (token.role === "TRAINER") {
        const trainerProfileId = token.trainerProfileId as string | undefined;
        const userId = token.id as string | undefined;
        if (userId) {
          try {
            if (trainerProfileId) {
              const exists = await prisma.trainerProfile.findUnique({
                where: { id: trainerProfileId },
                select: { id: true },
              });
              if (!exists) {
                // Try to find by userId or auto-create
                const byUser = await prisma.trainerProfile.findUnique({
                  where: { userId },
                  select: { id: true },
                });
                if (byUser) {
                  token.trainerProfileId = byUser.id;
                } else {
                  const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { username: true, phone: true },
                  });
                  if (user) {
                    const created = await prisma.trainerProfile.create({
                      data: {
                        userId,
                        fullName: (user as unknown as { username?: string }).username ?? user.phone ?? "Trainer",
                        phone: user.phone ?? "",
                      },
                    });
                    token.trainerProfileId = created.id;
                  } else {
                    token.trainerProfileId = undefined;
                  }
                }
              }
            } else {
              // No profile ID in token but user is TRAINER -> try to resolve
              const byUser = await prisma.trainerProfile.findUnique({
                where: { userId },
                select: { id: true },
              });
              if (byUser) {
                token.trainerProfileId = byUser.id;
              }
            }
          } catch {
            // Do not block auth on DB errors; leave token as-is for downstream handling
          }
        }
      }
      // Re-validate clientProfileId for CLIENT role — handles deleted client records.
      // If the linked Client row was deleted by the trainer, clear clientProfileId
      // so portal layout can detect the orphaned user and show "No longer subscribed".
      if (token.role === "CLIENT") {
        const clientProfileId = token.clientProfileId as string | undefined;
        const userId = token.id as string | undefined;
        if (userId) {
          try {
            if (clientProfileId) {
              const exists = await prisma.client.findUnique({
                where: { id: clientProfileId },
                select: { id: true },
              });
              if (!exists) {
                const byUser = await prisma.client.findUnique({
                  where: { userId },
                  select: { id: true },
                });
                token.clientProfileId = byUser?.id;
              }
            } else {
              const byUser = await prisma.client.findUnique({
                where: { userId },
                select: { id: true },
              });
              if (byUser) {
                token.clientProfileId = byUser.id;
              }
            }
          } catch {
            // Do not block auth on DB errors
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.mustChangePassword =
          (token.mustChangePassword as boolean | undefined) ?? false;
        session.user.trainerProfileId = token.trainerProfileId as
          | string
          | undefined;
        session.user.clientProfileId = token.clientProfileId as
          | string
          | undefined;
      }
      return session;
    },
  },
};

export const getCurrentSession = cache(async () =>
  getServerSession(authOptions)
);
