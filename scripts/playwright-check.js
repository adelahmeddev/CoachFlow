const { chromium } = require("playwright")
const fs = require("fs")

async function main() {
  const token = fs.readFileSync("C:/Users/ADELAH~1/AppData/Local/Temp/opencode/tok2.txt", "utf8").trim()
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  await ctx.addCookies([{ name: "next-auth.session-token", value: token, url: "http://localhost:3778", httpOnly: true }])
  const page = await ctx.newPage()
  const errors = new Set()
  page.on("console", (m) => { if (m.type() === "error") errors.add(`[console] ${m.text()}`) })
  page.on("pageerror", (e) => errors.add(`[pageerror] ${e.stack || e.message}`))

  for (const [label, url] of [
    ["Jane detail", "http://localhost:3778/clients/cm_test_invite_0001?tab=nutrition"],
    ["adel detail", "http://localhost:3778/clients/cmshed8wk0000x8u4xtd3y0qy?tab=nutrition"],
    ["adel detail default", "http://localhost:3778/clients/cmshed8wk0000x8u4xtd3y0qy"],
  ]) {
    console.log(`\n=== ${label} ===`)
    await page.goto(url, { waitUntil: "networkidle" })
    const text = await page.locator("body").innerText()
    console.log("URL:", page.url())
    console.log("has 'Nutrition':", text.includes("Nutrition"))
    console.log("has 'New Nutrition Plan':", text.includes("New Nutrition Plan"))
    console.log("has 'Active':", text.includes("Active"))
    console.log("has 'kcal':", text.toLowerCase().includes("kcal"))
    console.log("has 'No nutrition':", text.includes("no nutrition plan") || text.includes("No nutrition"))
    console.log("has 'Error':", text.includes("Application error") || text.includes("Internal Server Error"))
    if (errors.size) {
      console.log("ERRORS:")
      console.log([...new Set(errors)].join("\n---\n"))
      errors.clear()
    }
    const snippet = text.split("\n").map(s => s.trim()).filter(Boolean).slice(-12).join(" | ")
    console.log("tail:", snippet.slice(0, 400))
  }
  await browser.close()
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1) })