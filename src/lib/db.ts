import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"
import { randomUUID } from "crypto"
import { logger } from "@/lib/logger"

export type PgClient = PoolClient

const globalForPg = globalThis as unknown as {
  pgPool?: Pool
  replicaPgPool?: Pool
}

let _pool: Pool | null = null
let _replicaPool: Pool | null = null

function createPool(): Pool {
  let connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is not set")
    }
    return new Pool()
  }

  if (
    /sslmode=(require|prefer|verify-ca)/i.test(connectionString) &&
    !/uselibpqcompat=/i.test(connectionString) &&
    !/sslmode=verify-full/i.test(connectionString)
  ) {
    const separator = connectionString.includes("?") ? "&" : "?"
    connectionString = `${connectionString}${separator}uselibpqcompat=true`
  }

  const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME

  return new Pool({
    connectionString,
    max: isServerless ? 5 : 10,
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: isServerless ? 15_000 : 10_000,
    keepAlive: true,
    statement_timeout: 15_000,
    ssl: isServerless ? { rejectUnauthorized: false } : undefined,
  })
}

function getPool(): Pool {
  if (!_pool) {
    _pool = globalForPg.pgPool ?? createPool()
    if (process.env.NODE_ENV !== "production") {
      globalForPg.pgPool = _pool
    }
    _pool.on("error", (err) => {
      logger.error("[pg] pool error (idle client)", err)
    })
    _pool.on("connect", () => {})
  }
  return _pool
}

function makeLazyPool() {
  const handler = {
    get(_target: object, prop: string | symbol) {
      const p = getPool()
      const value = p[prop as keyof Pool]
      return typeof value === "function" ? value.bind(p) : value
    },
  }
  return new Proxy({}, handler) as Pool
}

export const pool = makeLazyPool()

function createReplicaPool(): Pool {
  let connectionString = process.env.DATABASE_URL_REPLICA || process.env.DATABASE_URL
  if (!connectionString) {
    return getPool()
  }

  if (
    /sslmode=(require|prefer|verify-ca)/i.test(connectionString) &&
    !/uselibpqcompat=/i.test(connectionString) &&
    !/sslmode=verify-full/i.test(connectionString)
  ) {
    const separator = connectionString.includes("?") ? "&" : "?"
    connectionString = `${connectionString}${separator}uselibpqcompat=true`
  }

  const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME

  return new Pool({
    connectionString,
    max: isServerless ? 5 : 10,
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: isServerless ? 15_000 : 10_000,
    keepAlive: true,
    statement_timeout: 15_000,
    ssl: isServerless ? { rejectUnauthorized: false } : undefined,
  })
}

function getReplicaPool(): Pool {
  if (!_replicaPool) {
    _replicaPool = globalForPg.replicaPgPool ?? createReplicaPool()
    if (process.env.NODE_ENV !== "production") {
      globalForPg.replicaPgPool = _replicaPool
    }
    _replicaPool.on("error", (err) => {
      logger.error("[pg-replica] replica pool error (idle client)", err)
    })
  }
  return _replicaPool
}

function makeLazyReplicaPool() {
  const handler = {
    get(_target: object, prop: string | symbol) {
      const p = getReplicaPool()
      const value = p[prop as keyof Pool]
      return typeof value === "function" ? value.bind(p) : value
    },
  }
  return new Proxy({}, handler) as Pool
}

export const replicaPool = makeLazyReplicaPool()

let totalRetries = 0
let totalRetryFailures = 0

export function getDbMetrics() {
  return {
    totalRetries,
    totalRetryFailures,
    hasReplica: !!process.env.DATABASE_URL_REPLICA,
  }
}

function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const msg = ((err as { message?: string }).message ?? "").toLowerCase()
  const code = (err as { code?: string }).code ?? ""
  if (
    msg.includes("timeout exceeded") ||
    msg.includes("connection terminated") ||
    msg.includes("connection timeout") ||
    msg.includes("terminated unexpectedly") ||
    msg.includes("econnrefused") ||
    msg.includes("is not iterable") ||
    // Transient DNS / network blips (e.g. Neon cold-start, local resolver hiccup).
    // Without this, a single failed lookup throws ENOTFOUND straight to the page.
    msg.includes("getaddrinfo") ||
    msg.includes("enotfound") ||
    msg.includes("eai_again") ||
    msg.includes("enetunreach") ||
    msg.includes("ehostunreach") ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ENETUNREACH" ||
    code === "EHOSTUNREACH" ||
    code === "57P01"
  ) return true
  // AggregateError from pg-pool / Node net: inspect inner errors
  const agg = err as { errors?: unknown[] }
  if (Array.isArray(agg.errors)) {
    return agg.errors.some((inner) => isTransientDbError(inner))
  }
  return false
}

async function withDbRetry<T>(fn: () => Promise<T>, opName = "query"): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isTransientDbError(err)) {
      totalRetries++
      const start = Date.now()
      logger.warn("[db] Transient error detected; retrying query", {
        op: opName,
        totalRetries,
        error: (err as Error).message,
        code: (err as { code?: string }).code,
      })
      await new Promise((r) => setTimeout(r, 500))
      try {
        const res = await fn()
        logger.info("[db] Transient error retry succeeded", {
          op: opName,
          durationMs: Date.now() - start,
        })
        return res
      } catch (retryErr) {
        totalRetryFailures++
        logger.error("[db] Retry failed; rethrowing", retryErr, {
          op: opName,
          totalRetryFailures,
        })
        throw retryErr
      }
    }
    throw err
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return withDbRetry(() => pool.query<T>(text, params as unknown[]), "query")
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await withDbRetry(() => pool.query<T>(text, params as unknown[]), "queryOne")
  return (res.rows[0] as T) ?? null
}

export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await withDbRetry(() => pool.query<T>(text, params as unknown[]), "queryMany")
  return res.rows as T[]
}

export async function replicaQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return withDbRetry(() => replicaPool.query<T>(text, params as unknown[]), "replicaQuery")
}

export async function replicaQueryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await withDbRetry(() => replicaPool.query<T>(text, params as unknown[]), "replicaQueryOne")
  return (res.rows[0] as T) ?? null
}

export async function replicaQueryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await withDbRetry(() => replicaPool.query<T>(text, params as unknown[]), "replicaQueryMany")
  return res.rows as T[]
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
  const res = await withDbRetry(() => pool.query(text, params as unknown[]))
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