// Tests for scripts/check-archive-dates.mjs using node:test.

import { strict as assert } from "node:assert";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

// Because the script resolves REPO_ROOT from its own location, we cannot
// swap the archive directory via a constant — instead, we drive the
// script as a child process against a temp-root harness that mirrors
// the expected layout and has its own copy of the script. That keeps
// the production script untouched and guarantees the test exercises
// the real CLI.
//
// The harness copies only the script bytes (not its imports), so we
// re-use `fileURLToPath` to locate the source.

import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_SRC = readFileSync(
  resolve(__dirname, "check-archive-dates.mjs"),
  "utf8",
);

function mkHarness(prep) {
  // realpath the tmp dir so `process.argv[1]` and `import.meta.url` agree
  // under macOS's /var -> /private/var symlink.
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-archive-test-")),
  );
  mkdirSync(join(root, "openspec", "changes", "archive"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-archive-dates.mjs"), SCRIPT_SRC);
  prep(join(root, "openspec", "changes", "archive"));
  return {
    root,
    run() {
      const result = spawnSync(
        process.execPath,
        [join(root, "scripts", "check-archive-dates.mjs")],
        { cwd: root, encoding: "utf8" },
      );
      return result;
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

test("matching folder date and Completed marker passes", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-17-sample-change",
      "> Completed: 2026-04-17\n\n# Sample\n",
    );
  });
  try {
    const result = h.run();
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /invariant holds/);
  } finally {
    h.cleanup();
  }
});

test("mismatched folder date and Completed marker fails", () => {
  const h = mkHarness((archive) => {
    writeProposal(
      archive,
      "2026-04-17-sample-change",
      "> Completed: 2026-04-15\n\n# Sample\n",
    );
  });
  try {
    const result = h.run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /folder date .* does NOT match/);
  } finally {
    h.cleanup();
  }
});

test("missing Completed marker is now an error (no more soft warnings)", () => {
  const h = mkHarness((archive) => {
    writeProposal(archive, "2026-04-17-sample-change", "# Sample\n");
  });
  try {
    const result = h.run();
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /proposal\.md is missing the "> Completed: YYYY-MM-DD" marker/,
    );
  } finally {
    h.cleanup();
  }
});

test("folder prefix with invalid calendar date is rejected", () => {
  const h = mkHarness((archive) => {
    // February 31 doesn't exist.
    writeProposal(
      archive,
      "2026-02-31-bad-date",
      "> Completed: 2026-02-31\n\n# Sample\n",
    );
  });
  try {
    const result = h.run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not a valid calendar date/);
  } finally {
    h.cleanup();
  }
});

test("folder without date prefix is rejected", () => {
  const h = mkHarness((archive) => {
    writeProposal(archive, "undated-change", "> Completed: 2026-04-17\n");
  });
  try {
    const result = h.run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /does not match "YYYY-MM-DD-<slug>"/);
  } finally {
    h.cleanup();
  }
});
