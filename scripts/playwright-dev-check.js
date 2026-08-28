const { chromium } = require("playwright")
const fs = require("fs")

async function main() {
  const token = fs.readFileSync("C:/Users/ADELAH~1/AppData/Local/Temp/opencode/tok2.txt", "utf8").trim()
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  await ctx.addCookies([{ name: "next-auth.session-token", value: token, url: "http://localhost:3777", httpOnly: true }])
  const page = await ctx.newPage()
  const errors = new Set()
  page.on("console", (m) => { if (m.type() === "error") errors.add(`[console] ${m.text().slice(0, 500)}`) })
  page.on("pageerror", (e) => errors.add(`[pageerror] ${(e.stack || e.message).slice(0, 800)}`))
  const all = new Set()
  function capture(label) {
    if (errors.size) { console.log(`${label} errors:`); for (const e of errors) { console.log("  " + e); all.add(e) } errors.clear() }
  }

  await page.goto("http://localhost:3777/clients", { waitUntil: "networkidle" })
  capture("clients list")

  const link = page.locator('a[href*="/clients/cm_test_invite_0001"]').first()
  if (await link.count()) {
    await link.click()
    await page.waitForTimeout(4000)
    console.log("clicked client ->", page.url())
    capture("client detail via click")
    // click nutrition tab
    const nutrl = page.locator('[role="tab"]', { hasText: "Nutrition" }).first()
    if (await nutrl.count()) { await nutrl.click(); await page.waitForTimeout(3000); capture("nutrition tab") }
  }

  await page.goto("http://localhost:3777/clients/cm_test_invite_0001?tab=nutrition", { waitUntil: "networkidle" })
  capture("nutrition page load")

  await page.goto("http://localhost:3777/clients/cm_test_invite_0001/nutrition/new", { waitUntil: "networkidle" })
  capture("new plan page")

  // edit page with real plan
  await page.goto("http://localhost:3777/clients/cm_test_invite_0001/nutrition/cmshb05iq0002iku4ht1apkhk", { waitUntil: "networkidle" })
  capture("edit plan page")

  console.log("\n===== ALL =====")
  console.log(all.size ? [...all].join("\n----\n") : "NONE")
  await browser.close()
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1) })