import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, test } from "node:test";

import {
  absoluteUrls,
  brokenUrls,
  checkDist,
} from "./check-css-asset-urls.mjs";

const FONT = "fonts/inter-var-latin.woff2";

const makeDist = (css) => {
  const dist = mkdtempSync(join(tmpdir(), "css-asset-urls-"));
  mkdirSync(join(dist, "fonts"));
  mkdirSync(join(dist, "assets"));
  writeFileSync(join(dist, FONT), "");
  writeFileSync(join(dist, "assets", "index.css"), css);
  return dist;
};

const dists = [];
const dist = (css) => {
  const dir = makeDist(css);
  dists.push(dir);
  return dir;
};
after(() => dists.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("check-css-asset-urls", () => {
  test("should flag a font left under the old /editor/ base", () => {
    // Arrange
    const dir = dist(`@font-face{src:url(/editor/${FONT}) format("woff2")}`);

    // Act
    const result = checkDist({ dist: dir, base: "/app/" });

    // Assert
    assert.deepEqual(result.broken, [`index.css: /editor/${FONT}`]);
  });

  test("should pass the font under the /app/ base", () => {
    // Arrange
    const dir = dist(`@font-face{src:url("/app/${FONT}")}`);

    // Act
    const result = checkDist({ dist: dir, base: "/app/" });

    // Assert
    assert.deepEqual(result, { sheets: 1, broken: [] });
  });

  test("should pass the font under the root base", () => {
    // Arrange
    const dir = dist(`@font-face{src:url('/${FONT}')}`);

    // Act
    const result = checkDist({ dist: dir, base: "/" });

    // Assert
    assert.deepEqual(result.broken, []);
  });

  test("should flag a url under the base whose file is missing", () => {
    // Arrange
    const css = "a{background:url(/app/img/missing.png)}";

    // Act
    const broken = brokenUrls(css, { dist: dist(css), base: "/app" });

    // Assert
    assert.deepEqual(broken, ["/app/img/missing.png"]);
  });

  test("should ignore data, remote and relative urls", () => {
    // Arrange
    const css =
      "a{b:url(data:image/png;base64,AA==);c:url(https://x.test/f.woff2);" +
      "d:url(//cdn.test/f.woff2);e:url(./rel.png);f:url(../up.png)}";

    // Act
    const urls = absoluteUrls(css);

    // Assert
    assert.deepEqual(urls, []);
  });

  test("should strip a query or hash before looking the file up", () => {
    // Arrange
    const dir = dist(`@font-face{src:url(/app/${FONT}?v=2#iefix)}`);

    // Act
    const result = checkDist({ dist: dir, base: "/app/" });

    // Assert
    assert.deepEqual(result.broken, []);
  });

  test("should fail when the dist has no stylesheet at all", () => {
    // Arrange
    const empty = mkdtempSync(join(tmpdir(), "css-asset-urls-"));
    dists.push(empty);

    // Act
    const result = checkDist({ dist: empty, base: "/app/" });

    // Assert
    assert.equal(result.sheets, 0);
    assert.equal(result.broken.length, 1);
  });
});
