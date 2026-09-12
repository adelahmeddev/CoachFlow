/**
 * Safe mobile haptic feedback wrapper using Navigator.vibrate.
 * Gracefully no-ops in unsupported browsers or non-touch environments.
 */
export const haptics = {
  /** Light tick for tab switches, segmented pickers, and filter pills */
  selection: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(6)
      } catch {
        // Ignore browser permissions errors
      }
    }
  },

  /** Medium impact for set logging, weight entry, button clicks */
  impact: (style: "light" | "medium" | "heavy" = "medium") => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        const duration = style === "light" ? 8 : style === "medium" ? 14 : 22
        navigator.vibrate(duration)
      } catch {
        // Ignore browser permissions errors
      }
    }
  },

  /** Celebratory pattern for workout completion or daily check-in */
  success: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([10, 40, 18])
      } catch {
        // Ignore browser permissions errors
      }
    }
  },
}
