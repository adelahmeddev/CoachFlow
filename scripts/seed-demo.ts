import "dotenv/config"
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
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
} from '../src/generated/prisma/enums';
import {
  SUPPLEMENT_DEFS_SEED,
  SUBSTITUTE_GROUPS_SEED,
  SAMPLE_MEALS_KAMEL,
} from '../src/lib/nutrition-fixed';

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
  const clients = await prisma.client.findMany({
    where: { trainerId },
    select: { id: true },
  });
  return clients.map(c => c.id);
}

async function clearDemoData(userId: string) {
  console.log('Checking for existing demo data...');

  // Find the trainer profile to get the trainer ID
  let trainerProfile;
  try {
    trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  } catch (e) {
    console.log('Database not ready or no existing trainer profile, skipping cleanup');
    return;
  }

  if (!trainerProfile) {
    console.log('No existing trainer profile found, skipping cleanup');
    return;
  }

  const clientIds = await getClientIdList(trainerProfile.id);
  if (clientIds.length === 0) {
    console.log('No existing demo clients to clean');
    return;
  }

  console.log(`Clearing ${clientIds.length} existing demo clients...`);

  // Delete in correct order due to foreign key constraints
  await prisma.exerciseLog.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.workoutLog.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.progressReview.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.subscription.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.trainingSplit.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.clientNutritionPlan.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.bodyComposition.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.client.deleteMany({ where: { trainerId: trainerProfile.id } });
}

async function createDemoTrainer() {
  const hashed = bcrypt.hashSync(DEMO_TRAINER_PASSWORD, 10);

  // First create/update the user
  const trainerUser = await prisma.user.upsert({
    where: { phone: DEMO_TRAINER_PHONE },
    update: { passwordHash: hashed },
    create: {
      username: 'coach.karim',
      phone: DEMO_TRAINER_PHONE,
      email: 'coach.karim@example.com',
      passwordHash: hashed,
      role: Role.TRAINER,
    },
  });

  const trainerProfile = await prisma.trainerProfile.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      fullName: 'Coach Karim Adel',
      phone: DEMO_TRAINER_PHONE,
      email: 'coach.karim@example.com',
      units: Units.METRIC,
      weekStartDay: WeekStartDay.SAT,
      timezone: 'Asia/Cairo',
    },
  });

  return { user: trainerUser, profile: trainerProfile };
}

let kamelTemplateId: string | null = null;

const KAMEL_GUIDELINES = [
  'ÙˆØ²Ø¹ ÙˆØ¬Ø¨Ø§ØªÙƒ ÙƒÙ„ Ù¢-Ù£ Ø³Ø§Ø¹Ø§Øª | Divide your meals every 2-3 hours',
  'Ù…ÙŠØ²Ø§Ù† Ø·Ø¹Ø§Ù… Ø®Ø§ØµØŒ Ø§ÙˆØ²Ù† Ø¨Ø¹Ø¯ Ø§Ù„Ø·Ø¨Ø® | Own food scale â€” weigh after cooking',
  'Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ ÙŠÙˆÙ… Ø§Ù„Ø¬Ù…Ø¹Ø©ØŒ ØµØ¨Ø§Ø­Ù‹Ø§ Ø¹Ù„Ù‰ Ù…Ø¹Ø¯Ø© ÙØ§Ø±ØºØ© ÙˆØ¨Ù†ÙØ³ Ø§Ù„Ù…ÙŠØ²Ø§Ù† | Weekly report Friday, empty stomach, same scale',
  'ØµÙˆØ± ÙˆÙ‚ÙŠØ§Ø³Ø§Øª ÙƒÙ„ Ù¡Ù¥ ÙŠÙˆÙ… | Photos + measurements every 15 days',
  'Ù£-Ù¤ Ù„ØªØ± Ù…ÙŠØ§Ù‡ Ù…ÙˆØ²Ø¹Ø© + Ù†ØµÙ Ù„ØªØ± Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªÙ…Ø±ÙŠÙ† | 3-4L water distributed + 0.5L during training',
  'Ù†Ø§Ù… Ù§ Ø³Ø§Ø¹Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ Ùˆ Ù„ÙŠØ³ Ø¨Ø¹Ø¯ Ø§Ù„Ø­Ø§Ø¯ÙŠØ© Ø¹Ø´Ø± Ù…Ø³Ø§Ø¡Ù‹ | Sleep at least 7 hours, not after 11pm',
  'Ù„Ø§ ÙƒØ§ÙÙŠÙŠÙ† Ø¹Ù„Ù‰ Ù…Ø¹Ø¯Ø© ÙØ§Ø±ØºØ© Ø£Ùˆ Ù‚Ø±Ø¨ Ø§Ù„Ù†ÙˆÙ… | No caffeine on an empty stomach or near bedtime',
];

async function ensureKamelTemplate(trainerProfileId: string) {
  if (kamelTemplateId) {
    const existing = await prisma.nutritionTemplate.findUnique({
      where: { id: kamelTemplateId },
      select: { id: true },
    });
    if (existing) return existing;
  }

  const byName = await prisma.nutritionTemplate.findFirst({
    where: { name: 'ØªÙ†Ø´ÙŠÙ 1900 - Ø³ØªØ§ÙŠÙ„ ÙƒØ§Ù…Ù„', trainerId: trainerProfileId },
    select: { id: true },
  });
  if (byName) {
    kamelTemplateId = byName.id;
    return byName;
  }

  const created = await prisma.nutritionTemplate.create({
    data: {
      trainerId: trainerProfileId,
      name: 'ØªÙ†Ø´ÙŠÙ 1900 - Ø³ØªØ§ÙŠÙ„ ÙƒØ§Ù…Ù„',
      isGlobal: false,
      calories: 1900,
      proteinGrams: 160,
      carbsGrams: 170,
      fatsGrams: 60,
      waterLiters: 4,
      coachMessage:
        'Ø§Ù„Ø®Ø·Ø© Ø¯ÙŠ Ù…Ø´ Ù‡ØªØ´ØªØºÙ„ ØºÙŠØ± Ù„Ùˆ Ø§Ù†Øª Ù…Ø´ØºÙ‘Ù„Ù‡Ø§. Ø§Ù„ØªØ²Ù… Ø¨Ø§Ø®ØªÙŠØ§Ø±Ø§Øª Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§Øª ÙˆØ§Ø­Ø¶Ø± Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ©.',
      guidelines: KAMEL_GUIDELINES,
      avoidFoods: ['Ø£ÙƒÙ„ Ù…Ù‚Ù„ÙŠ', 'Ù…Ø´Ø±ÙˆØ¨Ø§Øª Ø³ÙƒØ±ÙŠØ©', 'Ø³ÙƒØ± Ø£Ø¨ÙŠØ¶', 'Ù…Ø§ÙŠÙˆÙ†ÙŠØ²'],
      recommendedFoods: ['ÙØ±Ø§Ø® Ù…Ø´ÙˆÙŠØ©', 'Ø³Ù…Ùƒ', 'Ø³Ù„Ø·Ø§Øª', 'Ø®Ø¶Ø§Ø±'],
      supplementDefs: {
        create: SUPPLEMENT_DEFS_SEED.map((def, index) => ({
          order: index + 1,
          ...def,
        })),
      },
      substituteGroups: {
        create: SUBSTITUTE_GROUPS_SEED.map((group, groupIndex) => ({
          order: groupIndex + 1,
          category: group.category,
          caloriesLabel: group.caloriesLabel ?? null,
          items: {
            create: group.items.map((item, itemIndex) => ({
              order: itemIndex + 1,
              name: item.name,
              nameAr: item.nameAr ?? null,
              amount: item.amount ?? null,
              unit: item.unit,
            })),
          },
        })),
      },
      meals: {
        create: SAMPLE_MEALS_KAMEL.map((meal, mealIndex) => ({
          order: mealIndex + 1,
          kind: meal.kind,
          name: meal.name,
          nameAr: meal.nameAr ?? null,
          items: {
            create: meal.items.map((item, itemIndex) => ({
              order: itemIndex + 1,
              groupNumber: item.groupNumber,
              foodName: item.foodName,
              foodNameAr: item.foodNameAr ?? null,
              amount: item.amount ?? null,
              unit: item.unit,
              calories: item.calories ?? null,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  kamelTemplateId = created.id;
  return created;
}

async function copyTemplateContent(templateId: string, planId: string) {
  const template = await prisma.nutritionTemplate.findUnique({
    where: { id: templateId },
    include: {
      supplementDefs: true,
      substituteGroups: { include: { items: true } },
      meals: { include: { items: true } },
    },
  });
  if (!template) return;

  await prisma.clientNutritionPlan.update({
    where: { id: planId },
    data: {
      coachMessage: template.coachMessage,
      guidelines: [...template.guidelines],
      avoidFoods: [...template.avoidFoods],
      recommendedFoods: [...template.recommendedFoods],
      supplementDefs: {
        create: template.supplementDefs.map((def) => ({
          order: def.order,
          name: def.name,
          nameAr: def.nameAr,
          definition: def.definition,
          definitionAr: def.definitionAr,
          importance: def.importance,
          importanceAr: def.importanceAr,
        })),
      },
      substituteGroups: {
        create: template.substituteGroups.map((group) => ({
          order: group.order,
          category: group.category,
          caloriesLabel: group.caloriesLabel,
          items: {
            create: group.items.map((item) => ({
              order: item.order,
              name: item.name,
              nameAr: item.nameAr,
              amount: item.amount,
              unit: item.unit,
            })),
          },
        })),
      },
      meals: {
        create: template.meals.map((meal) => ({
          order: meal.order,
          kind: meal.kind,
          name: meal.name,
          nameAr: meal.nameAr,
          items: {
            create: meal.items.map((item) => ({
              order: item.order,
              groupNumber: item.groupNumber,
              foodName: item.foodName,
              foodNameAr: item.foodNameAr,
              amount: item.amount,
              unit: item.unit,
              calories: item.calories,
            })),
          },
        })),
      },
    },
  });
}

async function createClient(
  trainerProfile: { id: string },
  clientDef: DemoClient,
  index: number
): Promise<{ client: any }> {
  const phone = getPhone(index);
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - clientDef.age);

  const heightCm = getHeightCm(clientDef.gender, clientDef.age, clientDef.goal, index);
  const weightKg = getWeightKg(clientDef.gender, clientDef.goal, heightCm, index);
  const age = clientDef.age;

  const daysPerWeek = clientDef.hasSplit ? 4 + (index % 2) : 3;

  const clientData: any = {
    trainerId: trainerProfile.id,
    fullName: clientDef.fullName,
    birthDate,
    phone,
    goal: clientDef.goal,
    status: clientDef.status,
    neckPain: false,
    shoulderPain: false,
    backPain: clientDef.backPain ?? false,
    kneePain: clientDef.kneePain ?? false,
  };

  const client = await prisma.client.create({ data: clientData });

  // Create InBody (BodyComposition) if needed â€” BodyComposition is source of truth
  if (clientDef.hasAssessment) {
    const indicesWithPdfData = [0, 1, 2, 6]
    if (indicesWithPdfData.includes(index)) {
      const firstDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      const secondDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      await prisma.bodyComposition.create({
        data: {
          clientId: client.id,
          date: firstDate,
          source: BodyCompositionSource.COACH,
          weightKg: 86.8,
          muscleMassKg: 32.5,
          bodyFatKg: 29.3,
          bodyWaterPct: 42.1,
          fatControlKg: -19.1,
          bmrKcal: 1612,
          fitnessScore: 63,
          waistHipRatio: 0.92,
          visceralFatLevel: 12,
          notes: "InBody â€” ØªØ­Ù„ÙŠÙ„ ØªØ±ÙƒÙŠØ¨ Ø§Ù„Ø¬Ø³Ù…",
        },
      })
      await prisma.bodyComposition.create({
        data: {
          clientId: client.id,
          date: secondDate,
          source: BodyCompositionSource.COACH,
          weightKg: 84.2,
          muscleMassKg: 33.2,
          bodyFatKg: 27.1,
          bodyWaterPct: 43.5,
          fatControlKg: -16.8,
          bmrKcal: 1635,
          fitnessScore: 68,
          waistHipRatio: 0.89,
          visceralFatLevel: 10,
          notes: "InBody â€” Ù…ØªØ§Ø¨Ø¹Ø©",
        },
      })
    } else {
      const baselineDate = new Date(Date.now() - (90 - index * 8) * 24 * 60 * 60 * 1000);
      const waistCm = getWaistCm(clientDef.goal, weightKg, index);

      const bodyFatKg = +(weightKg * 0.18).toFixed(1)
      const muscleMassKg = +(weightKg * 0.42).toFixed(1)
      const bmrKcal = Math.round(1500 + weightKg * 10)
      const fitnessScore = 70 + (index % 20)
      const waistHipRatio = +(waistCm / (heightCm * 0.38)).toFixed(2)

      await prisma.bodyComposition.create({
        data: {
          clientId: client.id,
          date: baselineDate,
          source: BodyCompositionSource.COACH,
          weightKg,
          muscleMassKg,
          bodyFatKg,
          bodyWaterPct: 55 + (index % 5),
          bmrKcal,
          fitnessScore,
          waistHipRatio,
          visceralFatLevel: 5 + (index % 5),
          fatControlKg: +(bodyFatKg * 0.2).toFixed(1),
          notes: "Demo InBody entry",
        },
      });
    }

    // Create user for this client
    const password = bcrypt.hashSync('Demo@123', 10);
    await prisma.user.upsert({
      where: { phone },
      update: { passwordHash: password, role: Role.CLIENT },
      create: {
        username: `client${String(index + 1).padStart(2, '0')}`,
        phone,
        email: `client${String(index + 1).padStart(2, '0')}@example.com`,
        passwordHash: password,
        role: Role.CLIENT,
      },
    });
  }

  // Create nutrition plan if needed
  if (clientDef.hasNutritionPlan && clientDef.hasAssessment) {
    let calories, proteinGrams, carbsGrams, fatsGrams;

    switch (clientDef.goal) {
      case Goal.WEIGHT_LOSS:
        calories = 2000 + index * 50;
        proteinGrams = 150 + index * 5;
        carbsGrams = 180 + index * 10;
        fatsGrams = 65;
        break;
      case Goal.MUSCLE_BUILDING:
        calories = 2800 + index * 100;
        proteinGrams = 180 + index * 5;
        carbsGrams = 280 + index * 10;
        fatsGrams = 75;
        break;
      case Goal.WEIGHT_GAIN:
        calories = 3100 + index * 80;
        proteinGrams = 190 + index * 5;
        carbsGrams = 350 + index * 10;
        fatsGrams = 85;
        break;
      case Goal.STRENGTH:
        calories = 2500 + index * 70;
        proteinGrams = 170 + index * 5;
        carbsGrams = 250 + index * 10;
        fatsGrams = 70;
        break;
      default:
        calories = 2200 + index * 50;
        proteinGrams = 150 + index * 5;
        carbsGrams = 220 + index * 10;
        fatsGrams = 70;
    }

    await prisma.clientNutritionPlan.updateMany({
      where: { clientId: client.id, status: PlanStatus.ACTIVE },
      data: { status: PlanStatus.COMPLETED, endDate: new Date() },
    });

    const kamelTemplate = await ensureKamelTemplate(trainerProfile.id);

    const plan = await prisma.clientNutritionPlan.create({
      data: {
        clientId: client.id,
        templateId: kamelTemplate.id,
        calories,
        proteinGrams,
        carbsGrams,
        fatsGrams,
        waterLiters: 3 + index * 0.1,
        coachMessage:
          index === 0
            ? 'Ø§Ù„ØªØ²Ù… Ø¨Ø§Ù„Ø®Ø·Ø© ÙˆØ§Ù„Ù†ØªØ§Ø¦Ø¬ Ù‡ØªÙ„ØªØ²Ù… Ø¨Ùƒ. Ø£Ø´ÙˆÙÙƒ ÙÙŠ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ©!'
            : null,
        status: PlanStatus.ACTIVE,
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    });

    await copyTemplateContent(kamelTemplate.id, plan.id);
  }

  // Create training split if needed
  let splitExercises: { name: string; isBodyweight: boolean; muscleGroup: string }[] = [];

  if (clientDef.hasSplit && clientDef.hasAssessment) {
    const splitTypes: Record<Goal, SplitType> = {
      [Goal.WEIGHT_LOSS]: SplitType.PUSH_PULL_LEGS,
      [Goal.MUSCLE_BUILDING]: SplitType.PUSH_PULL_LEGS,
      [Goal.STRENGTH]: SplitType.UPPER_LOWER,
      [Goal.WEIGHT_GAIN]: SplitType.FULL_BODY,
      [Goal.GENERAL_FITNESS]: SplitType.PUSH_PULL_LEGS,
      [Goal.REHAB]: SplitType.CUSTOM,
    };

    const split = await prisma.trainingSplit.create({
      data: {
        clientId: client.id,
        splitType: splitTypes[clientDef.goal] || SplitType.PUSH_PULL_LEGS,
        daysPerWeek: daysPerWeek,
        status: PlanStatus.ACTIVE,
      },
    });

    const focuses: TrainingDayFocus[] = [
      TrainingDayFocus.PUSH, TrainingDayFocus.PULL, TrainingDayFocus.LEGS,
      TrainingDayFocus.UPPER, TrainingDayFocus.LOWER, TrainingDayFocus.MOBILITY,
    ];

    // Fetch exercise library once
    const exerciseLibrary = await prisma.exercise.findMany({
      select: { id: true, name: true, nameAr: true, muscleGroup: true, equipment: true, defaultSets: true, defaultReps: true, defaultRestSeconds: true, tags: true },
    });

    const exerciseByMuscleGroup = new Map<string, typeof exerciseLibrary>();
    for (const ex of exerciseLibrary) {
      const mg = ex.muscleGroup;
      if (!exerciseByMuscleGroup.has(mg)) exerciseByMuscleGroup.set(mg, []);
      exerciseByMuscleGroup.get(mg)!.push(ex);
    }

    const focusToMuscleGroups: Record<TrainingDayFocus, string[]> = {
      [TrainingDayFocus.PUSH]: ['chest', 'shoulders', 'triceps'],
      [TrainingDayFocus.PULL]: ['back', 'biceps', 'rear_delts'],
      [TrainingDayFocus.LEGS]: ['legs', 'glutes'],
      [TrainingDayFocus.UPPER]: ['chest', 'back', 'shoulders', 'arms'],
      [TrainingDayFocus.LOWER]: ['legs', 'glutes'],
      [TrainingDayFocus.FULL_BODY]: ['chest', 'back', 'legs', 'shoulders'],
      [TrainingDayFocus.MOBILITY]: [],
      [TrainingDayFocus.CARDIO]: ['cardio'],
      [TrainingDayFocus.CUSTOM]: [],
      [TrainingDayFocus.REST]: [],
      [TrainingDayFocus.SHOULDERS_ARMS]: ['shoulders', 'arms'],
    };

    // Track all exercises created for this split (for workout logs)

    for (let dayNum = 1; dayNum <= daysPerWeek; dayNum++) {
      const focus = focuses[(dayNum - 1) % focuses.length];

      const splitDay = await prisma.trainingSplitDay.create({
        data: {
          splitId: split.id,
          dayNumber: dayNum,
          focus,
          customFocus: focus === TrainingDayFocus.CUSTOM ? 'ÙŠÙˆÙ… ØªØ£Ù‡ÙŠÙ„' : undefined,
          notes: `ÙŠÙˆÙ… ØªØ¯Ø±ÙŠØ¨ ${dayNum} - ØªØ±ÙƒÙŠØ² ${focus.toLowerCase()}`,
        },
      });

      const dayMuscleGroups = focusToMuscleGroups[focus] || ['chest', 'back', 'legs'];
      let availableExercises: typeof exerciseLibrary = [];
      for (const mg of dayMuscleGroups) {
        availableExercises.push(...(exerciseByMuscleGroup.get(mg) || []));
      }

      // Filter to beginner-friendly for demo clients
      availableExercises = availableExercises.filter(e => e.tags?.includes('beginner_friendly'));

      // Pick exercises for this day
      const exercisesForDay = availableExercises
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 + (index % 3));

      for (let exIndex = 0; exIndex < exercisesForDay.length; exIndex++) {
        const ex = exercisesForDay[exIndex];
        const baseWeight = ex.muscleGroup === 'legs' || ex.muscleGroup === 'glutes' ? 40 : 20;
        const variation = (index + exIndex) % 5;

        await prisma.splitDayExercise.create({
          data: {
            splitDayId: splitDay.id,
            order: exIndex + 1,
            exerciseId: ex.id,
            exerciseName: ex.name,
            targetSets: ex.defaultSets ?? 3,
            targetReps: ex.defaultReps ?? 10,
            targetWeightKg: ex.equipment === 'bodyweight' ? null : baseWeight + variation * 5,
            restSeconds: ex.defaultRestSeconds ?? 90,
            notes: ex.equipment === 'bodyweight' ? 'ÙˆØ²Ù† Ø§Ù„Ø¬Ø³Ù… - Ø±ÙƒØ² Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„ØµØ­ÙŠØ­' : 'Ø­Ø±ÙƒØ© Ø£Ø³Ø§Ø³ÙŠØ©',
          },
        });

        splitExercises.push({ name: ex.name, isBodyweight: ex.equipment === 'bodyweight', muscleGroup: ex.muscleGroup });
      }
    }
  }

  // Create subscription if needed
  if (clientDef.subscription) {
    await prisma.subscription.create({
      data: {
        clientId: client.id,
        planName: clientDef.subscription.planName,
        status: clientDef.subscription.status,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sessionsCount: clientDef.subscription.sessionsCount,
        remainingSessions: clientDef.subscription.remainingSessions,
        paymentStatus: clientDef.subscription.paymentStatus,
        autoRenew: clientDef.subscription.autoRenew,
      },
    });
  }

  // Create progress reviews if needed
  if (clientDef.hasProgressReview && clientDef.hasAssessment) {
    const numReviews = 1 + (index % 3);
    const baseNotes = [
      'ØªÙ‚Ø¯Ù… Ø¬ÙŠØ¯ ÙÙŠ Ø§Ù„Ø¨Ø¯Ø§ÙŠØ© Ù…Ø¹ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ù…Ø³ØªÙ…Ø±',
      'ØªØ­Ø³Ù† Ù…Ù„Ø­ÙˆØ¸ ÙÙŠ Ø§Ù„Ø£Ø¯Ø§Ø¡ ÙˆØ§Ù„Ù‚ÙˆØ©',
      'Ø§Ù„ØªØ²Ø§Ù… Ø«Ø§Ø¨ØªØŒ Ù‚Ø±ÙŠØ¨ Ù…Ù† Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„ÙˆØ²Ù† Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù',
    ];

    for (let i = 0; i < numReviews; i++) {
      const reviewOffset = (8 - i) * 7 * 24 * 60 * 60 * 1000;

      await prisma.progressReview.create({
        data: {
          clientId: client.id,
          reviewDate: new Date(Date.now() - reviewOffset),
          trainerNotes: baseNotes[i % baseNotes.length],
          adherencePct: 70 + i * 5 + (index % 10),
          energyLevel: 6 + (index % 3) + (i % 2),
          nextAssessmentDate: new Date(Date.now() + (14 - i * 2) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Create workout logs if needed
  if (clientDef.hasWorkoutLogs && clientDef.hasAssessment && splitExercises.length > 0) {
    const numSessions = 4 + (index % 4);

    for (let session = 0; session < numSessions; session++) {
      const sessionOffset = (session + 1) * 3 * 24 * 60 * 60 * 1000;

      for (const splitEx of splitExercises) {
        let weight: number | null = null;
        let reps: number;
        let rpe: number;
        let notes: string;

        if (splitEx.isBodyweight) {
          reps = 10 + session * 2 + (index % 5);
          rpe = 6 + (session % 3) + (index % 2);
          notes = session % 3 === 0 ? 'Ø¥Ø­Ø³Ø§Ø³ Ù‚ÙˆÙŠ' : session % 3 === 1 ? 'Ø£Ø¯Ø§Ø¡ ØµØ­ÙŠØ­' : 'Ø¨Ø¯Ø£Øª Ø£ØªØ¹Ø¨ ÙÙŠ Ø§Ù„Ø¢Ø®Ø±';
        } else if (splitEx.muscleGroup === 'legs' || splitEx.muscleGroup === 'glutes') {
          weight = 20 + session * 2.5 + (index % 3) * 1.5;
          reps = 8 + session;
          rpe = 7 + (session % 2);
          notes = session % 3 === 0 ? 'Ø§Ù„Ù…Ø¯Ù‰ Ù…Ù…ØªØ§Ø²' : 'Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ø¶Ø±Ø¨ ÙÙŠ Ø¢Ø®Ø± Ù…Ø¬Ù…ÙˆØ¹Ø©';
        } else if (splitEx.muscleGroup === 'back') {
          weight = 30 + session * 2 + (index % 4);
          reps = 10 + session;
          rpe = 6 + (session % 2);
          notes = session % 3 === 0 ? 'ØªØ­ÙƒÙ… ÙƒØ§Ù…Ù„ ÙÙŠ Ø§Ù„Ù†Ø²ÙˆÙ„' : 'Ø¶Ø®Ù…Ø© Ø­Ù„ÙˆØ©';
        } else {
          weight = 12 + session + (index % 3);
          reps = 12 + session;
          rpe = 7 + (session % 2);
          notes = session % 3 === 0 ? 'Ø³Ù„Ø³' : 'Ø¢Ø®Ø± Ù…Ø¬Ù…ÙˆØ¹Ø© ÙƒØ§Ù†Øª ØµØ¹Ø¨Ø©';
        }

        await prisma.workoutLog.create({
          data: {
            clientId: client.id,
            date: new Date(Date.now() - sessionOffset),
            exerciseName: splitEx.name,
            sets: 3,
            reps,
            weightKg: weight,
            rpe,
            notes,
          },
        });
      }
    }
  }

  // Handle invited client (client 10)
  if (clientDef.status === ClientStatus.INVITED) {
    await prisma.client.update({
      where: { id: client.id },
      data: {
        inviteToken: `INV-${index}`,
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return { client };
}

async function seedDemoData() {
  console.log('Seeding demo data...\n');

  // Clear any existing demo data
  await clearDemoData('demo-check');

  // Create or update trainer
  const { user: trainerUser, profile } = await createDemoTrainer();
  console.log('Created/updated demo trainer: Coach Karim Adel (01000000000)');

  // Check if we need to clear (trainer already had clients)
  await clearDemoData(trainerUser.id);

  const clientCounts: Record<string, number> = {};

  // Create clients
  for (let i = 0; i < demoClients.length; i++) {
    const clientDef = demoClients[i];
    await createClient(profile, clientDef, i);
    clientCounts[clientDef.goal] = (clientCounts[clientDef.goal] || 0) + 1;
  }

  console.log('\n=== Demo Data Summary ===');
  console.log(`Clients created: ${demoClients.length}`);
  console.log('Clients by goal:', Object.entries(clientCounts).map(([k, v]) => `${v} ${k}`).join(', '));

  // Count specific entities
  const assessmentCount = await prisma.bodyComposition.count({
    where: { client: { trainerId: profile.id } },
  });
  const nutritionPlanCount = await prisma.clientNutritionPlan.count({
    where: { client: { trainerId: profile.id } },
  });
  const splitCount = await prisma.trainingSplit.count({
    where: { client: { trainerId: profile.id } },
  });
  const logCount = await prisma.workoutLog.count({
    where: { client: { trainerId: profile.id } },
  });
  const reviewCount = await prisma.progressReview.count({
    where: { client: { trainerId: profile.id } },
  });
  const subscriptionCount = await prisma.subscription.count({
    where: { client: { trainerId: profile.id } },
  });

  console.log(`InBody (BodyComposition): ${assessmentCount}`);
  console.log(`Nutrition Plans: ${nutritionPlanCount}`);
  console.log(`Training Splits: ${splitCount}`);
  console.log(`Workout Logs: ${logCount}`);
  console.log(`Progress Reviews: ${reviewCount}`);
  console.log(`Subscriptions: ${subscriptionCount}`);

  console.log('\n=== Demo Credentials ===');
  console.log('Login: 01000000000');
  console.log('Password: Demo@123');
  console.log('\nâœ“ Demo data seeding complete!');
}

seedDemoData().catch(e => {
  console.error('Error seeding demo data:', e);
  process.exit(1);
});
