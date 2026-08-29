import "dotenv/config"
import { pool, generateId, withTransaction } from "../src/lib/db"
import bcrypt from "bcryptjs"
import {
  Role,
  Goal,
  PlanStatus,
  SubscriptionStatus,
  PaymentStatus,
  Units,
  WeekStartDay,
  SplitType,
  TrainingDayFocus,
  ClientStatus,
  BodyCompositionSource,
} from "../src/lib/db/enums"
import {
  SUPPLEMENT_DEFS_SEED,
  SUBSTITUTE_GROUPS_SEED,
  SAMPLE_MEALS_KAMEL,
} from "../src/lib/nutrition-fixed"

const DEMO_TRAINER_PHONE = '01000000000';
const DEMO_TRAINER_PASSWORD = 'Demo@123';

// 10 demo clients with their data
interface DemoClient {
  fullName: string;
  gender: 'M' | 'F';
  age: number;
  goal: Goal;
  status: ClientStatus;
  backPain?: boolean;
  kneePain?: boolean;
  hasAssessment: boolean;
  phoneNumberPrefix: string;
  hasNutritionPlan?: boolean;
  hasSplit?: boolean;
  hasProgressReview?: boolean;
  hasWorkoutLogs?: boolean;
  subscription?: SubscriptionData;
}

interface SubscriptionData {
  status: SubscriptionStatus;
  planName: string;
  sessionsCount: number;
  remainingSessions: number;
  paymentStatus: PaymentStatus;
  autoRenew: boolean;
}

const demoClients: DemoClient[] = [
  {
    fullName: 'Ø£Ø­Ù…Ø¯ Ø³Ù…ÙŠØ± Ù…Ø­Ù…ÙˆØ¯',
    gender: 'M',
    age: 29,
    goal: Goal.WEIGHT_LOSS,
    status: ClientStatus.ACTIVE,
    hasAssessment: true,
    phoneNumberPrefix: '010',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.ACTIVE,
      planName: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
      sessionsCount: 12,
      remainingSessions: 8,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: true,
    },
  },
  {
    fullName: 'Ø³Ø§Ø±Ø© Ø¹Ø¨Ø¯ Ø§Ù„Ø±Ø­Ù…Ù† Ø¹Ù„ÙŠ',
    gender: 'F',
    age: 24,
    goal: Goal.MUSCLE_BUILDING,
    status: ClientStatus.ACTIVE,
    hasAssessment: true,
    phoneNumberPrefix: '011',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.ACTIVE,
      planName: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
      sessionsCount: 12,
      remainingSessions: 6,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: true,
    },
  },
  {
    fullName: 'Ù…ØµØ·ÙÙ‰ Ø­Ø³Ù† Ø¥Ø¨Ø±Ø§Ù‡ÙŠÙ…',
    gender: 'M',
    age: 35,
    goal: Goal.WEIGHT_LOSS,
    status: ClientStatus.ACTIVE,
    backPain: true,
    hasAssessment: true,
    phoneNumberPrefix: '012',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.ACTIVE,
      planName: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
      sessionsCount: 12,
      remainingSessions: 4,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: true,
    },
  },
  {
    fullName: 'ÙØ§Ø·Ù…Ø© Ø§Ù„Ø³ÙŠØ¯ Ù…ØµØ·ÙÙ‰',
    gender: 'F',
    age: 31,
    goal: Goal.GENERAL_FITNESS,
    status: ClientStatus.PENDING_ASSESSMENT,
    hasAssessment: false,
    phoneNumberPrefix: '015',
    hasNutritionPlan: false,
    hasSplit: false,
    hasProgressReview: false,
    hasWorkoutLogs: false,
  },
  {
    fullName: 'Ø¹Ù…Ø± Ø®Ø§Ù„Ø¯ ÙØ§Ø±ÙˆÙ‚',
    gender: 'M',
    age: 22,
    goal: Goal.STRENGTH,
    status: ClientStatus.ACTIVE,
    hasAssessment: true,
    phoneNumberPrefix: '010',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.ACTIVE,
      planName: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
      sessionsCount: 12,
      remainingSessions: 10,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: true,
    },
  },
  {
    fullName: 'Ù†ÙˆØ± Ø£Ø­Ù…Ø¯ ÙØªØ­ÙŠ',
    gender: 'F',
    age: 27,
    goal: Goal.WEIGHT_LOSS,
    status: ClientStatus.PAUSED,
    hasAssessment: true,
    phoneNumberPrefix: '011',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.PAUSED,
      planName: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
      sessionsCount: 12,
      remainingSessions: 3,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: false,
    },
  },
  {
    fullName: 'Ø­Ø³Ù† Ø¥Ø¨Ø±Ø§Ù‡ÙŠÙ… Ø­Ø³Ù†',
    gender: 'M',
    age: 41,
    goal: Goal.WEIGHT_LOSS,
    status: ClientStatus.ACTIVE,
    kneePain: true,
    hasAssessment: true,
    phoneNumberPrefix: '012',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.ACTIVE,
      planName: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
      sessionsCount: 12,
      remainingSessions: 2,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: true,
    },
  },
  {
    fullName: 'Ù…Ø±ÙŠÙ… Ø·Ø§Ø±Ù‚ Ø£Ù†ÙˆØ±',
    gender: 'F',
    age: 20,
    goal: Goal.WEIGHT_GAIN,
    status: ClientStatus.ACTIVE,
    hasAssessment: true,
    phoneNumberPrefix: '015',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.TRIAL,
      planName: 'Ø¨Ø§Ù‚Ø© ØªØ¬Ø±ÙŠØ¨ÙŠØ©',
      sessionsCount: 4,
      remainingSessions: 1,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: false,
    },
  },
  {
    fullName: 'ÙŠÙˆØ³Ù Ø¹Ø§Ø¯Ù„ Ø±Ù…Ø²ÙŠ',
    gender: 'M',
    age: 26,
    goal: Goal.MUSCLE_BUILDING,
    status: ClientStatus.COMPLETED,
    hasAssessment: true,
    phoneNumberPrefix: '010',
    hasNutritionPlan: true,
    hasSplit: true,
    hasProgressReview: true,
    hasWorkoutLogs: true,
    subscription: {
      status: SubscriptionStatus.EXPIRED,
      planName: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
      sessionsCount: 12,
      remainingSessions: 0,
      paymentStatus: PaymentStatus.PAID,
      autoRenew: false,
    },
  },
  {
    fullName: 'Ù‡Ù†Ø§ Ø³Ù…ÙŠØ± ÙØ¤Ø§Ø¯',
    gender: 'F',
    age: 33,
    goal: Goal.GENERAL_FITNESS,
    status: ClientStatus.INVITED,
    hasAssessment: false,
    phoneNumberPrefix: '011',
    hasNutritionPlan: false,
    hasSplit: false,
    hasProgressReview: false,
    hasWorkoutLogs: false,
  },
];

const phonePrefixes = ['010', '011', '012', '015'];
const jobTitles = ['Ù…Ø­Ø§Ø³Ø¨', 'Ù…Ø¹Ù„Ù…', 'Ù…Ù‡Ù†Ø¯Ø³', 'Ø·Ø§Ù„Ø¨', 'Ù…Ø¨ÙŠØ¹Ø§Øª'];

function getPhone(index: number): string {
  const prefix = phonePrefixes[index % phonePrefixes.length];
  const number = 10000000 + index * 1234;
  return `${prefix}${number}`;
}

function getSleepCategory(_index: number): string {
  return "HOURS_6_8"
}

function getActivityLevel(_index: number): string {
  return "MODERATE"
}

function getHeightCm(gender: 'M' | 'F', age: number, goal: Goal, index: number): number {
  const baseHeight = gender === 'M' ? 168 + (index % 14) : 158 + (index % 12);
  return baseHeight;
}

function getWeightKg(gender: 'M' | 'F', goal: Goal, heightCm: number, index: number): number {
  let weight: number;
  if (gender === 'M') {
    if (goal === Goal.WEIGHT_LOSS) {
      weight = 78 + (index % 20);
    } else if (goal === Goal.WEIGHT_GAIN) {
      weight = 65 + (index % 20);
    } else if (goal === Goal.STRENGTH) {
      weight = 80 + (index % 15);
    } else {
      weight = 75 + (index % 15);
    }
  } else {
    if (goal === Goal.WEIGHT_LOSS) {
      weight = 58 + (index % 20);
    } else if (goal === Goal.WEIGHT_GAIN) {
      weight = 88 + (index % 20);
    } else if (goal === Goal.MUSCLE_BUILDING) {
      weight = 60 + (index % 25);
    } else {
      weight = 65 + (index % 15);
    }
  }
  return Math.round(weight * 10) / 10;
}

function getWaistCm(goal: Goal, weightKg: number, index: number): number {
  if (goal === Goal.WEIGHT_LOSS) {
    return Math.round((85 + index) * 10) / 10;
  } else if (goal === Goal.WEIGHT_GAIN) {
    return Math.round((75 + index * 0.5) * 10) / 10;
  }
  return Math.round((80 + index * 0.3) * 10) / 10;
}

function getMobilityResult(_painFlags: boolean[]): string {
  return "GOOD";
}

function getHamstringResult(): string {
  return "GOOD";
}

function getStrengthTestValues(
  _sex: string,
  _age: number,
  _goal: Goal,
  _index: number
): {
  bodyweightSquatsReps: number;
  pushUpsReps: number;
  plankSeconds: number;
  latPulldownKg: number;
  latPulldownReps: number;
} {
  return {
    bodyweightSquatsReps: 12,
    pushUpsReps: 15,
    plankSeconds: 60,
    latPulldownKg: 40,
    latPulldownReps: 8,
  };
}

function getWalkTestDistance(_sex: string, _goal: Goal, index: number): number {
  return 500 + index * 20;
}

function getWalkTestPerformance(_sex: string, _distance: number): string {
  return "AVERAGE";
}

function getTargetWeightKg(_goal: Goal, currentWeight: number, _index: number): number {
  return currentWeight;
}


async function getClientIdList(trainerId: string): Promise<string[]> {
  const res = await pool.query(`SELECT "id" FROM "Client" WHERE "trainerId" = $1`, [trainerId])
  return res.rows.map((c: any) => c.id)
}

async function clearDemoData(userId: string) {
  console.log("Checking for existing demo data...")

  let trainerProfile: any
  try {
    const r = await pool.query(`SELECT "id" FROM "TrainerProfile" WHERE "userId" = $1 LIMIT 1`, [userId])
    trainerProfile = r.rows[0] ?? null
  } catch (e) {
    console.log("Database not ready or no existing trainer profile, skipping cleanup")
    return
  }

  if (!trainerProfile) {
    console.log("No existing trainer profile found, skipping cleanup")
    return
  }

  const clientIds = await getClientIdList(trainerProfile.id)
  if (clientIds.length === 0) {
    console.log("No existing demo clients to clean")
    return
  }

  console.log(`Clearing ${clientIds.length} existing demo clients...`)

  // Delete in correct order due to foreign key constraints
  await pool.query(`DELETE FROM "ExerciseLog" WHERE "clientId" = ANY($1::text[])`, [clientIds])
  await pool.query(`DELETE FROM "WorkoutLog" WHERE "clientId" = ANY($1::text[])`, [clientIds])
  await pool.query(`DELETE FROM "ProgressReview" WHERE "clientId" = ANY($1::text[])`, [clientIds])
  await pool.query(`DELETE FROM "Subscription" WHERE "clientId" = ANY($1::text[])`, [clientIds])
  // TrainingSplit cascade will delete days and exercises, but explicit delete
  await pool.query(`DELETE FROM "TrainingSplit" WHERE "clientId" = ANY($1::text[])`, [clientIds])
  await pool.query(`DELETE FROM "ClientNutritionPlan" WHERE "clientId" = ANY($1::text[])`, [clientIds])
  await pool.query(`DELETE FROM "BodyComposition" WHERE "clientId" = ANY($1::text[])`, [clientIds])
  await pool.query(`DELETE FROM "Client" WHERE "trainerId" = $1`, [trainerProfile.id])
}

async function createDemoTrainer() {
  const hashed = bcrypt.hashSync(DEMO_TRAINER_PASSWORD, 10)

  // SELECT then INSERT for User (upsert by phone)
  let userRow = await pool.query(`SELECT * FROM "User" WHERE "phone" = $1 LIMIT 1`, [DEMO_TRAINER_PHONE])
  let trainerUser: any
  if (userRow.rowCount === 0) {
    const id = generateId()
    await pool.query(
      `INSERT INTO "User" ("id","username","phone","email","passwordHash","role","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5::"Role",NOW(),NOW())`,
      [id, "coach.karim", DEMO_TRAINER_PHONE, "coach.karim@example.com", hashed, Role.TRAINER]
    )
    const fresh = await pool.query(`SELECT * FROM "User" WHERE "id" = $1`, [id])
    trainerUser = fresh.rows[0]
  } else {
    trainerUser = userRow.rows[0]
    // update passwordHash
    await pool.query(`UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE "id" = $2`, [hashed, trainerUser.id])
    const fresh = await pool.query(`SELECT * FROM "User" WHERE "id" = $1`, [trainerUser.id])
    trainerUser = fresh.rows[0]
  }

  let profileRow = await pool.query(`SELECT * FROM "TrainerProfile" WHERE "userId" = $1 LIMIT 1`, [trainerUser.id])
  let trainerProfile: any
  if (profileRow.rowCount === 0) {
    const pid = generateId()
    await pool.query(
      `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","email","units","weekStartDay","timezone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6::"Units",$7::"WeekStartDay",$8,NOW(),NOW())`,
      [pid, trainerUser.id, "Coach Karim Adel", DEMO_TRAINER_PHONE, "coach.karim@example.com", Units.METRIC, WeekStartDay.SAT, "Asia/Cairo"]
    )
    const fresh = await pool.query(`SELECT * FROM "TrainerProfile" WHERE "id" = $1`, [pid])
    trainerProfile = fresh.rows[0]
  } else {
    trainerProfile = profileRow.rows[0]
  }

  return { user: trainerUser, profile: trainerProfile }
}

let kamelTemplateId: string | null = null

const KAMEL_GUIDELINES = [
  "وزع وجباتك كل ٢-٣ ساعات | Divide your meals every 2-3 hours",
  "ميزان طعام خاص، اوزن بعد الطبخ | Own food scale — weigh after cooking",
  "التقرير الأسبوعي يوم الجمعة، صباحًا على معدة فارغة وبنفس الميزان | Weekly report Friday, empty stomach, same scale",
  "صور وقياسات كل ١٥ يوم | Photos + measurements every 15 days",
  "٣-٤ لتر مياه موزعة + نصف لتر أثناء التمرين | 3-4L water distributed + 0.5L during training",
  "نام ٧ ساعات على الأقل و ليس بعد الحادية عشر مساءً | Sleep at least 7 hours, not after 11pm",
  "لا كافيين على معدة فارغة أو قرب النوم | No caffeine on an empty stomach or near bedtime",
]

async function ensureKamelTemplate(trainerProfileId: string) {
  if (kamelTemplateId) {
    const existing = await pool.query(`SELECT "id" FROM "NutritionTemplate" WHERE "id" = $1 LIMIT 1`, [kamelTemplateId])
    if (existing.rowCount !== 0) return existing.rows[0]
  }

  const byName = await pool.query(`SELECT "id" FROM "NutritionTemplate" WHERE "name" = $1 AND "trainerId" = $2 LIMIT 1`, ["تنشيف 1900 - ستايل كامل", trainerProfileId])
  if (byName.rowCount !== 0) {
    kamelTemplateId = byName.rows[0].id
    return byName.rows[0]
  }

  const templateId = generateId()
  await withTransaction(async (tx) => {
    await tx.query(
      `INSERT INTO "NutritionTemplate" ("id","trainerId","name","isGlobal","calories","proteinGrams","carbsGrams","fatsGrams","waterLiters","coachMessage","guidelines","avoidFoods","recommendedFoods","createdAt","updatedAt") VALUES ($1,$2,$3,false,$4,$5,$6,$7,$8,$9,$10::text[],$11::text[],$12::text[],NOW(),NOW())`,
      [
        templateId,
        trainerProfileId,
        "تنشيف 1900 - ستايل كامل",
        1900,
        160,
        170,
        60,
        4,
        "الخطة دي مش هتشتغل غير لو انت مشغّلها. التزم باختيارات المجموعات واحضر المتابعة الأسبوعية.",
        KAMEL_GUIDELINES,
        ["أكل مقلي", "مشروبات سكرية", "سكر أبيض", "مايونيز"],
        ["فراخ مشوية", "سمك", "سلطات", "خضار"],
      ]
    )
    // supplementDefs
    for (let i = 0; i < SUPPLEMENT_DEFS_SEED.length; i++) {
      const def: any = SUPPLEMENT_DEFS_SEED[i]
      const sid = generateId()
      await tx.query(
        `INSERT INTO "SupplementDef" ("id","templateId","name","nameAr","definition","definitionAr","importance","importanceAr","order") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [sid, templateId, def.name, def.nameAr ?? null, def.definition ?? null, def.definitionAr ?? null, def.importance ?? null, def.importanceAr ?? null, i + 1]
      )
    }
    // substituteGroups
    for (let gi = 0; gi < SUBSTITUTE_GROUPS_SEED.length; gi++) {
      const group: any = SUBSTITUTE_GROUPS_SEED[gi]
      const gid = generateId()
      await tx.query(
        `INSERT INTO "SubstituteGroup" ("id","templateId","category","caloriesLabel","order") VALUES ($1,$2,$3::"SubstituteCategory",$4,$5)`,
        [gid, templateId, group.category, group.caloriesLabel ?? null, gi + 1]
      )
      for (let ii = 0; ii < group.items.length; ii++) {
        const item: any = group.items[ii]
        const iid = generateId()
        await tx.query(
          `INSERT INTO "SubstituteItem" ("id","groupId","name","nameAr","amount","unit","order") VALUES ($1,$2,$3,$4,$5,$6::"QuantityUnit",$7)`,
          [iid, gid, item.name, item.nameAr ?? null, item.amount ?? null, item.unit, ii + 1]
        )
      }
    }
    // meals
    for (let mi = 0; mi < SAMPLE_MEALS_KAMEL.length; mi++) {
      const meal: any = SAMPLE_MEALS_KAMEL[mi]
      const mid = generateId()
      await tx.query(
        `INSERT INTO "Meal" ("id","templateId","kind","order","name","nameAr") VALUES ($1,$2,$3::"MealKind",$4,$5,$6)`,
        [mid, templateId, meal.kind, mi + 1, meal.name, meal.nameAr ?? null]
      )
      for (let ii = 0; ii < meal.items.length; ii++) {
        const item: any = meal.items[ii]
        const iid = generateId()
        await tx.query(
          `INSERT INTO "MealItem" ("id","mealId","groupNumber","foodName","foodNameAr","amount","unit","calories","order") VALUES ($1,$2,$3,$4,$5,$6,$7::"QuantityUnit",$8,$9)`,
          [iid, mid, item.groupNumber, item.foodName, item.foodNameAr ?? null, item.amount ?? null, item.unit, item.calories ?? null, ii + 1]
        )
      }
    }
  })

  kamelTemplateId = templateId
  return { id: templateId }
}

async function copyTemplateContent(templateId: string, planId: string) {
  const templateRes = await pool.query(`SELECT * FROM "NutritionTemplate" WHERE "id" = $1 LIMIT 1`, [templateId])
  if (templateRes.rowCount === 0) return
  const template = templateRes.rows[0]

  const supplementDefsRes = await pool.query(`SELECT * FROM "SupplementDef" WHERE "templateId" = $1 ORDER BY "order"`, [templateId])
  const groupsRes = await pool.query(`SELECT * FROM "SubstituteGroup" WHERE "templateId" = $1 ORDER BY "order"`, [templateId])
  const mealsRes = await pool.query(`SELECT * FROM "Meal" WHERE "templateId" = $1 ORDER BY "order"`, [templateId])

  // Update plan with coachMessage etc.
  await pool.query(
    `UPDATE "ClientNutritionPlan" SET "coachMessage" = $1, "guidelines" = $2::text[], "avoidFoods" = $3::text[], "recommendedFoods" = $4::text[], "updatedAt" = NOW() WHERE "id" = $5`,
    [template.coachMessage, template.guidelines, template.avoidFoods, template.recommendedFoods, planId]
  )

  // Copy supplementDefs to plan
  for (const def of supplementDefsRes.rows) {
    const sid = generateId()
    await pool.query(
      `INSERT INTO "SupplementDef" ("id","planId","name","nameAr","definition","definitionAr","importance","importanceAr","order") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [sid, planId, def.name, def.nameAr, def.definition, def.definitionAr, def.importance, def.importanceAr, def.order]
    )
  }

  // Copy substituteGroups
  for (const group of groupsRes.rows) {
    const gid = generateId()
    await pool.query(
      `INSERT INTO "SubstituteGroup" ("id","planId","category","caloriesLabel","order") VALUES ($1,$2,$3::"SubstituteCategory",$4,$5)`,
      [gid, planId, group.category, group.caloriesLabel, group.order]
    )
    const itemsRes = await pool.query(`SELECT * FROM "SubstituteItem" WHERE "groupId" = $1 ORDER BY "order"`, [group.id])
    for (const item of itemsRes.rows) {
      const iid = generateId()
      await pool.query(
        `INSERT INTO "SubstituteItem" ("id","groupId","name","nameAr","amount","unit","order") VALUES ($1,$2,$3,$4,$5,$6::"QuantityUnit",$7)`,
        [iid, gid, item.name, item.nameAr, item.amount, item.unit, item.order]
      )
    }
  }

  // Copy meals
  for (const meal of mealsRes.rows) {
    const mid = generateId()
    await pool.query(
      `INSERT INTO "Meal" ("id","planId","kind","order","name","nameAr") VALUES ($1,$2,$3::"MealKind",$4,$5,$6)`,
      [mid, planId, meal.kind, meal.order, meal.name, meal.nameAr]
    )
    const itemsRes = await pool.query(`SELECT * FROM "MealItem" WHERE "mealId" = $1 ORDER BY "order"`, [meal.id])
    for (const item of itemsRes.rows) {
      const iid = generateId()
      await pool.query(
        `INSERT INTO "MealItem" ("id","mealId","groupNumber","foodName","foodNameAr","amount","unit","calories","order") VALUES ($1,$2,$3,$4,$5,$6,$7::"QuantityUnit",$8,$9)`,
        [iid, mid, item.groupNumber, item.foodName, item.foodNameAr, item.amount, item.unit, item.calories, item.order]
      )
    }
  }
}

async function createClient(
  trainerProfile: { id: string },
  clientDef: DemoClient,
  index: number
): Promise<{ client: any }> {
  const phone = getPhone(index)
  const birthDate = new Date()
  birthDate.setFullYear(birthDate.getFullYear() - clientDef.age)

  const heightCm = getHeightCm(clientDef.gender, clientDef.age, clientDef.goal, index)
  const weightKg = getWeightKg(clientDef.gender, clientDef.goal, heightCm, index)

  const daysPerWeek = clientDef.hasSplit ? 4 + (index % 2) : 3

  const clientId = generateId()
  const clientRes = await pool.query(
    `INSERT INTO "Client" ("id","trainerId","fullName","birthDate","phone","goal","status","neckPain","shoulderPain","backPain","kneePain","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6::"Goal",$7::"ClientStatus",false,false,$8,$9,NOW(),NOW()) RETURNING *`,
    [clientId, trainerProfile.id, clientDef.fullName, birthDate, phone, clientDef.goal, clientDef.status, clientDef.backPain ?? false, clientDef.kneePain ?? false]
  )
  const client = clientRes.rows[0]

  // Create InBody (BodyComposition) if needed — BodyComposition is source of truth
  if (clientDef.hasAssessment) {
    const indicesWithPdfData = [0, 1, 2, 6]
    if (indicesWithPdfData.includes(index)) {
      const firstDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      const secondDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      await pool.query(
        `INSERT INTO "BodyComposition" ("id","clientId","date","source","weightKg","muscleMassKg","bodyFatKg","bodyWaterPct","fatControlKg","bmrKcal","fitnessScore","waistHipRatio","visceralFatLevel","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"BodyCompositionSource",$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
        [generateId(), client.id, firstDate, BodyCompositionSource.COACH, 86.8, 32.5, 29.3, 42.1, -19.1, 1612, 63, 0.92, 12, "InBody — تحليل تركيب الجسم"]
      )
      await pool.query(
        `INSERT INTO "BodyComposition" ("id","clientId","date","source","weightKg","muscleMassKg","bodyFatKg","bodyWaterPct","fatControlKg","bmrKcal","fitnessScore","waistHipRatio","visceralFatLevel","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"BodyCompositionSource",$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
        [generateId(), client.id, secondDate, BodyCompositionSource.COACH, 84.2, 33.2, 27.1, 43.5, -16.8, 1635, 68, 0.89, 10, "InBody — متابعة"]
      )
    } else {
      const baselineDate = new Date(Date.now() - (90 - index * 8) * 24 * 60 * 60 * 1000)
      const waistCm = getWaistCm(clientDef.goal, weightKg, index)

      const bodyFatKg = +(weightKg * 0.18).toFixed(1)
      const muscleMassKg = +(weightKg * 0.42).toFixed(1)
      const bmrKcal = Math.round(1500 + weightKg * 10)
      const fitnessScore = 70 + (index % 20)
      const waistHipRatio = +(waistCm / (heightCm * 0.38)).toFixed(2)

      await pool.query(
        `INSERT INTO "BodyComposition" ("id","clientId","date","source","weightKg","muscleMassKg","bodyFatKg","bodyWaterPct","bmrKcal","fitnessScore","waistHipRatio","visceralFatLevel","fatControlKg","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"BodyCompositionSource",$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())`,
        [generateId(), client.id, baselineDate, BodyCompositionSource.COACH, weightKg, muscleMassKg, bodyFatKg, 55 + (index % 5), bmrKcal, fitnessScore, waistHipRatio, 5 + (index % 5), +(bodyFatKg * 0.2).toFixed(1), "Demo InBody entry"]
      )
    }

    // Create user for this client
    const password = bcrypt.hashSync("Demo@123", 10)
    const existingUser = await pool.query(`SELECT "id" FROM "User" WHERE "phone" = $1 LIMIT 1`, [phone])
    if (existingUser.rowCount === 0) {
      const uid = generateId()
      await pool.query(
        `INSERT INTO "User" ("id","username","phone","email","passwordHash","role","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6::"Role",NOW(),NOW())`,
        [uid, `client${String(index + 1).padStart(2, "0")}`, phone, `client${String(index + 1).padStart(2, "0")}@example.com`, password, Role.CLIENT]
      )
    } else {
      await pool.query(`UPDATE "User" SET "passwordHash" = $1, "role" = $2::"Role", "updatedAt" = NOW() WHERE "phone" = $3`, [password, Role.CLIENT, phone])
    }
  }

  // Create nutrition plan if needed
  if (clientDef.hasNutritionPlan && clientDef.hasAssessment) {
    let calories, proteinGrams, carbsGrams, fatsGrams

    switch (clientDef.goal) {
      case Goal.WEIGHT_LOSS:
        calories = 2000 + index * 50
        proteinGrams = 150 + index * 5
        carbsGrams = 180 + index * 10
        fatsGrams = 65
        break
      case Goal.MUSCLE_BUILDING:
        calories = 2800 + index * 100
        proteinGrams = 180 + index * 5
        carbsGrams = 280 + index * 10
        fatsGrams = 75
        break
      case Goal.WEIGHT_GAIN:
        calories = 3100 + index * 80
        proteinGrams = 190 + index * 5
        carbsGrams = 350 + index * 10
        fatsGrams = 85
        break
      case Goal.STRENGTH:
        calories = 2500 + index * 70
        proteinGrams = 170 + index * 5
        carbsGrams = 250 + index * 10
        fatsGrams = 70
        break
      default:
        calories = 2200 + index * 50
        proteinGrams = 150 + index * 5
        carbsGrams = 220 + index * 10
        fatsGrams = 70
    }

    await pool.query(`UPDATE "ClientNutritionPlan" SET "status" = $1::"PlanStatus", "endDate" = NOW(), "updatedAt" = NOW() WHERE "clientId" = $2 AND "status" = $3::"PlanStatus"`, [PlanStatus.COMPLETED, client.id, PlanStatus.ACTIVE])

    const kamelTemplate = await ensureKamelTemplate(trainerProfile.id)

    const planId = generateId()
    await pool.query(
      `INSERT INTO "ClientNutritionPlan" ("id","clientId","templateId","calories","proteinGrams","carbsGrams","fatsGrams","waterLiters","coachMessage","status","startDate","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::"PlanStatus",$11,NOW(),NOW())`,
      [
        planId,
        client.id,
        kamelTemplate.id,
        calories,
        proteinGrams,
        carbsGrams,
        fatsGrams,
        3 + index * 0.1,
        index === 0 ? "التزم بالخطة والنتائج هتلتزم بك. أشوفك في المتابعة الأسبوعية!" : null,
        PlanStatus.ACTIVE,
        new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      ]
    )

    await copyTemplateContent(kamelTemplate.id, planId)
  }

  // Create training split if needed
  let splitExercises: { name: string; isBodyweight: boolean; muscleGroup: string }[] = []

  if (clientDef.hasSplit && clientDef.hasAssessment) {
    const splitTypes: Record<Goal, SplitType> = {
      [Goal.WEIGHT_LOSS]: SplitType.PUSH_PULL_LEGS,
      [Goal.MUSCLE_BUILDING]: SplitType.PUSH_PULL_LEGS,
      [Goal.STRENGTH]: SplitType.UPPER_LOWER,
      [Goal.WEIGHT_GAIN]: SplitType.FULL_BODY,
      [Goal.GENERAL_FITNESS]: SplitType.PUSH_PULL_LEGS,
      [Goal.REHAB]: SplitType.CUSTOM,
    }

    const splitId = generateId()
    await pool.query(
      `INSERT INTO "TrainingSplit" ("id","clientId","splitType","daysPerWeek","status","createdAt","updatedAt") VALUES ($1,$2,$3::"SplitType",$4,$5::"PlanStatus",NOW(),NOW())`,
      [splitId, client.id, splitTypes[clientDef.goal] || SplitType.PUSH_PULL_LEGS, daysPerWeek, PlanStatus.ACTIVE]
    )

    const focuses: TrainingDayFocus[] = [
      TrainingDayFocus.PUSH, TrainingDayFocus.PULL, TrainingDayFocus.LEGS,
      TrainingDayFocus.UPPER, TrainingDayFocus.LOWER, TrainingDayFocus.MOBILITY,
    ]

    // Fetch exercise library once
    const exerciseLibraryRes = await pool.query(`SELECT "id","name","nameAr","muscleGroup","equipment","defaultSets","defaultReps","defaultRestSeconds","tags" FROM "Exercise"`)
    const exerciseLibrary = exerciseLibraryRes.rows as any[]

    const exerciseByMuscleGroup = new Map<string, typeof exerciseLibrary>()
    for (const ex of exerciseLibrary) {
      const mg = ex.muscleGroup
      if (!exerciseByMuscleGroup.has(mg)) exerciseByMuscleGroup.set(mg, [])
      exerciseByMuscleGroup.get(mg)!.push(ex)
    }

    const focusToMuscleGroups: Record<TrainingDayFocus, string[]> = {
      [TrainingDayFocus.PUSH]: ["chest", "shoulders", "triceps"],
      [TrainingDayFocus.PULL]: ["back", "biceps", "rear_delts"],
      [TrainingDayFocus.LEGS]: ["legs", "glutes"],
      [TrainingDayFocus.UPPER]: ["chest", "back", "shoulders", "arms"],
      [TrainingDayFocus.LOWER]: ["legs", "glutes"],
      [TrainingDayFocus.FULL_BODY]: ["chest", "back", "legs", "shoulders"],
      [TrainingDayFocus.MOBILITY]: [],
      [TrainingDayFocus.CARDIO]: ["cardio"],
      [TrainingDayFocus.CUSTOM]: [],
      [TrainingDayFocus.REST]: [],
      [TrainingDayFocus.SHOULDERS_ARMS]: ["shoulders", "arms"],
    }

    for (let dayNum = 1; dayNum <= daysPerWeek; dayNum++) {
      const focus = focuses[(dayNum - 1) % focuses.length]

      const splitDayId = generateId()
      await pool.query(
        `INSERT INTO "TrainingSplitDay" ("id","splitId","dayNumber","focus","customFocus","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"TrainingDayFocus",$5,$6,NOW(),NOW())`,
        [splitDayId, splitId, dayNum, focus, focus === TrainingDayFocus.CUSTOM ? "يوم تأهيل" : null, `يوم تدريب ${dayNum} - تركيز ${focus.toLowerCase()}`]
      )

      const dayMuscleGroups = (focusToMuscleGroups as any)[focus] || ["chest", "back", "legs"]
      let availableExercises: typeof exerciseLibrary = []
      for (const mg of dayMuscleGroups) {
        availableExercises.push(...(exerciseByMuscleGroup.get(mg) || []))
      }

      // Filter to beginner-friendly for demo clients
      availableExercises = availableExercises.filter((e: any) => e.tags?.includes("beginner_friendly"))

      // Pick exercises for this day
      const exercisesForDay = availableExercises
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 + (index % 3))

      for (let exIndex = 0; exIndex < exercisesForDay.length; exIndex++) {
        const ex = exercisesForDay[exIndex]
        const baseWeight = ex.muscleGroup === "legs" || ex.muscleGroup === "glutes" ? 40 : 20
        const variation = (index + exIndex) % 5

        const sdeId = generateId()
        await pool.query(
          `INSERT INTO "SplitDayExercise" ("id","splitDayId","order","exerciseId","exerciseName","targetSets","targetReps","targetWeightKg","restSeconds","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
          [sdeId, splitDayId, exIndex + 1, ex.id, ex.name, ex.defaultSets ?? 3, ex.defaultReps ?? 10, ex.equipment === "bodyweight" ? null : baseWeight + variation * 5, ex.defaultRestSeconds ?? 90, ex.equipment === "bodyweight" ? "وزن الجسم - ركز على الأداء الصحيح" : "حركة أساسية"]
        )

        splitExercises.push({ name: ex.name, isBodyweight: ex.equipment === "bodyweight", muscleGroup: ex.muscleGroup })
      }
    }
  }

  // Create subscription if needed
  if (clientDef.subscription) {
    await pool.query(
      `INSERT INTO "Subscription" ("id","clientId","planName","status","startDate","endDate","sessionsCount","remainingSessions","paymentStatus","autoRenew","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"SubscriptionStatus",$5,$6,$7,$8,$9::"PaymentStatus",$10,NOW(),NOW())`,
      [
        generateId(),
        client.id,
        clientDef.subscription.planName,
        clientDef.subscription.status,
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        clientDef.subscription.sessionsCount,
        clientDef.subscription.remainingSessions,
        clientDef.subscription.paymentStatus,
        clientDef.subscription.autoRenew,
      ]
    )
  }

  // Create progress reviews if needed
  if (clientDef.hasProgressReview && clientDef.hasAssessment) {
    const numReviews = 1 + (index % 3)
    const baseNotes = [
      "تقدم جيد في البداية مع الالتزام المستمر",
      "تحسن ملحوظ في الأداء والقوة",
      "التزام ثابت، قريب من الوصول للوزن المستهدف",
    ]

    for (let i = 0; i < numReviews; i++) {
      const reviewOffset = (8 - i) * 7 * 24 * 60 * 60 * 1000

      await pool.query(
        `INSERT INTO "ProgressReview" ("id","clientId","reviewDate","trainerNotes","adherencePct","energyLevel","nextAssessmentDate","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
        [
          generateId(),
          client.id,
          new Date(Date.now() - reviewOffset),
          baseNotes[i % baseNotes.length],
          70 + i * 5 + (index % 10),
          6 + (index % 3) + (i % 2),
          new Date(Date.now() + (14 - i * 2) * 24 * 60 * 60 * 1000),
        ]
      )
    }
  }

  // Create workout logs if needed
  if (clientDef.hasWorkoutLogs && clientDef.hasAssessment && splitExercises.length > 0) {
    const numSessions = 4 + (index % 4)

    for (let session = 0; session < numSessions; session++) {
      const sessionOffset = (session + 1) * 3 * 24 * 60 * 60 * 1000

      for (const splitEx of splitExercises) {
        let weight: number | null = null
        let reps: number
        let rpe: number
        let notes: string

        if (splitEx.isBodyweight) {
          reps = 10 + session * 2 + (index % 5)
          rpe = 6 + (session % 3) + (index % 2)
          notes = session % 3 === 0 ? "إحساس قوي" : session % 3 === 1 ? "أداء صحيح" : "بدأت أتعب في الآخر"
        } else if (splitEx.muscleGroup === "legs" || splitEx.muscleGroup === "glutes") {
          weight = 20 + session * 2.5 + (index % 3) * 1.5
          reps = 8 + session
          rpe = 7 + (session % 2)
          notes = session % 3 === 0 ? "المدى ممتاز" : "الأداء اضرب في آخر مجموعة"
        } else if (splitEx.muscleGroup === "back") {
          weight = 30 + session * 2 + (index % 4)
          reps = 10 + session
          rpe = 6 + (session % 2)
          notes = session % 3 === 0 ? "تحكم كامل في النزول" : "ضخامة حلوة"
        } else {
          weight = 12 + session + (index % 3)
          reps = 12 + session
          rpe = 7 + (session % 2)
          notes = session % 3 === 0 ? "سلس" : "آخر مجموعة كانت صعبة"
        }

        await pool.query(
          `INSERT INTO "WorkoutLog" ("id","clientId","date","exerciseName","sets","reps","weightKg","rpe","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
          [generateId(), client.id, new Date(Date.now() - sessionOffset), splitEx.name, 3, reps, weight, rpe, notes]
        )
      }
    }
  }

  // Handle invited client (client 10)
  if (clientDef.status === ClientStatus.INVITED) {
    await pool.query(`UPDATE "Client" SET "inviteToken" = $1, "inviteExpiresAt" = $2, "updatedAt" = NOW() WHERE "id" = $3`, [`INV-${index}`, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), client.id])
  }

  return { client }
}

async function seedDemoData() {
  console.log("Seeding demo data...\n")

  // Clear any existing demo data
  await clearDemoData("demo-check")

  // Create or update trainer
  const { user: trainerUser, profile } = await createDemoTrainer()
  console.log("Created/updated demo trainer: Coach Karim Adel (01000000000)")

  // Check if we need to clear (trainer already had clients)
  await clearDemoData(trainerUser.id)

  const clientCounts: Record<string, number> = {}

  // Create clients
  for (let i = 0; i < demoClients.length; i++) {
    const clientDef = demoClients[i]
    await createClient(profile, clientDef, i)
    clientCounts[clientDef.goal] = (clientCounts[clientDef.goal] || 0) + 1
  }

  console.log("\n=== Demo Data Summary ===")
  console.log(`Clients created: ${demoClients.length}`)
  console.log("Clients by goal:", Object.entries(clientCounts).map(([k, v]) => `${v} ${k}`).join(", "))

  // Count specific entities
  const assessmentCountRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM "BodyComposition" WHERE "clientId" IN (SELECT "id" FROM "Client" WHERE "trainerId" = $1)`, [profile.id])
  const nutritionPlanCountRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM "ClientNutritionPlan" WHERE "clientId" IN (SELECT "id" FROM "Client" WHERE "trainerId" = $1)`, [profile.id])
  const splitCountRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM "TrainingSplit" WHERE "clientId" IN (SELECT "id" FROM "Client" WHERE "trainerId" = $1)`, [profile.id])
  const logCountRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM "WorkoutLog" WHERE "clientId" IN (SELECT "id" FROM "Client" WHERE "trainerId" = $1)`, [profile.id])
  const reviewCountRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM "ProgressReview" WHERE "clientId" IN (SELECT "id" FROM "Client" WHERE "trainerId" = $1)`, [profile.id])
  const subscriptionCountRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM "Subscription" WHERE "clientId" IN (SELECT "id" FROM "Client" WHERE "trainerId" = $1)`, [profile.id])

  console.log(`InBody (BodyComposition): ${assessmentCountRes.rows[0].cnt}`)
  console.log(`Nutrition Plans: ${nutritionPlanCountRes.rows[0].cnt}`)
  console.log(`Training Splits: ${splitCountRes.rows[0].cnt}`)
  console.log(`Workout Logs: ${logCountRes.rows[0].cnt}`)
  console.log(`Progress Reviews: ${reviewCountRes.rows[0].cnt}`)
  console.log(`Subscriptions: ${subscriptionCountRes.rows[0].cnt}`)

  console.log("\n=== Demo Credentials ===")
  console.log("Login: 01000000000")
  console.log("Password: Demo@123")
  console.log("\n✓ Demo data seeding complete!")
}

seedDemoData()
  .catch((e) => {
    console.error("Error seeding demo data:", e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
