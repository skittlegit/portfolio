// Checks on the built site — run `npm run build` first, then `npm test`.
//
// These guard the things that are easy to break silently: every page must
// describe itself (not the home page) to search engines and link previews,
// and the shared tool list must stay in step with the routes on disk.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { TOOLS } from "../app/lib/tools.ts";

const SITE = "https://bydeepak.com";
const OUT = ".next/server/app";

const WORK_SLUGS = readdirSync(`${OUT}/work`, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith(".html"))
  .map((e) => e.name.replace(/\.html$/, ""));

// route → prerendered HTML file
const PAGES = [
  ["/", "index"],
  ["/about", "about"],
  ["/work", "work"],
  ["/resume", "resume"],
  ["/tools", "tools"],
  ...TOOLS.map((t) => [`/tools/${t.slug}`, `tools/${t.slug}`]),
  ...WORK_SLUGS.map((s) => [`/work/${s}`, `work/${s}`]),
];

const read = (file) => readFileSync(`${OUT}/${file}.html`, "utf8");
const attr = (html, re) => html.match(re)?.[1];
const canonicalOf = (html) => attr(html, /<link rel="canonical" href="([^"]*)"/);
const ogOf = (html, prop) => attr(html, new RegExp(`<meta property="og:${prop}" content="([^"]*)"`));
const titleOf = (html) => attr(html, /<title>([^<]*)<\/title>/);
const descOf = (html) => attr(html, /<meta name="description" content="([^"]*)"/);
// Next prints the site root without a trailing slash
const urlFor = (route) => (route === "/" ? SITE : SITE + route);

test("the build output exists", () => {
  assert.ok(existsSync(`${OUT}/index.html`), "run `npm run build` before `npm test`");
});

test("there is at least one case study", () => {
  assert.ok(WORK_SLUGS.length > 0);
});

for (const [route, file] of PAGES) {
  test(`${route} — canonical and og:url point at itself`, () => {
    const html = read(file);
    assert.equal(canonicalOf(html), urlFor(route));
    assert.equal(ogOf(html, "url"), urlFor(route));
  });

  test(`${route} — has a link-preview image, title and description`, () => {
    const html = read(file);
    assert.match(ogOf(html, "image") ?? "", /\/opengraph-image/);
    assert.ok(ogOf(html, "title"), "og:title missing");
    assert.ok(descOf(html), "description missing");
  });
}

test("every page has a unique <title>", () => {
  const seen = new Map();
  for (const [route, file] of PAGES) {
    const title = titleOf(read(file));
    assert.ok(title, `${route} has no <title>`);
    assert.ok(!seen.has(title), `${route} and ${seen.get(title)} share the title "${title}"`);
    seen.set(title, route);
  }
});

test("every tool page has a unique description", () => {
  const descs = TOOLS.map((t) => descOf(read(`tools/${t.slug}`)));
  assert.equal(new Set(descs).size, TOOLS.length);
});

test("the tool list matches the tool routes on disk", () => {
  const onDisk = readdirSync("app/tools", { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  assert.deepEqual(TOOLS.map((t) => t.slug).sort(), onDisk);
  for (const slug of onDisk) {
    assert.ok(existsSync(`app/tools/${slug}/layout.tsx`), `${slug} is missing its metadata layout.tsx`);
  }
});

test("the sitemap lists every page", () => {
  const xml = readFileSync(`${OUT}/sitemap.xml.body`, "utf8");
  for (const [route] of PAGES) {
    assert.ok(xml.includes(`<loc>${urlFor(route)}</loc>`), `${route} missing from sitemap`);
  }
});

test("the 404 page is not indexable", () => {
  assert.match(read("_not-found"), /<meta name="robots" content="noindex"/);
});
