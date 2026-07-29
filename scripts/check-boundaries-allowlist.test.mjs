import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";

import {
  ALLOWLIST_PACKAGE_ROOT,
  BOUNDARIES_ALLOWLIST,
  BOUNDARIES_ALLOWLIST_MAX,
  boundariesAllowlistPaths,
} from "./boundaries-allowlist.mjs";
import { checkBoundariesAllowlist } from "./check-boundaries-allowlist.mjs";

const sandboxes = [];

/** Builds a throwaway repo root containing only the given files. */
function sandbox(files) {
  const root = mkdtempSync(join(tmpdir(), "boundaries-allowlist-"));
  sandboxes.push(root);
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, ALLOWLIST_PACKAGE_ROOT, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  return root;
}

after(() => {
  for (const root of sandboxes) rmSync(root, { recursive: true, force: true });
});

describe("boundaries allowlist", () => {
  it("should hold the shrink-only invariant against the real repo", () => {
    // Arrange
    const expected = [];

    // Act
    const problems = checkBoundariesAllowlist();

    // Assert
    assert.deepEqual(problems, expected);
  });

  it("should never exceed the pinned high-water mark", () => {
    // Arrange
    const max = BOUNDARIES_ALLOWLIST_MAX;

    // Act
    const actual = BOUNDARIES_ALLOWLIST.length;

    // Assert
    assert.ok(
      actual <= max,
      `allowlist has ${actual} entries but the ceiling is ${max}; it is shrink-only`
    );
  });

  it("should give every parked entry a substantive reason", () => {
    // Arrange
    const entries = BOUNDARIES_ALLOWLIST;

    // Act
    const missing = entries.filter(
      (e) => !e.reason || e.reason.trim().length < 40
    );

    // Assert
    assert.deepEqual(missing, []);
  });

  it("should expose repo-root-relative paths for eslint ignores", () => {
    // Arrange
    const prefix = `${ALLOWLIST_PACKAGE_ROOT}/`;

    // Act
    const paths = boundariesAllowlistPaths();

    // Assert
    assert.ok(paths.length === BOUNDARIES_ALLOWLIST.length);
    assert.ok(paths.every((p) => p.startsWith(prefix)));
  });

  it("should reject an entry whose file no longer imports adapters", () => {
    // Arrange
    const files = Object.fromEntries(
      BOUNDARIES_ALLOWLIST.map((e) => [
        e.file,
        e.file === BOUNDARIES_ALLOWLIST[0].file
          ? "export const clean = 1;\n"
          : 'import { db } from "../adapters/dexie/dexie-database";\n',
      ])
    );
    const root = sandbox(files);

    // Act
    const problems = checkBoundariesAllowlist(root);

    // Assert
    assert.equal(problems.length, 1);
    assert.match(problems[0], /no longer imports adapters/);
  });

  it("should reject an entry whose file was deleted", () => {
    // Arrange
    const files = Object.fromEntries(
      BOUNDARIES_ALLOWLIST.slice(1).map((e) => [
        e.file,
        'import { db } from "../adapters/dexie/dexie-database";\n',
      ])
    );
    const root = sandbox(files);

    // Act
    const problems = checkBoundariesAllowlist(root);

    // Assert
    assert.equal(problems.length, 1);
    assert.match(problems[0], /no longer exists/);
  });
});
