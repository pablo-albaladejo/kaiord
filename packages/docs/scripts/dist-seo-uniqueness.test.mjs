// Indexing guards over the built docs (`.vitepress/dist`):
// - every page carries `noindex` exactly when `isNoindexPath` says so;
// - `<title>` and meta description are unique across the indexable pages;
// - the sitemap lists exactly the indexable pages: none with `noindex`,
//   none missing, none that do not exist;
// - with REQUIRE_FULL_HISTORY=1, every sitemap URL has a `<lastmod>`, the
//   dates are not all the same (the signature of a shallow clone), and the
//   dated pages carry `dateModified` in their TechArticle;
// - `<html lang>` is "es" under `es/` and "en" everywhere else, and every
//   page of an EN/ES pair links both languages plus x-default.
//
// Reads the build, so it skips unless REQUIRE_DOCS_DIST=1 (set in the CI
// `build` job and in deploy, after the docs build): a stale local dist would
// otherwise fail `pnpm test:scripts` for reasons unrelated to the change.

import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { hreflangPair, isNoindexPath } from "../.vitepress/indexing.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", ".vitepress", "dist");
const DOCS_URL = "https://kaiord.com/docs/";
const skip =
  process.env.REQUIRE_DOCS_DIST !== "1" &&
  "reads the docs build (set REQUIRE_DOCS_DIST=1 after building it)";
const requireHistory = process.env.REQUIRE_FULL_HISTORY === "1";

// The site has ~36 indexable pages; far fewer means the scan found nothing
// to check, not that the site shrank.
const MIN_INDEXABLE = 20;

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const attr = (html, re) => html.match(re)?.[1];

const docsUrlOf = (path) =>
  DOCS_URL +
  path.replace(/(^|\/)index\.(html|md)$/, "$1").replace(/\.(html|md)$/, "");

/**
 * Each alternate a page must declare, as `"<hreflang>=<href>"`: `es` points
 * at the Spanish twin, `en` and `x-default` at the English page.
 */
export function expectedHreflangs(pagePath) {
  const pair = hreflangPair(pagePath.replace(/\.html$/, ".md"));
  if (!pair) return [];
  const en = docsUrlOf(pair.en);
  return [`en=${en}`, `es=${docsUrlOf(pair.es)}`, `x-default=${en}`];
}

/** One record per built page (VitePress's 404 page is not a page). */
export function readPages(dist) {
  return htmlFiles(dist)
    .map((file) => relative(dist, file).split("\\").join("/"))
    .filter((path) => path !== "404.html")
    .map((path) => {
      const html = readFileSync(join(dist, path), "utf8");
      return {
        path,
        url: docsUrlOf(path),
        noindex: /<meta name="robots" content="noindex/.test(html),
        title: attr(html, /<title>([^<]*)<\/title>/),
        description: attr(html, /<meta name="description" content="([^"]*)"/),
        dateModified: attr(html, /"dateModified":"([^"]+)"/),
        lang: attr(html, /<html[^>]* lang="([^"]*)"/),
        hreflangs: [...html.matchAll(/<link [^>]*hreflang="[^"]*"[^>]*>/g)]
          .map(([link]) => {
            const lang = attr(link, /hreflang="([^"]*)"/);
            return `${lang}=${attr(link, / href="([^"]*)"/)}`;
          })
          .sort(),
      };
    });
}

/** `[{ loc, lastmod }]` from a sitemap.xml body. */
export function readSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: attr(body, /<loc>([^<]*)<\/loc>/),
    lastmod: attr(body, /<lastmod>([^<]*)<\/lastmod>/),
  }));
}

/** Values shared by more than one page, with the pages sharing them. */
export function duplicates(pages, key) {
  const seen = new Map();
  for (const page of pages) {
    seen.set(page[key], [...(seen.get(page[key]) ?? []), page.path]);
  }
  return [...seen].filter(([, paths]) => paths.length > 1);
}

/** Every indexing inconsistency between the built pages and the sitemap. */
export function indexingProblems(pages, sitemap, { requireHistory }) {
  const problems = [];
  const indexable = pages.filter((page) => !page.noindex);
  if (indexable.length < MIN_INDEXABLE) {
    problems.push(
      `only ${indexable.length} indexable pages found (expected at least ${MIN_INDEXABLE})`
    );
  }
  for (const page of pages) {
    if (page.noindex !== isNoindexPath(page.path)) {
      problems.push(
        `${page.path}: noindex=${page.noindex}, expected ${!page.noindex}`
      );
    }
  }
  for (const key of ["title", "description"]) {
    for (const page of indexable.filter((p) => !p[key])) {
      problems.push(`${page.path}: no ${key}`);
    }
    for (const [value, paths] of duplicates(indexable, key)) {
      problems.push(`duplicate ${key} "${value}": ${paths.join(", ")}`);
    }
  }
  for (const page of pages) {
    const lang = page.path.startsWith("es/") ? "es" : "en";
    if (page.lang !== lang) {
      problems.push(
        `${page.path}: <html lang="${page.lang}">, expected "${lang}"`
      );
    }
    const expected = expectedHreflangs(page.path);
    if (page.hreflangs.join() !== expected.join()) {
      problems.push(
        `${page.path}: hreflang [${page.hreflangs}], expected [${expected}]`
      );
    }
  }
  const byUrl = new Map(pages.map((page) => [page.url, page]));
  const listed = new Set(sitemap.map((entry) => entry.loc));
  for (const { loc } of sitemap) {
    const page = byUrl.get(loc);
    if (!page) problems.push(`sitemap lists ${loc}, which is not a built page`);
    else if (page.noindex)
      problems.push(`sitemap lists ${loc}, which is noindex`);
  }
  for (const page of indexable.filter((p) => !listed.has(p.url))) {
    problems.push(`sitemap misses indexable page ${page.url}`);
  }
  if (requireHistory) {
    for (const { loc } of sitemap.filter((entry) => !entry.lastmod)) {
      problems.push(`sitemap entry ${loc} has no <lastmod>`);
    }
    const dates = new Set(sitemap.map((entry) => entry.lastmod));
    if (sitemap.length > 1 && dates.size < 2) {
      problems.push(
        `all ${sitemap.length} sitemap lastmods are identical (${[...dates][0]}): shallow clone?`
      );
    }
    // Hand-written pages are dated by VitePress; the generated API entry
    // pages have no git history of their own.
    for (const page of indexable) {
      const dated = !page.path.startsWith("api/") && page.path !== "index.html";
      if (dated && !page.dateModified)
        problems.push(`${page.path}: no dateModified`);
    }
  }
  return problems;
}

test(
  "docs dist: noindex, unique titles/descriptions and the sitemap agree",
  { skip },
  () => {
    const pages = readPages(DIST);
    const sitemapPath = join(DIST, "sitemap.xml");
    assert.ok(existsSync(sitemapPath), `${sitemapPath} missing`);
    const sitemap = readSitemap(readFileSync(sitemapPath, "utf8"));

    const problems = indexingProblems(pages, sitemap, { requireHistory });

    assert.deepEqual(problems, []);
  }
);

test("root README and CHANGELOG are not built as docs pages", { skip }, () => {
  assert.equal(existsSync(join(DIST, "README.html")), false);
  assert.equal(existsSync(join(DIST, "CHANGELOG.html")), false);
  assert.equal(existsSync(join(DIST, "api", "core", "README.html")), true);
});

// The checks above only mean something if they fail on the bugs they guard.
// These run everywhere, on synthetic pages.
const page = (path, extra = {}) => ({
  path,
  url:
    DOCS_URL + path.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, ""),
  noindex: isNoindexPath(path),
  title: `Title of ${path}`,
  description: `Description of ${path}`,
  dateModified: "2026-09-01T00:00:00.000Z",
  lang: path.startsWith("es/") ? "es" : "en",
  hreflangs: expectedHreflangs(path),
  ...extra,
});
const site = Array.from({ length: MIN_INDEXABLE }, (_, i) =>
  page(`guide/p${i}.html`)
);
const sitemapOf = (
  pages,
  lastmod = (i) => `2026-09-${String(i + 1).padStart(2, "0")}`
) =>
  pages
    .filter((p) => !p.noindex)
    .map((p, i) => ({ loc: p.url, lastmod: lastmod(i) }));

test("guard passes a consistent synthetic site", () => {
  const pages = [...site, page("api/core/functions/foo.html")];

  const problems = indexingProblems(pages, sitemapOf(pages), {
    requireHistory: true,
  });

  assert.deepEqual(problems, []);
});

test("guard fails on an empty scan", () => {
  const problems = indexingProblems([], [], { requireHistory: true });

  assert.match(problems.join("\n"), /only 0 indexable pages/);
});

test("guard fails on a duplicated title or description", () => {
  const pages = [
    ...site,
    page("guide/dup.html", { description: site[0].description }),
  ];

  const problems = indexingProblems(pages, sitemapOf(pages), {
    requireHistory: false,
  });

  assert.match(
    problems.join("\n"),
    /duplicate description .*guide\/p0\.html, guide\/dup\.html/
  );
});

test("guard fails when a symbol page lacks noindex, or an entry page has it", () => {
  const pages = [
    ...site,
    page("api/core/functions/foo.html", { noindex: false }),
    page("api/core/README.html", { noindex: true }),
  ];

  const problems = indexingProblems(pages, sitemapOf(pages), {
    requireHistory: false,
  });

  assert.match(
    problems.join("\n"),
    /api\/core\/functions\/foo\.html: noindex=false/
  );
  assert.match(problems.join("\n"), /api\/core\/README\.html: noindex=true/);
});

test("guard fails when the sitemap lists a noindex page", () => {
  const symbol = page("api/core/functions/foo.html");
  const pages = [...site, symbol];

  const problems = indexingProblems(
    pages,
    [...sitemapOf(pages), { loc: symbol.url, lastmod: "2026-01-01" }],
    {
      requireHistory: false,
    }
  );

  assert.match(problems.join("\n"), /sitemap lists .*foo, which is noindex/);
});

test("guard fails when the sitemap misses a page or lists one that was not built", () => {
  const sitemap = [
    ...sitemapOf(site).slice(1),
    { loc: `${DOCS_URL}README`, lastmod: "2026-01-01" },
  ];

  const problems = indexingProblems(site, sitemap, { requireHistory: false });

  assert.match(
    problems.join("\n"),
    /sitemap misses indexable page .*guide\/p0/
  );
  assert.match(
    problems.join("\n"),
    /sitemap lists .*README, which is not a built page/
  );
});

test("guard fails on missing or all-identical lastmods when history is required", () => {
  const same = indexingProblems(
    site,
    sitemapOf(site, () => "2026-09-28"),
    { requireHistory: true }
  );
  const missing = indexingProblems(
    site,
    sitemapOf(site, () => undefined),
    { requireHistory: true }
  );
  const undated = indexingProblems(
    [...site, page("guide/new.html", { dateModified: undefined })],
    sitemapOf([...site, page("guide/new.html")]),
    {
      requireHistory: true,
    }
  );

  assert.match(same.join("\n"), /lastmods are identical/);
  assert.match(missing.join("\n"), /has no <lastmod>/);
  assert.match(undated.join("\n"), /guide\/new\.html: no dateModified/);
});

test("guard passes a translated EN/ES pair with lang and hreflang", () => {
  const pages = [
    ...site,
    page("guide/whoop-recovery-in-plan.html"),
    page("es/guide/whoop-recovery-in-plan.html"),
  ];

  const problems = indexingProblems(pages, sitemapOf(pages), {
    requireHistory: false,
  });

  assert.deepEqual(problems, []);
});

test("guard fails when a page declares the wrong <html lang>", () => {
  const pages = [
    ...site,
    page("guide/quick-start.html", { lang: "es" }),
    page("es/guide/whoop-recovery-in-plan.html", { lang: "en" }),
  ];

  const problems = indexingProblems(pages, sitemapOf(pages), {
    requireHistory: false,
  });

  assert.match(problems.join("\n"), /quick-start\.html: <html lang="es">/);
  assert.match(
    problems.join("\n"),
    /es\/guide\/whoop-recovery-in-plan\.html: <html lang="en">/
  );
});

test("guard fails when a paired page lacks hreflang, or an unpaired one has it", () => {
  const pages = [
    ...site,
    page("es/guide/whoop-recovery-in-plan.html", { hreflangs: ["en"] }),
    page("guide/quick-start.html", { hreflangs: ["en", "es", "x-default"] }),
  ];

  const problems = indexingProblems(pages, sitemapOf(pages), {
    requireHistory: false,
  });

  assert.match(
    problems.join("\n"),
    /whoop-recovery-in-plan\.html: hreflang \[en\]/
  );
  assert.match(
    problems.join("\n"),
    /quick-start\.html: hreflang \[en,es,x-default\], expected \[\]/
  );
});

test("guard fails when an alternate link points at the wrong page", () => {
  const [en, , xDefault] = expectedHreflangs(
    "guide/whoop-recovery-in-plan.html"
  );
  const pages = [
    ...site,
    page("guide/whoop-recovery-in-plan.html", {
      hreflangs: [en, en.replace("en=", "es="), xDefault],
    }),
  ];

  const problems = indexingProblems(pages, sitemapOf(pages), {
    requireHistory: false,
  });

  assert.match(
    problems.join("\n"),
    /whoop-recovery-in-plan\.html: hreflang .*es=https:\/\/kaiord\.com\/docs\/guide\/whoop-recovery-in-plan,.*expected .*es=https:\/\/kaiord\.com\/docs\/es\/guide\/whoop-recovery-in-plan/
  );
});
