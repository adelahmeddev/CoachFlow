import type { Metadata } from "next";
import { AuthCard, TrainerAuthFooter } from "@/components/features/auth/auth-card";
import { LoginForm } from "@/components/features/auth/login-form";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const { locale } = await getI18n();
  const isAr = locale === "ar";
  // Note: We don't check session here to avoid redirect loops
  // The protected routes (like /dashboard) will handle auth checks
  return (
    <AuthCard
      title={isAr ? "مرحبًا بعودتك" : "Welcome back"}
      description={isAr ? "سجّل الدخول برقم الهاتف وكلمة المرور." : "Sign in with your phone number and password."}
      footer={<TrainerAuthFooter />}
    >
      <LoginForm callbackUrl="/dashboard" />
    </AuthCard>
  );
}
