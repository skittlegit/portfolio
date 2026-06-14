// Final verification pass: hero fold (HUD clearance), preloader frame,
// resume page chrome, work index mid-scroll.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

mkdirSync("scripts/shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});

// 1. hero fold — booted, dark
let p = await browser.newPage();
await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await p.evaluateOnNewDocument(() => {
  sessionStorage.setItem("booted", "1");
  localStorage.setItem("theme", "dark");
});
await p.goto("http://localhost:3199/", { waitUntil: "networkidle0", timeout: 45000 });
await new Promise((r) => setTimeout(r, 1600));
await p.screenshot({ path: "scripts/shots/f-hero.png" });
await p.close();

// 2. preloader — NOT booted; catch it mid-count
p = await browser.newPage();
await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await p.evaluateOnNewDocument(() => localStorage.setItem("theme", "dark"));
await p.goto("http://localhost:3199/", { waitUntil: "domcontentloaded", timeout: 45000 });
await new Promise((r) => setTimeout(r, 450));
await p.screenshot({ path: "scripts/shots/f-preloader.png" });
await p.close();

// 3. resume page
p = await browser.newPage();
await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await p.evaluateOnNewDocument(() => {
  sessionStorage.setItem("booted", "1");
  localStorage.setItem("theme", "dark");
});
await p.goto("http://localhost:3199/resume", { waitUntil: "networkidle0", timeout: 45000 });
await new Promise((r) => setTimeout(r, 1000));
await p.screenshot({ path: "scripts/shots/f-resume.png" });
await p.close();

await browser.close();
console.log("done");
