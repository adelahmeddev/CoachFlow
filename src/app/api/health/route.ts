export const runtime = "nodejs"

export async function GET() {
  const results: Record<string, string> = {}

  results.DATABASE_URL_SET = String(!!process.env.DATABASE_URL)
  results.NEXTAUTH_SECRET_SET = String(!!process.env.NEXTAUTH_SECRET)
  results.NODE_ENV = process.env.NODE_ENV ?? "undefined"
  results.VERCEL = process.env.VERCEL ?? "undefined"

  try {
    const { pool } = await import("@/lib/db")
    const res = await pool.query("SELECT 1 as ok")
    results.DB_QUERY = `OK (${res.rows[0].ok})`
  } catch (e: any) {
    results.DB_ERROR = `${e.message} (code: ${e.code ?? "none"})`
  }

  try {
    const auth = await import("@/server/auth")
    results.AUTH_IMPORT = "OK"
    results.AUTH_OPTIONS = String(typeof auth.authOptions)
  } catch (e: any) {
    results.AUTH_IMPORT_ERROR = e.message
  }

  return Response.json(results)
}
