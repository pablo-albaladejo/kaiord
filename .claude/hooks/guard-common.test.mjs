// Tests for .claude/hooks/guard-common.cjs — the state location shared with
// the Deepgent guards, and the input hygiene every hook relies on.

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const {
  gitEnv,
  guardDir,
  parseInput,
  safeSessionId,
} = require("./guard-common.cjs");

describe("guard-common", () => {
  it("should keep state under $TMPDIR/claude-guards", () => {
    // Arrange
    const env = { TMPDIR: "/var/folders/x/T/" };

    // Act
    const dir = guardDir(env);

    // Assert
    assert.equal(dir, join("/var/folders/x/T/", "claude-guards"));
  });

  it("should accept Claude Code session ids and refuse path-like ones", () => {
    // Arrange
    const ids = ["7a55022a-8b3d-43eb-96b7-87ee0d253f69", "../x", "a/b", "", 42];

    // Act
    const safe = ids.map(safeSessionId);

    // Assert
    assert.deepEqual(safe, [
      "7a55022a-8b3d-43eb-96b7-87ee0d253f69",
      null,
      null,
      null,
      null,
    ]);
  });

  it("should parse objects only, rejecting arrays", () => {
    // Arrange
    const raws = ['{"a":1}', "null", "[]", "nope"];

    // Act
    const parsed = raws.map(parseInput);

    // Assert
    assert.deepEqual(parsed, [{ a: 1 }, null, null, null]);
  });

  it("should drop every inherited GIT_* variable", () => {
    // Arrange
    const env = { GIT_DIR: "/x/.git", GIT_INDEX_FILE: "/x/i", PATH: "/bin" };

    // Act
    const clean = gitEnv(env);

    // Assert
    assert.deepEqual(clean, { PATH: "/bin" });
  });
});

describe("entry guard — hooks launched through a symlinked path", () => {
  // An entry check that compares a realpath with argv[1] is false through a
  // symlink, so main() never runs and the hook exits 0: it fails OPEN.
  it("should still fail closed on unreadable input", () => {
    // Arrange
    const sandbox = mkdtempSync(join(tmpdir(), "guard-entry-"));
    const link = join(sandbox, "hooks");
    symlinkSync(dirname(fileURLToPath(import.meta.url)), link);
    const hooks = ["never-auto-remediate.cjs", "plan-approval-guard.cjs"];

    try {
      // Act
      const codes = hooks.map(
        (hook) =>
          spawnSync(process.execPath, [join(link, hook)], {
            input: "not json",
            encoding: "utf8",
            env: { ...gitEnv(), TMPDIR: sandbox },
          }).status
      );

      // Assert
      assert.deepEqual(codes, [2, 2]);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});

describe("malformed hook input — a JSON array", () => {
  it("should make both PreToolUse hooks fail closed with exit 2", () => {
    // Arrange
    const dir = dirname(fileURLToPath(import.meta.url));
    const hooks = ["never-auto-remediate.cjs", "plan-approval-guard.cjs"];
    const sandbox = mkdtempSync(join(tmpdir(), "guard-array-"));

    try {
      // Act
      const codes = hooks.map(
        (hook) =>
          spawnSync(process.execPath, [join(dir, hook)], {
            input: "[]",
            encoding: "utf8",
            env: { ...gitEnv(), TMPDIR: sandbox },
          }).status
      );

      // Assert
      assert.deepEqual(codes, [2, 2]);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
