import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { cache } from "react";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool, generateId } from "@/lib/db";
import { comparePassword } from "@/lib/auth";
import type { Role } from "@/lib/db/enums";

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

// Cache re-validation for 60s: jwt() is called on EVERY getServerSession (every page + every
// /api/messages/unread-count poll). Without cache each call does 2-3 DB queries,
// making actions feel slow. Cache is per-process and short-lived; stale after DB reset
// is resolved within 60s or on next cache miss.
const CACHE_TTL_MS = 60_000
const trainerValidationCache = new Map<string, { value: string | undefined; expires: number }>()
const clientValidationCache = new Map<string, { value: string | undefined; expires: number }>()
const nameCache = new Map<string, { value: string | undefined; expires: number }>()

export function invalidateNameCache(userId: string) {
  for (const role of ["TRAINER", "CLIENT"]) {
    nameCache.delete(`name:${userId}:${role}`);
  }
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
    signOut: "/signout",
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

        const userRes = await pool.query(
          `SELECT * FROM "User" WHERE "username"=$1 OR "phone"=$1 OR "email"=$1 LIMIT 1`,
          [credentials.identifier]
        );
        const user = userRes.rows[0] as
          | {
              id: string;
              username: string | null;
              phone: string | null;
              email: string | null;
              passwordHash: string;
              role: string;
              mustChangePassword: boolean;
            }
          | undefined;

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
        let displayName: string | undefined;

        if (user.role === "TRAINER") {
          let profileRes = await pool.query(
            `SELECT * FROM "TrainerProfile" WHERE "userId"=$1 LIMIT 1`,
            [user.id]
          );
          let profile = (profileRes.rows[0] as { id: string; fullName?: string } | undefined) ?? null;
          // Self-healing: auto-create missing TrainerProfile (e.g., after DB reset with stale token, or legacy user)
          if (!profile) {
            try {
              const id = generateId();
              const fullName =
                (user as unknown as { username?: string }).username ??
                user.phone ??
                "Trainer";
              const phone = user.phone ?? "";
              const createdRes = await pool.query(
                `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING *`,
                [id, user.id, fullName, phone]
              );
              profile = createdRes.rows[0] as { id: string };
            } catch {
              // If creation fails due to race, re-fetch
              const retryRes = await pool.query(
                `SELECT * FROM "TrainerProfile" WHERE "userId"=$1 LIMIT 1`,
                [user.id]
              );
              profile = (retryRes.rows[0] as { id: string } | undefined) ?? null;
            }
          }
          trainerProfileId = profile?.id;
          displayName = profile?.fullName;
        }

        if (user.role === "CLIENT") {
          const clientRes = await pool.query(
            `SELECT * FROM "Client" WHERE "userId"=$1 LIMIT 1`,
            [user.id]
          );
          const client = clientRes.rows[0] as { id: string; fullName?: string } | undefined;
          clientProfileId = client?.id;
          displayName = client?.fullName;
        }

        return {
          id: user.id,
          name: displayName ?? user.username ?? user.phone ?? user.email ?? "User",
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
        token.name = (user as any).name;
        token.role = user.role;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
        token.trainerProfileId = (user as any).trainerProfileId;
        token.clientProfileId = (user as any).clientProfileId;
      }
      // Refresh display name from profile (cached 60s) so renames are picked up
      const userId = token.id as string | undefined;
      const nameCacheKey = `name:${userId}:${token.role}`;
      if (userId) {
        const cachedName = nameCache.get(nameCacheKey);
        if (cachedName && cachedName.expires > Date.now()) {
          token.name = cachedName.value;
        } else {
          try {
            let dbName: string | undefined;
            if (token.role === "TRAINER") {
              const res = await pool.query(
                `SELECT "fullName" FROM "TrainerProfile" WHERE "userId"=$1 LIMIT 1`,
                [userId]
              );
              dbName = (res.rows[0] as { fullName?: string } | undefined)?.fullName;
            } else if (token.role === "CLIENT") {
              const res = await pool.query(
                `SELECT "fullName" FROM "Client" WHERE "userId"=$1 LIMIT 1`,
                [userId]
              );
              dbName = (res.rows[0] as { fullName?: string } | undefined)?.fullName;
            }
            if (dbName) token.name = dbName;
            nameCache.set(nameCacheKey, { value: token.name as string | undefined, expires: Date.now() + CACHE_TTL_MS });
          } catch {
            // Do not block auth on DB errors
          }
        }
      }
      // Re-validate trainerProfileId — cached 60s to avoid DB on every poll (was 2-3 queries per request)
      if (token.role === "TRAINER") {
        const trainerProfileId = token.trainerProfileId as string | undefined;
        const userId = token.id as string | undefined;
        if (userId) {
          const cacheKey = `${userId}:${trainerProfileId ?? "none"}`;
          const cached = trainerValidationCache.get(cacheKey);
          if (cached && cached.expires > Date.now()) {
            token.trainerProfileId = cached.value;
          } else {
            try {
              if (trainerProfileId) {
                const existsRes = await pool.query(
                  `SELECT "id" FROM "TrainerProfile" WHERE "id"=$1 LIMIT 1`,
                  [trainerProfileId]
                );
                const exists = existsRes.rows[0] as { id: string } | undefined;
                if (!exists) {
                  const byUserRes = await pool.query(
                    `SELECT "id" FROM "TrainerProfile" WHERE "userId"=$1 LIMIT 1`,
                    [userId]
                  );
                  const byUser = byUserRes.rows[0] as { id: string } | undefined;
                  if (byUser) {
                    token.trainerProfileId = byUser.id;
                  } else {
                    const userRes = await pool.query(
                      `SELECT "username", "phone" FROM "User" WHERE "id"=$1 LIMIT 1`,
                      [userId]
                    );
                    const user = userRes.rows[0] as
                      | { username: string | null; phone: string | null }
                      | undefined;
                    if (user) {
                      const id = generateId();
                      const fullName =
                        (user as unknown as { username?: string }).username ??
                        user.phone ??
                        "Trainer";
                      const phone = user.phone ?? "";
                      try {
                        const createdRes = await pool.query(
                          `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING *`,
                          [id, userId, fullName, phone]
                        );
                        const created = createdRes.rows[0] as { id: string };
                        token.trainerProfileId = created.id;
                      } catch {
                        const retryRes = await pool.query(
                          `SELECT "id" FROM "TrainerProfile" WHERE "userId"=$1 LIMIT 1`,
                          [userId]
                        );
                        const retry = retryRes.rows[0] as { id: string } | undefined;
                        if (retry) token.trainerProfileId = retry.id;
                        else token.trainerProfileId = undefined;
                      }
                    } else {
                      token.trainerProfileId = undefined;
                    }
                  }
                }
              } else {
                const byUserRes = await pool.query(
                  `SELECT "id" FROM "TrainerProfile" WHERE "userId"=$1 LIMIT 1`,
                  [userId]
                );
                const byUser = byUserRes.rows[0] as { id: string } | undefined;
                if (byUser) {
                  token.trainerProfileId = byUser.id;
                }
              }
            } catch {
              // Do not block auth on DB errors; leave token as-is
            }
            trainerValidationCache.set(cacheKey, {
              value: token.trainerProfileId as string | undefined,
              expires: Date.now() + CACHE_TTL_MS,
            });
          }
        }
      }
      // Re-validate clientProfileId — cached 60s (was 1-2 queries per request)
      if (token.role === "CLIENT") {
        const clientProfileId = token.clientProfileId as string | undefined;
        const userId = token.id as string | undefined;
        if (userId) {
          const cacheKey = `${userId}:${clientProfileId ?? "none"}`;
          const cached = clientValidationCache.get(cacheKey);
          if (cached && cached.expires > Date.now()) {
            token.clientProfileId = cached.value;
          } else {
            try {
              if (clientProfileId) {
                const existsRes = await pool.query(
                  `SELECT "id" FROM "Client" WHERE "id"=$1 LIMIT 1`,
                  [clientProfileId]
                );
                const exists = existsRes.rows[0] as { id: string } | undefined;
                if (!exists) {
                  const byUserRes = await pool.query(
                    `SELECT "id" FROM "Client" WHERE "userId"=$1 LIMIT 1`,
                    [userId]
                  );
                  const byUser = byUserRes.rows[0] as { id: string } | undefined;
                  token.clientProfileId = byUser?.id;
                }
              } else {
                const byUserRes = await pool.query(
                  `SELECT "id" FROM "Client" WHERE "userId"=$1 LIMIT 1`,
                  [userId]
                );
                const byUser = byUserRes.rows[0] as { id: string } | undefined;
                if (byUser) {
                  token.clientProfileId = byUser.id;
                }
              }
            } catch {
              // Do not block auth on DB errors
            }
            clientValidationCache.set(cacheKey, {
              value: token.clientProfileId as string | undefined,
              expires: Date.now() + CACHE_TTL_MS,
            });
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | undefined;
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
