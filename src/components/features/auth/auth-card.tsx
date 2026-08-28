import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AuthCardProps = {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="relative w-full animate-in fade-in zoom-in-95 duration-300 ease-out motion-reduce:animate-none">
      <Card className="relative w-full overflow-hidden border bg-card shadow-medium">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" aria-hidden="true" />
        <CardHeader className="space-y-2 pb-6 pt-7 text-center">
          <CardTitle className="text-balance text-xl font-heading font-bold tracking-tight sm:text-2xl">{title}</CardTitle>
          <CardDescription className="text-pretty text-sm leading-relaxed sm:text-[15px]">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-7">
          {children}
          {footer && (
            <>
              <div className="relative my-1 flex items-center" aria-hidden="true">
                <div className="flex-1 border-t" />
                <span className="px-3 text-xs font-medium text-muted-foreground">أو</span>
                <div className="flex-1 border-t" />
              </div>
              <div className="text-center text-sm leading-relaxed text-muted-foreground">{footer}</div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Convenience wrappers for specific pages
export function TrainerAuthFooter() {
  return (
    <>
      <span className="text-muted-foreground">ليس لديك حساب؟ </span>
      <Link href="/register" className="font-medium text-brand-600 dark:text-brand-400 hover:underline transition-colors">
        إنشاء حساب مدرب
      </Link>
    </>
  )
}

export function ClientAuthFooter() {
  return <span className="text-muted-foreground">دعوة فقط — تواصل مع مدربك للحصول على رابط الدعوة</span>
}