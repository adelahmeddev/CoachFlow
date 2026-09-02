"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS } from "@/lib/constants"
import { CoachSubscriptionStatus } from "@/lib/db/enums"
import { formatDate } from "@/lib/i18n/format"
import { adminSetCoachSubscriptionAction, adminExtendCoachSubscriptionAction, adminSetCoachSubscriptionStatusAction } from "@/server/actions/admin"

type Sub = {
  id: string
  coachId: string
  startDate: string | Date
  endDate: string | Date
  amountPaid: string | number
  paymentDate: string | Date
  status: string
  notes: string | null
} | null

type PaymentRecord = {
  id: string
  amount: string | number
  paymentDate: string | Date
  notes: string | null
  createdAt: string | Date
}

function calcEnd(start: string, days: number): string {
  const d = new Date(start)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function remainingLabel(endDate: string | Date): string {
  const end = new Date(endDate)
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return diff === 0 ? "Expires today" : "Expired"
  if (diff === 1) return "1 day remaining"
  return `${diff} days remaining`
}

export function AdminCoachSubscriptionForm({
  coachId,
  subscription,
  payments,
}: {
  coachId: string
  subscription: Sub
  payments: PaymentRecord[]
}) {
  const [pending, startTransition] = useTransition()

  const [startDate, setStartDate] = useState(() => {
    if (subscription) return new Date(subscription.startDate).toISOString().split("T")[0]
    return new Date().toISOString().split("T")[0]
  })
  const [duration, setDuration] = useState("30")
  const [customDays, setCustomDays] = useState("30")
  const [customEnd, setCustomEnd] = useState("")
  const [amount, setAmount] = useState(subscription ? String(subscription.amountPaid) : "500")
  const [paymentDate, setPaymentDate] = useState(() => {
    if (subscription) return new Date(subscription.paymentDate).toISOString().split("T")[0]
    return new Date().toISOString().split("T")[0]
  })
  const [notes, setNotes] = useState(subscription?.notes ?? "")

  const days = duration === "custom" ? (customEnd ? null : Number(customDays)) : Number(duration)
  const endDate = duration === "custom" && customEnd ? customEnd : days ? calcEnd(startDate, days) : ""

  const [extendDays, setExtendDays] = useState("30")
  const [extendCustom, setExtendCustom] = useState("30")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Subscription
            {subscription && <Badge variant={COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS[subscription.status as CoachSubscriptionStatus] ?? "outline"}>{subscription.status}</Badge>}
          </CardTitle>
          <CardDescription>
            {subscription ? (
              <>
                {formatDate(subscription.startDate as string, "en")} → {formatDate(subscription.endDate as string, "en")} · {remainingLabel(subscription.endDate)}
                {" · "}{String(subscription.amountPaid)} EGP
              </>
            ) : (
              "No subscription yet — create one below"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Duration picker */}
          <div className="space-y-2">
            <Label>Subscription Duration</Label>
            <div className="flex flex-wrap gap-2">
              {[7,15,30,60,90].map(d => (
                <Button key={d} type="button" variant={duration===String(d)?"default":"outline"} size="sm" onClick={()=> setDuration(String(d))}>{d} days</Button>
              ))}
              <Button type="button" variant={duration==="custom"?"default":"outline"} size="sm" onClick={()=> setDuration("custom")}>Custom</Button>
            </div>
          </div>

          {duration==="custom" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Custom days (or pick end date)</Label>
                <Input type="number" value={customDays} onChange={e=> setCustomDays(e.target.value)} placeholder="30" />
              </div>
              <div className="space-y-1">
                <Label>Exact end date (overrides days)</Label>
                <Input type="date" value={customEnd} onChange={e=> setCustomEnd(e.target.value)} />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e=> setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date (auto)</Label>
              <Input type="date" value={endDate} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Amount Paid (EGP)</Label>
              <Input type="number" value={amount} onChange={e=> setAmount(e.target.value)} placeholder="500" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Payment Date</Label>
              <Input type="date" value={paymentDate} onChange={e=> setPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e=> setNotes(e.target.value)} placeholder="Monthly subscription" rows={2} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button disabled={pending} onClick={()=> startTransition(async()=>{
              const payload: Record<string, unknown> = {
                startDate,
                amountPaid: Number(amount),
                paymentDate,
                notes: notes || null,
              }
              if (duration==="custom" && customEnd) payload.endDate = customEnd
              else payload.durationDays = days
              const res = await adminSetCoachSubscriptionAction(coachId, payload)
              if (res.ok) toast.success("Subscription saved")
              else toast.error(res.error)
            })}>
              {subscription ? "Update Subscription" : "Create Subscription"}
            </Button>
            {subscription && subscription.status !== "SUSPENDED" && (
              <Button variant="destructive" disabled={pending} onClick={()=> startTransition(async()=>{
                const res = await adminSetCoachSubscriptionStatusAction(coachId, "SUSPENDED")
                if (res.ok) toast.success("Suspended")
                else toast.error(res.error)
              })}>Suspend</Button>
            )}
            {subscription && subscription.status === "SUSPENDED" && (
              <Button variant="outline" disabled={pending} onClick={()=> startTransition(async()=>{
                const res = await adminSetCoachSubscriptionStatusAction(coachId, "ACTIVE")
                if (res.ok) toast.success("Activated")
                else toast.error(res.error)
              })}>Activate</Button>
            )}
          </div>

          {/* Extend quick section */}
          {subscription && (
            <div className="border-t pt-4 space-y-2">
              <Label>Extend Subscription</Label>
              <p className="text-xs text-muted-foreground">Current expiration: {formatDate(subscription.endDate as string, "en")}</p>
              <div className="flex flex-wrap gap-2 items-center">
                {[7,15,30,60,90].map(d => (
                  <Button key={d} variant={extendDays===String(d)?"default":"outline"} size="sm" onClick={()=> setExtendDays(String(d))}>{d} days</Button>
                ))}
                <Button variant={extendDays==="custom"?"default":"outline"} size="sm" onClick={()=> setExtendDays("custom")}>Custom</Button>
                {extendDays==="custom" && <Input className="w-20" type="number" value={extendCustom} onChange={e=> setExtendCustom(e.target.value)} />}
                <Button size="sm" disabled={pending} onClick={()=> startTransition(async()=>{
                  const d = extendDays==="custom" ? Number(extendCustom) : Number(extendDays)
                  const res = await adminExtendCoachSubscriptionAction(coachId, d)
                  if (res.ok) toast.success(`Extended by ${d} days`)
                  else toast.error(res.error)
                })}>Extend</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle><CardDescription>Manual records of money received</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {payments.map(p=> (
              <div key={p.id} className="flex justify-between border-b py-2 last:border-0 text-sm">
                <div>
                  <div className="font-medium">{formatDate(p.paymentDate as string, "en")} · {String(p.amount)} EGP</div>
                  {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(p.createdAt as string, "en")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
