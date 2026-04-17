// Tests for scripts/generate-archive-index.mjs using node:test.

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
const GENERATOR_SRC = readFileSync(
  resolve(__dirname, "generate-archive-index.mjs"),
  "utf8",
);

function mkHarness(prep) {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-index-test-")),
  );
  mkdirSync(join(root, "openspec", "changes", "archive"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "generate-archive-index.mjs"),
    GENERATOR_SRC,
  );
  prep(join(root, "openspec", "changes", "archive"));
  return {
    root,
    run() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "generate-archive-index.mjs")],
        { cwd: root, encoding: "utf8" },
      );
    },
    readReadme() {
      return readFileSync(
        join(root, "openspec", "changes", "archive", "README.md"),
        "utf8",
      );
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

test("heading with Proposal: prefix is stripped", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-10-sample-change",
      "# Proposal: Sample Change\n\nIrrelevant body.\n",
    );
  });
  try {
    const result = h.run();
    assert.equal(result.status, 0, result.stderr);
    const readme = h.readReadme();
    assert.match(readme, /\| 2026-04-10 \| \[`sample-change`\]/);
    assert.match(readme, /\| Sample Change \|/);
    assert.doesNotMatch(readme, /Proposal:/);
  } finally {
    h.cleanup();
  }
});

test("falls back to first prose line when no heading", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-11-prose-only",
      "> Completed: 2026-04-11\n\nThis change does the thing.\n",
    );
  });
  try {
    const result = h.run();
    assert.equal(result.status, 0);
    const readme = h.readReadme();
    assert.match(readme, /\| This change does the thing\. \|/);
  } finally {
    h.cleanup();
  }
});

test("reverse-chronological sort with same-date tiebreak", () => {
  const h = mkHarness((archive) => {
    writeProposal(archive, "2026-04-10-beta", "# Beta\n");
    writeProposal(archive, "2026-04-10-alpha", "# Alpha\n");
    writeProposal(archive, "2026-04-15-newest", "# Newest\n");
  });
  try {
    const result = h.run();
    assert.equal(result.status, 0);
    const readme = h.readReadme();
    const rows = readme
      .split("\n")
      .filter((l) => l.startsWith("| 2026-"));
    assert.equal(rows[0].includes("newest"), true, "newest first");
    assert.equal(rows[1].includes("alpha"), true, "alpha before beta (same date, slug order)");
    assert.equal(rows[2].includes("beta"), true);
  } finally {
    h.cleanup();
  }
});

test("pipe characters in summary are escaped", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-12-pipe",
      "# Title with a | pipe inside\n",
    );
  });
  try {
    const result = h.run();
    assert.equal(result.status, 0);
    const readme = h.readReadme();
    // The summary column should not contain an unescaped pipe.
    const row = readme.split("\n").find((l) => l.includes("`pipe`"));
    assert.ok(row);
    const summaryCell = row.split("|").slice(3).join("|");
    assert.match(summaryCell, /\\\|/);
  } finally {
    h.cleanup();
  }
});

test("output is idempotent across two runs", () => {
  const h = mkHarness((archive) => {
    writeProposal(archive, "2026-04-13-a", "# A\nbody\n");
    writeProposal(archive, "2026-04-13-b", "# B\nbody\n");
  });
  try {
    const r1 = h.run();
    assert.equal(r1.status, 0);
    const first = h.readReadme();
    const r2 = h.run();
    assert.equal(r2.status, 0);
    assert.equal(h.readReadme(), first);
  } finally {
    h.cleanup();
  }
});

test("undated folder is skipped (not listed)", () => {
  const h = mkHarness((archive) => {
    writeProposal(archive, "undated-change", "# Should be ignored\n");
    writeProposal(archive, "2026-04-14-real", "# Real\n");
  });
  try {
    const result = h.run();
    assert.equal(result.status, 0);
    const readme = h.readReadme();
    assert.doesNotMatch(readme, /undated-change/);
    assert.match(readme, /\| 2026-04-14 \|/);
  } finally {
    h.cleanup();
  }
});
