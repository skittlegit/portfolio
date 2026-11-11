// Shared launcher for the screenshot scripts.
//
// puppeteer-core ships without a browser, so it needs a local Chrome/Chromium.
// Set CHROME_PATH to override the per-platform default; set SHOT_BASE to point
// the scripts at a server other than the local production build.
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const DEFAULTS = {
  win32: [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ],
  darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
  linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
};

export const BASE = (process.env.SHOT_BASE ?? "http://localhost:3199").replace(/\/$/, "");

export function launch() {
  const candidates = process.env.CHROME_PATH
    ? [process.env.CHROME_PATH]
    : (DEFAULTS[process.platform] ?? []);
  const executablePath = candidates.find((p) => existsSync(p));
  if (!executablePath) {
    throw new Error(
      "Chrome not found. Set CHROME_PATH to your Chrome/Chromium executable.\nTried: " +
        (candidates.join(", ") || "(no default for this platform)"),
    );
  }
  return puppeteer.launch({ executablePath, headless: "new" });
}
