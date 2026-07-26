import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = process.cwd();
const outDir = path.join(root, "docs", "design-references");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 1000 }],
  ["mobile", { width: 390, height: 900 }]
]) {
  const page = await browser.newPage({ viewport });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, `clone-home-${name}.png`), fullPage: true });
  await page.getByRole("button", { name: /got it/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `clone-home-${name}-closed.png`), fullPage: true });
  await page.close();
}

for (const route of ["leaderboard", "profile"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`http://localhost:3000/${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, `clone-${route}-desktop.png`), fullPage: true });
  await page.close();
}
await browser.close();
console.log("captured local clone screenshots");
