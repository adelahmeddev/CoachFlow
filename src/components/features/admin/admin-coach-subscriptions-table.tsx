"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS } from "@/lib/constants"
import { CoachSubscriptionStatus } from "@/lib/db/enums"
import { formatDate } from "@/lib/i18n/format"
import { adminExtendCoachSubscriptionAction, adminSetCoachSubscriptionStatusAction } from "@/server/actions/admin"

type Row = {
  id: string
  coachId: string
  status: string
  startDate: string | Date
  endDate: string | Date
  amountPaid: string | number
  paymentDate: string | Date
  coachName: string
  coachPhone: string
}

function daysRemaining(endDate: string | Date): string {
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return "Expired"
  if (diff === 1) return "1 day"
  if (diff <= 7) return `${diff} days`
  return `${diff} days`
}

export function AdminCoachSubscriptionsTable({ subscriptions }: { subscriptions: Row[] }) {
  if (subscriptions.length === 0) return <div className="py-10 text-center text-sm text-muted-foreground">No subscriptions</div>

  return (
    <>
      <div className="space-y-3 md:hidden p-3">
        {subscriptions.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-medium truncate">{s.coachName}</span>
              <Badge variant={COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS[s.status as CoachSubscriptionStatus] ?? "outline"}>{s.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Expires {formatDate(s.endDate as string, "en")} · {daysRemaining(s.endDate)}</p>
            <p className="text-sm">{String(s.amountPaid)} EGP · Paid {formatDate(s.paymentDate as string, "en")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminSubActions sub={s} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.coachName}</div>
                  <div className="text-xs text-muted-foreground">{s.coachPhone}</div>
                </TableCell>
                <TableCell><Badge variant={COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS[s.status as CoachSubscriptionStatus] ?? "outline"}>{s.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(s.startDate as string, "en")}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(s.endDate as string, "en")}</TableCell>
                <TableCell className="text-xs">{daysRemaining(s.endDate)}</TableCell>
                <TableCell>{String(s.amountPaid)} EGP</TableCell>
                <TableCell><AdminSubActions sub={s} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function AdminSubActions({ sub }: { sub: Row }) {
  const [pending, startTransition] = useTransition()
  const [days, setDays] = useState("30")
  const [customDays, setCustomDays] = useState("30")
  const [amount, setAmount] = useState(String(sub.amountPaid))
  const [status, setStatus] = useState<string>(sub.status)

  return (
    <div className="flex flex-wrap gap-1 items-center">
      <Dialog>
        <DialogTrigger asChild><Button size="sm" variant="outline" disabled={pending}>Extend</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Extend subscription</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current expiration: {formatDate(sub.endDate as string, "en")}</p>
            <div className="flex gap-2 flex-wrap">
              {[7,15,30,60,90].map(d => (
                <Button key={d} variant={days===String(d)?"default":"outline"} size="sm" onClick={()=> setDays(String(d))}>{d} days</Button>
              ))}
              <Button variant={days==="custom"?"default":"outline"} size="sm" onClick={()=> setDays("custom")}>Custom</Button>
            </div>
            {days==="custom" && <Input type="number" value={customDays} onChange={e=> setCustomDays(e.target.value)} placeholder="Days" />}
            <Input type="number" value={amount} onChange={e=> setAmount(e.target.value)} placeholder="Amount Paid" />
            <Button disabled={pending} onClick={()=> startTransition(async()=>{
              const d = days==="custom" ? Number(customDays) : Number(days)
              const res = await adminExtendCoachSubscriptionAction(sub.coachId, d, { amountPaid: Number(amount) })
              if (res.ok) toast.success(`Extended by ${d} days`)
              else toast.error(res.error)
            })}>Extend</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
          <SelectItem value="EXPIRED">EXPIRED</SelectItem>
          <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" disabled={pending || status===sub.status} onClick={()=> startTransition(async()=>{
        const res = await adminSetCoachSubscriptionStatusAction(sub.coachId, status)
        if (res.ok) toast.success("Status updated")
        else toast.error(res.error)
      })}>Set</Button>

      <Button size="sm" variant="ghost" asChild><a href={`/admin/trainers/${sub.coachId}`}>View</a></Button>
    </div>
  )
}
