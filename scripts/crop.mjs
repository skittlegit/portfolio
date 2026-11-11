// Section-level screenshots — captures specific elements at full resolution.
// Usage: node scripts/crop.mjs [url]
import { launch, BASE } from "./browser.mjs";
import { mkdirSync } from "node:fs";

const URL = process.argv[2] ?? BASE + "/";
mkdirSync("scripts/shots", { recursive: true });

const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument(() => sessionStorage.setItem("booted", "1"));
await page.goto(URL, { waitUntil: "networkidle0", timeout: 45000 });
await page.evaluate(async () => {
  const total = document.body.scrollHeight;
  for (let y = 0; y <= total; y += 300) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 40));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 1200));

const targets = [
  ["#work .work-tile", "crop-feature"],
  ["#tools-teaser", "crop-teaser"],
  ["#contact", "crop-contact"],
];
for (const [sel, name] of targets) {
  const el = await page.$(sel);
  if (el) {
    await el.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));
    await el.screenshot({ path: `scripts/shots/${name}.png` });
  }
}
await browser.close();
console.log("done");
