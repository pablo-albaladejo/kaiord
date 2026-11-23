import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { checkKill, checkManifest } from "./sw-precache-audit.mjs";

const put = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const hex = (text) => createHash("sha256").update(text).digest("hex");

const entry = (rel, bytes, key) => ({
  url: `/app/${rel}`,
  revision: hex(bytes),
  key: key ?? `/app/${rel}`,
});

describe("sw-precache-audit", () => {
  let app;

  beforeEach(() => {
    app = mkdtempSync(join(tmpdir(), "sw-audit-"));
    put(join(app, "index.html"), "shell");
    put(join(app, "assets/index-AAAA.js"), "entry");
    put(join(app, "assets/index-AAAA.js.map"), "map");
  });

  afterEach(() => rmSync(app, { recursive: true, force: true }));

  it("should find nothing wrong when the manifest lists exactly the shipped bytes", () => {
    // Arrange
    const shell = `/app/index.html?__rev=${hex("shell")}`;
    const manifest = [
      entry("assets/index-AAAA.js", "entry"),
      entry("index.html", "shell", shell),
    ];

    // Act
    const problems = checkManifest(app, "/app/", manifest);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should name each disagreement: other bytes, a wrong key, an outsider, an unlisted file", () => {
    // Arrange
    const manifest = [
      entry("index.html", "other bytes"),
      { url: "/elsewhere/x.js", revision: hex("x"), key: "/elsewhere/x.js" },
    ];

    // Act
    const problems = checkManifest(app, "/app/", manifest);

    // Assert
    assert.deepEqual(problems, [
      "index.html: shipped bytes do not match its revision",
      "index.html: not keyed by ?__rev=<revision>",
      "/elsewhere/x.js: outside the scope /app/",
      "assets/index-AAAA.js: shipped but not precached",
    ]);
  });

  it("should fail an empty manifest and an excluded file that is listed", () => {
    // Arrange
    const listed = [entry("assets/index-AAAA.js.map", "map")];

    // Act
    const empty = checkManifest(app, "/app/", []);
    const excluded = checkManifest(app, "/app/", listed);

    // Assert
    assert.deepEqual(empty, ["the manifest is empty"]);
    assert.ok(
      excluded.includes("assets/index-AAAA.js.map: excluded but listed")
    );
  });

  it("should refuse a kill worker that fetches, claims or reaches uncontrolled windows", () => {
    // Arrange
    const bad = `addEventListener("fetch", f); clients.claim(); matchAll({includeUncontrolled: true})`;

    // Act
    const problems = checkKill(bad);

    // Assert
    assert.equal(problems.length, 3);
    assert.deepEqual(checkKill("self.registration.unregister();"), []);
  });
});
