import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:7887";
const routes = [
  "/",
  "/stocks",
  "/dashboard",
  "/compare",
  "/economic-calendar",
  "/AdminConsole",
];

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status < 500) return;
    } catch {
      await delay(500);
    }
  }
  throw new Error(`Server did not become ready at ${url}`);
}

function startServer() {
  const child = spawn("npx", ["next", "start", "-p", "7887", "-H", "127.0.0.1"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: "7887" },
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

const server = process.env.SMOKE_BASE_URL ? null : startServer();

try {
  await waitForServer(baseUrl);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const failures = [];

  page.on("pageerror", (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (!/favicon|ResizeObserver|net::ERR_ABORTED|401 \(Unauthorized\)/i.test(text)) {
        failures.push(`console error: ${text}`);
      }
    }
  });

  for (const route of routes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
    if (!response || response.status() >= 500) {
      failures.push(`${route}: HTTP ${response?.status() || "no response"}`);
      continue;
    }
    const bodyText = await page.locator("body").innerText({ timeout: 10_000 });
    if (!bodyText || bodyText.trim().length < 20) {
      failures.push(`${route}: body rendered too little content`);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/stocks`, { waitUntil: "networkidle", timeout: 30_000 });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  if (hasHorizontalOverflow) {
    failures.push("/stocks mobile: horizontal overflow detected");
  }

  await browser.close();

  if (failures.length) {
    throw new Error(`Smoke test failed:\n${failures.join("\n")}`);
  }

  console.log("Smoke test passed");
} finally {
  if (server) {
    server.kill("SIGTERM");
  }
}
