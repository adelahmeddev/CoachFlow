const { chromium } = require("playwright")

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  console.log("URL:", page.url())
  const identifier = await page.locator('input[name="identifier"]').count()
  const emailInput = await page.locator('input[type="email"], input[name="email"]').count()
  console.log("identifier fields:", identifier, emailInput)
  if (identifier > 0) {
    await page.fill('input[name="identifier"]', "nuttest")
  } else {
    await page.fill('input[type="email"], input[name="email"]', "nuttest")
  }
  await page.fill('input[name="password"]', "test1234")
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 15000 })
  const cookies = await ctx.cookies()
  const session = cookies.find((c) => c.name.includes("session-token"))
  if (!session) {
    console.error("NO SESSION COOKIE")
    process.exit(1)
  }
  console.log(session.name + "=" + session.value)
  await browser.close()
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
