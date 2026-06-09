// Screenshot helper — drives headless Chrome against the running prod server.
// Usage: node scripts/shot.mjs [url] [outPrefix]
import puppeteer from "puppeteer-core";

const URL = process.argv[2] ?? "http://localhost:3199/";
const PREFIX = process.argv[3] ?? "home";
const OUT = "scripts/shots";

import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});

async function capture(width, height, suffix, { dark = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1.5 });
  // skip the once-per-session preloader
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("booted", "1");
  });
  if (dark) {
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("theme", "dark");
    });
  }
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 45000 });
  // scroll through the page to fire whileInView reveals + lazy images
  await page.evaluate(async () => {
    const total = document.body.scrollHeight;
    for (let y = 0; y <= total; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: `${OUT}/${PREFIX}-${suffix}-fold.png` });
  await page.screenshot({ path: `${OUT}/${PREFIX}-${suffix}-full.png`, fullPage: true });
  await page.close();
}

await capture(1440, 900, "desktop");
await capture(390, 844, "mobile");
await capture(1440, 900, "dark", { dark: true });

await browser.close();
console.log("done");
