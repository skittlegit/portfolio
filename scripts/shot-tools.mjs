// Batch fold screenshots of every tool page.
// Usage: node scripts/shot-tools.mjs
import { launch, BASE } from "./browser.mjs";
import { mkdirSync } from "node:fs";

// Node strips the types from this .ts import natively, so the scripts share
// the app's own tool list instead of keeping a copy.
import { TOOLS } from "../app/lib/tools.ts";

const SLUGS = TOOLS.map((t) => t.slug);
mkdirSync("scripts/shots", { recursive: true });

const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument(() => sessionStorage.setItem("booted", "1"));

for (const slug of SLUGS) {
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "networkidle0", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `scripts/shots/tool-${slug}.png` });
}
await browser.close();
console.log("done");
