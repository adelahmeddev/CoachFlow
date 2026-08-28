const { chromium } = require("playwright")
const fs = require("fs")

const cookie = fs
  .readFileSync("C:\\Users\\ADELAH~1\\AppData\\Local\\Temp\\opencode\\cookie.txt", "utf8")
  .trim()

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  await ctx.addCookies([
    { name: "next-auth.session-token", value: cookie.split("=")[1], domain: "localhost", path: "/" },
  ])
  const page = await ctx.newPage()
  const jsLoaded = new Set()
  page.on("response", (res) => {
    if (res.url().includes("/_next/static/chunks/") && res.url().endsWith(".js")) {
      jsLoaded.add(res.url())
    }
  })
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" })
  console.log("title:", await page.title())
  console.log("JS chunks loaded:", jsLoaded.size)
  let rechartsHit = null
  for (const url of jsLoaded) {
    const body = await (await fetch(url)).text()
    if (body.includes("recharts")) {
      rechartsHit = url
      break
    }
  }
  console.log("recharts in eagerly loaded chunks:", rechartsHit ? "YES - " + rechartsHit : "NO")
  await browser.close()
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
