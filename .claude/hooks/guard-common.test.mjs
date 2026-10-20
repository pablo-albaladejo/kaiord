// Tests for .claude/hooks/guard-common.cjs — the state location shared with
// the Deepgent guards, and the input hygiene every hook relies on.

import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { join } from "node:path";
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

  it("should parse objects only", () => {
    // Arrange
    const raws = ['{"a":1}', "null", "[]", "nope"];

    // Act
    const parsed = raws.map(parseInput);

    // Assert
    assert.deepEqual(parsed, [{ a: 1 }, null, [], null]);
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
