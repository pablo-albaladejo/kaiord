// Tests for scripts/check-archive-index.mjs using node:test.

import { strict as assert } from "node:assert";
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
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHECK_SRC = readFileSync(
  resolve(__dirname, "check-archive-index.mjs"),
  "utf8"
);
const GENERATOR_SRC = readFileSync(
  resolve(__dirname, "generate-archive-index.mjs"),
  "utf8"
);

function mkHarness(prep) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kaiord-index-guard-")));
  mkdirSync(join(root, "openspec", "changes", "archive"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-archive-index.mjs"), CHECK_SRC);
  writeFileSync(
    join(root, "scripts", "generate-archive-index.mjs"),
    GENERATOR_SRC
  );
  prep(join(root, "openspec", "changes", "archive"));
  return {
    root,
    generate() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "generate-archive-index.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    check() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "check-archive-index.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    readme() {
      return join(root, "openspec", "changes", "archive", "README.md");
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeProposal(archiveDir, folder, body) {
  mkdirSync(join(archiveDir, folder), { recursive: true });
  writeFileSync(join(archiveDir, folder, "proposal.md"), body);
}

test("passes when committed README matches generator output", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-17-sample",
      "> Completed: 2026-04-17\n\n# Sample\n"
    );
  });
  try {
    assert.equal(h.generate().status, 0);
    const result = h.check();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /up to date/);
  } finally {
    h.cleanup();
  }
});

test("fails when committed README has drifted from generator output", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-17-sample",
      "> Completed: 2026-04-17\n\n# Sample\n"
    );
  });
  try {
    // Generate first, then mutate the committed file to simulate drift.
    assert.equal(h.generate().status, 0);
    const readme = h.readme();
    const original = readFileSync(readme, "utf8");
    writeFileSync(readme, original + "\nDRIFT\n");

    const result = h.check();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /out of date/);
  } finally {
    h.cleanup();
  }
});

test("fails when committed README is missing entirely", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-17-sample",
      "> Completed: 2026-04-17\n\n# Sample\n"
    );
    // Intentionally do NOT generate; README never exists.
  });
  try {
    const result = h.check();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /out of date/);
  } finally {
    h.cleanup();
  }
});
