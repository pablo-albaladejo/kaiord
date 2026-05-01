import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { injectSpaFallback } from "./inject-spa-fallback.mjs";

describe("inject-spa-fallback", () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "spa-fallback-"));
    mkdirSync(join(dir, "editor"));
    writeFileSync(
      join(dir, "404.html"),
      "<!DOCTYPE html><html><body>404 base</body></html>"
    );
    writeFileSync(
      join(dir, "editor", "index.html"),
      "<!DOCTYPE html><html><head><title>x</title></head><body></body></html>"
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("appends the redirect script to 404.html", () => {
    injectSpaFallback(dir);

    const fourOhFour = readFileSync(join(dir, "404.html"), "utf8");
    assert.match(fourOhFour, /indexOf\('\/editor\/'\)/);
    assert.match(fourOhFour, /window\.location/);
  });

  it("injects the decoder into editor/index.html <head>", () => {
    injectSpaFallback(dir);

    const editor = readFileSync(join(dir, "editor", "index.html"), "utf8");
    assert.match(editor, /URLSearchParams/);
    assert.match(editor, /history\.replaceState/);
    // decoder must come before the existing head content (i.e. before <title>)
    const decoderIdx = editor.indexOf("URLSearchParams");
    const titleIdx = editor.indexOf("<title>");
    assert.ok(
      decoderIdx < titleIdx,
      "decoder must run synchronously before any other head content"
    );
  });

  it("throws when editor/index.html lacks <head>", () => {
    writeFileSync(
      join(dir, "editor", "index.html"),
      "<!DOCTYPE html><html><body></body></html>"
    );

    assert.throws(() => injectSpaFallback(dir), /Could not find <head>/);
  });

  it("preserves the original 404 body content", () => {
    injectSpaFallback(dir);

    const fourOhFour = readFileSync(join(dir, "404.html"), "utf8");
    assert.match(fourOhFour, /404 base/);
  });

  it("legacy-route allowlist: simulating a /calendar visit redirects to /editor/?p=%2Feditor%2Fcalendar", () => {
    injectSpaFallback(dir);

    const fourOhFour = readFileSync(join(dir, "404.html"), "utf8");
    const fn = extractRedirectFn(fourOhFour);

    const replaced = simulateLocation(fn, "/calendar");

    assert.equal(
      replaced,
      "https://example.test/editor/?p=" + encodeURIComponent("/editor/calendar")
    );
  });

  it("legacy-route allowlist: /library and /workout/abc also redirect", () => {
    injectSpaFallback(dir);

    const fourOhFour = readFileSync(join(dir, "404.html"), "utf8");
    const fn = extractRedirectFn(fourOhFour);

    assert.equal(
      simulateLocation(fn, "/library"),
      "https://example.test/editor/?p=" + encodeURIComponent("/editor/library")
    );
    assert.equal(
      simulateLocation(fn, "/workout/abc"),
      "https://example.test/editor/?p=" +
        encodeURIComponent("/editor/workout/abc")
    );
  });

  it("does NOT redirect arbitrary 404s that aren't in the allowlist", () => {
    injectSpaFallback(dir);

    const fourOhFour = readFileSync(join(dir, "404.html"), "utf8");
    const fn = extractRedirectFn(fourOhFour);

    assert.equal(simulateLocation(fn, "/typo-here"), null);
    assert.equal(simulateLocation(fn, "/some/random/path"), null);
    // /calendarx should NOT match — must be exact /calendar or /calendar/<rest>
    assert.equal(simulateLocation(fn, "/calendarx"), null);
  });

  it("/editor/* deep links keep using the existing rafgraph bounce, not the legacy path", () => {
    injectSpaFallback(dir);

    const fourOhFour = readFileSync(join(dir, "404.html"), "utf8");
    const fn = extractRedirectFn(fourOhFour);

    assert.equal(
      simulateLocation(fn, "/editor/calendar"),
      "https://example.test/editor/?p=" + encodeURIComponent("/editor/calendar")
    );
  });
});

// --- helpers ---

// Extract the IIFE body from the injected redirect <script> so we can run it
// against a synthetic window.location and verify behaviour.
function extractRedirectFn(html) {
  const match = html.match(
    /<script>\s*\(function \(\) \{([\s\S]*?)\}\)\(\);\s*<\/script>/
  );
  if (!match) throw new Error("could not extract redirect IIFE");
  return new Function("window", `${match[1]}`);
}

function simulateLocation(fn, pathname) {
  let replacedTo = null;
  const fakeWindow = {
    location: {
      protocol: "https:",
      host: "example.test",
      pathname,
      search: "",
      hash: "",
      replace: (url) => {
        replacedTo = url;
      },
    },
  };
  fn(fakeWindow);
  return replacedTo;
}
