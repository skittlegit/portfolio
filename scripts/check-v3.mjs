// Verify: nav active underline, Crossmint phone cover (preview / case / mobile
// thumb), and the new square-dot + label-chip cursor.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

mkdirSync("scripts/shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});

async function open(path, { width = 1280, height = 800 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("booted", "1");
    localStorage.setItem("theme", "dark");
  });
  await page.goto("http://localhost:3199" + path, { waitUntil: "networkidle0", timeout: 45000 });
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 280) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 25));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 800));
  return page;
}

// 1. /work — nav underline (active) + crossmint row hover: cover + chip cursor
let p = await open("/work");
const rows = await p.$$(".index-row");
const last = rows[rows.length - 1];
await p.evaluate((el) => el.scrollIntoView({ block: "center" }), last);
await new Promise((r) => setTimeout(r, 600));
const box = await last.boundingBox();
await p.mouse.move(box.x + box.width * 0.55, box.y + box.height / 2, { steps: 6 });
await new Promise((r) => setTimeout(r, 950));
await p.screenshot({ path: "scripts/shots/v3-work-hover.png" });
// nav close-up while on /work (underline under WORK)
const sy = await p.evaluate(() => window.scrollY);
await p.screenshot({ path: "scripts/shots/v3-nav.png", clip: { x: 640, y: sy, width: 640, height: 64 } });
await p.close();

// 2. crossmint case study — phone cover media
p = await open("/work/crossmint");
await p.evaluate(() => window.scrollTo(0, Math.round((document.body.scrollHeight - innerHeight) * 0.4)));
await new Promise((r) => setTimeout(r, 700));
await p.screenshot({ path: "scripts/shots/v3-cross-case.png" });
await p.close();

// 3. mobile /work — crossmint row thumb (last row)
p = await open("/work", { width: 390, height: 844 });
await p.evaluate(() => {
  const rows = document.querySelectorAll(".index-row");
  rows[rows.length - 1].scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 700));
await p.screenshot({ path: "scripts/shots/v3-work-mob.png" });
await p.close();

// 4. home — cursor square over plain field (no target)
p = await open("/");
await p.mouse.move(900, 500, { steps: 4 });
await new Promise((r) => setTimeout(r, 500));
await p.screenshot({ path: "scripts/shots/v3-home-dot.png", clip: { x: 640, y: 240, width: 640, height: 420 } });
await p.close();

await browser.close();
console.log("done");
