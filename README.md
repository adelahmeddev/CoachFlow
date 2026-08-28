# كوتش - نظام إدارة المدرب الشخصي

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.9.1-indigo?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## نظرة عامة

منصة SaaS حديثة للمدربين الشخصيين لإدارة دورة حياة العميل بالكامل - من الانضمام عبر روابط الدعوة والتقييمات الشاملة لللياقة، إلى خطط التغذية وبرامج التدريب وتتبع التقدم. مصممة للمدربين الذين يريدون استبدال السجلات الورقية بسير عمل رقمي قابل للتوسع.

## المميزات حسب الدور

### المدرب (Trainer)

- **انضمام العملاء عبر روابط الدعوة** - إنشاء روابط قابلة للمشاركة للعملاء الجدد برموز مخصصة
- **محرك تقييم اللياقة** - حساب تلقائي لـ BMI/BMR/TDEE، معايير اختبار المشي، فحص المرونة والآلام، تتبع الإصابات
- **قوالب وخطط التغذية** - إنشاء قوالب قابلة لإعادة الاستخدام، وتعيين أهداف سعرات وماكروز لكل عميل
- **قوالب التقسيمات التدريبية** - تقسيمات جاهزة (Full Body، Upper/Lower، Push/Pull/Legs، Bro Split، مخصص) مع مكتبة تمارين
- **تحليلات التقدم** - مخططات مقارنة جانبية، سجلات تدريب مع RPE، تتبع الالتزام
- **إدارة الاشتراكات والجلسات** - تتبع الاشتراكات النشطة، الجلسات المتبقية، حالة الدفع، التجديد التلقائي

### المسؤول (Admin)

- **لوحة تحكم شاملة** - إحصائيات عامة لجميع المدربين: إجمالي العملاء، الاشتراكات النشطة، التقييمات المعلقة
- **إدارة المدربين** - إنشاء مدربين، عرض أعداد عملائهم ومؤشرات اشتراكاتهم
- **عرض جميع العملاء** - قائمة قابلة للتصفية حسب الحالة والهدف وتاريخ آخر تقييم
- **عرض جميع الاشتراكات** - مراقبة حالة الدفع والاشتراكات المنتهية/التجريبية/الموقوفة

### العميل (Client)

- **نموذج دعوة عام** - نموذج بسيط لتقديم الاسم وتاريخ الميلاد ورقم الهاتف وهدف التدريب
- **استمارة التقييم** - إكمال تقييم اللياقة الأساسي مع الفحص الصحي

## مزايا التدريب الذكية

- **تنبيهات التمارين المرتبطة بالإصابات** - تحديد التمارين التي قد تزيد الإصابات المسجلة مع اقتراح بدائل بنقرة واحدة
- **اقتراحات التصعيد التلقائية** - تحليل الأداء المسجل للتوصية بزيادة الأوزان/العدّات/المجموعات

## التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| الواجهة | Next.js 16 (App Router)، React 19.2، TypeScript 5 |
| الخلفية | NextAuth.js 4، React Hook Form، Zod validation |
| قاعدة البيانات | PostgreSQL 15+، Prisma ORM 7.9.1 |
| واجهة المستخدم | Tailwind CSS 4، shadcn/ui، Radix UI primitives |
| المخططات | Recharts 3.10.1 |
| الأيقونات | Lucide React |
| التعريب | نظام locales مخصص (ar/en) مع حفظ في الكوكيز - العربية هي اللغة الافتراضية |
| الحالة | React Server Components + Client Components |
| الأمان | bcryptjs لتشفير كلمات المرور، RBAC (Admin/Trainer/Client) |

## البنية المعمارية

```
┌─────────────────────────────────────────────────────────────┐
│                    مسار المدرب → العميل                     │
├─────────────────────────────────────────────────────────────┤
│  لوحة المدرب  →  دعوة عميل  →  النموذج العام                │
│       ↓              ↓              ↓                       │
│  محرك التقييم ←  إنشاء الخطة ←  إكمال البيانات الأساسية    │
│       ↓              ↓              ↓                       │
│  خطة التغذية →  التقسيم التدريبي →  تتبع التقدم            │
└─────────────────────────────────────────────────────────────┘
```

- **App Router** مع مجموعات مسارات: `(admin)`، `(trainer)`، `(auth)`، `invite/[token]`
- **Server Actions** للعمليات (إنشاء/تحديث/حذف)
- **طبقة الخدمات** (`src/server/services/`) لمنطق الأعمال
- **Prisma repositories** باستعلامات آمنة الأنواع داخل الخدمات
- **وصول محدود للبيانات** - لا يستطيع المدرب الوصول إلا لعملائه

## هيكل المشروع

```
src/
├── app/
│   ├── (admin)/admin/          # المسؤول: صفحات المدربين والعملاء والاشتراكات
│   ├── (trainer)/               # المدرب: لوحة التحكم، العملاء، التغذية، الإعدادات
│   ├── (auth)/                  # تسجيل الدخول، التسجيل
│   ├── invite/[token]/          # مسار دعوة العميل العام
│   ├── api/                     # مسارات API للمصادقة
│   ├── globals.css              # Tailwind globals
│   └── layout.tsx               # التخطيط الرئيسي مع Providers
├── components/
│   ├── features/                # مكونات UI الخاصة بالمزايا
│   ├── layout/                  # الشريط الجانبي، الشريط العلوي، التنقل
│   ├── providers/               # Session، i18n، Theme providers
│   └── ui/                      # مكونات shadcn/ui الأساسية
├── lib/
│   ├── i18n/                    # ترجمات ar/en + الإعدادات
│   ├── validations/             # مخططات Zod
│   ├── constants/               # Role enum، ثوابت الواجهة
│   ├── calculations/            # أدوات BMI، BMR، TDEE، اختبار المشي
│   ├── prisma.ts                # Prisma client singleton
│   └── utils.ts
├── server/
│   ├── actions/                 # Server Actions للعمليات
│   ├── auth/                    # إعداد NextAuth والمساعدات
│   └── services/                # منطق الأعمال (client, assessment, subscription)
└── middleware.ts                # حماية المسارات وفحص الأدوار
prisma/
├── schema.prisma                # 20 نموذجاً، enums، علاقات
└── seed.ts                      # بيانات أولية (إنشاء المسؤول)
scripts/
└── seed-demo.ts                 # بيانات تجريبية: مدرب + 10 عملاء
```

## البداية السريعة

### المتطلبات

- Node.js 18+ (يُنصح بإصدار LTS)
- PostgreSQL 15+
- npm 10+

### التثبيت

```bash
# استنساخ المستودع
git clone <repository-url>
cd coach

# تثبيت الاعتماديات
npm install

# نسخ ملف البيئة وإعداد المتغيرات
cp .env.example .env
# عدّل .env بقيم DATABASE_URL و NEXTAUTH_SECRET وبيانات الدخول

# تجهيز قاعدة البيانات
npm run db:migrate

# تعبئة البيانات الأولية (إنشاء حساب المسؤول من متغيرات البيئة)
npm run db:seed

# اختياري: بيانات تجريبية (مدرب + 10 عملاء)
npm run seed:demo

# تشغيل خادم التطوير
npm run dev
```

افتح `http://localhost:3000`

## الحسابات الافتراضية

| الدور | الهاتف | كلمة المرور | الوصول |
|------|--------|-------------|--------|
| المسؤول | من `.env` عبر `ADMIN_USERNAME` | من `.env` عبر `ADMIN_PASSWORD` | `/admin` |
| المدرب التجريبي | `01000000000` | `Demo@123` | `/trainer` |

> شغّل `npm run seed:demo` بعد إعداد قاعدة البيانات لإنشاء حساب المدرب التجريبي.

## السكربتات

| السكربت | الوصف |
|---------|-------|
| `npm run dev` | تشغيل خادم التطوير مع Turbopack |
| `npm run build` | البناء للإنتاج |
| `npm run start` | تشغيل خادم الإنتاج |
| `npm run lint` | تشغيل ESLint |
| `npm run typecheck` | فحص أنواع TypeScript |
| `npm run db:start` | تشغيل PostgreSQL المحلي |
| `npm run db:stop` | إيقاف PostgreSQL المحلي |
| `npm run db:migrate` | تنفيذ Prisma migrations |
| `npm run db:seed` | تعبئة البيانات الأولية (حساب المسؤول) |
| `npm run db:studio` | فتح واجهة Prisma Studio |
| `npm run db:reset` | إعادة تعيين قاعدة البيانات (حذف + migrate + seed) |
| `npm run prisma:migrate` | اسم بديل لـ db:migrate |
| `npm run prisma:generate` | إعادة توليد Prisma Client |
| `npm run prisma:seed` | اسم بديل لـ db:seed |
| `npm run seed:demo` | إنشاء المدرب التجريبي + 10 عملاء |

## نماذج قاعدة البيانات

| النموذج | الغرض |
|---------|-------|
| `User` | سجلات المصادقة مع دور (ADMIN/TRAINER/CLIENT) |
| `TrainerProfile` | تفاصيل أعمال المدرب، الإعدادات، الوحدات، المنطقة الزمنية |
| `Client` | سجلات العملاء، الحالة، رموز الدعوة، الهدف، علامات الآلام |
| `Assessment` | بيانات التقييم الأساسي/التقدمي مع المؤشرات المحسوبة |
| `NutritionTemplate` | قوالب خطط التغذية القابلة لإعادة الاستخدام (خاصة أو عامة) |
| `ClientNutritionPlan` | خطط التغذية المعينة بحالة ونطاق تاريخي |
| `ProgramInfo` | بيانات البرنامج التدريبي (الاسم، الهدف، المستوى، الملاحظات) |
| `TrainingSplit` | الجدول الأسبوعي للعميل حسب نوع التقسيمة |
| `TrainingSplitDay` | يوم فردي ضمن التقسيمة (تركيز: PUSH/PULL/LEGS...) |
| `SplitDayExercise` | تمارين اليوم التدريبي مع المجموعات/العدّات/الأوزان |
| `Exercise` | مكتبة التمارين العامة مع المجموعة العضلية والأجهزة والوسوم |
| `TrainingSplitTemplate` | قوالب تقسيمات قابلة لإعادة الاستخدام للمدربين |
| `TemplateDayExercise` | تمارين يوم القالب مرتبطة بمكتبة التمارين |
| `Subscription` | اشتراكات العملاء بالحالة والجلسات وحالة الدفع |
| `ProgressReview` | ملاحظات الجلسات، نسبة الالتزام، مستوى الطاقة، موعد التقييم القادم |
| `WorkoutLog` | سجلات التمارين الفردية بالمجموعات/العدّات/الوزن/RPE |

Enums: `ClientStatus` (INVITED, PENDING_ASSESSMENT, ACTIVE, PAUSED, COMPLETED, ARCHIVED)، `Goal` (WEIGHT_LOSS, MUSCLE_BUILDING, STRENGTH, GENERAL_FITNESS, WEIGHT_GAIN, REHAB)، `Role` (ADMIN, TRAINER, CLIENT)، `PlanStatus` (DRAFT, ACTIVE, PAUSED, COMPLETED)، `SplitType` (FULL_BODY, UPPER_LOWER, PUSH_PULL_LEGS, BRO_SPLIT, CUSTOM).

## التعريب ودعم اللغات

- **اللغة الافتراضية**: العربية (`ar`) - مع دعم كامل للإنجليزية (`en`)
- **دعم RTL**: تخطيط كامل من اليمين لليسار للعربية
- **حفظ اللغة**: عبر الكوكيز (`locale`)
- **بدون بادئات في الروابط**: يتم تحديد اللغة من الكوكيز
- **الملفات**:
  - `src/lib/i18n/config.ts` - إعدادات اللغات وكشف RTL (`DEFAULT_LOCALE = "ar"`)
  - `src/lib/i18n/messages/ar.ts` / `en.ts` - قواميس الترجمة
  - `src/lib/i18n/labels.ts` - ربط الـ enums بالتسميات مع التعريب

## نظام التصميم

- **الثيم**: زجاجي داكن/فاتح مع متغيرات CSS دلالية
- **الرموز**: لوحة الألوان، المسافات، الخطوط عبر Tailwind CSS
- **المكونات**: مكونات shadcn/ui الأساسية بتنسيق مخصص
- **تبديل الثيم**: تبديل من جهة العميل محفوظ في local storage
- **التأثيرات الزجاجية**: ضبابية الخلفية، حدود خفيفة، backdrop filters

## الأمان

- **RBAC**: ثلاثة أدوار مع وصول محدود للبيانات (Admin/Trainer/Client)
- **تحديد نطاق البيانات**: لا يستطيع المدرب الوصول لعملاء مدرب آخر
- **المصادقة**: NextAuth.js credentials provider مع تشفير bcrypt
- **التحقق**: مخططات Zod تتحقق من جميع المدخلات على الخادم
- **Transactions**: Prisma transactions للعمليات متعددة السجلات
- **جلسة نشطة واحدة**: مفروضة عبر إدارة الجلسات
- **حماية CSRF**: مدمجة في NextAuth.js
- **كوكيز HttpOnly**: توكن الجلسة محمي من الوصول عبر JavaScript

## خارطة الطريق

- [ ] **بوابة العميل** - تسجيل دخول العملاء لعرض الخطط وتسجيل التدريبات
- [ ] **إشعارات فورية** - تذكير الجلسات ومواعيد التقييمات
- [ ] **تقارير PDF** - توليد ملخصات التقييم وتقارير التقدم
- [ ] **تكامل الدفعات** - Stripe/PayPal لدفع الاشتراكات
- [ ] **مولد تقسيمات ذكي** - توليد تقسيمات تدريبية تلقائيًا حسب الهدف
- [ ] **مزامنة الأجهزة القابلة للارتداء** - Apple Health، Google Fit، Fitbit

---

# Coach - Personal Trainer Management System (English)

Modern SaaS platform for personal trainers to manage their entire client lifecycle - from invite-based onboarding and comprehensive fitness assessments to nutrition planning, training program delivery, and progress tracking.

### Roles

- **Trainer**: invite-link client onboarding, fitness assessment engine (auto BMI/BMR/TDEE, walk-test benchmarks, mobility & pain screening), nutrition templates & plans, training split templates, progress analytics, subscription & session management.
- **Admin**: global dashboard stats across all trainers, trainer management, all-clients view, all-subscriptions view.
- **Client**: public invite form, baseline assessment intake.

### Smart Coaching Features

- **Injury-aware exercise warnings** - flags exercises that may aggravate recorded injuries with one-click alternatives.
- **Auto progression suggestions** - analyzes logged performance to recommend load/rep/sets progression.

### Tech Stack

Next.js 16 (App Router), React 19.2, TypeScript 5, NextAuth.js 4, React Hook Form + Zod, PostgreSQL 15+, Prisma ORM 7.9.1, Tailwind CSS 4, shadcn/ui + Radix, Recharts, Lucide icons. i18n: custom locale system (ar default / en) with cookie persistence and full RTL support.

### Getting Started

```bash
npm install
cp .env.example .env   # set DATABASE_URL, NEXTAUTH_SECRET, ADMIN_USERNAME/ADMIN_PASSWORD
npm run db:migrate
npm run db:seed
npm run seed:demo      # optional demo trainer + 10 clients
npm run dev
```

Visit `http://localhost:3000`. Default accounts: Admin from `.env`, Demo Trainer `01000000000` / `Demo@123`.

### Security

RBAC with scoped data access, bcrypt password hashing, Zod server-side validation, Prisma transactions, single active session, CSRF protection, HttpOnly session cookies.

### Roadmap

Client portal, push notifications, PDF reports, payment integration, AI split generator, wearables sync.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Built by Adel Ahmed. For questions or contributions, open an issue or contact via the project repository.
