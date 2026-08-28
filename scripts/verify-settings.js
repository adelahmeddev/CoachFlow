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

async function gotoSettings(page) {
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" })
}

async function clickTab(page, name) {
  await page.click(`[role="tab"]:has-text("${name}")`)
}

async function waitToast(page, text, timeout = 10000) {
  try {
    await page.waitForSelector(`[data-sonner-toast]:has-text("${text}")`, {
      timeout,
    })
    return true
  } catch {
    return false
  }
}

async function selectValue(page, triggerLabel, value) {
  const trigger = page.locator(`[role="combobox"]`).nth(0)
  const all = page.locator('[role="combobox"]')
  for (let i = 0; i < (await all.count()); i++) {
    const t = all.nth(i)
    const labelId = await t.getAttribute("aria-labelledby")
    if (labelId && (await page.locator(`#${labelId}`).textContent())?.includes(triggerLabel)) {
      await t.click()
      await page.click(`[role="option"]:has-text("${value}")`)
      return
    }
  }
  throw new Error(`select not found: ${triggerLabel}`)
}

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addCookies([{ name: "locale", value: "en", domain: "localhost", path: "/" }])
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))

  await login(page, "nuttest", "test1234")

  // --- Tabs render ---
  await gotoSettings(page)
  const tabNames = ["Profile", "Security", "Preferences", "Notifications", "Business", "Data"]
  for (const name of tabNames) {
    const visible = await page.locator(`[role="tab"]:has-text("${name}")`).isVisible()
    check(`tab visible: ${name}`, visible)
  }

  // --- Profile save ---
  await page.fill('#fullName', "Nutrition Test Trainer Updated")
  await page.fill('#phone', "01001111111")
  await page.click('button[type="submit"]')
  check("profile toast", await waitToast(page, "Profile updated"))
  await page.waitForTimeout(500)
  await page.reload({ waitUntil: "networkidle" })
  const nameVal = await page.inputValue("#fullName")
  const phoneVal = await page.inputValue("#phone")
  check("profile persisted after reload", nameVal === "Nutrition Test Trainer Updated" && phoneVal === "01001111111", `got ${nameVal}/${phoneVal}`)

  // --- Profile phone conflict ---
  await page.fill('#phone', "01009999999")
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1200)
  const conflictVisible = await page
    .locator("text=A trainer with this phone number already exists.")
    .isVisible()
    .catch(() => false)
  check("phone conflict translated error", conflictVisible)

  // --- Security: wrong current password ---
  await clickTab(page, "Security")
  await page.fill('#currentPassword', "wrongpass")
  await page.fill('#newPassword', "newpass123")
  await page.fill('#confirmPassword', "newpass123")
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1200)
  const wrongVisible = await page
    .locator("text=Current password is incorrect.")
    .isVisible()
    .catch(() => false)
  check("wrong current password error", wrongVisible)

  // --- Security: correct change ---
  await page.fill('#currentPassword', "test1234")
  await page.fill('#newPassword', "newpass123")
  await page.fill('#confirmPassword', "newpass123")
  await page.click('button[type="submit"]')
  check("password changed toast", await waitToast(page, "Password changed"))

  // --- Re-login with new password ---
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page2 = await ctx2.newPage()
  await login(page2, "nuttest", "newpass123")
  check("login with new password", page2.url().includes("/dashboard"))
  await ctx2.close()

  // --- Revert password to test1234 (keep script idempotent) ---
  await gotoSettings(page)
  await clickTab(page, "Security")
  await page.fill('#currentPassword', "newpass123")
  await page.fill('#newPassword', "test1234")
  await page.fill('#confirmPassword', "test1234")
  await page.click('button[type="submit"]')
  check("password reverted to test1234", await waitToast(page, "Password changed"))

  // --- Preferences ---
  await gotoSettings(page)
  await clickTab(page, "Preferences")
  const cbs = page.locator('[role="combobox"]')
  await cbs.nth(0).click()
  await page.click('[role="option"]:has-text("عربي")')
  await page.waitForSelector('[role="option"]', { state: "detached" }).catch(() => {})
  await cbs.nth(1).click()
  await page.click('[role="option"]:has-text("Imperial")')
  await page.waitForSelector('[role="option"]', { state: "detached" }).catch(() => {})
  await cbs.nth(2).click()
  await page.click('[role="option"]:has-text("Monday")')
  await page.waitForSelector('[role="option"]', { state: "detached" }).catch(() => {})
  await cbs.nth(3).click()
  await page.click('[role="option"]:has-text("Africa/Cairo")')
  await page.waitForSelector('[role="option"]', { state: "detached" }).catch(() => {})
  await page.click('button[type="submit"]')
  await page.waitForSelector('html[dir="rtl"]', { timeout: 20000 })
  check("preferences save switches UI to Arabic (RTL)", true)

  // persisted after reload (Arabic labels)
  await page.reload({ waitUntil: "networkidle" })
  await clickTab(page, "التفضيلات")
  await page.waitForTimeout(400)
  const triggers = await page.locator('[role="combobox"]').allTextContents()
  const pers = triggers.join(" | ")
  check("preferences persisted (ar)", pers.includes("إمبراطوري") && pers.includes("الاثنين") && pers.includes("Africa/Cairo"), pers)

  // switch language back to en
  await page.locator('[role="combobox"]').nth(0).click()
  await page.click('[role="option"]:has-text("English")')
  await page.click('button[type="submit"]')
  await page.waitForSelector('html[dir="ltr"]', { timeout: 20000 })
  check("language back to English", true)

  // --- Notifications ---
  await gotoSettings(page)
  await clickTab(page, "Notifications")
  const switches = page.locator('[role="switch"]')
  async function setSwitch(i, target) {
    const current = (await switches.nth(i).getAttribute("aria-checked")) === "true"
    if (current !== target) {
      await switches.nth(i).click()
    }
  }
  await setSwitch(0, false) // reassessment
  await setSwitch(1, false) // inactivity
  await setSwitch(2, false) // subscription
  await setSwitch(3, true) // weeklySummary
  await page.click('button[type="submit"]')
  check("notifications toast", await waitToast(page, "Notification preferences saved"))
  await page.reload({ waitUntil: "networkidle" })
  await clickTab(page, "Notifications")
  await page.waitForTimeout(400)
  const after = await page
    .locator('[role="switch"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("aria-checked")))
  check(
    "notifications persisted after reload",
    after[0] === "false" && after[1] === "false" && after[2] === "false" && after[3] === "true",
    JSON.stringify(after)
  )

  // --- Business ---
  await clickTab(page, "Business")
  await page.fill("#businessName", "Elite Fitness Coaching")
  await page.click('button[type="submit"]')
  check("business toast", await waitToast(page, "Business info saved"))
  await page.reload({ waitUntil: "networkidle" })
  await clickTab(page, "Business")
  const bizVal = await page.inputValue("#businessName")
  check("business persisted after reload", bizVal === "Elite Fitness Coaching", bizVal)

  // --- CSV export ---
  const cookie = (await ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ")
  const res = await fetch("http://localhost:3000/api/export/clients", {
    headers: { Cookie: cookie },
  })
  const buf = Buffer.from(await res.arrayBuffer())
  const text = buf.toString("utf8")
  const ct = res.headers.get("content-type") || ""
  const cd = res.headers.get("content-disposition") || ""
  check("csv status 200", res.status === 200, String(res.status))
  check("csv utf-8 content type", ct.includes("charset=utf-8"), ct)
  check("csv attachment disposition", cd.includes("attachment") && cd.includes(".csv"), cd)
  check(
    "csv starts with UTF-8 BOM",
    buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf && text.charCodeAt(0) === 0xfeff,
    buf.subarray(0, 3).toString("hex")
  )
  check("csv contains Arabic client name", text.includes("عميل تجريبي عربي"))
  check("csv header row", text.includes('"fullName"'))

  check("no page errors", errors.length === 0, errors.join(" | "))

  await browser.close()
  console.log(`\nRESULT: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
