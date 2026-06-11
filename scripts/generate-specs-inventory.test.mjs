// Tests for scripts/generate-specs-inventory.mjs using node:test.

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

function mkHarness(prep) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kaiord-specs-inv-")));
  mkdirSync(join(root, "openspec", "specs"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "generate-specs-inventory.mjs"),
    GENERATOR_SRC
  );
  prep(join(root, "openspec", "specs"));
  return {
    root,
    run() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "generate-specs-inventory.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    readReadme() {
      return readFileSync(join(root, "openspec", "specs", "README.md"), "utf8");
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeSpec(specsDir, slug, title, purpose) {
  mkdirSync(join(specsDir, slug), { recursive: true });
  writeFileSync(
    join(specsDir, slug, "spec.md"),
    `# ${title}\n\n## Purpose\n\n${purpose}\n\n## Requirements\n`
  );
}

test("should render one sorted row per spec with title and purpose", () => {
  // Arrange
  const h = mkHarness((specsDir) => {
    writeSpec(specsDir, "zeta-cap", "Zeta", "Last purpose.");
    writeSpec(specsDir, "alpha-cap", "Alpha", "First purpose.");
  });

  // Act
  const result = h.run();

  // Assert
  assert.equal(result.status, 0, result.stderr);
  const readme = h.readReadme();
  const alphaIdx = readme.indexOf("alpha-cap");
  const zetaIdx = readme.indexOf("zeta-cap");
  assert.ok(alphaIdx >= 0 && zetaIdx > alphaIdx, "rows sorted by slug");
  assert.ok(
    readme.includes(
      "| [`alpha-cap`](./alpha-cap/spec.md) | Alpha | First purpose. |"
    )
  );
  assert.ok(readme.includes("2 specs."));
  h.cleanup();
});

test("should ignore folders without a spec.md", () => {
  // Arrange
  const h = mkHarness((specsDir) => {
    writeSpec(specsDir, "real-cap", "Real", "Real purpose.");
    mkdirSync(join(specsDir, "not-a-spec"), { recursive: true });
  });

  // Act
  const result = h.run();

  // Assert
  assert.equal(result.status, 0, result.stderr);
  const readme = h.readReadme();
  assert.ok(!readme.includes("not-a-spec"));
  assert.ok(readme.includes("1 specs."));
  h.cleanup();
});

test("should be idempotent across two runs", () => {
  // Arrange
  const h = mkHarness((specsDir) => {
    writeSpec(specsDir, "one-cap", "One", "Purpose one.");
  });

  // Act
  h.run();
  const first = h.readReadme();
  h.run();
  const second = h.readReadme();

  // Assert
  assert.equal(first, second);
  h.cleanup();
});

test("should escape pipe characters in extracted text", () => {
  // Arrange
  const h = mkHarness((specsDir) => {
    writeSpec(specsDir, "pipe-cap", "Pipes | Everywhere", "Uses a | b syntax.");
  });

  // Act
  const result = h.run();

  // Assert
  assert.equal(result.status, 0, result.stderr);
  const readme = h.readReadme();
  assert.ok(readme.includes("Pipes \\| Everywhere"));
  assert.ok(readme.includes("Uses a \\| b syntax."));
  h.cleanup();
});
