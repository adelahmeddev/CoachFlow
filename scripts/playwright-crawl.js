const { chromium } = require("playwright")
const fs = require("fs")

async function run(browser, base, token, label) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  await ctx.addCookies([{ name: "next-auth.session-token", value: token, url: base, httpOnly: true }])
  const page = await ctx.newPage()
  const errors = new Set()
  page.on("console", (m) => { if (m.type() === "error") errors.add(`[console] ${m.text().slice(0, 300)}`) })
  page.on("pageerror", (e) => errors.add(`[pageerror] ${(e.stack || e.message).slice(0, 500)}`))

  const seen = new Set()
  const queue = []
  async function visit(url) {
    if (seen.has(url) || queue.includes(url)) return
    queue.push(url)
    try { await page.goto((url.startsWith("http") ? url : base + url), { waitUntil: "networkidle", timeout: 45000 }) }
    catch (e) { console.log(`[${label}] goto fail ${url}: ${e.message.split("\n")[0]}`); queue.pop(); return }
    seen.add(url)
    if (errors.size) {
      console.log(`[${label}] ERR @ ${url}:`)
      for (const e of [...errors].slice(0, 4)) console.log("   " + e)
      errors.clear()
    }
    const hrefs = await page.$$eval("a[href]", (as) => as.map(a => a.getAttribute("href")).filter(Boolean)).catch(() => [])
    for (const h of hrefs) {
      if (h.startsWith("/") && !h.includes("signout") && !h.includes("/api/")) {
        const clean = h.split("?")[0]
        await visit(clean)
      }
    }
    queue.pop()
  }
  await visit("http://localhost:3778/dashboard")
  await page.waitForTimeout(2000)
  console.log(`[${label}] visited ${seen.size} unique paths`)
  await ctx.close()
  return [...seen]
}

async function main() {
  const browser = await chromium.launch()
  const t1 = fs.readFileSync("C:/Users/ADELAH~1/AppData/Local/Temp/opencode/tok2.txt", "utf8").trim()
  await run(browser, "http://localhost:3778", t1, "TRAINER")
  await browser.close()
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1) })
