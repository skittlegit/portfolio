// One-off: screenshot external reference sites for design study.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

mkdirSync("scripts/shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});

const SITES = [
  ["https://sohub.digital/", "ref-sohub"],
  ["https://www.billchien.net/grid", "ref-billchien"],
  ["https://matveyan.com/", "ref-matveyan"],
];

for (const [url, name] of SITES) {
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3500));
    // nudge scroll to trigger entrance animations, then return to top
    await page.evaluate(async () => {
      for (let y = 0; y <= 2400; y += 300) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: `scripts/shots/${name}-fold.png` });
    await page.evaluate(() => window.scrollTo(0, 1200));
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: `scripts/shots/${name}-mid.png` });
    await page.close();
    console.log("ok", name);
  } catch (e) {
    console.log("fail", name, e.message);
  }
}
await browser.close();
