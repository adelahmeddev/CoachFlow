"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global application error:", error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <RefreshCw className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">حدث خطأ غير متوقع في النظام</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              نعتذر عن هذا الخطأ المؤقت. يمكنك الضغط على الزر أدناه لإعادة تحميل التطبيق بأمان.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <RefreshCw className="size-3.5" />
            <span>إعادة المحاولة / Reload</span>
          </button>
        </div>
      </body>
    </html>
  )
}
