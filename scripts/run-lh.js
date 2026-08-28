const fs = require("fs")

const LH_BASE = "C:\\Users\\Adel Ahmed\\AppData\\Local\\npm-cache\\_npx\\0f94ee7615faf582\\node_modules"
const lighthouse = require(LH_BASE + "\\lighthouse").default
const chromeLauncher = require(LH_BASE + "\\chrome-launcher")

const cookie = fs
  .readFileSync("C:\\Users\\ADELAH~1\\AppData\\Local\\Temp\\opencode\\cookie.txt", "utf8")
  .trim()

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

async function run(url, extraHeaders) {
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  })
  try {
    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance"],
        formFactor: "desktop",
        screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1 },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        extraHeaders,
      },
      null
    )
    return JSON.parse(result.report)
  } finally {
    try {
      await chrome.kill()
    } catch {
      /* cleanup noise */
    }
  }
}

async function main() {
  for (const [name, url, headers] of [
    ["login", "http://localhost:3000/login", undefined],
    ["dashboard", "http://localhost:3000/dashboard", { Cookie: cookie }],
  ]) {
    const lhr = await run(url, headers)
    const score = Math.round(lhr.categories.performance.score * 100)
    const pick = (id) => lhr.audits[id]?.displayValue ?? "n/a"
    console.log(
      `${name}: ${score} | FCP ${pick("first-contentful-paint")} | LCP ${pick("largest-contentful-paint")} | TBT ${pick("total-blocking-time")} | CLS ${pick("cumulative-layout-shift")} | TTI ${pick("interactive")}`
    )
    fs.writeFileSync(
      `C:\\Users\\ADELAH~1\\AppData\\Local\\Temp\\opencode\\lh-${name}.json`,
      JSON.stringify(lhr)
    )
  }
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
