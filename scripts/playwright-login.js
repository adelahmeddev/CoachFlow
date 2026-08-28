const { chromium } = require("playwright")
const fs = require("fs")

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  const consoleErrors = []
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  page.on("pageerror", (err) => {
    consoleErrors.push(`[pageerror] ${err.stack || err.message}`)
  })

  // 1. Login via UI
  console.log("--- navigating to /login ---")
  await page.goto("http://localhost:3778/login", { waitUntil: "networkidle" })
  console.log("URL after load:", page.url())
  await page.screenshot({ path: "C:/Users/ADELAH~1/AppData/Local/Temp/opencode/probe/login.png" })

  console.log("--- current console errors ---")
  console.log(consoleErrors.slice().join("\n"))

  const html = await page.content()
  console.log("has password field:", html.includes('name="password"'))
  console.log("has identifier field:", /name="identifier"/.test(html))

  await browser.close()
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})