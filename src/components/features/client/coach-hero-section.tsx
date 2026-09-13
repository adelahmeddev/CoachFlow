"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowLeftRight, MessageSquare, Sparkles } from "lucide-react"
import { useBranding } from "@/components/branding/branding-provider"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { BlogCardPost } from "@/components/features/blog/post-card"

/**
 * Full-bleed client home hero: the coach's dedicated personal photo
 * (TrainerProfile.avatarUrl — never the brand logo as primary source) as a
 * cinematic banner with vignette fades, identity overlay, and three action
 * pills docked over the bottom fade. Negative margins bleed the surrounding
 * padded portal containers for a true edge-to-edge banner.
 */
export function CoachHeroSection({ latestPost = null }: { latestPost?: BlogCardPost | null }) {
  const branding = useBranding()
  const router = useRouter()
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const [failStage, setFailStage] = useState(0)
  const [tipOpen, setTipOpen] = useState(false)

  const candidates = [branding.avatarUrl, branding.logoUrl, "/brand/logo.png"].filter(
    (u): u is string => !!u
  )
  const src = candidates[Math.min(failStage, candidates.length - 1)] ?? null
  const showImage = src !== null && failStage < candidates.length

  const pillClass =
    "h-8 px-3 rounded-full text-[11px] font-medium bg-black/45 hover:bg-black/65 active:scale-95 border border-white/15 text-white/95 backdrop-blur-xl shadow-sm transition-all duration-150 flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-label={branding.brandName}
      className="relative -mx-8 -mt-10 h-[360px] w-auto overflow-hidden md:-mx-16 md:-mt-16 md:h-[440px]"
    >
      {/* Background coach photo */}
      {showImage && (
        <Image
          key={src}
          src={src}
          alt={branding.brandName}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-top contrast-[1.02]"
          onError={() => setFailStage((s) => s + 1)}
        />
      )}

      {/* Bottom-edge fade only — mid-body stays clear to show the coach */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Bottom dock: action stack */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-end gap-3 p-4 md:p-6">
        <div className="z-20 flex shrink-0 flex-col gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={() => setTipOpen(true)} className={pillClass}>
            <Sparkles className="size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            {isAr ? "نصيحة اليوم" : "Today's tip"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/client/nutrition#substitutes")} className={pillClass}>
            <ArrowLeftRight className="size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            {isAr ? "بدائل الوجبات" : "Meal substitutes"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/client/messages")} className={pillClass}>
            <MessageSquare className="size-3.5 shrink-0 text-sky-400" aria-hidden="true" />
            {isAr ? "شات الكابتن" : "Coach chat"}
          </Button>
        </div>
      </div>

      {/* Daily tip dialog */}
      <Dialog open={tipOpen} onOpenChange={setTipOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{isAr ? "نصيحة اليوم" : "Today's tip"}</DialogTitle>
          </DialogHeader>
          {latestPost ? (
            <div className="space-y-2">
              <p className="text-sm font-bold">{latestPost.title}</p>
              {latestPost.excerpt && <p className="text-sm leading-relaxed text-muted-foreground">{latestPost.excerpt}</p>}
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/client/blog" onClick={() => setTipOpen(false)}>
                  {isAr ? "اقرأ المزيد" : "Read more"}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد نصائح بعد — اسأل مدربك في الرسائل." : "No tips yet — ask your coach in messages."}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTipOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  )
}
