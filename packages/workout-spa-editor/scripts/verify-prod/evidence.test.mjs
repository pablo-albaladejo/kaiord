import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createEvidence, isHashedAsset, readEntryScript } from "./evidence.mjs";
import { formatEvidence, hasAssetFailure } from "./evidence-format.mjs";

function collectorAt(times) {
  let i = 0;
  return createEvidence(1000, () => times[i++]);
}

describe("createEvidence", () => {
  it("should timestamp navigations relative to the check start", () => {
    // Arrange
    const c = collectorAt([1000, 1250]);

    // Act
    c.navigation("https://x/app/#/a");
    c.navigation("https://x/app/#/b");

    // Assert
    assert.deepEqual(c.evidence.navigations, [
      { ms: 0, url: "https://x/app/#/a" },
      { ms: 250, url: "https://x/app/#/b" },
    ]);
  });

  it("should keep only responses with status >= 400 plus failed requests", () => {
    // Arrange
    const c = collectorAt([]);

    // Act
    c.response(200, "https://x/ok");
    c.response(404, "https://x/app/assets/a-abc123.js");
    c.requestFailed("https://x/net", "net::ERR_ABORTED");

    // Assert
    assert.deepEqual(c.evidence.failedRequests, [
      { what: 404, url: "https://x/app/assets/a-abc123.js" },
      { what: "net::ERR_ABORTED", url: "https://x/net" },
    ]);
  });

  it("should record console and page errors", () => {
    // Arrange
    const c = collectorAt([]);

    // Act
    c.console("boom\n  stack");
    c.pageError("bad");

    // Assert
    assert.deepEqual(c.evidence.errors, [
      "console: boom stack",
      "pageerror: bad",
    ]);
  });
});

describe("isHashedAsset / hasAssetFailure", () => {
  it("should match hashed files under /app/assets/ only", () => {
    assert.equal(
      isHashedAsset("https://k.com/app/assets/index-BoUQiELf.js"),
      true
    );
    assert.equal(isHashedAsset("https://k.com/app/version.json"), false);
    assert.equal(isHashedAsset("https://k.com/api/assets/x-abcdef.js"), false);
  });

  it("should flag a session whose failed requests include a hashed asset", () => {
    // Arrange
    const c = collectorAt([]);
    c.response(404, "https://k.com/app/assets/chunk-Abc12345.js");

    // Act / Assert
    assert.equal(hasAssetFailure([c.evidence]), true);
    assert.equal(hasAssetFailure([collectorAt([]).evidence]), false);
  });
});

describe("formatEvidence", () => {
  it("should print timeline, failed requests, errors and the propagation hint", () => {
    // Arrange
    const c = collectorAt([1100]);
    c.navigation("https://k.com/app/#/workout/new");
    c.response(404, "https://k.com/app/assets/chunk-Abc12345.js");
    c.pageError("ChunkLoadError");

    // Act
    const out = formatEvidence("fit-import", [c.evidence]);

    // Assert
    assert.match(out, /evidence for fit-import:/);
    assert.match(out, /asset 404 during propagation/);
    assert.match(out, /\+100ms https:\/\/k\.com\/app\/#\/workout\/new/);
    assert.match(out, /404 https:\/\/k\.com\/app\/assets\/chunk-Abc12345\.js/);
    assert.match(out, /pageerror: ChunkLoadError/);
  });

  it("should say none for empty sections and cap long lists", () => {
    // Arrange
    const c = collectorAt([]);
    for (let i = 0; i < 15; i++) c.response(500, `https://k.com/r${i}`);

    // Act
    const out = formatEvidence("x", [c.evidence]);

    // Assert
    assert.match(out, /navigations: none/);
    assert.match(out, /errors: none/);
    assert.match(out, /\.\.\. 3 more/);
    assert.doesNotMatch(out, /asset 404/);
  });
});

describe("readEntryScript", () => {
  it("should return the module script src of index.html", async () => {
    // Arrange
    const html =
      '<script>x</script><script type="module" crossorigin src="/app/assets/index-A1.js"></script>';
    const fetchImpl = async () => ({ ok: true, text: async () => html });

    // Act / Assert
    assert.equal(
      await readEntryScript("b", fetchImpl),
      "/app/assets/index-A1.js"
    );
  });

  it("should return unknown on failure", async () => {
    // Arrange
    const fetchImpl = async () => {
      throw new Error("down");
    };

    // Act / Assert
    assert.equal(await readEntryScript("b", fetchImpl), "unknown");
  });
});
