const { chromium } = require("playwright")
const fs = require("fs")

async function main() {
  const token = fs.readFileSync("C:/Users/ADELAH~1/AppData/Local/Temp/opencode/tok2.txt", "utf8").trim()
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  await ctx.addCookies([{ name: "next-auth.session-token", value: token, url: "http://localhost:3778", httpOnly: true }])
  const page = await ctx.newPage()
  const errors = new Set()
  page.on("console", (m) => { if (m.type() === "error") errors.add(`[console] ${m.text().slice(0, 300)}`) })
  page.on("pageerror", (e) => errors.add(`[pageerror] ${(e.stack || e.message).slice(0, 600)}`))
  const all = new Set()
  function capture(label) {
    if (errors.size) {
      console.log(`${label} ERROR CAPTURE:`)
      for (const e of errors) { console.log("  " + e); all.add(e) }
      errors.clear()
    }
  }

  // 1. Dashboard: click through anything interactive
  await page.goto("http://localhost:3778/dashboard", { waitUntil: "networkidle" })
  capture("dashboard load")

  // 2. Client detail: click each tab triggers RSC replace
  await page.goto("http://localhost:3778/clients/cm_test_invite_0001", { waitUntil: "networkidle" })
  capture("detail load")
  const tabs = page.locator('[role="tab"]')
  const tabCount = await tabs.count()
  console.log("tab count:", tabCount)
  for (let i = 0; i < tabCount; i++) {
    const label = (await tabs.nth(i).innerText()).trim()
    await tabs.nth(i).click()
    await page.waitForTimeout(2500)
    console.log(`  clicked tab[${i}] "${label}" -> URL ${page.url()}`)
    capture(`tab ${label}`)
  }

  // 3. Templates: open dialog, cancel
  await page.goto("http://localhost:3778/nutrition-templates", { waitUntil: "networkidle" })
  capture("templates load")
  const openTpl = page.locator('button:has-text("New Template")').first()
  if (await openTpl.count()) {
    await openTpl.click()
    await page.waitForTimeout(1500)
    capture("dialog open")
    // fill + submit
    const dlg = page.locator('[role="dialog"]')
    if (await dlg.count()) {
      await dlg.locator('input[name="name"]').fill("Auto Delete Test")
      await dlg.locator('button[type="submit"]').first().click()
      await page.waitForTimeout(4000)
      capture("dialog submit")
      console.log("After template submit URL:", page.url())
    }
  }

  // 4. go to detail and click the edit link for a plan (RSC nav to edit page)
  await page.goto("http://localhost:3778/clients/cm_test_invite_0001?tab=nutrition", { waitUntil: "networkidle" })
  capture("detail nutrition load")
  const editLink = page.locator('a[href*="/nutrition/"]').first()
  if (await editLink.count()) {
    await editLink.click()
    await page.waitForTimeout(4000)
    console.log("-> edit URL:", page.url())
    capture("edit plan nav")
  }

  console.log("\n===== ALL CAPTURED ERRORS =====")
  console.log(all.size ? [...all].join("\n---\n") : "NONE")
  await browser.close()
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1) })