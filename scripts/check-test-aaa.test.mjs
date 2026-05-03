import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  __setAllowlistsForTest,
  collectAaaViolations,
  hasCanonicalMarkers,
  inferShard,
} from "./check-test-aaa.mjs";

function makeTempTree(setup) {
  const root = mkdtempSync(join(tmpdir(), "aaa-guard-"));
  setup(root);
  return root;
}

test("file with three canonical markers per it() body passes", () => {
  // Arrange
  const source = `it("should X", () => {
  // Arrange
  const x = 1;

  // Act
  const y = x + 1;

  // Assert
  expect(y).toBe(2);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert
  assert.equal(result, true);
});

test("file missing // Arrange marker fails", () => {
  // Arrange
  const source = `it("should X", () => {
  const x = 1;

  // Act
  const y = x + 1;

  // Assert
  expect(y).toBe(2);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert
  assert.equal(result, false);
});

test("file missing // Act marker fails", () => {
  // Arrange
  const source = `it("should X", () => {
  // Arrange
  const x = 1;

  const y = x + 1;

  // Assert
  expect(y).toBe(2);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert
  assert.equal(result, false);
});

test("file missing // Assert marker fails", () => {
  // Arrange
  const source = `it("should X", () => {
  // Arrange
  const x = 1;

  // Act
  const y = x + 1;

  expect(y).toBe(2);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert
  assert.equal(result, false);
});

test("multiple statements per section accepted", () => {
  // Arrange
  const source = `it("should X", () => {
  // Arrange
  const x = 1;
  const y = 2;
  const z = 3;

  // Act
  const sum = x + y + z;

  // Assert
  expect(sum).toBe(6);
  expect(sum).toBeGreaterThan(0);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert
  assert.equal(result, true);
});

test("lowercase variant fails (case-sensitive Pascal-case dogma)", () => {
  // Arrange
  const source = `it("should X", () => {
  // arrange
  const x = 1;

  // act
  const y = x + 1;

  // assert
  expect(y).toBe(2);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert
  assert.equal(result, false);
});

test("all-caps variant fails", () => {
  // Arrange
  const source = `it("should X", () => {
  // ARRANGE
  // ACT
  // ASSERT
  expect(true).toBe(true);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert
  assert.equal(result, false);
});

test("trailing punctuation on marker fails", () => {
  // Arrange
  const source = `it("should X", () => {
  // Arrange:
  const x = 1;
  // Act
  const y = x;
  // Assert
  expect(y).toBe(1);
});`;

  // Act
  const result = hasCanonicalMarkers(source);

  // Assert — `// Arrange:` does not match canonical regex
  assert.equal(result, false);
});

test("file with zero it() calls silently passes (no enforcement)", () => {
  // Arrange — fixture loaders, helpers, etc.
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "fixture.test.ts"),
      `describe("X", () => { /* placeholder */ });`
    );
  });
  __setAllowlistsForTest({ BACKEND: new Set(), SPA_NON_COMPONENT: new Set(), SPA_COMPONENT: new Set() });

  try {
    // Act
    const { violations } = collectAaaViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("allowlisted file (BACKEND shard) silently passes", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "core", "src"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "core", "src", "x.test.ts"),
      `it("should X", () => { expect(1).toBe(1); });`
    );
  });
  __setAllowlistsForTest({
    BACKEND: new Set(["packages/core/src/x.test.ts"]),
    SPA_NON_COMPONENT: new Set(),
    SPA_COMPONENT: new Set(),
  });

  try {
    // Act
    const { violations } = collectAaaViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("non-allowlisted backend file with missing markers fails", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "core", "src"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "core", "src", "y.test.ts"),
      `it("should X", () => { expect(1).toBe(1); });`
    );
  });
  __setAllowlistsForTest({
    BACKEND: new Set(),
    SPA_NON_COMPONENT: new Set(),
    SPA_COMPONENT: new Set(),
  });

  try {
    // Act
    const { violations } = collectAaaViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0].path, /packages\/core\/src\/y\.test\.ts/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("inferShard partitions paths into BACKEND / SPA_NON_COMPONENT / SPA_COMPONENT", () => {
  // Arrange / Act / Assert
  assert.equal(inferShard("packages/core/src/x.test.ts"), "BACKEND");
  assert.equal(inferShard("packages/cli/src/y.test.ts"), "BACKEND");
  assert.equal(
    inferShard("packages/workout-spa-editor/src/application/x.test.ts"),
    "SPA_NON_COMPONENT"
  );
  assert.equal(
    inferShard("packages/workout-spa-editor/src/components/X/X.test.tsx"),
    "SPA_COMPONENT"
  );
  assert.equal(
    inferShard("packages/workout-spa-editor/src/App.test.tsx"),
    "SPA_COMPONENT"
  );
});
