// Tests for scripts/check-specs-inventory.mjs using node:test.

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATOR_SRC = readFileSync(
  resolve(__dirname, "generate-specs-inventory.mjs"),
  "utf8"
);
const CHECKER_SRC = readFileSync(
  resolve(__dirname, "check-specs-inventory.mjs"),
  "utf8"
);

function mkHarness() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kaiord-specs-chk-")));
  const specsDir = join(root, "openspec", "specs");
  mkdirSync(join(specsDir, "demo-cap"), { recursive: true });
  writeFileSync(
    join(specsDir, "demo-cap", "spec.md"),
    "# Demo\n\n## Purpose\n\nDemo purpose.\n\n## Requirements\n"
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "generate-specs-inventory.mjs"),
    GENERATOR_SRC
  );
  writeFileSync(
    join(root, "scripts", "check-specs-inventory.mjs"),
    CHECKER_SRC
  );
  return {
    root,
    specsDir,
    generate() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "generate-specs-inventory.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    check() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "check-specs-inventory.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("should pass when the committed inventory is fresh", () => {
  // Arrange
  const h = mkHarness();
  h.generate();

  // Act
  const result = h.check();

  // Assert
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("up to date"));
  h.cleanup();
});

test("should fail with a diff hint when the inventory is stale", () => {
  // Arrange
  const h = mkHarness();
  h.generate();
  mkdirSync(join(h.specsDir, "new-cap"), { recursive: true });
  writeFileSync(
    join(h.specsDir, "new-cap", "spec.md"),
    "# New\n\n## Purpose\n\nNew purpose.\n\n## Requirements\n"
  );

  // Act
  const result = h.check();

  // Assert
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("stale"));
  assert.ok(result.stderr.includes("pnpm specs:inventory"));
  h.cleanup();
});

test("should fail when the inventory file is missing", () => {
  // Arrange
  const h = mkHarness();

  // Act
  const result = h.check();

  // Assert
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("stale"));
  h.cleanup();
});
