import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex min-h-5 h-auto w-fit max-w-full shrink-0 items-center justify-center gap-1 rounded-full border border-border/60 px-2.5 py-0.5 text-xs font-medium whitespace-normal break-words text-center [overflow-wrap:anywhere] transition-[color,background-color,border-color] duration-200 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3! [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-600/90 backdrop-blur-md text-white font-medium shadow-soft [a]:hover:bg-brand-500 dark:bg-brand-500/90 dark:[a]:hover:bg-brand-400",
        secondary:
          "glass-chip text-foreground",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:text-destructive [a]:hover:bg-destructive/20",
        outline:
          "glass-chip border-border/80 text-foreground [a]:hover:bg-muted dark:border-border dark:text-foreground",
        ghost:
          "bg-transparent hover:bg-muted/50 hover:text-foreground dark:hover:bg-muted/50",
        glass:
          "glass-chip text-foreground",
        link: "text-brand-700 underline-offset-4 hover:underline dark:text-brand-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }