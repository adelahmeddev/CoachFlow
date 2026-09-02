import "dotenv/config"
import bcrypt from "bcryptjs"
import { pool, generateId, withTransaction } from "../src/lib/db"
import {
  ClientStatus,
  Goal,
  PlanStatus,
  SubscriptionStatus,
  PaymentStatus,
  SplitType,
  TrainingDayFocus,
  BodyCompositionSource,
} from "../src/lib/db/enums"

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123"
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@coach.local"
  const seedDemo = process.env.SEED_DEMO === "true"

  const existingAdminRes = await pool.query(
    `SELECT "id" FROM "User" WHERE "username" = $1 LIMIT 1`,
    [adminUsername]
  )

  if (existingAdminRes.rowCount === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    const id = generateId()
    await pool.query(
      `INSERT INTO "User" ("id","username","email","passwordHash","role","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5::"Role",NOW(),NOW())`,
      [id, adminUsername, adminEmail, passwordHash, "SUPER_ADMIN"]
    )
    console.log(`Created admin user "${adminUsername}" (role SUPER_ADMIN)`)
  } else {
    // Update role if it was changed (e.g., ADMIN -> SUPER_ADMIN)
    await pool.query(
      `UPDATE "User" SET "role" = $1::"Role", "updatedAt" = NOW() WHERE "username" = $2 AND "role" <> $1::"Role"`,
      ["SUPER_ADMIN", adminUsername]
    )
    console.log(`Admin user "${adminUsername}" already exists, ensured role is SUPER_ADMIN`)
  }

  const globalTemplates = [
    {
      name: "إنقاص الوزن - متوازن",
      calories: 1800,
      proteinGrams: 140,
      carbsGrams: 180,
      fatsGrams: 55,
      waterLiters: 3,
    },
    {
      name: "بناء العضلات - قياسي",
      calories: 2600,
      proteinGrams: 170,
      carbsGrams: 320,
      fatsGrams: 70,
      waterLiters: 3.5,
    },
    {
      name: "الثبات على الوزن - متوازن",
      calories: 2200,
      proteinGrams: 150,
      carbsGrams: 240,
      fatsGrams: 65,
      waterLiters: 3,
    },
  ]

  for (const template of globalTemplates) {
    const exists = await pool.query(
      `SELECT "id" FROM "NutritionTemplate" WHERE "name" = $1 AND "isGlobal" = true LIMIT 1`,
      [template.name]
    )
    if (exists.rowCount === 0) {
      const id = generateId()
      await pool.query(
        `INSERT INTO "NutritionTemplate" ("id","name","calories","proteinGrams","carbsGrams","fatsGrams","waterLiters","isGlobal","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW())`,
        [id, template.name, template.calories, template.proteinGrams, template.carbsGrams, template.fatsGrams, template.waterLiters]
      )
      console.log(`Created global nutrition template "${template.name}"`)
    }
  }

  await seedExerciseLibrary()
  await seedGlobalSplitTemplates()

  // Always ensure default CoachSubscriptionPlan exists and backfill trials for existing coaches
  await ensureCoachSubscriptionPlan()

  if (seedDemo) {
    console.log("Seeding demo data...")
    await seedDemoData()
  }

  console.log("Seed completed")
}

async function seedDemoData() {
  // Create demo trainer — SELECT then INSERT (upsert)
  const trainerPassword = await bcrypt.hash("demo123", 10)
  let trainerUserRow = await pool.query(`SELECT * FROM "User" WHERE "username" = $1 LIMIT 1`, ["trainer1"])
  let trainerUser: any
  if (trainerUserRow.rowCount === 0) {
    const userId = generateId()
    const profileId = generateId()
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO "User" ("id","username","email","passwordHash","phone","role","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6::"Role",NOW(),NOW())`,
        [userId, "trainer1", "trainer1@demo.local", trainerPassword, "+1555000111", "COACH"]
      )
      await client.query(
        `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [profileId, userId, "المدرب التجريبي", "+1555000111"]
      )
    })
    const fresh = await pool.query(`SELECT * FROM "User" WHERE "id" = $1`, [userId])
    trainerUser = fresh.rows[0]
  } else {
    trainerUser = trainerUserRow.rows[0]
    // Update role if it was changed (e.g., TRAINER -> COACH)
    await pool.query(
      `UPDATE "User" SET "role" = $1::"Role", "updatedAt" = NOW() WHERE "id" = $2 AND "role" <> $1::"Role"`,
      ["COACH", trainerUser.id]
    )
  }

  const trainerProfileRes = await pool.query(`SELECT * FROM "TrainerProfile" WHERE "userId" = $1 LIMIT 1`, [trainerUser.id])
  if (trainerProfileRes.rowCount === 0) {
    console.log("Trainer profile not found, skipping demo data")
    return
  }
  const trainerProfile = trainerProfileRes.rows[0]

  // Ensure coach has a subscription (simple manual model)
  const subRes = await pool.query(
    `SELECT "id" FROM "CoachSubscription" WHERE "coachId" = $1 LIMIT 1`,
    [trainerProfile.id]
  )
  if (subRes.rowCount === 0) {
    const subscriptionId = generateId()
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 30)
    await pool.query(
      `INSERT INTO "CoachSubscription" ("id","coachId","startDate","endDate","amountPaid","paymentDate","status","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE'::"CoachSubscriptionStatus",$7,NOW(),NOW())`,
      [subscriptionId, trainerProfile.id, now, end, 500, now, "Demo subscription"]
    )
    await pool.query(
      `INSERT INTO "PaymentRecord" ("id","coachId","subscriptionId","amount","paymentDate","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [generateId(), trainerProfile.id, subscriptionId, 500, now, "Demo initial payment"]
    )
  }

  // Create demo client
  const clientId = generateId()
  const clientRes = await pool.query(
    `INSERT INTO "Client" ("id","trainerId","fullName","phone","birthDate","goal","status","basicInfoCompletedAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6::"Goal",$7::"ClientStatus",$8,NOW(),NOW()) RETURNING *`,
    [clientId, trainerProfile.id, "العميل التجريبي", "+1555000222", new Date("1990-01-15"), Goal.MUSCLE_BUILDING, ClientStatus.ACTIVE, new Date()]
  )
  const client = clientRes.rows[0]

  // Create sample InBody (BodyComposition is source of truth)
  await pool.query(
    `INSERT INTO "BodyComposition" ("id","clientId","date","source","weightKg","muscleMassKg","bodyFatKg","bodyWaterPct","bmrKcal","fitnessScore","waistHipRatio","visceralFatLevel","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"BodyCompositionSource",$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
    [generateId(), client.id, new Date("2024-01-10"), BodyCompositionSource.COACH, 75, 35, 15, 55, 1700, 75, 0.85, 5, "بداية جيدة، التركيز على قوة الجزء العلوي من الجسم."]
  )

  // Create sample nutrition plan
  await pool.query(
    `INSERT INTO "ClientNutritionPlan" ("id","clientId","calories","proteinGrams","carbsGrams","fatsGrams","waterLiters","status","startDate","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8::"PlanStatus",$9,NOW(),NOW())`,
    [generateId(), client.id, 2600, 170, 320, 70, 3.5, PlanStatus.ACTIVE, new Date("2024-01-15")]
  )

  // Create sample training split
  const demoExerciseNames = [
    "Barbell Bench Press",
    "Lat Pulldown",
    "Barbell Back Squat",
    "Romanian Deadlift",
    "Overhead Press",
    "Seated Cable Row",
    "Leg Press",
    "Leg Curl",
  ]
  const demoLibraryRes = await pool.query(`SELECT "id","name" FROM "Exercise" WHERE "name" = ANY($1::text[])`, [demoExerciseNames])
  const demoExerciseById = new Map(demoLibraryRes.rows.map((e: any) => [e.name, e.id]))

  // Build split with days and exercises inside transaction and keep created exercise ids
  const splitId = generateId()
  type CreatedEx = { id: string; exerciseName: string }
  const createdExercises: CreatedEx[] = []

  await withTransaction(async (tx) => {
    await tx.query(
      `INSERT INTO "TrainingSplit" ("id","clientId","splitType","daysPerWeek","status","createdAt","updatedAt") VALUES ($1,$2,$3::"SplitType",$4,$5::"PlanStatus",NOW(),NOW())`,
      [splitId, client.id, "UPPER_LOWER", 4, PlanStatus.ACTIVE]
    )

    const dayDefs: Array<{ dayNumber: number; focus: string; notes: string; exercises: Array<{ order: number; exerciseName: string; targetSets: number | null; targetReps: number | null; targetWeightKg: number | null; restSeconds: number | null }> }> = [
      {
        dayNumber: 1,
        focus: "UPPER",
        notes: "تركيز دفع/سحب",
        exercises: [
          { order: 1, exerciseName: "Barbell Bench Press", targetSets: 3, targetReps: 8, targetWeightKg: 60, restSeconds: 120 },
          { order: 2, exerciseName: "Lat Pulldown", targetSets: 3, targetReps: 10, targetWeightKg: null, restSeconds: 90 },
        ],
      },
      {
        dayNumber: 2,
        focus: "LOWER",
        notes: "تركيز سكوات/رومانية",
        exercises: [
          { order: 1, exerciseName: "Barbell Back Squat", targetSets: 3, targetReps: 8, targetWeightKg: 80, restSeconds: 180 },
          { order: 2, exerciseName: "Romanian Deadlift", targetSets: 3, targetReps: 10, targetWeightKg: null, restSeconds: 120 },
        ],
      },
      {
        dayNumber: 3,
        focus: "UPPER",
        notes: "تركيز مائل/تجديف",
        exercises: [
          { order: 1, exerciseName: "Overhead Press", targetSets: 3, targetReps: 8, targetWeightKg: null, restSeconds: 120 },
          { order: 2, exerciseName: "Seated Cable Row", targetSets: 3, targetReps: 10, targetWeightKg: null, restSeconds: 90 },
        ],
      },
      {
        dayNumber: 4,
        focus: "LOWER",
        notes: "تركيز اندفاع/مفصل الورك",
        exercises: [
          { order: 1, exerciseName: "Leg Press", targetSets: 3, targetReps: 12, targetWeightKg: null, restSeconds: 120 },
          { order: 2, exerciseName: "Leg Curl", targetSets: 3, targetReps: 12, targetWeightKg: null, restSeconds: 60 },
        ],
      },
    ]

    for (const day of dayDefs) {
      const dayId = generateId()
      await tx.query(
        `INSERT INTO "TrainingSplitDay" ("id","splitId","dayNumber","focus","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"TrainingDayFocus",$5,NOW(),NOW())`,
        [dayId, splitId, day.dayNumber, day.focus, day.notes]
      )
      for (const ex of day.exercises) {
        const exId = generateId()
        await tx.query(
          `INSERT INTO "SplitDayExercise" ("id","splitDayId","order","exerciseId","exerciseName","targetSets","targetReps","targetWeightKg","restSeconds","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
          [exId, dayId, ex.order, demoExerciseById.get(ex.exerciseName) ?? null, ex.exerciseName, ex.targetSets, ex.targetReps, ex.targetWeightKg, ex.restSeconds]
        )
        createdExercises.push({ id: exId, exerciseName: ex.exerciseName })
      }
    }
  })

  const bench = createdExercises.find((e) => e.exerciseName === "Barbell Bench Press")
  const squat = createdExercises.find((e) => e.exerciseName === "Barbell Back Squat")

  if (bench) {
    const logs = [
      { date: new Date("2024-02-01"), actualSets: 3, actualReps: 8, actualWeightKg: 60, rpe: 7, notes: "إحساس قوي" as string | null },
      { date: new Date("2024-02-08"), actualSets: 3, actualReps: 8, actualWeightKg: 62.5, rpe: 7, notes: null as string | null },
    ]
    for (const l of logs) {
      await pool.query(
        `INSERT INTO "ExerciseLog" ("id","splitDayExerciseId","clientId","date","actualSets","actualReps","actualWeightKg","rpe","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
        [generateId(), bench.id, client.id, l.date, l.actualSets, l.actualReps, l.actualWeightKg, l.rpe, l.notes]
      )
    }
  }
  if (squat) {
    const logs = [
      { date: new Date("2024-02-01"), actualSets: 3, actualReps: 8, actualWeightKg: 80, rpe: 8, notes: null as string | null },
      { date: new Date("2024-02-08"), actualSets: 3, actualReps: 8, actualWeightKg: 80, rpe: 9, notes: "صعب جدًا" as string | null },
    ]
    for (const l of logs) {
      await pool.query(
        `INSERT INTO "ExerciseLog" ("id","splitDayExerciseId","clientId","date","actualSets","actualReps","actualWeightKg","rpe","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
        [generateId(), squat.id, client.id, l.date, l.actualSets, l.actualReps, l.actualWeightKg, l.rpe, l.notes]
      )
    }
  }

  // Create sample subscription
  await pool.query(
    `INSERT INTO "Subscription" ("id","clientId","planName","status","paymentStatus","startDate","endDate","sessionsCount","remainingSessions","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"SubscriptionStatus",$5::"PaymentStatus",$6,$7,$8,$9,NOW(),NOW())`,
    [generateId(), client.id, "4 جلسات / شهر", SubscriptionStatus.ACTIVE, PaymentStatus.PAID, new Date("2024-01-15"), new Date("2024-02-15"), 16, 12]
  )

  // Create sample workout log
  await pool.query(
    `INSERT INTO "WorkoutLog" ("id","clientId","date","exerciseName","sets","reps","weightKg","rpe","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
    [generateId(), client.id, new Date("2024-02-01"), "بنش برس", 3, 8, 70, 8, "إحساس قوي، زدت وزن البنش."]
  )

  // Create sample progress review
  await pool.query(
    `INSERT INTO "ProgressReview" ("id","clientId","reviewDate","trainerNotes","adherencePct","energyLevel","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
    [generateId(), client.id, new Date("2024-02-15"), "الوزن زاد ١.٥ كجم والقوة تتحسن. ارفع السعرات ٢٠٠ كالوري.", 85, 8]
  )

  console.log("Demo data seeded successfully")
}

interface ExerciseSeed {
  name: string
  nameAr: string
  muscleGroup: string
  equipment: string
  tags: string[]
  defaultSets?: number
  defaultReps?: number
  defaultRestSeconds?: number
}

const EXERCISE_LIBRARY: ExerciseSeed[] = [
  { name: "Barbell Bench Press", nameAr: "بنش برس بالبار", muscleGroup: "chest", equipment: "barbell", tags: ["push", "beginner_friendly"], defaultSets: 3, defaultReps: 8, defaultRestSeconds: 120 },
  { name: "Dumbbell Bench Press", nameAr: "بنش برس بالدمبل", muscleGroup: "chest", equipment: "dumbbell", tags: ["push", "beginner_friendly"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: "Incline Dumbbell Press", nameAr: "ضغط دمبل مائل", muscleGroup: "chest", equipment: "dumbbell", tags: ["push", "shoulder_load"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: "Push-Ups", nameAr: "تمارين الضغط", muscleGroup: "chest", equipment: "bodyweight", tags: ["push", "beginner_friendly", "shoulder_load"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Chest Fly Machine", nameAr: "تفتيح صدر بالجهاز", muscleGroup: "chest", equipment: "machine", tags: ["push", "beginner_friendly"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Cable Crossover", nameAr: "تقاطع كابلات", muscleGroup: "chest", equipment: "cable", tags: ["push"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Dips", nameAr: "غطس أذرع", muscleGroup: "chest", equipment: "bodyweight", tags: ["push", "shoulder_load"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: "Pull-Ups", nameAr: "سحب لأعلى", muscleGroup: "back", equipment: "bodyweight", tags: ["pull", "shoulder_load"], defaultSets: 3, defaultReps: 8, defaultRestSeconds: 90 },
  { name: "Lat Pulldown", nameAr: "سحب أمامي", muscleGroup: "back", equipment: "cable", tags: ["pull", "beginner_friendly"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: "Barbell Row", nameAr: "تجديف بالبار", muscleGroup: "back", equipment: "barbell", tags: ["pull", "back_load"], defaultSets: 3, defaultReps: 8, defaultRestSeconds: 90 },
  { name: "Seated Cable Row", nameAr: "تجديف كابلات جالس", muscleGroup: "back", equipment: "cable", tags: ["pull", "back_load", "beginner_friendly"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: "Dumbbell Row", nameAr: "تجديف دمبل", muscleGroup: "back", equipment: "dumbbell", tags: ["pull", "back_load"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: "Face Pull", nameAr: "سحب وجهي", muscleGroup: "back", equipment: "cable", tags: ["pull", "shoulder_load", "beginner_friendly"], defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: "Overhead Press", nameAr: "ضغط فوق الرأس", muscleGroup: "shoulders", equipment: "barbell", tags: ["push", "shoulder_load"], defaultSets: 3, defaultReps: 8, defaultRestSeconds: 120 },
  { name: "Dumbbell Shoulder Press", nameAr: "ضغط دمبل للكتف", muscleGroup: "shoulders", equipment: "dumbbell", tags: ["push", "shoulder_load"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: "Lateral Raises", nameAr: "رفرفة جانبية", muscleGroup: "shoulders", equipment: "dumbbell", tags: ["push", "beginner_friendly"], defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: "Rear Delt Fly", nameAr: "تفتيح كتف خلفي", muscleGroup: "shoulders", equipment: "dumbbell", tags: ["pull", "beginner_friendly"], defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: "Front Raises", nameAr: "رفع أمامي", muscleGroup: "shoulders", equipment: "dumbbell", tags: ["push"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Barbell Curl", nameAr: "بايسبس بالبار", muscleGroup: "arms", equipment: "barbell", tags: ["pull"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Dumbbell Curl", nameAr: "بايسبس بالدمبل", muscleGroup: "arms", equipment: "dumbbell", tags: ["pull", "beginner_friendly"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Hammer Curl", nameAr: "بايسبس مطرقة", muscleGroup: "arms", equipment: "dumbbell", tags: ["pull"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Triceps Pushdown", nameAr: "تمديد ترايسبس بالكابل", muscleGroup: "arms", equipment: "cable", tags: ["push", "beginner_friendly"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Skull Crushers", nameAr: "تمديد ترايسبس مستلقي", muscleGroup: "arms", equipment: "barbell", tags: ["push", "shoulder_load"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },
  { name: "Overhead Triceps Extension", nameAr: "تمديد ترايسبس خلف الرأس", muscleGroup: "arms", equipment: "dumbbell", tags: ["push", "shoulder_load"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Barbell Back Squat", nameAr: "سكوات بار خلفي", muscleGroup: "legs", equipment: "barbell", tags: ["push", "knee_load", "back_load"], defaultSets: 3, defaultReps: 8, defaultRestSeconds: 180 },
  { name: "Front Squat", nameAr: "سكوات أمامي", muscleGroup: "legs", equipment: "barbell", tags: ["push", "knee_load"], defaultSets: 3, defaultReps: 8, defaultRestSeconds: 150 },
  { name: "Leg Press", nameAr: "ضغط رجل بالجهاز", muscleGroup: "legs", equipment: "machine", tags: ["push", "knee_load", "beginner_friendly"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 120 },
  { name: "Romanian Deadlift", nameAr: "رومانية ديدليفت", muscleGroup: "legs", equipment: "barbell", tags: ["pull", "back_load"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 120 },
  { name: "Leg Extensions", nameAr: "تمديد رجل بالجهاز", muscleGroup: "legs", equipment: "machine", tags: ["push", "knee_load", "beginner_friendly"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Leg Curl", nameAr: "ثني رجل بالجهاز", muscleGroup: "legs", equipment: "machine", tags: ["pull", "knee_load", "beginner_friendly"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Walking Lunges", nameAr: "اندفاع للمشي", muscleGroup: "legs", equipment: "bodyweight", tags: ["push", "knee_load"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },
  { name: "Goblet Squat", nameAr: "سكوات بالدمبل", muscleGroup: "legs", equipment: "dumbbell", tags: ["push", "knee_load", "beginner_friendly"], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },
  { name: "Calf Raises", nameAr: "رفع سمانة", muscleGroup: "legs", equipment: "machine", tags: ["push", "beginner_friendly"], defaultSets: 4, defaultReps: 15, defaultRestSeconds: 60 },
  { name: "Hip Thrust", nameAr: "رفع حوض بالبار", muscleGroup: "glutes", equipment: "barbell", tags: ["push", "back_load"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 120 },
  { name: "Glute Bridge", nameAr: "جسر عضلي", muscleGroup: "glutes", equipment: "bodyweight", tags: ["beginner_friendly", "back_load"], defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: "Cable Kickbacks", nameAr: "ركلة كابل خلفية", muscleGroup: "glutes", equipment: "cable", tags: ["beginner_friendly"], defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: "Plank", nameAr: "بلانك", muscleGroup: "core", equipment: "bodyweight", tags: ["beginner_friendly"], defaultSets: 3, defaultRestSeconds: 60 },
  { name: "Crunches", nameAr: "تمارين البطن", muscleGroup: "core", equipment: "bodyweight", tags: ["beginner_friendly"], defaultSets: 3, defaultReps: 20, defaultRestSeconds: 45 },
  { name: "Hanging Leg Raises", nameAr: "رفع رجل معلق", muscleGroup: "core", equipment: "bodyweight", tags: [], defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: "Russian Twists", nameAr: "لف روسي", muscleGroup: "core", equipment: "bodyweight", tags: ["back_load", "beginner_friendly"], defaultSets: 3, defaultReps: 20, defaultRestSeconds: 45 },
  { name: "Dead Bug", nameAr: "ديد باج", muscleGroup: "core", equipment: "bodyweight", tags: ["back_load", "beginner_friendly"], defaultSets: 3, defaultReps: 10, defaultRestSeconds: 45 },
  { name: "Treadmill Walking", nameAr: "مشي على الجهاز", muscleGroup: "cardio", equipment: "cardio", tags: ["beginner_friendly"], defaultSets: 1, defaultRestSeconds: 300 },
  { name: "Treadmill Running", nameAr: "جري على الجهاز", muscleGroup: "cardio", equipment: "cardio", tags: [], defaultSets: 1, defaultRestSeconds: 300 },
  { name: "Stationary Bike", nameAr: "دراجة ثابتة", muscleGroup: "cardio", equipment: "cardio", tags: ["beginner_friendly"], defaultSets: 1, defaultRestSeconds: 300 },
  { name: "Rowing Machine", nameAr: "جهاز التجديف", muscleGroup: "cardio", equipment: "cardio", tags: ["back_load"], defaultSets: 1, defaultRestSeconds: 300 },
  { name: "Jump Rope", nameAr: "نط الحبل", muscleGroup: "cardio", equipment: "bodyweight", tags: ["knee_load"], defaultSets: 1, defaultRestSeconds: 120 },
]

async function seedExerciseLibrary() {
  let count = 0
  for (const exercise of EXERCISE_LIBRARY) {
    const exists = await pool.query(`SELECT "id" FROM "Exercise" WHERE "name" = $1 LIMIT 1`, [exercise.name])
    if (exists.rowCount === 0) {
      const id = generateId()
      await pool.query(
        `INSERT INTO "Exercise" ("id","name","nameAr","muscleGroup","equipment","tags","defaultSets","defaultReps","defaultRestSeconds","isGlobal","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6::text[],$7,$8,$9,true,NOW(),NOW())`,
        [id, exercise.name, exercise.nameAr, exercise.muscleGroup, exercise.equipment, exercise.tags, exercise.defaultSets ?? null, exercise.defaultReps ?? null, exercise.defaultRestSeconds ?? null]
      )
      count++
    }
  }
  console.log(`Exercise library ready (${count} created)`)
}

interface TemplateExerciseSeed {
  exercise: string
  sets?: number
  reps?: number
  weightKg?: number
  rest?: number
  notes?: string
}

interface TemplateDaySeed {
  focus: TrainingDayFocus
  customFocus?: string
  exercises: TemplateExerciseSeed[]
}

interface TemplateSeed {
  name: string
  goal: Goal
  level: string
  splitType: SplitType
  daysPerWeek: number
  description: string
  days: TemplateDaySeed[]
}

const GLOBAL_SPLIT_TEMPLATES: TemplateSeed[] = [
  {
    name: "Fat Loss - 3 Days Full Body",
    goal: Goal.WEIGHT_LOSS,
    level: "Beginner",
    splitType: SplitType.FULL_BODY,
    daysPerWeek: 3,
    description: "Three full-body sessions mixing strength and cardio to maximize calorie burn.",
    days: [
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Goblet Squat", sets: 3, reps: 12, rest: 90 },
          { exercise: "Push-Ups", sets: 3, reps: 12, rest: 60 },
          { exercise: "Seated Cable Row", sets: 3, reps: 12, rest: 60 },
          { exercise: "Plank", sets: 3, rest: 45, notes: "Hold 30-45 seconds" },
          { exercise: "Treadmill Walking", sets: 1, rest: 60, notes: "20 minutes incline walk" },
        ],
      },
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Leg Press", sets: 3, reps: 12, rest: 90 },
          { exercise: "Lat Pulldown", sets: 3, reps: 12, rest: 60 },
          { exercise: "Dumbbell Shoulder Press", sets: 3, reps: 10, rest: 90 },
          { exercise: "Russian Twists", sets: 3, reps: 15, rest: 45 },
          { exercise: "Stationary Bike", sets: 1, rest: 60, notes: "20 minutes steady pace" },
        ],
      },
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Romanian Deadlift", sets: 3, reps: 10, rest: 120 },
          { exercise: "Chest Fly Machine", sets: 3, reps: 12, rest: 60 },
          { exercise: "Dumbbell Row", sets: 3, reps: 12, rest: 60 },
          { exercise: "Glute Bridge", sets: 3, reps: 15, rest: 45 },
          { exercise: "Rowing Machine", sets: 1, rest: 60, notes: "15 minutes" },
        ],
      },
    ],
  },
  {
    name: "Muscle Building - 4 Days Upper/Lower",
    goal: Goal.MUSCLE_BUILDING,
    level: "Intermediate",
    splitType: SplitType.UPPER_LOWER,
    daysPerWeek: 4,
    description: "Upper/Lower split built for hypertrophy with progressive overload.",
    days: [
      {
        focus: TrainingDayFocus.UPPER,
        exercises: [
          { exercise: "Barbell Bench Press", sets: 4, reps: 8, weightKg: 60, rest: 120 },
          { exercise: "Incline Dumbbell Press", sets: 3, reps: 10, rest: 90 },
          { exercise: "Lat Pulldown", sets: 4, reps: 10, rest: 90 },
          { exercise: "Barbell Row", sets: 3, reps: 10, rest: 90 },
          { exercise: "Dumbbell Curl", sets: 3, reps: 12, rest: 60 },
          { exercise: "Triceps Pushdown", sets: 3, reps: 12, rest: 60 },
        ],
      },
      {
        focus: TrainingDayFocus.LOWER,
        exercises: [
          { exercise: "Barbell Back Squat", sets: 4, reps: 8, weightKg: 80, rest: 180 },
          { exercise: "Romanian Deadlift", sets: 4, reps: 8, rest: 150 },
          { exercise: "Leg Press", sets: 3, reps: 10, rest: 120 },
          { exercise: "Leg Curl", sets: 3, reps: 12, rest: 60 },
          { exercise: "Calf Raises", sets: 4, reps: 15, rest: 60 },
        ],
      },
      {
        focus: TrainingDayFocus.UPPER,
        exercises: [
          { exercise: "Overhead Press", sets: 4, reps: 8, rest: 120 },
          { exercise: "Dumbbell Shoulder Press", sets: 3, reps: 10, rest: 90 },
          { exercise: "Pull-Ups", sets: 3, reps: 8, rest: 90 },
          { exercise: "Seated Cable Row", sets: 4, reps: 10, rest: 90 },
          { exercise: "Hammer Curl", sets: 3, reps: 12, rest: 60 },
          { exercise: "Skull Crushers", sets: 3, reps: 10, rest: 90 },
        ],
      },
      {
        focus: TrainingDayFocus.LOWER,
        exercises: [
          { exercise: "Front Squat", sets: 4, reps: 8, rest: 150 },
          { exercise: "Walking Lunges", sets: 3, reps: 12, rest: 90 },
          { exercise: "Leg Extensions", sets: 3, reps: 12, rest: 60 },
          { exercise: "Hip Thrust", sets: 3, reps: 10, rest: 120 },
          { exercise: "Glute Bridge", sets: 3, reps: 15, rest: 60 },
        ],
      },
    ],
  },
  {
    name: "Strength - 3 Days",
    goal: Goal.STRENGTH,
    level: "Intermediate",
    splitType: SplitType.FULL_BODY,
    daysPerWeek: 3,
    description: "Heavy compound lifts with low reps for maximal strength gains.",
    days: [
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Barbell Back Squat", sets: 5, reps: 5, weightKg: 100, rest: 240 },
          { exercise: "Barbell Bench Press", sets: 5, reps: 5, weightKg: 70, rest: 180 },
          { exercise: "Barbell Row", sets: 5, reps: 5, rest: 180 },
          { exercise: "Plank", sets: 3, rest: 60, notes: "Hold 60 seconds" },
        ],
      },
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Overhead Press", sets: 5, reps: 5, weightKg: 45, rest: 180 },
          { exercise: "Romanian Deadlift", sets: 5, reps: 5, rest: 180 },
          { exercise: "Pull-Ups", sets: 4, reps: 6, rest: 120 },
          { exercise: "Leg Press", sets: 4, reps: 10, rest: 120 },
        ],
      },
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Front Squat", sets: 5, reps: 5, rest: 180 },
          { exercise: "Dips", sets: 4, reps: 8, rest: 120 },
          { exercise: "Seated Cable Row", sets: 4, reps: 8, rest: 120 },
          { exercise: "Calf Raises", sets: 4, reps: 12, rest: 60 },
        ],
      },
    ],
  },
  {
    name: "General Fitness - 2 Days",
    goal: Goal.GENERAL_FITNESS,
    level: "Beginner",
    splitType: SplitType.FULL_BODY,
    daysPerWeek: 2,
    description: "A simple two-day full body routine to build a consistent habit.",
    days: [
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Goblet Squat", sets: 3, reps: 12, rest: 90 },
          { exercise: "Push-Ups", sets: 3, reps: 10, rest: 60 },
          { exercise: "Seated Cable Row", sets: 3, reps: 12, rest: 60 },
          { exercise: "Plank", sets: 3, rest: 45, notes: "Hold 30 seconds" },
          { exercise: "Treadmill Walking", sets: 1, rest: 60, notes: "15 minutes" },
        ],
      },
      {
        focus: TrainingDayFocus.FULL_BODY,
        exercises: [
          { exercise: "Leg Press", sets: 3, reps: 12, rest: 90 },
          { exercise: "Lat Pulldown", sets: 3, reps: 12, rest: 60 },
          { exercise: "Dumbbell Shoulder Press", sets: 3, reps: 10, rest: 90 },
          { exercise: "Glute Bridge", sets: 3, reps: 15, rest: 45 },
          { exercise: "Stationary Bike", sets: 1, rest: 60, notes: "15 minutes" },
        ],
      },
    ],
  },
]

async function seedGlobalSplitTemplates() {
  let count = 0
  for (const template of GLOBAL_SPLIT_TEMPLATES) {
    const exists = await pool.query(`SELECT "id" FROM "TrainingSplitTemplate" WHERE "name" = $1 AND "isGlobal" = true LIMIT 1`, [template.name])
    if (exists.rowCount !== 0) continue

    const exerciseNames = [...new Set(template.days.flatMap((day) => day.exercises.map((exercise) => exercise.exercise)))]
    const libraryRes = await pool.query(`SELECT "id","name" FROM "Exercise" WHERE "name" = ANY($1::text[])`, [exerciseNames])
    const libraryByName = new Map(libraryRes.rows.map((e: any) => [e.name, e.id]))

    await withTransaction(async (client) => {
      const templateId = generateId()
      await client.query(
        `INSERT INTO "TrainingSplitTemplate" ("id","name","goal","level","splitType","daysPerWeek","description","isGlobal","createdAt","updatedAt") VALUES ($1,$2,$3::"Goal",$4,$5::"SplitType",$6,$7,true,NOW(),NOW())`,
        [templateId, template.name, template.goal, template.level, template.splitType, template.daysPerWeek, template.description]
      )
      for (let dayIndex = 0; dayIndex < template.days.length; dayIndex++) {
        const day = template.days[dayIndex]
        const dayId = generateId()
        await client.query(
          `INSERT INTO "TrainingSplitTemplateDay" ("id","templateId","dayNumber","focus","customFocus","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"TrainingDayFocus",$5,NOW(),NOW())`,
          [dayId, templateId, dayIndex + 1, day.focus, (day as any).customFocus ?? null]
        )
        for (let exIndex = 0; exIndex < day.exercises.length; exIndex++) {
          const exercise = day.exercises[exIndex]
          const exId = generateId()
          await client.query(
            `INSERT INTO "TemplateDayExercise" ("id","templateDayId","order","exerciseId","exerciseName","targetSets","targetReps","targetWeightKg","restSeconds","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
            [exId, dayId, exIndex + 1, libraryByName.get(exercise.exercise) ?? null, exercise.exercise, exercise.sets ?? null, exercise.reps ?? null, exercise.weightKg ?? null, exercise.rest ?? null, exercise.notes ?? null]
          )
        }
      }
    })
    count++
  }
  console.log(`Global split templates ready (${count} created)`)
}

async function ensureCoachSubscriptionPlan() {
  // New manual model: create a simple 30-day ACTIVE subscription for coaches without one
  const coaches = await pool.query(`SELECT "id" FROM "TrainerProfile"`)
  for (const row of coaches.rows as { id: string }[]) {
    const exists = await pool.query(`SELECT "id" FROM "CoachSubscription" WHERE "coachId" = $1 LIMIT 1`, [row.id])
    if ((exists.rowCount ?? 0) === 0) {
      const subId = generateId()
      const now = new Date()
      const end = new Date(now)
      end.setDate(end.getDate() + 30)
      await pool.query(
        `INSERT INTO "CoachSubscription" ("id","coachId","startDate","endDate","amountPaid","paymentDate","status","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE'::"CoachSubscriptionStatus",$7,NOW(),NOW())`,
        [subId, row.id, now, end, 500, now, "Initial 30-day subscription"]
      )
      await pool.query(
        `INSERT INTO "PaymentRecord" ("id","coachId","subscriptionId","amount","paymentDate","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
        [generateId(), row.id, subId, 500, now, "Initial subscription"]
      )
      console.log(`Created initial subscription for coach ${row.id}`)
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })