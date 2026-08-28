import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/i18n/format"
import { getI18n } from "@/lib/i18n"

type Entry = {
  date: string | Date
  weightKg: number | null
  muscleMassKg: number | null
  bodyFatKg: number | null
  bodyWaterPct: number | null
  fatControlKg: number | null
  bmrKcal: number | null
  fitnessScore: number | null
  waistHipRatio: number | null
  visceralFatLevel: number | null
}

const FIELDS: { key: keyof Entry; labelAr: string; labelEn: string; unit: string }[] = [
  { key: "weightKg", labelAr: "الوزن", labelEn: "WEIGHT", unit: "kg" },
  { key: "muscleMassKg", labelAr: "الكتلة العضلية", labelEn: "MUSCLE", unit: "kg" },
  { key: "bodyFatKg", labelAr: "دهون الجسم", labelEn: "BODY FAT", unit: "kg" },
  { key: "bodyWaterPct", labelAr: "نسبة المياه %", labelEn: "WATER %", unit: "%" },
  { key: "fatControlKg", labelAr: "التحكم دهون", labelEn: "FAT CTRL", unit: "kg" },
  { key: "bmrKcal", labelAr: "BMR", labelEn: "BMR", unit: "kcal" },
  { key: "fitnessScore", labelAr: "مؤشر اللياقة", labelEn: "FITNESS", unit: "" },
  { key: "waistHipRatio", labelAr: "WHR", labelEn: "WHR", unit: "" },
  { key: "visceralFatLevel", labelAr: "الدهون الحشوية", labelEn: "VISCERAL", unit: "" },
]

function deltaLabel(d: number | null): string {
  if (d === null) return "—"
  const sign = d > 0 ? "+" : ""
  return `${sign}${d}`
}

export async function BodyCompositionComparison({ entries }: { entries: Entry[] }) {
  const { t, locale } = await getI18n()
  if (entries.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {entries.length === 0 ? "No data for comparison" : "Need at least 2 InBody records for comparison"}
        </CardContent>
      </Card>
    )
  }
  const latest = entries[0]
  const previous = entries[1]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">المقارنة — آخر تحليلين | Latest 2 Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 text-start font-medium">المقياس | Metric</th>
                <th className="py-2 text-start font-medium">{formatDate(previous.date as never, locale)}</th>
                <th className="py-2 text-start font-medium">{formatDate(latest.date as never, locale)}</th>
                <th className="py-2 text-start font-medium">التغيير | Change</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => {
                const prev = previous[f.key] as number | null
                const curr = latest[f.key] as number | null
                const d = curr != null && prev != null ? +(curr - prev).toFixed(2) : null
                const isPositiveGood = f.key === "muscleMassKg" || f.key === "fitnessScore" || f.key === "bodyWaterPct"
                const isNegativeGood = f.key === "bodyFatKg" || f.key === "weightKg" || f.key === "visceralFatLevel" || f.key === "waistHipRatio"
                let color = "text-muted-foreground"
                if (d !== null && d !== 0) {
                  if (isPositiveGood) color = d > 0 ? "text-emerald-600" : "text-rose-600"
                  else if (isNegativeGood) color = d < 0 ? "text-emerald-600" : "text-rose-600"
                  else color = d > 0 ? "text-emerald-600" : "text-rose-600"
                }
                return (
                  <tr key={f.key} className="border-b last:border-0">
                    <td className="py-2 font-medium">{f.labelAr} | {f.labelEn}</td>
                    <td className="py-2">{prev ?? "—"} {prev != null ? f.unit : ""}</td>
                    <td className="py-2">{curr ?? "—"} {curr != null ? f.unit : ""}</td>
                    <td className={`py-2 font-medium ${color}`}>{deltaLabel(d)} {d != null ? f.unit : ""}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
