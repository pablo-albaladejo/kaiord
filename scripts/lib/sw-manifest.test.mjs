import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { buildManifest, versionOf } from "./sw-manifest.mjs";

const put = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const hex = (text) => createHash("sha256").update(text).digest("hex");

describe("sw-manifest", () => {
  let app;

  beforeEach(() => {
    app = mkdtempSync(join(tmpdir(), "sw-manifest-"));
    put(join(app, "index.html"), "shell");
    put(join(app, "assets/index-AAAA.js"), "entry");
    put(join(app, "assets/index-AAAA.js.map"), "map");
    put(join(app, "assets/.keep"), "");
    put(join(app, "sw.js"), "old worker");
    put(join(app, "version.json"), "{}");
    put(join(app, "og-image-editor.png"), "og");
    put(join(app, "CLAUDE.md"), "notes");
  });

  afterEach(() => rmSync(app, { recursive: true, force: true }));

  it("should list only shipped files, sorted, keyed by URL for chunks and by ?__rev= otherwise", () => {
    // Arrange
    const scope = "/app/";

    // Act
    const manifest = buildManifest(app, scope);

    // Assert
    assert.deepEqual(manifest, [
      {
        url: "/app/assets/index-AAAA.js",
        revision: hex("entry"),
        key: "/app/assets/index-AAAA.js",
      },
      {
        url: "/app/index.html",
        revision: hex("shell"),
        key: `/app/index.html?__rev=${hex("shell")}`,
      },
    ]);
  });

  it("should name a version of twelve hex characters that any changed revision changes", () => {
    // Arrange
    const before = versionOf(buildManifest(app, "/app/"));
    put(join(app, "index.html"), "shell v2");

    // Act
    const after = versionOf(buildManifest(app, "/app/"));

    // Assert
    assert.match(before, /^[0-9a-f]{12}$/);
    assert.notEqual(after, before);
  });
});
