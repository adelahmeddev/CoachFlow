import { getCurrentSession } from "@/server/auth";
import { getTemplatesForTrainer } from "@/server/services/nutrition.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user || session.user.role !== "TRAINER" || !session.user.trainerProfileId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const templates = await getTemplatesForTrainer(session.user.trainerProfileId);
  return new Response(JSON.stringify({ templates }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
