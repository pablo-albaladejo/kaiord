// Postbuild step: derive localized dist/<locale>/index.html files from Vite's
// already-built dist/index.html. The English dist/index.html is the source of
// truth and is NEVER rewritten — its sha256 is snapshotted and re-checked so
// the build fails loudly if anything touches it. Deterministic and idempotent.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalize, parseHtml, walkTranslatable } from "./extract-strings.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const landingRoot = resolve(here, "..");
const DIST = resolve(landingRoot, "dist");
const EN_HTML = resolve(DIST, "index.html");
const I18N = resolve(landingRoot, "i18n");

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const setAttr = (root, selector, attr, value) => {
  const el = root.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

const rewriteHead = (root, meta) => {
  const html = root.querySelector("html");
  if (html) html.setAttribute("lang", meta.lang);
  const title = root.querySelector("title");
  if (title) title.set_content(meta.title);
  setAttr(root, 'meta[name="description"]', "content", meta.description);
  setAttr(root, 'link[rel="canonical"]', "href", meta.canonical);
  setAttr(root, 'meta[property="og:url"]', "content", meta.ogUrl);
  setAttr(root, 'meta[property="og:locale"]', "content", meta.ogLocale);
  setAttr(root, 'meta[property="og:title"]', "content", meta.ogTitle);
  setAttr(
    root,
    'meta[property="og:description"]',
    "content",
    meta.ogDescription
  );
  setAttr(root, 'meta[name="twitter:title"]', "content", meta.ogTitle);
  setAttr(
    root,
    'meta[name="twitter:description"]',
    "content",
    meta.ogDescription
  );
};

const buildLocale = (locale, meta, translations) => {
  const root = parseHtml(readFileSync(EN_HTML, "utf8"));
  walkTranslatable(root, ({ value, apply }) => {
    const next = translations[value];
    if (typeof next === "string" && next.length > 0) apply(next);
  });
  rewriteHead(root, meta);
  const outDir = resolve(DIST, locale);
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, "index.html");
  writeFileSync(outFile, root.toString(), "utf8");
  return outFile;
};

const assertNoResidualEnglish = (outFile, inventory, translations) => {
  const root = parseHtml(readFileSync(outFile, "utf8"));
  const known = new Set(inventory);
  const residual = new Set();
  walkTranslatable(root, ({ value }) => {
    const key = normalize(value);
    if (known.has(key) && translations[key] !== key) residual.add(key);
  });
  if (residual.size > 0) {
    console.error(`build-locales: residual English copy in ${outFile}:`, [
      ...residual,
    ]);
    process.exit(1);
  }
};

const main = () => {
  const shaBefore = sha256(readFileSync(EN_HTML));
  console.log(`build-locales: en dist/index.html sha256=${shaBefore}`);

  const inventory = JSON.parse(
    readFileSync(resolve(I18N, "en-strings.json"), "utf8")
  );
  const meta = JSON.parse(readFileSync(resolve(I18N, "meta.json"), "utf8"));
  const es = JSON.parse(readFileSync(resolve(I18N, "es.json"), "utf8"));

  const outFile = buildLocale("es", meta.es, es);
  console.log(`build-locales: wrote ${outFile}`);
  assertNoResidualEnglish(outFile, inventory, es);

  const shaAfter = sha256(readFileSync(EN_HTML));
  if (shaAfter !== shaBefore) {
    console.error(
      `build-locales: en dist/index.html changed ${shaBefore} -> ${shaAfter}`
    );
    process.exit(1);
  }
  console.log(
    `build-locales: en dist/index.html sha256 unchanged (${shaAfter}).`
  );
};

main();
