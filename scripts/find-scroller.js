const { chromium } = require("playwright")

async function main() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const p = await ctx.newPage()
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  await p.fill('input[name="identifier"]', "admin@coach.local")
  await p.fill('input[name="password"]', "admin123")
  await p.click('button[type="submit"]')
  await p.waitForURL("**/admin", { timeout: 15000 })
  await p.goto("http://localhost:3000/admin/clients", { waitUntil: "networkidle" })
  const info = await p.evaluate(() => {
    const els = [...document.querySelectorAll("main, [class*=container], [class*=layout]")].map((e) => ({
      tag: e.tagName,
      cls: (e.className || "").toString().slice(0, 90),
      sh: e.scrollHeight,
      ch: e.clientHeight,
      oy: getComputedStyle(e).overflowY,
    }))
    return {
      docScrollH: document.documentElement.scrollHeight,
      docClientH: document.documentElement.clientHeight,
      els,
    }
  })
  console.log(JSON.stringify(info, null, 1))
  await b.close()
}

main().catch((e) => {
  console.error("FATAL:", e.message)
  process.exit(1)
})
