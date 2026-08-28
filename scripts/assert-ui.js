const { chromium } = require("playwright")
const fs = require("fs")

const cookie = fs
  .readFileSync("C:\\Users\\ADELAH~1\\AppData\\Local\\Temp\\opencode\\cookie.txt", "utf8")
  .trim()

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addCookies([
    { name: "next-auth.session-token", value: cookie.split("=")[1], domain: "localhost", path: "/" },
    { name: "locale", value: "ar", domain: "localhost", path: "/" },
  ])
  const page = await ctx.newPage()
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" })

  const checks = await page.evaluate(() => {
    const out = {}
    const body = document.body
    out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
    out.bodyBg = getComputedStyle(body).backgroundImage.includes("radial-gradient")
    const statCard = document.querySelector('[class*="glass"]')
    out.glassFound = !!statCard
    if (statCard) {
      out.glassRadius = getComputedStyle(statCard).borderRadius
      out.glassBackdrop = getComputedStyle(statCard).backdropFilter
    }
    const btn = document.querySelector("button")
    if (btn) out.btnRadius = getComputedStyle(btn).borderRadius
    const nav = document.querySelector("nav") || document.querySelector("header")
    if (nav) {
      out.navBlurTop = getComputedStyle(nav).backdropFilter
      out.navRadius = getComputedStyle(nav).borderRadius
    }
    const headings = [...document.querySelectorAll("h1,h2,h3")].map((h) => h.textContent.trim())
    out.headings = headings.slice(0, 8)
    const rtl = document.documentElement.dir
    out.rtl = rtl
    const tables = [...document.querySelectorAll("table")]
    out.tableCount = tables.length
    if (tables[0]) out.tableRadius = getComputedStyle(tables[0].parentElement).borderRadius
    out.mainText = document.body.innerText.slice(0, 300).replace(/\n+/g, " | ")
    return out
  })

  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(600)
  const compact = await page.evaluate(() => {
    const nav = document.querySelector("nav") || document.querySelector("header")
    return nav ? getComputedStyle(nav).backdropFilter : "none"
  })
  checks.navBlurAfterScroll = compact

  console.log(JSON.stringify(checks, null, 1))
  await browser.close()
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
