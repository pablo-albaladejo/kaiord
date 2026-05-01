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
});
