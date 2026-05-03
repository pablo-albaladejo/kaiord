import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  __setAllowlistForTest,
  collectTitleViolations,
  findFiles,
  isInScope,
  stripPlaceholders,
} from "./check-test-title-should.mjs";

function makeTempTree(setup) {
  const root = mkdtempSync(join(tmpdir(), "title-guard-"));
  setup(root);
  return root;
}

test("conformant should-prefixed title passes", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "x.test.ts"),
      `it("should render correctly", () => {});`
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("non-should title fails with path:line", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "x.test.ts"),
      `it("renders correctly", () => {});`
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0].path, /packages\/x\/x\.test\.ts/);
    assert.equal(violations[0].line, 1);
    assert.equal(violations[0].title, "renders correctly");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("it.skip / it.only / it.todo / it.fails subject to same rule", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "x.test.ts"),
      [
        `it.skip("renders X", () => {});`,
        `it.only("returns Y", () => {});`,
        `it.todo("handles edge");`,
        `it.fails("throws on bad", () => {});`,
      ].join("\n")
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.equal(violations.length, 4);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("it.each with %s placeholder is stripped before prefix check", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "x.test.ts"),
      `it.each([1, 2])("should compute for %s", (v) => {});`
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert — placeholder is stripped; "should " prefix passes
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("template literal title supported when statically analyzable", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "x.test.ts"),
      "it(`should handle template literal`, () => {});"
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("allowlist hit silently passes despite non-conformant title", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "legacy.test.ts"),
      `it("renders X", () => {});`
    );
  });
  __setAllowlistForTest(new Set(["packages/x/legacy.test.ts:1"]));

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert — entry is in allowlist, no violation reported
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Capital-S Should is rejected (case-sensitive lowercase)", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "x.test.ts"),
      `it("Should render X", () => {});`
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.equal(violations.length, 1);
    assert.equal(violations[0].title, "Should render X");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("file with zero it() calls silently passes", () => {
  // Arrange
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "x", "fixtures.test.ts"),
      `describe("X", () => { /* placeholder */ });`
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("e2e/ paths are excluded from scanning", () => {
  // Arrange — file under /e2e/ contains a violating title; should be ignored
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "spa", "e2e"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "spa", "e2e", "x.test.ts"),
      `it("renders X", () => {});`
    );
  });
  __setAllowlistForTest(new Set());

  try {
    // Act
    const { violations } = collectTitleViolations({
      packagesDir: join(root, "packages"),
      repoRoot: root,
    });

    // Assert
    assert.deepEqual(violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("isInScope rejects out-of-scope paths", () => {
  // Arrange / Act / Assert
  assert.equal(isInScope("packages/x/foo.test.ts"), true);
  assert.equal(isInScope("packages/x/foo.test.tsx"), true);
  assert.equal(isInScope("packages/x/e2e/foo.test.ts"), false);
  assert.equal(isInScope("packages/x/test-utils/foo.test.ts"), false);
  assert.equal(isInScope("packages/x/foo.stories.ts"), false);
  assert.equal(isInScope("node_modules/x/foo.test.ts"), false);
  assert.equal(isInScope("packages/x/test-setup.ts"), false);
});

test("stripPlaceholders removes vitest substitution markers", () => {
  // Arrange / Act / Assert
  assert.equal(stripPlaceholders("renders %s correctly"), "renders  correctly");
  assert.equal(
    stripPlaceholders("computes for %d and %i"),
    "computes for  and "
  );
  assert.equal(
    stripPlaceholders("named placeholder $prop here"),
    "named placeholder  here"
  );
  assert.equal(stripPlaceholders("should X with $1"), "should X with ");
});
