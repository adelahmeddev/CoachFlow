export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(date))
}

export function calcAge(birthDate: Date | null | undefined): number | null {
  if (!birthDate) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return age
}
