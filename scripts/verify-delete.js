const { chromium } = require("playwright")
const { execSync } = require("child_process")

const PSQL = '"D:\\coach\\.pg\\pgsql\\bin\\psql.exe" -h localhost -U postgres -d coach -t'
const ENV = "SET PGPASSWORD=postgres&& "

function sql(query) {
  return execSync(ENV + PSQL + " -c " + JSON.stringify(query), { encoding: "utf8" }).trim()
}

async function main() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const p = await ctx.newPage()
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
  await p.fill('input[name="identifier"]', "deleteme")
  await p.fill('input[name="password"]', "delete_me_pass")
  await p.click('button[type="submit"]')
  await p.waitForURL("**/dashboard", { timeout: 20000 })
  console.log("logged in as deleteme")

  await p.goto("http://localhost:3000/settings", { waitUntil: "networkidle" })
  await p.click('[role="tab"]:has-text("Data")')
  await p.waitForTimeout(300)
  await p.click('button:has-text("Delete Account")')
  await p.waitForSelector("text=Yes, delete my account", { timeout: 10000 })
  await p.click('button:has-text("Yes, delete my account")')
  await p.waitForURL("**/login", { timeout: 30000 })
  console.log("redirected to /login after deletion")

  const user = sql('SELECT COUNT(*) FROM "User" WHERE id = \'usrdel0000000000000000001\';')
  const profile = sql('SELECT COUNT(*) FROM "TrainerProfile" WHERE id = \'tpdel000000000000000000001\';')
  const client = sql('SELECT COUNT(*) FROM "Client" WHERE id = \'cldel00000000000000000001\';')
  const assessment = sql('SELECT COUNT(*) FROM "Assessment" WHERE id = \'asdel00000000000000000001\';')
  console.log("remaining rows — user:", user, "| profile:", profile, "| client:", client, "| assessment:", assessment)
  const ok = user === "0" && profile === "0" && client === "0" && assessment === "0"
  console.log(ok ? "CASCADE OK: all rows deleted" : "CASCADE FAIL")
  await b.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error("FATAL:", e.message)
  process.exit(1)
})
