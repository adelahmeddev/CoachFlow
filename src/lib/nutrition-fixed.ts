import type {
  MealInput,
  SubstituteGroupInput,
  SupplementDefInput,
} from "@/lib/validations/nutrition"
import { MealKind, QuantityUnit, SubstituteCategory } from "@/generated/prisma/enums"

export const SUPPLEMENT_DEFS_SEED: SupplementDefInput[] = [
  {
    name: "Multivitamins",
    nameAr: "مالتيفيتامين",
    definition:
      "Dietary supplements containing a varied collection of vitamins and minerals to supply essential nutrients the body may lack from food alone.",
    definitionAr:
      "مكملات غذائية تحتوي على مجموعة متنوعة من الفيتامينات والمعادن لتزويد الجسم بالعناصر الأساسية التي قد لا يحصل عليها من الطعام وحده.",
    importance: "Supports general health and improves vital body functions.",
    importanceAr: "يدعم الصحة العامة ويحسن وظائف الجسم الحيوية.",
  },
  {
    name: "Omega-3",
    nameAr: "أوميجا 3",
    definition:
      "Essential fatty acids the body cannot produce itself; they must be obtained from food or supplements.",
    definitionAr:
      "أحماض دهنية أساسية لا يستطيع الجسم إنتاجها، ويجب الحصول عليها من الطعام أو المكملات الغذائية.",
    importance: "Plays a major role in biological functions and disease prevention.",
    importanceAr: "تلعب دورًا كبيرًا في الوظائف الحيوية والوقاية من الأمراض.",
  },
  {
    name: "Creatine",
    nameAr: "كرياتين",
    definition: null,
    definitionAr: null,
    importance: "Increases strength and muscle size and improves gym performance.",
    importanceAr: "يزيد القوة وحجم العضلات ويحسن الأداء في الجيم.",
  },
]

const g = QuantityUnit.G
const pcs = QuantityUnit.PCS

export const SUBSTITUTE_GROUPS_SEED: SubstituteGroupInput[] = [
  {
    category: SubstituteCategory.CARB,
    caloriesLabel: "~130 Kcal",
    items: [
      { name: "Rice", nameAr: "أرز", amount: 100, unit: g },
      { name: "Potato", nameAr: "بطاطس", amount: 150, unit: g },
      { name: "Sweet potato", nameAr: "بطاطا", amount: 150, unit: g },
      { name: "Pasta", nameAr: "مكرونة", amount: 130, unit: g },
      { name: "Oats", nameAr: "شوفان", amount: 40, unit: g },
      { name: "Baladi bread", nameAr: "عيش بلدي", amount: 120, unit: g },
    ],
  },
  {
    category: SubstituteCategory.PROTEIN,
    caloriesLabel: "~150 Kcal",
    items: [
      { name: "Chicken", nameAr: "فراخ", amount: 100, unit: g },
      { name: "Meat", nameAr: "لحمة", amount: 150, unit: g },
      { name: "Fish or tuna", nameAr: "سمك أو تونة", amount: 150, unit: g },
      { name: "Whey protein scoop", nameAr: "سكوب واي بروتين", amount: 1, unit: pcs },
      { name: "Whole eggs", nameAr: "بيض كامل", amount: 5, unit: pcs },
      { name: "Chicken liver", nameAr: "كبدة فراخ", amount: 130, unit: g },
      { name: "Cottage cheese", nameAr: "جبن قريش", amount: 280, unit: g },
      { name: "Greek yogurt", nameAr: "زبادي يوناني", amount: 300, unit: g },
      { name: "Yogurt", nameAr: "زبادي", amount: 400, unit: g },
    ],
  },
  {
    category: SubstituteCategory.FRUIT,
    caloriesLabel: "~130 Kcal",
    items: [
      { name: "Dates", nameAr: "بلح", amount: 40, unit: g },
      { name: "Banana", nameAr: "موز", amount: 100, unit: g },
      { name: "Strawberry", nameAr: "فراولة", amount: 300, unit: g },
      { name: "Pomegranate", nameAr: "رمان", amount: 150, unit: g },
      { name: "Orange", nameAr: "برتقال", amount: 200, unit: g },
      { name: "Grapes", nameAr: "عنب", amount: 200, unit: g },
      { name: "Mango", nameAr: "مانجو", amount: 150, unit: g },
      { name: "Watermelon", nameAr: "بطيخ", amount: 300, unit: g },
      { name: "Melon", nameAr: "كانتلوب", amount: 300, unit: g },
      { name: "Kiwi", nameAr: "كيوي", amount: 150, unit: g },
    ],
  },
  {
    category: SubstituteCategory.FAT,
    caloriesLabel: "30g / 150 Kcal",
    items: [
      { name: "Almonds", nameAr: "لوز", amount: 30, unit: g },
      { name: "Hazelnuts", nameAr: "بندق", amount: 30, unit: g },
      { name: "Peanuts", nameAr: "فول سوداني", amount: 30, unit: g },
      { name: "Pistachios", nameAr: "فستق", amount: 30, unit: g },
      { name: "Avocado", nameAr: "أفوكادو", amount: 100, unit: g },
      { name: "Walnuts", nameAr: "عين جمل", amount: 30, unit: g },
      { name: "Olive oil", nameAr: "زيت زيتون", amount: 15, unit: g },
      { name: "Baladi ghee", nameAr: "سمنة بلدي", amount: 30, unit: g },
    ],
  },
]

export const SAMPLE_MEALS_KAMEL: MealInput[] = [
  {
    kind: MealKind.MEAL,
    name: "Meal 1 Breakfast",
    nameAr: "وجبة 1 الفطار",
    items: [
      { foodName: "Oats", foodNameAr: "شوفان", amount: 60, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Baladi bread", foodNameAr: "عيش بلدي", amount: 120, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Cottage cheese", foodNameAr: "جبن قريش", amount: 150, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Whole eggs", foodNameAr: "بيض كامل", amount: 3, unit: pcs, calories: null, groupNumber: 2 },
      { foodName: "Skim milk", foodNameAr: "لبن خالي الدسم", amount: 250, unit: QuantityUnit.ML, calories: null, groupNumber: 1 },
      { foodName: "Apple", foodNameAr: "تفاح", amount: 150, unit: g, calories: null, groupNumber: 1 },
      { foodName: "Tomato + cucumber", foodNameAr: "طماطم وخيار", amount: null, unit: g, calories: null, groupNumber: 1 },
    ],
  },
  {
    kind: MealKind.SNACK,
    name: "Snack after breakfast",
    nameAr: "سناك بعد الفطار",
    items: [
      { foodName: "Greek yogurt", foodNameAr: "زبادي يوناني", amount: 170, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Banana", foodNameAr: "موز", amount: 120, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Whey scoop", foodNameAr: "سكوب واي", amount: 1, unit: pcs, calories: null, groupNumber: 2 },
      { foodName: "Apple", foodNameAr: "تفاح", amount: 180, unit: g, calories: null, groupNumber: 2 },
    ],
  },
  {
    kind: MealKind.SNACK,
    name: "Snack pre-workout",
    nameAr: "سناك قبل التمرين",
    items: [
      { foodName: "Medium banana", foodNameAr: "موسة وسط", amount: 1, unit: pcs, calories: null, groupNumber: 1 },
      { foodName: "Black coffee", foodNameAr: "قهوة سادة", amount: 1, unit: pcs, calories: null, groupNumber: 1 },
    ],
  },
  {
    kind: MealKind.MEAL,
    name: "Meal 2 Lunch",
    nameAr: "وجبة 2 الغدا",
    items: [
      { foodName: "Grilled or boiled chicken", foodNameAr: "فراخ مشوية أو مسلوقة", amount: 200, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Diet tuna", foodNameAr: "تونة دايت", amount: 220, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Cooked rice", foodNameAr: "أرز مطبوخ", amount: 250, unit: g, calories: null, groupNumber: 3 },
      { foodName: "Oven potatoes", foodNameAr: "بطاطس فرن", amount: 350, unit: g, calories: null, groupNumber: 3 },
      { foodName: "Big salad + olive oil spoon", foodNameAr: "سلطة كبيرة + معلق زيت زيتون", amount: 15, unit: g, calories: null, groupNumber: 1 },
    ],
  },
  {
    kind: MealKind.MEAL,
    name: "Meal 3 Dinner",
    nameAr: "وجبة 3 العشا",
    items: [
      { foodName: "Cottage cheese", foodNameAr: "جبن قريش", amount: 250, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Tuna", foodNameAr: "تونة", amount: 150, unit: g, calories: null, groupNumber: 2 },
      { foodName: "Baladi bread", foodNameAr: "عيش بلدي", amount: 60, unit: g, calories: null, groupNumber: 3 },
      { foodName: "Brown toast", foodNameAr: "توست أسمر", amount: 4, unit: pcs, calories: null, groupNumber: 3 },
      { foodName: "Vegetable salad", foodNameAr: "سلطة خضار", amount: null, unit: g, calories: null, groupNumber: 1 },
    ],
  },
]
