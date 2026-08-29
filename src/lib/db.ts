import { neon } from "@neondatabase/serverless"
import { randomUUID } from "crypto"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(connectionString)

async function neonQuery<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const rows = await sql(text as unknown as TemplateStringsArray, ...(params ?? [])) as T[]
  return { rows, rowCount: rows.length }
}

export interface PgClient {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number | null }>
  end(): Promise<void>
}

export const pool: PgClient = {
  async query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ) {
    return neonQuery<T>(text, params)
  },
  async end() {},
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  return neonQuery<T>(text, params)
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await query<T>(text, params)
  return (res.rows[0] as T) ?? null
}

export async function queryMany<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await query<T>(text, params)
  return res.rows as T[]
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
  const res = await query(text, params)
  return res.rowCount ?? 0
}

export async function withTransaction<T>(
  fn: (client: PgClient) => Promise<T>
): Promise<T> {
  const failed = { value: false }
  const client: PgClient = {
    async query(text: string, params?: unknown[]) {
      if (failed.value) {
        throw new Error("Transaction rolled back")
      }
      try {
        return await pool.query(text, params)
      } catch (e) {
        failed.value = true
        throw e
      }
    },
    async end() {},
  }
  try {
    return await fn(client)
  } catch (e) {
    throw e
  }
}

export async function txQueryOne<T extends Record<string, unknown>>(
  client: PgClient, text: string, params?: unknown[]
): Promise<T | null> {
  const res = await client.query<T>(text, params)
  return (res.rows[0] as T) ?? null
}

export async function txQueryMany<T extends Record<string, unknown>>(
  client: PgClient, text: string, params?: unknown[]
): Promise<T[]> {
  const res = await client.query<T>(text, params)
  return res.rows as T[]
}

export async function txExecute(
  client: PgClient, text: string, params?: unknown[]
): Promise<number> {
  const res = await client.query(text, params)
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
