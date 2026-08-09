import assert from "node:assert/strict";
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

import {
  assertPrecedesVisibleMarkup,
  injectSpaFallback,
} from "./inject-spa-fallback.mjs";

function extractIife(html) {
  const match = html.match(
    /<script>\(function\(\)\{([\s\S]*?)\}\)\(\);<\/script>/
  );
  if (!match) throw new Error("could not extract the injected IIFE");
  return new Function("window", match[1]);
}

function simulateLocation(fn, pathname, search = "") {
  let replacedTo = null;
  fn({
    location: {
      protocol: "https:",
      host: "example.test",
      pathname,
      search,
      hash: "",
      replace: (url) => {
        replacedTo = url;
      },
    },
  });
  return replacedTo;
}

describe("inject-spa-fallback", () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "spa-fallback-"));
    mkdirSync(join(dir, "app"));
    writeFileSync(
      join(dir, "404.html"),
      "<!DOCTYPE html><html><head><title>404</title></head><body>This page doesn't exist.</body></html>"
    );
    writeFileSync(
      join(dir, "app", "index.html"),
      "<!DOCTYPE html><html><head><title>x</title></head><body></body></html>"
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("puts the redirect before anything the browser would paint", () => {
    // The bug this bridge existed to avoid was not a missing script but a
    // late one: appended after </body>, the error page is fully painted
    // before the redirect runs.
    injectSpaFallback(dir);

    const html = readFileSync(join(dir, "404.html"), "utf8");
    const scriptAt = html.indexOf("indexOf('/editor/')");
    const bodyAt = html.indexOf("<body");

    assert.ok(scriptAt > -1, "redirect script present");
    assert.ok(
      scriptAt < bodyAt,
      `redirect at ${scriptAt} must precede <body> at ${bodyAt}`
    );
  });

  it("rejects a snippet that sits after the visible markup", () => {
    // Guards the guard. The previous check asserted presence, and an appended
    // script satisfies presence exactly as well as a head-injected one — which
    // is how a visible error page shipped on every deep link while the check
    // stayed green. Asserted against the assertion itself: re-running the
    // injector would simply inject a second, well-placed copy and pass.
    const appended =
      "<!DOCTYPE html><html><head></head><body>gone</body></html>" +
      "<script>(function(){window.location.pathname.indexOf('/editor/')})();</script>";

    assert.throws(
      () =>
        assertPrecedesVisibleMarkup(appended, "indexOf('/editor/')", "x.html"),
      /after the first visible markup/
    );
  });

  it("accepts the same snippet once it precedes the markup", () => {
    const injected =
      "<!DOCTYPE html><html><head>" +
      "<script>(function(){window.location.pathname.indexOf('/editor/')})();</script>" +
      "</head><body>gone</body></html>";

    assert.doesNotThrow(() =>
      assertPrecedesVisibleMarkup(injected, "indexOf('/editor/')", "x.html")
    );
  });

  it("sends a legacy /editor path to the same route in the fragment", () => {
    injectSpaFallback(dir);
    const fn = extractIife(readFileSync(join(dir, "404.html"), "utf8"));

    assert.equal(
      simulateLocation(fn, "/editor/calendar/2026-W32"),
      "/app/#/calendar/2026-W32"
    );
    assert.equal(
      simulateLocation(fn, "/editor/workout/abc", "?from=chat"),
      "/app/#/workout/abc?from=chat"
    );
  });

  it("keeps serving the pre-prefix bookmarks in the allowlist", () => {
    injectSpaFallback(dir);
    const fn = extractIife(readFileSync(join(dir, "404.html"), "utf8"));

    assert.equal(simulateLocation(fn, "/library"), "/app/#/library");
    assert.equal(simulateLocation(fn, "/workout/abc"), "/app/#/workout/abc");
    assert.equal(simulateLocation(fn, "/calendar"), "/app/#/calendar");
  });

  it("leaves an unrelated 404 alone, so the landing's error page still shows", () => {
    injectSpaFallback(dir);
    const fn = extractIife(readFileSync(join(dir, "404.html"), "utf8"));

    assert.equal(simulateLocation(fn, "/typo-here"), null);
    assert.equal(simulateLocation(fn, "/calendarx"), null);
    assert.equal(simulateLocation(fn, "/docs/guide/intro"), null);
  });

  it("translates a ?p= link minted by the previous bridge", () => {
    injectSpaFallback(dir);
    const html = readFileSync(join(dir, "app", "index.html"), "utf8");
    const match = html.match(
      /<script>\(function\(\)\{([\s\S]*?)\}\)\(\);<\/script>/
    );
    assert.ok(match, "decoder present");

    let replacedTo = null;
    const fakeWindow = {
      location: { search: "?p=" + encodeURIComponent("/editor/library") },
      history: {
        replaceState: (_s, _t, url) => {
          replacedTo = url;
        },
      },
    };
    new Function("window", "URLSearchParams", match[1])(
      fakeWindow,
      URLSearchParams
    );

    assert.equal(replacedTo, "/app/#/library");
  });

  it("fails loudly when the document has no head to inject into", () => {
    writeFileSync(
      join(dir, "404.html"),
      "<!DOCTYPE html><html><body>404</body></html>"
    );

    assert.throws(() => injectSpaFallback(dir), /Could not find <head>/);
  });
});
