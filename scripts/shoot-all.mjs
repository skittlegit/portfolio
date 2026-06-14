// Screenshot every redesigned page against the running prod server.
// 1280×800 @ dsf 1 keeps reads safely under the image-size limits.
// Usage: node scripts/shoot-all.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

mkdirSync("scripts/shots", { recursive: true });
const BASE = "http://localhost:3199";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});

async function open(path, { width = 1280, height = 800, theme } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  // theme set explicitly every time — localStorage persists across pages in
  // the same browser profile, so a "light" run would otherwise leak forward
  await page.evaluateOnNewDocument((t) => {
    sessionStorage.setItem("booted", "1");
    localStorage.setItem("theme", t);
  }, theme ?? "dark");
  await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 45000 });
  // sweep the page to fire whileInView reveals + lazy images, then return
  await page.evaluate(async () => {
    const total = document.body.scrollHeight;
    for (let y = 0; y <= total; y += 280) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 900));
  return page;
}

// evenly-spaced scroll stops down the page
async function stops(page, name, fractions) {
  const total = await page.evaluate(
    () => document.body.scrollHeight - innerHeight
  );
  for (let i = 0; i < fractions.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * fractions[i]));
    await new Promise((r) => setTimeout(r, 650));
    await page.screenshot({ path: `scripts/shots/${name}-${i}.png` });
  }
}

// home — default (dark), then light fold, then mobile
let p = await open("/");
await stops(p, "n-home", [0, 0.33, 0.66, 1]);
await p.close();

p = await open("/", { theme: "light" });
await stops(p, "n-home-light", [0, 1]);
await p.close();

p = await open("/", { width: 390, height: 844 });
await stops(p, "n-home-mob", [0, 0.5, 1]);
await p.close();

// work index + hover preview state
p = await open("/work");
await stops(p, "n-work", [0, 0.55]);
const rows = await p.$$(".index-row");
if (rows[1]) {
  await p.evaluate((el) => el.scrollIntoView({ block: "center" }), rows[1]);
  await new Promise((r) => setTimeout(r, 600));
  const box = await rows[1].boundingBox();
  if (box) {
    await p.mouse.move(box.x + box.width * 0.35, box.y + box.height / 2);
    await new Promise((r) => setTimeout(r, 850));
    await p.screenshot({ path: "scripts/shots/n-work-hover.png" });
  }
}
await p.close();

p = await open("/work", { width: 390, height: 844 });
await stops(p, "n-work-mob", [0, 0.4]);
await p.close();

// case studies — one with a shot, one without
p = await open("/work/mcse");
await stops(p, "n-case", [0, 0.36, 0.72, 1]);
await p.close();

p = await open("/work/crossmint");
await stops(p, "n-case-cross", [0, 0.4]);
await p.close();

// about
p = await open("/about");
await stops(p, "n-about", [0, 0.45, 0.9]);
await p.close();

// tools chrome (restyled tokens)
p = await open("/tools");
await stops(p, "n-tools", [0]);
await p.close();

await browser.close();
console.log("done");
