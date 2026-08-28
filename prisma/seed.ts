import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  ClientStatus,
  Goal,
  PlanStatus,
  SubscriptionStatus,
  PaymentStatus,
  SplitType,
  TrainingDayFocus,
  BodyCompositionSource,
} from "../src/generated/prisma/enums"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123"
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@coach.local"
  const seedDemo = process.env.SEED_DEMO === "true"

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    })
    console.log(`Created admin user "${adminUsername}" (role ADMIN)`)
  } else {
    console.log(`Admin user "${adminUsername}" already exists, skipping`)
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
    const exists = await prisma.nutritionTemplate.findFirst({
      where: { name: template.name, isGlobal: true },
    })
    if (!exists) {
      await prisma.nutritionTemplate.create({
        data: { ...template, isGlobal: true },
      })
      console.log(`Created global nutrition template "${template.name}"`)
    }
  }

  await seedExerciseLibrary()
  await seedGlobalSplitTemplates()

  if (seedDemo) {
    console.log("Seeding demo data...")
    await seedDemoData()
  }

  console.log("Seed completed")
}

async function seedDemoData() {
  // Create demo trainer
  const trainerPassword = await bcrypt.hash("demo123", 10)
  const trainerUser = await prisma.user.upsert({
    where: { username: "trainer1" },
    update: {},
    create: {
      username: "trainer1",
      email: "trainer1@demo.local",
      passwordHash: trainerPassword,
      phone: "+1555000111",
      role: "TRAINER",
      trainerProfile: {
        create: {
          fullName: "المدرب التجريبي",
          phone: "+1555000111",
        },
      },
    },
  })

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: trainerUser.id },
  })

  if (!trainerProfile) {
    console.log("Trainer profile not found, skipping demo data")
    return
  }

  // Create demo client
  const client = await prisma.client.create({
    data: {
      trainerId: trainerProfile.id,
      fullName: "العميل التجريبي",
      phone: "+1555000222",
      birthDate: new Date("1990-01-15"),
      goal: Goal.MUSCLE_BUILDING,
      status: ClientStatus.ACTIVE,
      basicInfoCompletedAt: new Date(),
    },
  })

  // Create sample InBody (BodyComposition is source of truth)
  await prisma.bodyComposition.create({
    data: {
      clientId: client.id,
      date: new Date("2024-01-10"),
      source: BodyCompositionSource.COACH,
      weightKg: 75,
      muscleMassKg: 35,
      bodyFatKg: 15,
      bodyWaterPct: 55,
      bmrKcal: 1700,
      fitnessScore: 75,
      waistHipRatio: 0.85,
      visceralFatLevel: 5,
      notes: "بداية جيدة، التركيز على قوة الجزء العلوي من الجسم.",
    },
  })

  // Create sample nutrition plan
  await prisma.clientNutritionPlan.create({
    data: {
      clientId: client.id,
      calories: 2600,
      proteinGrams: 170,
      carbsGrams: 320,
      fatsGrams: 70,
      waterLiters: 3.5,
      status: PlanStatus.ACTIVE,
      startDate: new Date("2024-01-15"),
    },
  })

  // Create sample training split
  const demoLibrary = await prisma.exercise.findMany({
    where: {
      name: {
        in: [
          "Barbell Bench Press",
          "Lat Pulldown",
          "Barbell Back Squat",
          "Romanian Deadlift",
          "Overhead Press",
          "Seated Cable Row",
          "Leg Press",
          "Leg Curl",
        ],
      },
    },
    select: { id: true, name: true },
  })
  const demoExerciseById = new Map(demoLibrary.map((e) => [e.name, e.id]))

  const demoSplit = await prisma.trainingSplit.create({
    data: {
      clientId: client.id,
      splitType: "UPPER_LOWER",
      daysPerWeek: 4,
      status: PlanStatus.ACTIVE,
      days: {
        create: [
          {
            dayNumber: 1,
            focus: "UPPER",
            notes: "تركيز دفع/سحب",
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: demoExerciseById.get("Barbell Bench Press") ?? null,
                  exerciseName: "Barbell Bench Press",
                  targetSets: 3,
                  targetReps: 8,
                  targetWeightKg: 60,
                  restSeconds: 120,
                },
                {
                  order: 2,
                  exerciseId: demoExerciseById.get("Lat Pulldown") ?? null,
                  exerciseName: "Lat Pulldown",
                  targetSets: 3,
                  targetReps: 10,
                  restSeconds: 90,
                },
              ],
            },
          },
          {
            dayNumber: 2,
            focus: "LOWER",
            notes: "تركيز سكوات/رومانية",
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: demoExerciseById.get("Barbell Back Squat") ?? null,
                  exerciseName: "Barbell Back Squat",
                  targetSets: 3,
                  targetReps: 8,
                  targetWeightKg: 80,
                  restSeconds: 180,
                },
                {
                  order: 2,
                  exerciseId: demoExerciseById.get("Romanian Deadlift") ?? null,
                  exerciseName: "Romanian Deadlift",
                  targetSets: 3,
                  targetReps: 10,
                  restSeconds: 120,
                },
              ],
            },
          },
          {
            dayNumber: 3,
            focus: "UPPER",
            notes: "تركيز مائل/تجديف",
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: demoExerciseById.get("Overhead Press") ?? null,
                  exerciseName: "Overhead Press",
                  targetSets: 3,
                  targetReps: 8,
                  restSeconds: 120,
                },
                {
                  order: 2,
                  exerciseId: demoExerciseById.get("Seated Cable Row") ?? null,
                  exerciseName: "Seated Cable Row",
                  targetSets: 3,
                  targetReps: 10,
                  restSeconds: 90,
                },
              ],
            },
          },
          {
            dayNumber: 4,
            focus: "LOWER",
            notes: "تركيز اندفاع/مفصل الورك",
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: demoExerciseById.get("Leg Press") ?? null,
                  exerciseName: "Leg Press",
                  targetSets: 3,
                  targetReps: 12,
                  restSeconds: 120,
                },
                {
                  order: 2,
                  exerciseId: demoExerciseById.get("Leg Curl") ?? null,
                  exerciseName: "Leg Curl",
                  targetSets: 3,
                  targetReps: 12,
                  restSeconds: 60,
                },
              ],
            },
          },
        ],
      },
    },
    include: { days: { include: { exercises: true } } },
  })

  // Create sample exercise logs (drives auto-progress demo)
  const demoDayExercises = demoSplit.days.flatMap((day) => day.exercises)
  const bench = demoDayExercises.find((e) => e.exerciseName === "Barbell Bench Press")
  const squat = demoDayExercises.find((e) => e.exerciseName === "Barbell Back Squat")

  if (bench) {
    await prisma.exerciseLog.createMany({
      data: [
        {
          splitDayExerciseId: bench.id,
          clientId: client.id,
          date: new Date("2024-02-01"),
          actualSets: 3,
          actualReps: 8,
          actualWeightKg: 60,
          rpe: 7,
          notes: "إحساس قوي",
        },
        {
          splitDayExerciseId: bench.id,
          clientId: client.id,
          date: new Date("2024-02-08"),
          actualSets: 3,
          actualReps: 8,
          actualWeightKg: 62.5,
          rpe: 7,
        },
      ],
    })
  }
  if (squat) {
    await prisma.exerciseLog.createMany({
      data: [
        {
          splitDayExerciseId: squat.id,
          clientId: client.id,
          date: new Date("2024-02-01"),
          actualSets: 3,
          actualReps: 8,
          actualWeightKg: 80,
          rpe: 8,
        },
        {
          splitDayExerciseId: squat.id,
          clientId: client.id,
          date: new Date("2024-02-08"),
          actualSets: 3,
          actualReps: 8,
          actualWeightKg: 80,
          rpe: 9,
          notes: "صعب جدًا",
        },
      ],
    })
  }

  // Create sample subscription
  await prisma.subscription.create({
    data: {
      clientId: client.id,
      planName: "4 جلسات / شهر",
      status: SubscriptionStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-02-15"),
      sessionsCount: 16,
      remainingSessions: 12,
    },
  })

  // Create sample workout log
  await prisma.workoutLog.create({
    data: {
      clientId: client.id,
      date: new Date("2024-02-01"),
      exerciseName: "بنش برس",
      sets: 3,
      reps: 8,
      weightKg: 70,
      rpe: 8,
      notes: "إحساس قوي، زدت وزن البنش.",
    },
  })

  // Create sample progress review
  await prisma.progressReview.create({
    data: {
      clientId: client.id,
      reviewDate: new Date("2024-02-15"),
      trainerNotes: "الوزن زاد ١.٥ كجم والقوة تتحسن. ارفع السعرات ٢٠٠ كالوري.",
      adherencePct: 85,
      energyLevel: 8,
    },
  })

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
    const exists = await prisma.exercise.findUnique({
      where: { name: exercise.name },
    })
    if (!exists) {
      await prisma.exercise.create({ data: exercise })
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
    const exists = await prisma.trainingSplitTemplate.findFirst({
      where: { name: template.name, isGlobal: true },
    })
    if (exists) continue

    const exerciseNames = [
      ...new Set(
        template.days.flatMap((day) =>
          day.exercises.map((exercise) => exercise.exercise)
        )
      ),
    ]
    const library = await prisma.exercise.findMany({
      where: { name: { in: exerciseNames } },
      select: { id: true, name: true },
    })
    const libraryByName = new Map(library.map((e) => [e.name, e.id]))

    await prisma.trainingSplitTemplate.create({
      data: {
        name: template.name,
        goal: template.goal,
        level: template.level,
        splitType: template.splitType,
        daysPerWeek: template.daysPerWeek,
        description: template.description,
        isGlobal: true,
        days: {
          create: template.days.map((day, dayIndex) => ({
            dayNumber: dayIndex + 1,
            focus: day.focus,
            customFocus: day.customFocus,
            exercises: {
              create: day.exercises.map((exercise, exIndex) => ({
                order: exIndex + 1,
                exerciseId: libraryByName.get(exercise.exercise) ?? null,
                exerciseName: exercise.exercise,
                targetSets: exercise.sets ?? null,
                targetReps: exercise.reps ?? null,
                targetWeightKg: exercise.weightKg ?? null,
                restSeconds: exercise.rest ?? null,
                notes: exercise.notes ?? null,
              })),
            },
          })),
        },
      },
    })
    count++
  }
  console.log(`Global split templates ready (${count} created)`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())