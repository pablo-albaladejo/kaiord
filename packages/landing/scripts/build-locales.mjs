// Postbuild step: post-process Vite's built dist/index.html into two localized
// outputs. The English dist/index.html is rewritten IN PLACE to add SEO
// hreflang/canonical-alternate links plus a language switcher, but its visible
// English copy is asserted unchanged (only head <link>s and the switcher <a>s
// are added). dist/es/index.html additionally text-swaps every translatable
// string to Spanish. Deterministic and idempotent.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalize, parseHtml, walkTranslatable } from "./extract-strings.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const landingRoot = resolve(here, "..");
const DIST = resolve(landingRoot, "dist");
const EN_HTML = resolve(DIST, "index.html");
const I18N = resolve(landingRoot, "i18n");

// Language-switcher config per output page. `label` is the *target* language's
// endonym (shown in the target language by convention); `href` points at the
// other locale's document; `aria` localizes the control for the current page.
const SWITCH = {
  en: { href: "/es/", label: "Español", lang: "es", aria: "Cambiar idioma" },
  es: { href: "/", label: "English", lang: "en", aria: "Switch language" },
};

// querySelector anchors that survive the Vite build byte-for-byte. The first
// "/editor/" link is the desktop-nav CTA; the npm link is unique to the footer.
const HEADER_ANCHOR = 'a[href="/editor/"]';
const FOOTER_ANCHOR = 'a[href="https://www.npmjs.com/org/kaiord"]';

// Reuse the exact utility classes already present on neighbouring nav/footer
// links so Tailwind (which generates CSS at Vite build time, before this script
// runs) has already emitted them and the switcher inherits real styling.
const HEADER_CLASS =
  "text-[var(--brand-text-secondary)] transition-colors hover:text-[var(--brand-text-primary)]";
const FOOTER_CLASS =
  "transition-colors hover:text-[var(--brand-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-accent-blue)]";

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

// The hreflang/canonical-alternate block is identical on both pages. Absolute
// URLs derive from the canonical already present in the built head so the origin
// stays a single source of truth. Inserted right before </head>.
const injectHreflang = (root) => {
  const canonical = root.querySelector('link[rel="canonical"]');
  if (!canonical)
    throw new Error("build-locales: missing <link rel=canonical>");
  const origin = new URL(canonical.getAttribute("href")).origin;
  const links = [
    `<link rel="alternate" hreflang="en" href="${origin}/" />`,
    `<link rel="alternate" hreflang="es" href="${origin}/es/" />`,
    `<link rel="alternate" hreflang="x-default" href="${origin}/" />`,
  ].join("\n    ");
  const head = root.querySelector("head");
  head.insertAdjacentHTML("beforeend", `\n    ${links}\n  `);
};

// A single unobtrusive <a> is inserted additively at two stable anchors (desktop
// header nav + footer links); the existing markup is never restructured.
const switchAnchor = (sw, className) =>
  `<a href="${sw.href}" lang="${sw.lang}" data-testid="lang-switch" ` +
  `aria-label="${sw.aria}" class="${className}">${sw.label}</a>`;

const injectSwitchers = (root, sw) => {
  const header = root.querySelector(HEADER_ANCHOR);
  if (!header)
    throw new Error(`build-locales: no header anchor ${HEADER_ANCHOR}`);
  header.insertAdjacentHTML("beforebegin", switchAnchor(sw, HEADER_CLASS));
  const footer = root.querySelector(FOOTER_ANCHOR);
  if (!footer)
    throw new Error(`build-locales: no footer anchor ${FOOTER_ANCHOR}`);
  footer.insertAdjacentHTML("afterend", switchAnchor(sw, FOOTER_CLASS));
};

// Every translatable text node / attribute value on a parsed page, in document
// order (a multiset — repeats are significant for the unchanged-copy check).
const collectText = (root) => {
  const values = [];
  walkTranslatable(root, ({ value }) => values.push(value));
  return values;
};

// Multiset difference: items of `a` not accounted for by `b`.
const multisetDiff = (a, b) => {
  const counts = new Map();
  for (const v of b) counts.set(v, (counts.get(v) ?? 0) + 1);
  const extra = [];
  for (const v of a) {
    const c = counts.get(v) ?? 0;
    if (c > 0) counts.set(v, c - 1);
    else extra.push(v);
  }
  return extra;
};

// Replaces the old byte-identical sha256 assertion: the English page now changes
// on purpose, so instead we prove no visible English copy was altered — every
// pre-injection text node still present, and the only additions are the
// switcher's own label + aria-label.
const assertEnglishCopyUnchanged = (before, after, sw) => {
  const removed = multisetDiff(before, after);
  const added = multisetDiff(after, before);
  const allowed = new Set([sw.label, sw.aria]);
  const unexpected = added.filter((v) => !allowed.has(v));
  if (removed.length > 0 || unexpected.length > 0) {
    console.error("build-locales: en visible copy changed", {
      removed,
      unexpected,
    });
    process.exit(1);
  }
  console.log(
    `build-locales: en visible copy unchanged (${before.length} translatable nodes); ` +
      `added only switcher strings [${[...allowed].join(", ")}]`
  );
};

const assertNoResidualEnglish = (root, outFile, inventory, translations) => {
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

const buildEnglish = (rawHtml) => {
  const root = parseHtml(rawHtml);
  const before = collectText(root);
  injectHreflang(root);
  injectSwitchers(root, SWITCH.en);
  assertEnglishCopyUnchanged(before, collectText(root), SWITCH.en);
  writeFileSync(EN_HTML, root.toString(), "utf8");
  return EN_HTML;
};

const buildSpanish = (rawHtml, meta, translations, inventory) => {
  const root = parseHtml(rawHtml);
  walkTranslatable(root, ({ value, apply }) => {
    const next = translations[value];
    if (typeof next === "string" && next.length > 0) apply(next);
  });
  rewriteHead(root, meta);
  const outDir = resolve(DIST, "es");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, "index.html");
  // Residual-English check runs on the translated body *before* the switcher
  // (whose label is intentionally the English endonym) is added.
  assertNoResidualEnglish(root, outFile, inventory, translations);
  injectHreflang(root);
  injectSwitchers(root, SWITCH.es);
  writeFileSync(outFile, root.toString(), "utf8");
  return outFile;
};

const main = () => {
  const rawHtml = readFileSync(EN_HTML, "utf8");
  const inventory = JSON.parse(
    readFileSync(resolve(I18N, "en-strings.json"), "utf8")
  );
  const meta = JSON.parse(readFileSync(resolve(I18N, "meta.json"), "utf8"));
  const es = JSON.parse(readFileSync(resolve(I18N, "es.json"), "utf8"));

  const enFile = buildEnglish(rawHtml);
  console.log(`build-locales: wrote ${enFile} (en + hreflang + switcher)`);

  const esFile = buildSpanish(rawHtml, meta.es, es, inventory);
  console.log(`build-locales: wrote ${esFile} (es + hreflang + switcher)`);
};

main();
