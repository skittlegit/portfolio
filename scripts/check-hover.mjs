// One-off: clipped close-up of a hovered work-index row.
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});
const p = await browser.newPage();
await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await p.evaluateOnNewDocument(() => {
  sessionStorage.setItem("booted", "1");
  localStorage.setItem("theme", "dark");
});
await p.goto("http://localhost:3199/work", { waitUntil: "networkidle0", timeout: 45000 });
await p.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 280) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 25));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 800));

const rows = await p.$$(".index-row");
await p.evaluate((el) => el.scrollIntoView({ block: "center" }), rows[1]);
await new Promise((r) => setTimeout(r, 600));
const box = await rows[1].boundingBox(); // viewport-relative
await p.mouse.move(box.x + box.width * 0.55, box.y + box.height / 2);
await new Promise((r) => setTimeout(r, 900));
// clip is in document coordinates — add the scroll offset
const scrollY = await p.evaluate(() => window.scrollY);
await p.screenshot({
  path: "scripts/shots/hover-zoom.png",
  clip: { x: 0, y: Math.max(0, scrollY + box.y - 60), width: 1280, height: box.height + 120 },
});
await browser.close();
console.log("done", JSON.stringify(box));
