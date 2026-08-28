import type { Metadata } from "next";
import { AuthCard, ClientAuthFooter } from "@/components/features/auth/auth-card";
import { LoginForm } from "@/components/features/auth/login-form";
import { BrandLogo } from "@/components/brand/brand-logo";

export const metadata: Metadata = {
  title: "Login",
};

export default function ClientLoginPage() {
  return (
    <div className="min-h-screen flex min-h-[480px] items-center justify-center overflow-x-hidden overflow-y-auto bg-gradient-to-br from-background via-brand-50/30 to-brand-100/20 dark:from-background dark:via-brand-900/10 dark:to-brand-900/5 p-4 sm:p-6">
      <div className="absolute inset-0 texture-halftone pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -end-32 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl animate-pulse-slow sm:-top-40 sm:-end-40 sm:h-80 sm:w-80" />
        <div className="absolute -bottom-32 -start-32 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl sm:-bottom-40 sm:-start-40 sm:h-80 sm:w-80" />
      </div>
      <main className="relative z-10 w-full max-w-md px-2 sm:px-0 flex flex-col items-center gap-4 sm:gap-6">
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_0_30px_rgba(242,106,27,0.35)] dark:shadow-[0_0_30px_rgba(242,106,27,0.25)] sm:h-24 sm:w-24">
            <BrandLogo variant="mark" height={42} width={64} priority className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]" alt="NANOUSH" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight text-foreground sm:text-3xl">
            NANOUSH
          </h1>
        </div>
        <div>
          <AuthCard
            title="مرحبًا بعودتك"
            description="سجّل الدخول باسم المستخدم أو رقم الهاتف أو البريد الإلكتروني."
            footer={<ClientAuthFooter />}
          >
            <LoginForm callbackUrl="/client/home" />
          </AuthCard>
        </div>
        <p className="mt-4 text-center text-sm sm:text-base text-muted-foreground font-medium">
          نظام إدارة المدرب الشخصي
        </p>
      </main>
    </div>
  );
}