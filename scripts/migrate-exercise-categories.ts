import "dotenv/config"
import { fileURLToPath } from "node:url"
import { pool } from "../src/lib/db"

const CATEGORY_RULES: { group: string; patterns: RegExp[] }[] = [
  {
    group: "core",
    patterns: [
      /\b(abs|core|ab|plank|crunch|crunches|russian twist|leg raise|leg raises|dead bug|sit-?up|oblique)\b/i,
      /بطن|بلانك|جذع|معدة|رفع.*رجل/i,
    ],
  },
  {
    group: "legs",
    patterns: [
      /\b(squat|squats|leg press|hack squat|lunge|lunges|calf|quad|hamstring|leg extension|leg curl|step-?up|\blegs?\b)\b/i,
      /سكوات|رجل|أرجل|فخذ|سمانة|اندفاع/i,
    ],
  },
  {
    group: "chest",
    patterns: [
      /\b(bench|press|chest|push-?up|fly|flye|dip|pecs|pec|dumbbell press|incline press|decline press)\b/i,
      /بنش|صدر|تفتيح|غطس|ضغط.*صدر|تجميع/i,
    ],
  },
  {
    group: "back",
    patterns: [
      /\b(row|lat|pull-?up|chin-?up|pulldown|back|deadlift|face pull|shrug|t-bar)\b/i,
      /ظهر|سحب|تجديف|ديدليفت|عقلة/i,
    ],
  },
  {
    group: "shoulders",
    patterns: [
      /\b(shoulder|overhead|military|delt|lateral raise|front raise|arnold|upright row)\b/i,
      /كتف|أكتاف|رفرفة|ضغط.*كتف/i,
    ],
  },
  {
    group: "arms",
    patterns: [
      /\b(curl|bicep|tricep|skull crusher|pushdown|extension|hammer|kickback|preacher)\b/i,
      /بايسبس|ترايسبس|ذراع|ذراعين|تبادل/i,
    ],
  },
  {
    group: "glutes",
    patterns: [
      /\b(glute|hip thrust|bridge|cable kickback|abductor|adductor)\b/i,
      /أرداف|ارداف|مؤخرة|حوض|جسر عضلي/i,
    ],
  },
  {
    group: "cardio",
    patterns: [
      /\b(run|running|walk|treadmill|bike|cycling|rowing|jump rope|elliptical|cardio|hiit)\b/i,
      /جري|مشي|دراجة|قلب|حبل|كارديو/i,
    ],
  },
]

export function guessMuscleGroup(name: string, nameAr?: string | null): string {
  const combined = `${name} ${nameAr ?? ""}`

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(combined)) {
        return rule.group
      }
    }
  }

  return "chest" // safe fallback
}

export async function migrateExerciseCategories() {
  console.log("Checking for exercises needing category migration...")

  const { rows } = await pool.query<{ id: string; name: string; nameAr: string | null; muscleGroup: string }>(
    `SELECT id, name, "nameAr", "muscleGroup"
     FROM "Exercise"
     WHERE "muscleGroup" = 'general'
        OR "muscleGroup" IS NULL
        OR TRIM("muscleGroup") = ''`
  )

  if (rows.length === 0) {
    console.log("All exercises already have specific categories! No migration needed.")
    return { updated: 0 }
  }

  console.log(`Found ${rows.length} exercises to re-categorize:`)
  let updatedCount = 0

  for (const ex of rows) {
    const assigned = guessMuscleGroup(ex.name, ex.nameAr)
    await pool.query(
      `UPDATE "Exercise" SET "muscleGroup" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [assigned, ex.id]
    )
    console.log(`- "${ex.name}" [${ex.nameAr ?? "N/A"}] -> ${assigned}`)
    updatedCount++
  }

  console.log(`Successfully migrated ${updatedCount} exercises.`)
  return { updated: updatedCount }
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("migrate-exercise-categories.ts"))

if (isDirectRun) {
  migrateExerciseCategories()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Migration error:", err)
      pool.end()
      process.exit(1)
    })
}
