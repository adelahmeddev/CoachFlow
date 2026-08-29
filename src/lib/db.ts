import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"
import { randomUUID } from "crypto"

const globalForPg = globalThis as unknown as {
  pgPool?: Pool
}

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }
  return new Pool({
    connectionString,
    max: 10,
    // Fail fast in dev so slow FS/DB doesn't block compile for 5s
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 2_000,
    // Keep TCP alive on Windows (pg default 0 = no keepalive, causes
    // 1-2s reconnection lag after idle)
    keepAlive: true,
    // Don't queue forever when pool saturated (e.g., auth + unread-count thundering herd)
    // – surface error immediately instead of hanging action
    statement_timeout: 5000,
  })
}

export const pool: Pool =
  globalForPg.pgPool ?? createPool()

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool
  // Warm pool after creation to avoid 40-50ms cold-start on first request
  if (process.env.DATABASE_URL) {
    setTimeout(() => {
      pool.query("SELECT 1").catch(() => {})
    }, 0)
  }
}

// Generic query helpers
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as unknown[])
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await pool.query<T>(text, params as unknown[])
  return (res.rows[0] as T) ?? null
}

export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query<T>(text, params as unknown[])
  return res.rows as T[]
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
  const res = await pool.query(text, params as unknown[])
  return res.rowCount ?? 0
}

// Transaction helper - provides a client with BEGIN/COMMIT/ROLLBACK
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

// Transaction-aware query helpers
export async function txQueryOne<T extends QueryResultRow>(
  client: PoolClient,
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await client.query<T>(text, params as unknown[])
  return (res.rows[0] as T) ?? null
}

export async function txQueryMany<T extends QueryResultRow>(
  client: PoolClient,
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await client.query<T>(text, params as unknown[])
  return res.rows as T[]
}

export async function txExecute(
  client: PoolClient,
  text: string,
  params?: unknown[]
): Promise<number> {
  const res = await client.query(text, params as unknown[])
  return res.rowCount ?? 0
}

// ID generation - matches Prisma cuid() style but any unique TEXT works for PK
// Prisma used cuid() (c + 24 chars). We generate c + nanoid-like random.
export function generateId(): string {
  // Prisma cuid is 25 chars starting with c; we emulate with c + 24 hex chars from UUID
  return `c${randomUUID().replace(/-/g, "").slice(0, 24)}`
}

// Helper to handle updatedAt auto-timestamp in SQL (Prisma @updatedAt)
export function nowSql(): string {
  return "NOW()"
}

// Helper to check unique violation (Postgres code 23505) similar to Prisma P2002
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  )
}

// Helper to check foreign key violation (23503) similar to Prisma P2003
export function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23503"
  )
}

