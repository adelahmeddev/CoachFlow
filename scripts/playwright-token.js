const { chromium } = require("playwright")
const fs = require("fs")

async function main() {
  const token = fs.readFileSync("C:/Users/ADELAH~1/AppData/Local/Temp/opencode/tok2.txt", "utf8").trim()

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  await ctx.addCookies([{
    name: "next-auth.session-token",
    value: token,
    url: "http://localhost:3778",
    httpOnly: true,
  }])
  const page = await ctx.newPage()

  const errors = new Set()
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.add(`[console] ${msg.text()}`)
  })
  page.on("pageerror", (err) => {
    errors.add(`[pageerror] ${err.stack || err.message}`)
  })

  async function nav(label, url) {
    console.log(`\n=== ${label}: ${url} ===`)
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 })
    } catch (e) {
      console.log("goto failed:", e.message.split("\n")[0])
    }
    console.log("URL ->", page.url())
    console.log("title:", await page.title())
    if (errors.size) {
      console.log("NEW CAPTURED ERRORS:")
      console.log([...errors].join("\n---\n"))
      errors.clear()
    }
  }

  await nav("Dashboard", "http://localhost:3778/dashboard")
  await nav("Clients list", "http://localhost:3778/clients")
  await nav("Client detail nutrition tab", "http://localhost:3778/clients/cm_test_invite_0001?tab=nutrition")
  await nav("Nutrition templates", "http://localhost:3778/nutrition-templates")
  await nav("New nutrition plan", "http://localhost:3778/clients/cm_test_invite_0001/nutrition/new")

  // client-side navigation via <a> click (triggers RSC flight)
  console.log("\n=== Client-side nav from /clients ===")
  await nav("Clients (nav entry)", "http://localhost:3778/clients")
  const link = page.locator('a[href*="/clients/cm_test_invite_0001"]').first()
  const cnt = await link.count()
  console.log("client links found:", cnt)
  if (cnt) {
    await link.click()
    await page.waitForTimeout(5000)
    console.log("URL after click ->", page.url())
    if (errors.size) {
      console.log("CAPTURED ERRORS AFTER CLICK:")
      console.log([...errors].join("\n---\n"))
      errors.clear()
    }
  }

  await page.screenshot({ path: "C:/Users/ADELAH~1/AppData/Local/Temp/opencode/probe/token-tour.png", fullPage: true })
  console.log("\nDONE")
  await browser.close()
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})