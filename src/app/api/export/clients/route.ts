import { pool } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"

export const dynamic = "force-dynamic"

function csvCell(value: unknown): string {
  const text = String(value ?? "")
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    return new Response("Unauthorized", { status: 401 })
  }

  const clientsRes = await pool.query(
    `SELECT "id", "fullName", "phone", "goal", "status", "createdAt" FROM "Client" WHERE "trainerId" = $1 ORDER BY "createdAt" DESC`,
    [session.user.trainerProfileId]
  )
  const clients = clientsRes.rows as Array<{ id: string; fullName: string | null; phone: string | null; goal: string | null; status: string; createdAt: Date }>

  const header = ["id", "fullName", "phone", "goal", "status", "createdAt"]

  const rows = clients.map((client) =>
    [
      client.id,
      client.fullName,
      client.phone,
      client.goal,
      client.status,
      client.createdAt.toISOString(),
    ]
      .map(csvCell)
      .join(",")
  )

  const csv = "\uFEFF" + [header.map(csvCell).join(","), ...rows].join("\n")
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(csv))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clients.csv"',
    },
  })
}
