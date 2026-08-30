import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"
import { randomUUID } from "crypto"

export type PgClient = PoolClient

const globalForPg = globalThis as unknown as {
  pgPool?: Pool
}

let _pool: Pool | null = null

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is not set")
    }
    return new Pool()
  }

  const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME

  return new Pool({
    connectionString,
    max: isServerless ? 1 : 10,
    idleTimeoutMillis: isServerless ? 5_000 : 10_000,
    connectionTimeoutMillis: isServerless ? 10_000 : 2_000,
    keepAlive: !isServerless,
    statement_timeout: 10_000,
    ssl: isServerless ? { rejectUnauthorized: false } : undefined,
  })
}

function getPool(): Pool {
  if (!_pool) {
    _pool = globalForPg.pgPool ?? createPool()
    if (process.env.NODE_ENV !== "production") {
      globalForPg.pgPool = _pool
    }
  }
  return _pool
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const p = getPool()
    const value = (p as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === "function" ? value.bind(p) : value
  },
})

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

export function generateId(): string {
  return `c${randomUUID().replace(/-/g, "").slice(0, 24)}`
}

export function nowSql(): string {
  return "NOW()"
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  )
}

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23503"
  )
}

export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query("SELECT 1")
    return true
  } catch {
    return false
  }
}