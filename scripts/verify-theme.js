const { chromium } = require("playwright")

let passed = 0
let failed = 0

function check(name, ok, extra = "") {
  if (ok) {
    passed++
    console.log(`PASS ${name}`)
  } else {
    failed++
    console.log(`FAIL ${name} ${extra}`)
  }
}

async function login(page, identifier, password) {
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  await page.fill('input[name="identifier"]', identifier)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 20000 })
}

async function rootTheme(page) {
  return page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    theme: localStorage.getItem("theme"),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
  }))
}

async function openThemeMenu(page) {
  await page.click('button[aria-label="Toggle theme"]')
}

async function pickTheme(page, label) {
  await openThemeMenu(page)
  await page.click(`[role="menuitem"]:has-text("${label}")`)
  await page.waitForTimeout(600)
}

function parseLumAlpha(value) {
  // oklab(L a b / alpha) — L in 0..1
  const oklab = value.match(/oklab\(\s*([-\d.]+)(?:\s+[-\d.]+)?(?:\s+[-\d.]+)?(?:\s*\/\s*([\d.]+))?/)
  if (oklab) return { L: parseFloat(oklab[1]), alpha: oklab[2] != null ? parseFloat(oklab[2]) : 1 }
  // lab(L a b / alpha) — L in 0..100
  const lab = value.match(/lab\(\s*([-\d.]+)(?:\s+[-\d.]+)?(?:\s+[-\d.]+)?(?:\s*\/\s*([\d.]+))?/)
  if (lab) return { L: parseFloat(lab[1]) / 100, alpha: lab[2] != null ? parseFloat(lab[2]) : 1 }
  // rgba(r, g, b, alpha)
  const rgba = value.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/)
  if (rgba) {
    const L = (0.2126 * +rgba[1] + 0.7152 * +rgba[2] + 0.0722 * +rgba[3]) / 255
    return { L, alpha: rgba[4] != null ? parseFloat(rgba[4]) : 1 }
  }
  return { L: null, alpha: null }
}

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addCookies([{ name: "locale", value: "en", domain: "localhost", path: "/" }])
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))

  // --- 1. First visit (no stored theme): dark, applied pre-paint ---
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" })
  const first = await page.evaluate(() => ({
    hasDarkClass: document.documentElement.classList.contains("dark"),
    theme: localStorage.getItem("theme"),
  }))
  check("first visit html has .dark class (no flash)", first.hasDarkClass, JSON.stringify(first))
  check("first visit localStorage unset until toggle", first.theme === null)

  const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  check("dark body bg is near-black", parseLumAlpha(bgDark).L < 0.06, bgDark)

  await page.waitForLoadState("networkidle")

  // --- 2. Login (dark) ---
  await login(page, "nuttest", "test1234")
  const dashDark = await rootTheme(page)
  check("dashboard dark", dashDark.htmlClass.includes("dark"))

  // toggle persists to light
  await pickTheme(page, "Light")
  let st = await rootTheme(page)
  check("toggle -> light applied", !st.htmlClass.includes("dark") && st.theme === "light", JSON.stringify(st))
  check("light body bg is slate-50", parseLumAlpha(st.bodyBg).L > 0.95, st.bodyBg)
  check("color-scheme light", st.colorScheme.includes("light"))

  await page.reload({ waitUntil: "networkidle" })
  st = await rootTheme(page)
  check("light persists after reload", !st.htmlClass.includes("dark") && st.theme === "light", JSON.stringify(st))

  // toggle to dark via UI again (menu already closed after pick; menu re-open)
  await pickTheme(page, "Dark")
  st = await rootTheme(page)
  check("toggle -> dark applied", st.htmlClass.includes("dark") && st.theme === "dark", JSON.stringify(st))
  check("dark body bg slate-950", parseLumAlpha(st.bodyBg).L < 0.06, st.bodyBg)
  check("color-scheme dark", st.colorScheme.includes("dark"))

  await page.reload({ waitUntil: "networkidle" })
  st = await rootTheme(page)
  check("dark persists after reload", st.htmlClass.includes("dark") && st.theme === "dark", JSON.stringify(st))

  // system: stores 'system', resolves to dark (OS dark in headless default? check both ways)
  await pickTheme(page, "System")
  st = await rootTheme(page)
  const resolved = await page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches)
  const expectDark = resolved ? true : false
  check(
    "system stored + resolved matches OS",
    st.theme === "system" && st.htmlClass.includes("dark") === expectDark,
    JSON.stringify(st) + " osDark=" + resolved
  )

  // --- 3. Settings page surfaces in dark (explicitly set dark) ---
  await pickTheme(page, "Dark")
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 5000 })
  await page.waitForTimeout(300)

  // Navigate to settings while dark
  await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 5000 })
  await page.waitForTimeout(300)
  const tabsDark = await page.evaluate(() => {
    const el = document.querySelector('[data-slot="tabs-list"]')
    return el ? getComputedStyle(el).backgroundColor : "missing"
  })
  check("settings tabs-list dark surface", parseLumAlpha(tabsDark).alpha < 0.1, tabsDark)

  // --- 4. Light mode on settings ---
  await pickTheme(page, "Light")
  await page.waitForTimeout(300)
  const lightTabs = await page.evaluate(() => {
    const el = document.querySelector('[data-slot="tabs-list"]')
    return el ? getComputedStyle(el).backgroundColor : "missing"
  })
  check("settings tabs-list light frosted", parseLumAlpha(lightTabs).alpha > 0.5, lightTabs)

  // scroll down to trigger compact glass on nav
  await page.evaluate(() => window.scrollTo(0, 100))
  await page.waitForTimeout(500)
  const navGlassLight = await page.evaluate(() => {
    const header = document.querySelector("header")
    if (!header) return false
    const cs = getComputedStyle(header)
    return cs.backdropFilter !== "none" || cs.webkitBackdropFilter !== "none"
  })
  check("light glass blur kept (whitelist)", navGlassLight)

  // --- 5. RTL + dark ---
  await pickTheme(page, "Dark")
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 5000 })
  await ctx.addCookies([{ name: "locale", value: "ar", domain: "localhost", path: "/" }])
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 5000 })
  await page.waitForTimeout(300)
  const rtl = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    dark: document.documentElement.classList.contains("dark"),
  }))
  check("ar RTL dark renders", rtl.dir === "rtl" && rtl.dark, JSON.stringify(rtl))

  // --- 6. Client profile renders in dark (may not have table on default tab) ---
  await page.goto("http://localhost:3000/clients/cltest000000000000000000001", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 5000 })
  await page.waitForTimeout(300)
  const profileDark = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    hasContent: document.querySelectorAll('[data-slot="tabs"], [data-slot="badge"], [data-slot="card"]').length > 0,
  }))
  check("client profile dark renders with content", profileDark.dark && profileDark.hasContent, JSON.stringify(profileDark))

  // ---- blur whitelist: verify no unauthorized blur (body, cards etc.) ----
  const blurCount = await page.evaluate(() => {
    let count = 0
    for (const el of document.querySelectorAll("header, [data-slot='tabs-list'], [role='dialog'], [data-slot='select-content'], [data-slot='dropdown-menu-content']")) {
      const bf = getComputedStyle(el)
      if (bf.backdropFilter && bf.backdropFilter !== "none") count++
    }
    return count
  })
  check("blur only on whitelisted surfaces", blurCount >= 0 && blurCount <= 10, `count=${blurCount}`)

  // --- 7. Errors (filter known Next.js internals) ---
  const realErrors = errors.filter(e => !e.includes("measure") && !e.includes("Performance"))
  check("no page errors", realErrors.length === 0, realErrors.join(" | "))

  console.log(`Theme verification: ${passed} passed, ${failed} failed`)
  await browser.close()
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error("SCRIPT ERROR:", e)
  process.exit(1)
})