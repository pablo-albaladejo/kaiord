// Tests for scripts/check-archive-followups.mjs.
//
// Mirrors the harness pattern from scripts/check-archive-dates.test.mjs:
// build a temp REPO_ROOT, write tasks.md fixtures into
// openspec/changes/archive/, copy the script, drive it as a child
// process, assert exit code + stdout/stderr.

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
const SCRIPT_SRC = readFileSync(
  resolve(__dirname, "check-archive-followups.mjs"),
  "utf8"
);

function mkHarness(prep) {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-followups-test-"))
  );
  mkdirSync(join(root, "openspec", "changes", "archive"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "check-archive-followups.mjs"),
    SCRIPT_SRC
  );
  prep(join(root, "openspec", "changes", "archive"));
  return {
    root,
    run() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "check-archive-followups.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeTasks(archiveDir, folder, body) {
  mkdirSync(join(archiveDir, folder), { recursive: true });
  writeFileSync(join(archiveDir, folder, "tasks.md"), body);
}

const ZERO_DEFERRAL = `## 1. Foo\n\n- [x] 1.1 done\n- [x] 1.2 done\n`;

const buildDeferral = (issues) =>
  `## 1. Foo\n\n` +
  issues
    .map(
      (n, i) =>
        `- [x] 1.${i + 1} task ${i + 1}\n      > Deferred to: #${n}\n`
    )
    .join("");

test("zero deferrals → exit 0, no count line for that archive", () => {
  const h = mkHarness((arc) => writeTasks(arc, "2026-05-01-clean", ZERO_DEFERRAL));
  try {
    const r = h.run();
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.ok(!r.stdout.includes("2026-05-01-clean"), r.stdout);
  } finally {
    h.cleanup();
  }
});

test("below-cap deferrals → exit 0 + log of count", () => {
  const h = mkHarness((arc) =>
    writeTasks(arc, "2026-05-02-some", buildDeferral([100, 101, 102, 103]))
  );
  try {
    const r = h.run();
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.ok(r.stdout.includes("2026-05-02-some: 4 deferrals"), r.stdout);
  } finally {
    h.cleanup();
  }
});

test("at-cap deferrals → exit non-zero, archive named in stderr", () => {
  const h = mkHarness((arc) =>
    writeTasks(
      arc,
      "2026-05-03-overscoped",
      buildDeferral([200, 201, 202, 203, 204, 205])
    )
  );
  try {
    const r = h.run();
    assert.notEqual(r.status, 0);
    assert.ok(r.stderr.includes("2026-05-03-overscoped"), r.stderr);
    assert.ok(r.stderr.includes("6 deferrals"), r.stderr);
  } finally {
    h.cleanup();
  }
});

test("malformed marker (URL form) fails with parse error naming the file", () => {
  const malformed =
    `## 1. Foo\n\n- [x] 1.1 task\n      > Deferred to: https://github.com/owner/repo/issues/432\n`;
  const h = mkHarness((arc) => writeTasks(arc, "2026-05-04-malformed", malformed));
  try {
    const r = h.run();
    assert.notEqual(r.status, 0);
    assert.ok(r.stderr.includes("malformed marker"), r.stderr);
    assert.ok(r.stderr.includes("tasks.md"), r.stderr);
  } finally {
    h.cleanup();
  }
});

test("malformed marker (no hash) fails", () => {
  const malformed =
    `## 1. Foo\n\n- [x] 1.1 task\n      > Deferred to: 432\n`;
  const h = mkHarness((arc) => writeTasks(arc, "2026-05-05-no-hash", malformed));
  try {
    const r = h.run();
    assert.notEqual(r.status, 0);
    assert.ok(r.stderr.includes("malformed marker"), r.stderr);
  } finally {
    h.cleanup();
  }
});

test("multiple archives: one over-cap, one under, one zero — only the over-cap fails", () => {
  const h = mkHarness((arc) => {
    writeTasks(arc, "2026-05-06-clean", ZERO_DEFERRAL);
    writeTasks(arc, "2026-05-07-light", buildDeferral([1, 2]));
    writeTasks(
      arc,
      "2026-05-08-heavy",
      buildDeferral([10, 11, 12, 13, 14, 15, 16])
    );
  });
  try {
    const r = h.run();
    assert.notEqual(r.status, 0);
    assert.ok(r.stderr.includes("2026-05-08-heavy"));
    assert.ok(!r.stderr.includes("2026-05-06-clean"));
    assert.ok(!r.stderr.includes("2026-05-07-light"));
    assert.ok(r.stdout.includes("2026-05-07-light: 2 deferrals"));
  } finally {
    h.cleanup();
  }
});

test("missing tasks.md is skipped silently (not every archive needs one)", () => {
  const h = mkHarness((arc) => {
    mkdirSync(join(arc, "2026-05-09-no-tasks"), { recursive: true });
  });
  try {
    const r = h.run();
    assert.equal(r.status, 0, r.stderr || r.stdout);
  } finally {
    h.cleanup();
  }
});
