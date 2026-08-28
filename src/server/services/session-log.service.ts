import { prisma } from "@/lib/prisma"
import { PlanStatus } from "@/generated/prisma/enums"
import type {
  SessionLogEntryInput,
  SessionLogInput,
} from "@/lib/validations/session-log"

function getOwnedClient(clientId: string, trainerProfileId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, trainerId: trainerProfileId },
    select: { id: true, fullName: true },
  })
}

export async function getSessionLogPageData(
  clientId: string,
  trainerProfileId: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const activeSplit = await prisma.trainingSplit.findFirst({
    where: { clientId: client.id, status: PlanStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          exercises: { orderBy: { order: "asc" } },
        },
      },
    },
  })

  return { client, activeSplit }
}

export async function createSessionLogs(
  clientId: string,
  trainerProfileId: string,
  data: SessionLogInput
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const splitDay = await prisma.trainingSplitDay.findFirst({
    where: {
      id: data.splitDayId,
      split: { clientId: client.id },
    },
    include: {
      exercises: { select: { id: true } },
    },
  })
  if (!splitDay) return null

  const exerciseIds = new Set(splitDay.exercises.map((e) => e.id))
  const validEntries = data.entries.filter((entry) =>
    exerciseIds.has(entry.splitDayExerciseId)
  )
  if (validEntries.length === 0) return null

  const date = new Date(`${data.date}T00:00:00Z`)

  const logs = await prisma.exerciseLog.createMany({
    data: validEntries.map((entry: SessionLogEntryInput) => ({
      splitDayExerciseId: entry.splitDayExerciseId,
      clientId: client.id,
      date,
      actualSets:
        entry.actualSets === "" || entry.actualSets === undefined
          ? null
          : (entry.actualSets as number),
      actualReps:
        entry.actualReps === "" || entry.actualReps === undefined
          ? null
          : (entry.actualReps as number),
      actualWeightKg:
        entry.actualWeightKg === "" || entry.actualWeightKg === undefined
          ? null
          : (entry.actualWeightKg as number),
      rpe:
        entry.rpe === "" || entry.rpe === undefined
          ? null
          : (entry.rpe as number),
      notes: entry.notes?.trim() || null,
    })),
  })

  return logs
}
