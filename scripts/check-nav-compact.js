const { chromium } = require("playwright")

async function main() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1200, height: 600 } })
  const p = await ctx.newPage()
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  await p.fill('input[name="identifier"]', "admin@coach.local")
  await p.fill('input[name="password"]', "admin123")
  await p.click('button[type="submit"]')
  await p.waitForURL("**/admin", { timeout: 15000 })
  await p.goto("http://localhost:3000/admin/clients", { waitUntil: "networkidle" })

  const before = await p.evaluate(() => {
    const h = document.querySelector("header")
    return { blur: getComputedStyle(h).backdropFilter, h: getComputedStyle(h).height }
  })

  await p.evaluate(() => {
    const div = document.createElement("div")
    div.style.height = "2000px"
    document.body.appendChild(div)
  })
  await p.evaluate(() => window.scrollTo(0, 400))
  await p.waitForTimeout(800)
  const after = await p.evaluate(() => {
    const h = document.querySelector("header")
    return { blur: getComputedStyle(h).backdropFilter, h: getComputedStyle(h).height, scrollY: window.scrollY }
  })
  console.log("before:", JSON.stringify(before))
  console.log("after: ", JSON.stringify(after))
  await b.close()
}

main().catch((e) => {
  console.error("FATAL:", e.message)
  process.exit(1)
})
