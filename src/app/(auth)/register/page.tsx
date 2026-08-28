import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/features/auth/register-form";

export const metadata: Metadata = {
  title: "إنشاء حساب",
};

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden p-4">
      {/* Background decorative elements */}
      <div className="absolute -top-40 -end-40 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="absolute -bottom-40 -start-40 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      
      <Card className="relative w-full max-w-md gap-8 border-none bg-background/80 backdrop-blur-xl shadow-2xl glass-subtle">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">أنشئ حساب المدرب الخاص بك</CardTitle>
          <CardDescription>
            جهّز حسابك لتبدأ في إدارة عملائك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <div className="relative my-6 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground">أو</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <span>لديك حساب بالفعل؟ </span>
            <Link 
              href="/login" 
              className="font-medium text-primary hover:underline transition-colors"
            >
              تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
