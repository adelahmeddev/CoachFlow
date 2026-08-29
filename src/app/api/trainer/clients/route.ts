import { getCurrentSession } from "@/server/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user || session.user.role !== "TRAINER" || !session.user.trainerProfileId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const res = await pool.query(
    `SELECT "id", "fullName", "goal" FROM "Client" WHERE "trainerId" = $1 ORDER BY "createdAt" DESC`,
    [session.user.trainerProfileId]
  );
  const clients = res.rows as Array<{ id: string; fullName: string | null; goal: string | null }>;
  return new Response(JSON.stringify({ clients }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
