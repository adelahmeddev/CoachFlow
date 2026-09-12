"use client"

import { useBranding } from "@/components/branding/branding-provider"
import { cn } from "@/lib/utils"

const WhatsappIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
    <path d="M14 14a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1Z" />
    <path d="M9.5 8c0 1.5.5 3 1.5 4s2.5 1.5 4 1.5" />
  </svg>
)
const FacebookIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)
const InstagramIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

/**
 * Coach contact row for the bottom of client portal pages. Renders only the
 * configured profiles; hidden entirely when the coach set no social links.
 */
export function CoachSocialFooter({ className }: { className?: string }) {
  // Outside a BrandingProvider this yields the default context (all links
  // null), which renders nothing — no try/catch needed.
  const branding = useBranding()
  const links = [
    branding.whatsappUrl ? { href: branding.whatsappUrl, label: "WhatsApp", Icon: WhatsappIcon } : null,
    branding.facebookUrl ? { href: branding.facebookUrl, label: "Facebook", Icon: FacebookIcon } : null,
    branding.instagramUrl ? { href: branding.instagramUrl, label: "Instagram", Icon: InstagramIcon } : null,
  ].filter((l): l is { href: string; label: string; Icon: (p: React.ComponentProps<"svg">) => React.JSX.Element } => l !== null)
  if (links.length === 0) return null

  return (
    <div className={cn("flex items-center justify-center gap-2", className)} role="contentinfo" aria-label="Coach contact">
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground ring-1 ring-border/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="size-4" aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}
