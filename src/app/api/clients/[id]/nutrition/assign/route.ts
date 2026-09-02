import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import { assignTemplateToClients } from "@/server/services/nutrition.service"
import { invalidate } from "@/lib/cache"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const { templateId } = await req.json()
  if (!templateId) return NextResponse.json({ error: "templateId required" }, { status: 400 })
  try {
    await assignTemplateToClients(session.user.trainerProfileId, templateId, [id])
    invalidate([`client:${id}:nutrition`, `client:${id}:profile`])
    revalidatePath(`/clients/${id}?tab=nutrition`)
    revalidatePath("/client/nutrition")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
