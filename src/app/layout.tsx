import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_Arabic, Alexandria } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { getI18n } from "@/lib/i18n"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
})

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const display = Alexandria({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Coach Flow",
    template: "%s · Coach Flow",
  },
  description: "نظام إدارة المدرب الشخصي",
  applicationName: "Coach Flow",
  manifest: "/brand/manifest.json",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Coach Flow",
    statusBarStyle: "black-translucent",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coach Flow",
    description: "نظام إدارة المدرب الشخصي",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale, dir, t } = await getI18n()

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${arabic.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only z-50 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {t.common.skipToContent ?? "تخطي إلى المحتوى"}
        </a>
        <Providers locale={locale} dictionary={t}>
          {children}
        </Providers>
      </body>
    </html>
  )
}