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
  const all = []

  async function show(label) {
    if (errors.size) {
      console.log(`${label} ERRORS:`)
      for (const e of new Set(errors)) console.log("  " + e)
      all.push(...errors)
      errors.clear()
    }
  }

  // --- Create a NEW PLAN via /nutrition/new ---
  console.log("\n=== CREATE PLAN build ===")
  await page.goto("http://localhost:3778/clients/cm_test_invite_0001/nutrition/new", { waitUntil: "networkidle" })
  const hasName = await page.locator('input[name="name"], input[placeholder*="Plan"]').count()
  console.log("plan name field:", hasName)
  // find form fields
  for (const sel of ['input[name="name"]', 'input[name="calories"]', 'input[name="startDate"]', 'button[type="submit"]']) {
    console.log(`  ${sel} count:`, await page.locator(sel).count())
  }
  await show("new-plan page")

  // try to submit a minimal valid plan
  const submit = page.locator('button[type="submit"]').first()
  if (await submit.count()) {
    if (await page.locator('input[name="name"]').count()) await page.locator('input[name="name"]').fill("PW Plan")
    if (await page.locator('input[name="startDate"]').count()) await page.locator('input[name="startDate"]').fill("2026-08-15")
    await submit.click()
    await page.waitForTimeout(6000)
    console.log("after create submit ->", page.url())
    await show("create submit")
  }

  // --- Open dialog on templates, fill, submit ---
  console.log("\n=== template create build ===")
  await page.goto("http://localhost:3778/nutrition-templates", { waitUntil: "networkidle" })
  const trig = page.locator('button:has-text("New Template"), a:has-text("New Template")').first()
  const tc = await trig.count()
  console.log("trigger count:", tc)
  if (tc) {
    await trig.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: "C:/Users/ADELAH~1/AppData/Local/Temp/opencode/probe/tpl-dialog.png" })
    const diag = page.locator('[role="dialog"]')
    console.log("dialog present:", await diag.count())
    for (const sel of ['input[name="name"]', 'input[name="calories"]', 'button[type="submit"]']) {
      console.log(`dialog ${sel}:`, await diag.locator(sel).count())
    }
    if (await diag.locator('input[name="name"]').count()) {
      await diag.locator('input[name="name"]').fill("PW Template")
      await diag.locator('button[type="submit"]').first().click()
      await page.waitForTimeout(5000)
      await show("template create submit")
    }
  }

  await page.screenshot({ path: "C:/Users/ADELAH~1/AppData/Local/Temp/opencode/probe/after-actions.png", fullPage: true })
  console.log("\nALL ERRORS CAPTURED:")
  console.log(all.length ? [...new Set(all)].join("\n---\n") : "NONE")
  await browser.close()
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1) })