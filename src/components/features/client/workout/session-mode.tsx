"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ChevronLeft,
  Dumbbell,
  Loader2,
  Play,
  Timer,
  X,
} from "lucide-react"
import { saveExerciseLogAction } from "@/server/actions/client-portal"
import type {
  SessionLastTime,
  TodayWorkoutResult,
} from "@/server/services/client-portal.service"
import { extractYoutubeId, getEmbedUrl, getThumbnailUrl } from "@/lib/utils/video"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type SetFormValues = { weightKg: string; reps: string }
type FormValues = { sets: SetFormValues[]; notes: string }

interface WakeLockSentinelLike {
  release: () => Promise<void>
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>
  }
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    template
  )
}

function ElapsedTimer({
  startedAt,
  className,
}: {
  startedAt: number
  className?: string
}) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
    }, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return (
    <span
      className={cn(
        "font-medium tabular-nums text-sm text-muted-foreground",
        className
      )}
    >
      {formatClock(seconds)}
    </span>
  )
}

export function SessionMode({
  workout,
  lastTime,
}: {
  workout: TodayWorkoutResult
  lastTime: Record<string, SessionLastTime>
}) {
  const { t } = useI18n()
  const router = useRouter()
  const s = t.client.workout.session

  const exercises = useMemo(() => workout.exercises, [workout.exercises])

  const initialForms = useMemo(() => {
    const entries = exercises.map((ex): [string, FormValues] => {
      const savedSets =
        ex.log?.setData?.filter((s) => s.weightKg != null || s.reps != null) ??
        []
      const sets: SetFormValues[] = Array.from(
        { length: ex.sets },
        (_, i): SetFormValues => {
          const saved = savedSets[i]
          return {
            weightKg:
              saved?.weightKg != null
                ? String(saved.weightKg)
                : ex.targetWeight != null
                  ? String(ex.targetWeight)
                  : lastTime[ex.id]?.weightKg != null
                    ? String(lastTime[ex.id]!.weightKg)
                    : "",
            reps:
              saved?.reps != null
                ? String(saved.reps)
                : lastTime[ex.id]?.reps != null
                  ? String(lastTime[ex.id]!.reps)
                  : String(ex.reps),
          }
        }
      )
      return [
        ex.id,
        { sets, notes: ex.log?.notes ?? ex.notes ?? "" },
      ]
    })
    return Object.fromEntries(entries)
  }, [exercises, lastTime])

  const initialTicks = useMemo(() => {
    const entries = exercises.map(
      (ex): [string, boolean[]] => [
        ex.id,
        Array.from({ length: ex.sets }, () => Boolean(ex.log)),
      ]
    )
    return Object.fromEntries(entries)
  }, [exercises])

  const [startedAt] = useState(() => Date.now())
  const [phase, setPhase] = useState<"workout" | "summary">("workout")
  const [index, setIndex] = useState(() => {
    const first = exercises.findIndex((ex) => !ex.log)
    return first === -1 ? 0 : first
  })
  const [forms, setForms] = useState<Record<string, FormValues>>(initialForms)
  const [setTicks, setSetTicks] =
    useState<Record<string, boolean[]>>(initialTicks)
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(exercises.filter((ex) => ex.log).map((ex) => ex.id))
  )
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const [videoExpanded, setVideoExpanded] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)

  useEffect(() => {
    if (restRemaining === null) return
    if (restRemaining <= 0) {
      setTimeout(() => setRestRemaining(null), 0)
      return
    }
    const id = setInterval(() => {
      setRestRemaining((v) => (v === null ? null : v - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [restRemaining])

  useEffect(() => {
    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false
    async function acquire() {
      try {
        const nav = navigator as Navigator & NavigatorWithWakeLock
        if (nav.wakeLock) {
          const result = await nav.wakeLock.request("screen")
          if (cancelled) {
            await result.release().catch(() => {})
            return
          }
          sentinel = result
        }
      } catch {
        // wake lock unsupported or denied — ignore silently
      }
    }
    void acquire()
    return () => {
      cancelled = true
      void sentinel?.release().catch(() => {})
    }
  }, [])

  const required = exercises.filter((ex) => !skippedIds.has(ex.id))
  const completedCount = required.filter((ex) => savedIds.has(ex.id)).length
  const current = exercises[index]
  const ticks = current ? (setTicks[current.id] ?? []) : []

  const nextUpName = useMemo(() => {
    if (!current) return null
    const n = exercises.length
    for (let step = 1; step <= n; step++) {
      const idx = (index + step) % n
      const ex = exercises[idx]
      if (!savedIds.has(ex.id) && !skippedIds.has(ex.id)) return ex.exerciseName
    }
    return null
  }, [current, exercises, index, savedIds, skippedIds])

  const goToNextAfter = useCallback(
    (from: number, saved: Set<string>, skipped: Set<string>) => {
      const n = exercises.length
      for (let step = 1; step <= n; step++) {
        const idx = (from + step) % n
        const ex = exercises[idx]
        if (!saved.has(ex.id) && !skipped.has(ex.id)) {
          setIndex(idx)
          setVideoExpanded(false)
          return
        }
      }
      setPhase("summary")
    },
    [exercises]
  )

  const handleToggleSet = useCallback(
    (setIdx: number) => {
      if (!current) return
      const ex = current
      const arr = [...(setTicks[ex.id] ?? [])]
      const turningOn = !arr[setIdx]
      arr[setIdx] = !arr[setIdx]
      const allDone = arr.every(Boolean)
      setSetTicks((prev) => ({ ...prev, [ex.id]: arr }))
      if (turningOn && !allDone) {
        const seconds = ex.restSeconds ?? 60
        if (seconds > 0) setRestRemaining(seconds)
      }
    },
    [current, setTicks]
  )

  const handleSetFieldChange = useCallback(
    (id: string, setIdx: number, patch: Partial<SetFormValues>) => {
      setForms((prev) => {
        const fv = prev[id]
        if (!fv) return prev
        const sets = fv.sets.map((s, i) =>
          i === setIdx ? { ...s, ...patch } : s
        )
        return { ...prev, [id]: { ...fv, sets } }
      })
    },
    []
  )

  const handleNotesChange = useCallback((id: string, notes: string) => {
    setForms((prev) => {
      const fv = prev[id]
      if (!fv) return prev
      return { ...prev, [id]: { ...fv, notes } }
    })
  }, [])

  const handleSaveAndNext = useCallback(async () => {
    if (!current || savingId) return
    const values = forms[current.id]
    if (!values) return
    setSavingId(current.id)
    try {
      const ticksArr = setTicks[current.id] ?? []
      const parseNum = (v: string): number | null =>
        v.trim() === "" ? null : Number(v)
      let setsPayload = values.sets
        .map((sv) => ({
          weightKg: parseNum(sv.weightKg),
          reps: parseNum(sv.reps),
        }))
        .filter((_, i) => ticksArr[i])
      if (setsPayload.length === 0 && values.sets[0]) {
        setsPayload = [
          {
            weightKg: parseNum(values.sets[0].weightKg),
            reps: parseNum(values.sets[0].reps),
          },
        ]
      }
      const result = await saveExerciseLogAction(current.id, {
        sets: setsPayload,
        notes: values.notes.trim() || undefined,
      })
      if (!result.ok) {
        toast.error(t.auth.errors.generic)
        return
      }
      const nextSaved = new Set(savedIds)
      nextSaved.add(current.id)
      setSavedIds(nextSaved)
      goToNextAfter(index, nextSaved, skippedIds)
    } finally {
      setSavingId(null)
    }
  }, [
    current,
    forms,
    goToNextAfter,
    index,
    savedIds,
    setTicks,
    skippedIds,
    savingId,
    t.auth.errors.generic,
  ])

  const handleSkip = useCallback(() => {
    if (!current) return
    const nextSkipped = new Set(skippedIds)
    nextSkipped.add(current.id)
    setSkippedIds(nextSkipped)
    goToNextAfter(index, savedIds, nextSkipped)
  }, [current, goToNextAfter, index, savedIds, skippedIds])

  const handlePrev = useCallback(() => {
    const n = exercises.length
    for (let step = 1; step < n; step++) {
      const idx = (index - step + n) % n
      if (!skippedIds.has(exercises[idx].id)) {
        setIndex(idx)
        setVideoExpanded(false)
        return
      }
    }
  }, [exercises, index, skippedIds])

  const summary = useMemo(() => {
    let volume = 0
    const done: string[] = []
    const skipped: string[] = []
    for (const ex of exercises) {
      if (savedIds.has(ex.id)) {
        done.push(ex.exerciseName)
        const fv = forms[ex.id]
        const ticksArr = setTicks[ex.id] ?? []
        for (let i = 0; i < ticksArr.length; i++) {
          if (!ticksArr[i]) continue
          const reps = Number(fv?.sets[i]?.reps) || ex.reps
          const weight = Number(fv?.sets[i]?.weightKg) || 0
          volume += reps * weight
        }
      } else if (skippedIds.has(ex.id)) {
        skipped.push(ex.exerciseName)
      }
    }
    return { volume, done, skipped }
  }, [exercises, forms, savedIds, setTicks, skippedIds])

  const exitSession = useCallback(() => {
    router.push("/client/workout/today")
  }, [router])

  if (phase === "summary") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center p-4">
        <div className="space-y-6 rounded-2xl border bg-card p-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
            <Dumbbell className="size-7" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t.client.workout.summary}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.client.workout.greatWorkoutDescription}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.elapsedTime}</p>
              <ElapsedTimer startedAt={startedAt} className="text-base" />
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                {t.client.workout.totalVolume}
              </p>
              <p className="font-medium tabular-nums">
                {summary.volume > 0 ? `${Math.round(summary.volume)}kg` : "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.doneList}</p>
              <p className="font-medium tabular-nums">
                {summary.done.length}/{required.length}
              </p>
            </div>
          </div>
          {summary.skipped.length > 0 ? (
            <div className="text-start text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                {s.skippedList}
              </p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {summary.skipped.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <Button size="lg" className="min-h-[48px]" onClick={() => router.push("/client/home")}>
            {t.client.workout.finish}
          </Button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const videoId = extractYoutubeId(current.videoUrl ?? current.youtubeUrl ?? "")

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={s.exit}
            onClick={() => setExitOpen(true)}
          >
            <X className="size-5" />
          </Button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              {interpolate(s.exerciseXofY, {
                x: String(index + 1),
                y: String(exercises.length),
              })}
            </p>
            <Progress
              value={exercises.length ? (completedCount / required.length) * 100 : 0}
              className="mt-1 h-1.5"
            />
          </div>
          <ElapsedTimer startedAt={startedAt} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4">
        <div className="rounded-2xl border bg-card p-4">
          <h1 className="text-lg font-semibold leading-snug">
            {current.exerciseName}
          </h1>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg border p-2">
              <p className="text-xs text-muted-foreground">{t.client.workout.sets}</p>
              <p className="font-medium">{current.sets}</p>
            </div>
            <div className="rounded-lg border p-2">
              <p className="text-xs text-muted-foreground">{t.client.workout.reps}</p>
              <p className="font-medium">{current.reps}</p>
            </div>
            <div className="rounded-lg border p-2">
              <p className="text-xs text-muted-foreground">{t.client.workout.weight}</p>
              <p className="font-medium">
                {current.targetWeight ? `${current.targetWeight}kg` : "—"}
              </p>
            </div>
          </div>

          {lastTime[current.id] &&
          (lastTime[current.id]!.weightKg != null ||
            lastTime[current.id]!.reps != null) ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {s.lastTime}:{" "}
              <span className="font-medium text-foreground">
                {lastTime[current.id]!.weightKg != null
                  ? `${lastTime[current.id]!.weightKg}kg`
                  : "—"}
                {" × "}
                {lastTime[current.id]!.reps != null
                  ? lastTime[current.id]!.reps
                  : "—"}
              </span>
            </p>
          ) : null}

          {current.notes ? (
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {current.notes}
            </p>
          ) : null}
        </div>

        {videoId ? (
          <div className="overflow-hidden rounded-2xl border">
            {videoExpanded ? (
              <div className="relative" style={{ aspectRatio: "16/9" }}>
                <iframe
                  src={getEmbedUrl(videoId, { autoPlay: true })}
                  title={current.exerciseName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            ) : (
              <button
                type="button"
                className="group relative block w-full"
                onClick={() => setVideoExpanded(true)}
                aria-label={t.clients.watchExercise}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getThumbnailUrl(videoId)}
                  alt=""
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/30 transition-colors group-hover:bg-black/40">
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-glass">
                    <Play className="size-6 translate-x-[1px]" />
                  </span>
                </span>
              </button>
            )}
          </div>
        ) : null}

        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {t.client.workout.sets}
            </p>
            <div className="flex items-center gap-3 pe-1 text-[11px] text-muted-foreground">
              <span className="w-[76px] text-center">
                {t.client.workout.weight} (kg)
              </span>
              <span className="w-[64px] text-center">
                {t.client.workout.reps}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {ticks.map((checked, setIdx) => (
              <div
                key={setIdx}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-1.5 transition-colors",
                  checked
                    ? "border-emerald-600/60 bg-emerald-600/5 dark:border-emerald-500/60 dark:bg-emerald-500/10"
                    : "border-border"
                )}
              >
                <button
                  type="button"
                  aria-pressed={checked}
                  onClick={() => handleToggleSet(setIdx)}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    checked
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "bg-background hover:bg-accent"
                  )}
                >
                  {setIdx + 1}
                </button>
                <Input
                  type="number"
                  inputMode="decimal"
                  className="min-h-[44px] w-[76px] text-center"
                  value={forms[current.id]?.sets[setIdx]?.weightKg ?? ""}
                  onChange={(e) =>
                    handleSetFieldChange(current.id, setIdx, {
                      weightKg: e.target.value,
                    })
                  }
                  placeholder={
                    current.targetWeight ? String(current.targetWeight) : "0"
                  }
                  aria-label={`${t.client.workout.weight} ${setIdx + 1}`}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  className="min-h-[44px] w-[64px] text-center"
                  value={forms[current.id]?.sets[setIdx]?.reps ?? ""}
                  onChange={(e) =>
                    handleSetFieldChange(current.id, setIdx, {
                      reps: e.target.value,
                    })
                  }
                  placeholder={String(current.reps)}
                  aria-label={`${t.client.workout.reps} ${setIdx + 1}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            <label className="text-xs text-muted-foreground">
              {t.client.workout.addNote}
            </label>
            <Input
              inputMode="text"
              className="min-h-[44px]"
              value={forms[current.id]?.notes ?? ""}
              onChange={(e) =>
                handleNotesChange(current.id, e.target.value)
              }
              placeholder={t.client.workout.addNote}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="min-h-[48px]"
              disabled={index === 0 || savingId !== null}
              onClick={handlePrev}
            >
              <ChevronLeft className="size-4 rtl:-scale-x-100" />
              {s.previous}
            </Button>
            <Button
              variant="ghost"
              className="min-h-[48px]"
              disabled={savingId !== null}
              onClick={handleSkip}
            >
              {t.client.workout.skipExercise}
            </Button>
            <Button
              className="min-h-[48px] flex-1"
              disabled={savingId !== null}
              onClick={handleSaveAndNext}
            >
              {savingId === current.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {s.saveAndNext}
            </Button>
          </div>
        </div>
      </div>

      {restRemaining !== null && restRemaining > 0 ? (
        <div className="fixed inset-x-4 bottom-6 z-40 mx-auto flex max-w-sm items-center justify-between rounded-2xl border bg-popover/95 px-4 py-3 shadow-glass backdrop-blur">
          <div className="flex items-center gap-2">
            <Timer className="size-5 text-brand-600 dark:text-brand-400" />
            <span className="text-lg font-semibold tabular-nums">
              {formatClock(restRemaining)}
            </span>
            {nextUpName ? (
              <span className="ms-2 hidden max-w-[160px] truncate text-xs text-muted-foreground sm:inline">
                {s.upNext}: {nextUpName}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[36px]"
              onClick={() => setRestRemaining((v) => (v ?? 0) + 20)}
            >
              {s.add20s}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={s.skipRest}
              onClick={() => setRestRemaining(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{s.exitConfirmTitle}</DialogTitle>
            <DialogDescription>{s.exitConfirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitOpen(false)}>
              {s.stay}
            </Button>
            <Button variant="destructive" onClick={exitSession}>
              {s.leave}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
