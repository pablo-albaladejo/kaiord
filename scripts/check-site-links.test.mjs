import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";

import { checkSiteLinks, mountsFromArgs } from "./check-site-links.mjs";
import { linksIn } from "./lib/site-links-resolve.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "fixtures", "site-links");
const SCRIPT = join(HERE, "check-site-links.mjs");
const SEGMENTS = ["calendar", "library", "workout"];

describe("check-site-links", () => {
  let dir;
  let mounts;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "site-links-"));
    cpSync(FIXTURE, dir, { recursive: true });
    mounts = mountsFromArgs({
      landing: join(dir, "landing"),
      app: join(dir, "app"),
      docs: join(dir, "docs"),
    });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const addDocsPage = (name, link) =>
    writeFileSync(join(dir, "docs", name), `<a href="${link}">x</a>`);

  const reasons = () =>
    checkSiteLinks({ mounts, segments: SEGMENTS })
      .problems.map((p) => p.reason)
      .sort();

  const runCli = (args) =>
    spawnSync(process.execPath, [SCRIPT, ...args], {
      env: { ...process.env, REQUIRE_DOCS_DIST: "1" },
      encoding: "utf8",
    });

  it("accepts a site whose links all resolve", () => {
    const result = checkSiteLinks({ mounts, segments: SEGMENTS });

    assert.deepEqual(result.problems, []);
    assert.ok(result.filesScanned > 0 && result.linksChecked > 0);
  });

  it("rejects a content link to the legacy /editor/ path", () => {
    // The bug this guard exists for: 13 converter pages linked
    // kaiord.com/editor/, which crawlers only ever see as a 404.
    writeFileSync(
      join(dir, "docs", "guide", "convert.md"),
      "Open [kaiord.com/editor](https://kaiord.com/editor/)."
    );

    assert.deepEqual(reasons(), [
      "links the legacy /editor/ path; link https://kaiord.com/app/ instead",
    ]);
  });

  it("rejects a link to a page that is not built", () => {
    addDocsPage("broken.html", "https://kaiord.com/docs/guide/missing");

    assert.deepEqual(reasons(), ["no page is served at /docs/guide/missing"]);
  });

  it("rejects a trailing-slash link to a page served as a file", () => {
    // Breadcrumb JSON-LD linked /docs/guide/quick-start/: Pages only serves
    // guide/quick-start.html at the extensionless URL, so the slash is a 404.
    addDocsPage("crumb.html", "https://kaiord.com/docs/guide/quick-start/");
    addDocsPage("dir.html", "https://kaiord.com/docs/guide/");

    assert.deepEqual(reasons(), [
      "no page is served at /docs/guide/",
      "no page is served at /docs/guide/quick-start/",
    ]);
  });

  it("rejects an SPA deep link to a route the app does not have", () => {
    addDocsPage("deep.html", "https://kaiord.com/app/#/convert?from=fit");

    assert.deepEqual(reasons(), [
      'SPA route "/convert" is not in route-segments.json',
    ]);
  });

  it("rejects a language switcher pointing at an untranslated page", () => {
    // VitePress's default switcher links "/es/<same path>", a 404 on every
    // page without a Spanish translation (i18nRouting must stay false).
    writeFileSync(
      join(dir, "docs", "switcher.html"),
      '<a class="VPLink link" href="/docs/es/guide/quick-start" rel="alternate" lang="es" hreflang="es">Español</a>'
    );

    assert.deepEqual(reasons(), [
      "language switcher: no page is served at /docs/es/guide/quick-start",
    ]);
  });

  it("passes under REQUIRE_DOCS_DIST=1 when every docs page has a switcher", () => {
    const result = runCli([
      "--landing",
      join(dir, "landing"),
      "--app",
      join(dir, "app"),
      "--docs",
      join(dir, "docs"),
    ]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /language-switcher links/);
  });

  it("fails under REQUIRE_DOCS_DIST=1 when a docs page renders no switcher", () => {
    // A switcher the scan cannot see is a switcher nobody checks: a VitePress
    // markup change would silently turn the switcher guard green.
    writeFileSync(join(dir, "docs", "bare.html"), "<p>no switcher</p>");
    writeFileSync(join(dir, "docs", "404.html"), "<p>not found</p>");

    const split = runCli([
      "--landing",
      join(dir, "landing"),
      "--app",
      join(dir, "app"),
      "--docs",
      join(dir, "docs"),
    ]);

    assert.equal(split.status, 1);
    assert.match(split.stderr, /1 docs pages render no language switcher/);
    assert.match(split.stderr, /bare\.html/);
  });

  it("resolves a merged tree the same way as the three dists", () => {
    const merged = join(dir, "merged");
    cpSync(join(dir, "landing"), merged, { recursive: true });
    cpSync(join(dir, "app"), join(merged, "app"), { recursive: true });
    cpSync(join(dir, "docs"), join(merged, "docs"), { recursive: true });
    mkdirSync(join(merged, "editor"));
    writeFileSync(
      join(merged, "editor", "index.html"),
      '<link rel="canonical" href="https://kaiord.com/app/" />'
    );

    assert.deepEqual(
      checkSiteLinks({
        mounts: mountsFromArgs({ merged }),
        segments: SEGMENTS,
      }).problems,
      []
    );
  });

  it("treats /app without a trailing slash as the SPA", () => {
    // Pages redirects /app to /app/ and keeps the fragment, so a deep link
    // written without the slash reaches the same router.
    addDocsPage("bare.html", "https://kaiord.com/app#/bogus");

    assert.deepEqual(reasons(), [
      'SPA route "/bogus" is not in route-segments.json',
    ]);
  });

  it("rejects a root-relative /editor link in built HTML", () => {
    // An absolute-URL scan cannot see href="/editor/…", which lands on the
    // same 404 for crawlers.
    writeFileSync(
      join(dir, "landing", "cta.html"),
      '<a href="/editor/calendar">Open</a><a href="/app/">ok</a>'
    );

    assert.deepEqual(reasons(), [
      "links the legacy /editor/ path; link https://kaiord.com/app/ instead",
    ]);
  });

  it("checks links in sitemaps and robots.txt", () => {
    writeFileSync(
      join(dir, "landing", "sitemap.xml"),
      "<urlset><url><loc>https://kaiord.com/docs/gone</loc></url></urlset>"
    );
    writeFileSync(
      join(dir, "landing", "robots.txt"),
      "Sitemap: https://kaiord.com/sitemap-missing.xml\n"
    );

    assert.deepEqual(reasons(), [
      "no page is served at /docs/gone",
      "no page is served at /sitemap-missing.xml",
    ]);
  });

  it("fails under REQUIRE_DOCS_DIST=1 when the dists are empty", () => {
    // An existing but empty directory scanned zero files and passed.
    const empty = join(dir, "empty");
    mkdirSync(join(empty, "app"), { recursive: true });
    mkdirSync(join(empty, "docs"));

    const split = runCli([
      "--landing",
      empty,
      "--app",
      join(empty, "app"),
      "--docs",
      join(empty, "docs"),
    ]);
    const merged = runCli(["--merged", empty]);

    assert.equal(split.status, 1);
    assert.match(split.stderr, /index\.html/);
    assert.equal(merged.status, 1);
    assert.match(merged.stderr, /index\.html/);
  });

  it("fails under REQUIRE_DOCS_DIST=1 when no link is checked", () => {
    const bare = join(dir, "bare");
    for (const sub of ["", "app", "docs"]) {
      mkdirSync(join(bare, sub), { recursive: true });
      writeFileSync(join(bare, sub, "index.html"), "<p>no links</p>");
    }

    const result = runCli(["--merged", bare]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /0 links/);
  });

  it("extracts links from prose without trailing punctuation or entities", () => {
    assert.deepEqual(
      linksIn(
        'See https://kaiord.com/docs/convert/. Or <a href="https://kaiord.com/app/#/?a=1&amp;b=2">. Not https://kaiord.community/x'
      ),
      ["https://kaiord.com/docs/convert/", "https://kaiord.com/app/#/?a=1&b=2"]
    );
  });

  it("fails on a missing dist only when REQUIRE_DOCS_DIST=1", () => {
    const args = [SCRIPT, "--merged", join(dir, "nope")];
    const env = { ...process.env, REQUIRE_DOCS_DIST: "" };

    const lenient = spawnSync(process.execPath, args, {
      env,
      encoding: "utf8",
    });
    const strict = spawnSync(process.execPath, args, {
      env: { ...env, REQUIRE_DOCS_DIST: "1" },
      encoding: "utf8",
    });

    assert.equal(lenient.status, 0);
    assert.match(lenient.stdout, /skipped, dist not built/);
    assert.equal(strict.status, 1);
    assert.match(strict.stderr, /Site dist missing/);
  });
});
