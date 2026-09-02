"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useI18n } from "@/lib/i18n/client";

export function LoginForm({
  callbackUrl = "/dashboard",
}: {
  callbackUrl?: string
}) {
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const router = useRouter();
  const { t } = useI18n();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsPending(true);
    try {
      const result = await signIn("credentials", {
        identifier: values.identifier,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "TOO_MANY_ATTEMPTS") {
          toast.error("محاولات خاطئة كثيرة. برجاء المحاولة بعد ١٥ دقيقة.");
        } else if (result.error.includes("ACCOUNT_SUSPENDED")) {
          toast.error("تم تعليق الحساب. برجاء التواصل مع الإدارة.");
        } else {
          toast.error("بيانات الدخول غير صحيحة. حاول مرة أخرى.");
        }
        setIsPending(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role as string | undefined;

      let redirectUrl = callbackUrl;
      if (role === "SUPER_ADMIN") redirectUrl = "/admin";
      else if (role === "COACH") redirectUrl = "/dashboard";
      else if (role === "CLIENT") redirectUrl = "/client/home";

      router.push(redirectUrl);
      router.refresh();
    } catch {
      toast.error("حدث خطأ ما. حاول مرة أخرى.");
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input
                  placeholder="coach.karim أو 01000000000 أو you@example.com"
                  autoComplete="username"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.auth.password}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isPending}
                    className="pe-10"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full shadow-soft" disabled={isPending || !hydrated} aria-busy={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              جارٍ تسجيل الدخول...
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </Button>
      </form>
    </Form>
  );
}