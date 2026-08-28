const { chromium } = require("playwright")
const fs = require("fs")

async function main() {
  const token = fs.readFileSync("C:/Users/ADELAH~1/AppData/Local/Temp/opencode/tok2.txt", "utf8").trim()

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  await ctx.addCookies([{ name: "next-auth.session-token", value: token, url: "http://localhost:3778", httpOnly: true }])
  const page = await ctx.newPage()
  const errors = new Set()
  page.on("console", (m) => { if (m.type() === "error") errors.add(`[console] ${m.text()}`) })
  page.on("pageerror", (e) => errors.add(`[pageerror] ${e.stack || e.message}`))

  const seen = []
  async function nav(label, url) {
    console.log(`\n=== ${label}: ${url} ===`)
    try { await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }) }
    catch (e) { console.log("goto fail:", e.message.split("\n")[0]) }
    const t = await page.title()
    console.log("->", page.url(), "| title:", t)
    if (errors.size) { console.log("NEW ERRORS:\n" + [...errors].join("\n---\n")); seen.push(...errors); errors.clear() }
  }

  // client-side <a> click navigation from detail to edit page
  await nav("Detail (owner view)", "http://localhost:3778/clients/cm_test_invite_0001")
  const editLink = page.locator('a[href*="nutrition/"]').first()
  const ec = await editLink.count()
  console.log("edit/nutrition links:", ec)
  if (ec) {
    console.log("URL of edit link:", await editLink.getAttribute("href"))
    await editLink.click()
    await page.waitForTimeout(5000)
    console.log("after edit click:", page.url())
    if (errors.size) { console.log("ERRORS AFTER EDIT CLICK:\n" + [...errors].join("\n")); errors.clear() }
  }

  await nav("Edit plan page", "http://localhost:3778/clients/cm_test_invite_0001/nutrition/cmshb05iq0002iku4ht1apkhk")

  // Open template dialog on templates page
  await nav("Templates (dialog test)", "http://localhost:3778/nutrition-templates")
  const btn = page.locator('button:has-text("New Template"), button:has-text("Add Template"), a:has-text("New Template")').first()
  const bc = await btn.count()
  console.log("new template trigger:", bc)
  if (bc) {
    await btn.click()
    await page.waitForTimeout(4000)
    // screenshot dialog
    await page.screenshot({ path: "C:/Users/ADELAH~1/AppData/Local/Temp/opencode/probe/dialog.png" })
    if (errors.size) { console.log("DIALOG ERRORS:\n" + [...errors].join("\n---\n")); errors.clear() }
  }

  await page.screenshot({ path: "C:/Users/ADELAH~1/AppData/Local/Temp/opencode/probe/final2.png", fullPage: true })
  console.log("\nALL SEEN ERRORS:")
  console.log(seen.length ? [...new Set(seen)].join("\n---\n") : "NONE")
  await browser.close()
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1) })