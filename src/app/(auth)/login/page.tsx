import type { Metadata } from "next";
import { AuthCard, TrainerAuthFooter } from "@/components/features/auth/auth-card";
import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  // Note: We don't check session here to avoid redirect loops
  // The protected routes (like /dashboard) will handle auth checks
  return (
    <AuthCard
      title="مرحبًا بعودتك"
      description="سجّل الدخول باسم المستخدم أو رقم الهاتف أو البريد الإلكتروني."
      footer={<TrainerAuthFooter />}
    >
      <LoginForm callbackUrl="/dashboard" />
    </AuthCard>
  );
}
