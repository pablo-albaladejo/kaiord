import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  BRIDGE_MARKER,
  emitLegacyEditorPage,
} from "./emit-legacy-editor-page.mjs";
import {
  assertPrecedesVisibleMarkup,
  injectSpaFallback,
} from "./inject-spa-fallback.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REAL_404 = join(REPO_ROOT, "packages/landing/public/404.html");

// The URLs the /editor/ page can actually receive: GitHub Pages serves
// editor/index.html for both the directory and the explicit file name.
const URL_TABLE = [
  { pathname: "/editor/", search: "" },
  { pathname: "/editor/", search: "?utm_source=t" },
  { pathname: "/editor/index.html", search: "?a=1&b=2" },
];

// Located by content, never by position: the real 404.html also carries the
// Umami loader script, and picking it by accident would compare nothing.
function extractScript(html, marker) {
  const matches = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .filter((body) => body.includes(marker));
  assert.equal(
    matches.length,
    1,
    `expected exactly one <script> containing ${marker}, found ${matches.length}`
  );
  return matches[0];
}

function redirectTarget(script, { pathname, search }) {
  let target = null;
  runInNewContext(script, {
    window: {
      location: {
        pathname,
        search,
        replace: (url) => {
          target = url;
        },
      },
    },
  });
  return target;
}

function assertSameTargets(bridgeScript, pageScript) {
  for (const row of URL_TABLE) {
    assert.equal(
      redirectTarget(pageScript, row),
      redirectTarget(bridgeScript, row),
      `/editor/ page and 404 bridge disagree on ${row.pathname}${row.search}`
    );
  }
}

describe("emit-legacy-editor-page", () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "legacy-editor-page-"));
    mkdirSync(join(dir, "app"));
    copyFileSync(REAL_404, join(dir, "404.html"));
    writeFileSync(
      join(dir, "app", "index.html"),
      "<!DOCTYPE html><html><head><title>x</title></head><body></body></html>"
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const emitBoth = () => {
    injectSpaFallback(dir);
    emitLegacyEditorPage(dir);
    return {
      bridge: readFileSync(join(dir, "404.html"), "utf8"),
      page: readFileSync(join(dir, "editor", "index.html"), "utf8"),
    };
  };

  it("redirects every URL it serves to the same target as the 404 bridge", () => {
    const { bridge, page } = emitBoth();

    assertSameTargets(
      extractScript(bridge, BRIDGE_MARKER),
      extractScript(page, BRIDGE_MARKER)
    );
  });

  it("keeps the query string, after the fragment, as the bridge does", () => {
    const { page } = emitBoth();

    assert.equal(
      redirectTarget(extractScript(page, BRIDGE_MARKER), URL_TABLE[1]),
      "/app/#/?utm_source=t"
    );
  });

  it("detects a page script that drops the query string", () => {
    // Guards the guard: a parity check that cannot see search loss would
    // let the /editor/ page silently strip UTM parameters.
    const { bridge, page } = emitBoth();
    const mutated = extractScript(page, BRIDGE_MARKER).replace("+l.search", "");

    assert.notEqual(mutated, extractScript(page, BRIDGE_MARKER));
    assert.throws(
      () => assertSameTargets(extractScript(bridge, BRIDGE_MARKER), mutated),
      /disagree on \/editor\/\?utm_source=t/
    );
  });

  it("serves a canonical to /app/ and a no-JS way out, without noindex", () => {
    const { page } = emitBoth();

    assert.match(
      page,
      /<link rel="canonical" href="https:\/\/kaiord\.com\/app\/" \/>/
    );
    assert.match(
      page,
      /<meta http-equiv="refresh" content="0; url=\/app\/" \/>/
    );
    assert.match(page, /<a href="\/app\/">/);
    assert.doesNotMatch(page, /noindex/i);
    assert.doesNotThrow(() =>
      assertPrecedesVisibleMarkup(page, BRIDGE_MARKER, "editor/index.html")
    );
  });

  it("refuses to run before the bridge is injected", () => {
    assert.throws(() => emitLegacyEditorPage(dir), /bridge not found/);
  });

  it("refuses to overwrite an existing editor/index.html", () => {
    injectSpaFallback(dir);
    mkdirSync(join(dir, "editor"));
    writeFileSync(join(dir, "editor", "index.html"), "keep me");

    assert.throws(() => emitLegacyEditorPage(dir), /refusing to overwrite/);
    assert.equal(
      readFileSync(join(dir, "editor", "index.html"), "utf8"),
      "keep me"
    );
  });
});
