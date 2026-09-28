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
      .map((p) => p.reason)
      .sort();

  it("accepts a site whose links all resolve", () => {
    assert.deepEqual(checkSiteLinks({ mounts, segments: SEGMENTS }), []);
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
      }),
      []
    );
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
