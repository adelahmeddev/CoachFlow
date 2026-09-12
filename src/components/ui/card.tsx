import * as React from "react"
import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" | "lg"; interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex min-w-0 flex-col gap-(--card-spacing) rounded-[var(--radius-lg)] glass-card text-sm break-words text-card-foreground shadow-soft ring-1 ring-inset ring-black/[0.03] transition-[transform,box-shadow,border-color] duration-200 [--card-spacing:--spacing(4)] [overflow-wrap:anywhere] dark:ring-white/[0.04]",
        interactive && "hover:shadow-card-hover hover:-translate-y-0.5 card-lift",
        "motion-reduce:transition-none motion-reduce:hover:transform-none",
        "has-data-[slot=card-footer]:pb-0",
        "has-[>img:first-child]:pt-0",
        "*:[img:first-child]:rounded-t-[var(--radius-lg)]",
        "*:[img:last-child]:rounded-b-[var(--radius-lg)]",
        "data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0",
        "data-[size=lg]:[--card-spacing:--spacing(6)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid min-w-0 auto-rows-min items-start gap-1 rounded-t-[var(--radius-lg)] px-(--card-spacing) pt-(--card-spacing) break-words [overflow-wrap:anywhere] has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "min-w-0 font-heading text-[0.9375rem] leading-snug font-bold break-words [overflow-wrap:anywhere] text-pretty group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("min-w-0 text-sm break-words text-muted-foreground [overflow-wrap:anywhere]", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("min-w-0 px-(--card-spacing) pb-(--card-spacing) break-words [overflow-wrap:anywhere]", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2 rounded-b-[var(--radius-lg)] border-t border-border/60 p-(--card-spacing) break-words [overflow-wrap:anywhere]",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
