/**
 * WhatsApp helpers: Egyptian phone normalization, template interpolation,
 * and wa.me URL construction (client-safe, no dependencies).
 */

/**
 * Normalizes Egyptian and international phone numbers into clean WhatsApp digits.
 * "01012345678" -> "201012345678"
 * "+20 10 1234 5678" -> "201012345678"
 * "00201012345678" -> "201012345678"
 */
export function normalizeEgyptianPhone(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, "")

  if (cleaned.startsWith("0020")) {
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "20" + cleaned.slice(1)
  } else if (cleaned.length === 10 && cleaned.startsWith("1")) {
    cleaned = "20" + cleaned
  }

  return cleaned
}

export interface TemplateVariables {
  coach_name: string
  end_date: string
  days_left: number | string
}

export function interpolateTemplate(
  template: string,
  vars: TemplateVariables
): string {
  return template
    .replace(/{coach_name}/g, vars.coach_name)
    .replace(/{end_date}/g, vars.end_date)
    .replace(/{days_left}/g, String(vars.days_left))
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const normalized = normalizeEgyptianPhone(phone)
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text.trim())}`
}
