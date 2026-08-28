import { prisma } from "@/lib/prisma"
import { withCache } from "@/lib/cache"

export async function listGlobalExercises() {
  return withCache(
    () =>
      prisma.exercise.findMany({
        where: { isGlobal: true },
        orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          nameAr: true,
          muscleGroup: true,
          equipment: true,
          tags: true,
          defaultSets: true,
          defaultReps: true,
          defaultRestSeconds: true,
          youtubeUrl: true,
        },
      }),
    ["exercises-global"],
    ["exercises"],
    3600
  )()
}
