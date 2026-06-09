// Batch fold screenshots of every tool page.
// Usage: node scripts/shot-tools.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3199/tools/";
const SLUGS = [
  "qr-code", "palette-generator", "gradient-generator", "ascii-art",
  "halftone", "image-compressor", "images-to-pdf", "pattern-library",
  "generative-art", "vector-art", "color-converter", "logo-maker",
];
mkdirSync("scripts/shots", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument(() => sessionStorage.setItem("booted", "1"));

for (const slug of SLUGS) {
  await page.goto(BASE + slug, { waitUntil: "networkidle0", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `scripts/shots/tool-${slug}.png` });
}
await browser.close();
console.log("done");
