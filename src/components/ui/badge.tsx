import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-200 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-brand-600 to-brand-700 text-white font-medium shadow-soft [a]:hover:brightness-110 dark:from-brand-500 dark:to-brand-600",
        secondary:
          "bg-white/60 text-foreground shadow-soft [a]:hover:bg-white/80 dark:bg-white/10 dark:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:text-destructive [a]:hover:bg-destructive/20",
        outline:
          "border-white/40 bg-white/40 text-foreground [a]:hover:bg-white/60 [a]:hover:text-foreground dark:text-foreground",
        ghost:
          "bg-transparent hover:bg-white/60 hover:text-foreground dark:hover:bg-muted/50",
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