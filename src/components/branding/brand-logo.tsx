"use client"

import { useBranding } from "./branding-provider"

export function BrandLogo({ size = 32, className }: { size?: number; className?: string }) {
  const { logoUrl, brandName } = useBranding()
  if (logoUrl) {
    return <img src={logoUrl} alt={brandName} width={size} height={size} className={className ?? "rounded-md object-contain"} style={{ width: size, height: size }} />
  }
  // Default CoachFlow logo fallback — simple inline
  return (
    <div className={className ?? "rounded-md bg-[var(--brand-primary)] text-white grid place-items-center font-bold"} style={{ width: size, height: size, background: "var(--brand-primary)" }}>
      CF
    </div>
  )
}
