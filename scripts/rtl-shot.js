const { chromium } = require("playwright")
const fs = require("fs")

const outDir = "C:\\Users\\ADELAH~1\\AppData\\Local\\Temp\\opencode"

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  const errors = []
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text())
  })

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  await page.fill('input[name="identifier"]', "nuttest")
  await page.fill('input[name="password"]', "test1234")
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 15000 })

  await page.context().addCookies([
    { name: "locale", value: "ar", domain: "localhost", path: "/" },
  ])
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" })
  const dir = await page.evaluate(() => document.documentElement.dir)
  console.log("dashboard dir:", dir, "| lang:", await page.evaluate(() => document.documentElement.lang))
  await page.screenshot({ path: outDir + "\\shot-dashboard-ar.png", fullPage: false })
  await page.setViewportSize({ width: 900, height: 800 })
  await page.screenshot({ path: outDir + "\\shot-dashboard-ar-mobile.png", fullPage: true })
  await page.setViewportSize({ width: 1440, height: 900 })

  const { chromium: chr } = require("playwright")
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx2.addCookies([{ name: "locale", value: "ar", domain: "localhost", path: "/" }])
  const page2 = await ctx2.newPage()
  page2.on("pageerror", (e) => errors.push("pageerror: " + e.message))
  await page2.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  const dir2 = await page2.evaluate(() => document.documentElement.dir)
  console.log("login dir:", dir2, "| lang:", await page2.evaluate(() => document.documentElement.lang))
  await page2.screenshot({ path: outDir + "\\shot-login-ar.png" })

  console.log("errors:", errors.length ? errors : "none")
  await browser.close()
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
