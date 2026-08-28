const { chromium } = require("playwright")

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()

  const errors = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${msg.text()}`)
  })
  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.stack || err.message}`)
  })

  async function nav(label, url) {
    console.log(`\n=== ${label}: ${url} ===`)
    await page.goto(url, { waitUntil: "networkidle" })
    console.log("URL ->", page.url())
    if (errors.length) {
      console.log("ERRORS SO FAR:")
      console.log([...new Set(errors)].join("\n---\n"))
    }
  }

  // login
  await page.goto("http://localhost:3778/login", { waitUntil: "networkidle" })
  await page.fill('input[name="identifier"]', "nuttest_1")
  await page.fill('input[name="password"]', "test1234")
  await page.click('button[type="submit"]')
  try {
    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 20000 })
  } catch (e) {
    console.log("login redirect timeout; current URL:", page.url())
    await page.waitForTimeout(4000)
  }
  console.log("After login ->", page.url())
  console.log("page text snippet:", (await page.content()).slice(0, 300))

  await nav("Dashboard", "http://localhost:3778/dashboard")
  await nav("Clients list", "http://localhost:3778/clients")
  await nav("Client detail nutrition tab", "http://localhost:3778/clients/cm_test_invite_0001?tab=nutrition")
  await nav("Nutrition templates", "http://localhost:3778/nutrition-templates")
  await nav("New nutrition plan", "http://localhost:3778/clients/cm_test_invite_0001/nutrition/new")

  // Now test client-side navigation (Link clicks) which spur RSC flight requests
  console.log("\n=== Client-side nav: /clients -> client detail via <a> click ===")
  await page.goto("http://localhost:3778/clients", { waitUntil: "networkidle" })
  const clientLink = page.locator('a[href*="/clients/cm_test_invite_0001"]').first()
  if (await clientLink.count()) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      clientLink.click(),
    ])
    console.log("URL after click ->", page.url())
  } else {
    console.log("no client link found; current page text:", (await page.content()).slice(0, 500))
  }

  await page.screenshot({ path: "C:/Users/ADELAH~1/AppData/Local/Temp/opencode/probe/final.png", fullPage: true })

  console.log("\n\n===== FINAL CAPTURED ERRORS =====")
  if (errors.length === 0) console.log("NONE")
  else console.log([...new Set(errors)].join("\n---\n"))

  await browser.close()
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})