const { chromium } = require("playwright")

async function main() {
  const b = await chromium.launch()
  const ctx = await b.newContext()
  const p = await ctx.newPage()
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  await p.fill('input[name="identifier"]', "nuttest")
  await p.fill('input[name="password"]', "test1234")
  await p.click('button[type="submit"]')
  await p.waitForURL("**/dashboard", { timeout: 20000 })
  const cookie = (await ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ")
  const res = await fetch("http://localhost:3000/api/export/clients", {
    headers: { Cookie: cookie },
  })
  const buf = Buffer.from(await res.arrayBuffer())
  console.log("first 6 bytes hex:", buf.subarray(0, 6).toString("hex"))
  console.log("has BOM bytes:", buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf)
  const text = buf.toString("utf8")
  console.log("charCodeAt(0):", text.charCodeAt(0))
  console.log("starts with FEFF:", text.charCodeAt(0) === 0xfeff)
  await b.close()
}

main().catch((e) => {
  console.error("FATAL:", e.message)
  process.exit(1)
})
