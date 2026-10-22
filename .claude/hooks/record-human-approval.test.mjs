// Tests for .claude/hooks/record-human-approval.cjs (R-PlanApprovalReceipt).

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";

const require = createRequire(import.meta.url);
const {
  TTL_MS,
  isHumanPrompt,
  receiptPath,
} = require("./record-human-approval.cjs");
const { gitEnv } = require("./guard-common.cjs");

const HOOK = join(
  dirname(fileURLToPath(import.meta.url)),
  "record-human-approval.cjs"
);

let state;
beforeEach(() => {
  state = mkdtempSync(join(tmpdir(), "record-human-approval-"));
});
afterEach(() => {
  rmSync(state, { recursive: true, force: true });
});

const runHook = (input) =>
  spawnSync(process.execPath, [HOOK], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    env: { ...gitEnv(), TMPDIR: state },
  });
const receipt = (id) => receiptPath({ TMPDIR: state }, id);

// Prompts as measured on Claude Code 2.1.304 (raw UserPromptSubmit stdin).
const MACHINE = [
  "<task-notification>\n<task-id>a1e49a6870e790a41</task-id>\n<status>completed</status>",
  '<cross-session-message from="uds:/tmp/cc-socks/50486.sock" from-mode="bypass">\nhi\n</cross-session-message>',
  '<teammate-message teammate_id="team-lead">\ndo the thing\n</teammate-message>',
  "  <task-notification>\nleading whitespace</task-notification>",
];

describe("isHumanPrompt", () => {
  it("should accept a typed prompt", () => {
    // Arrange
    const prompt = "go ahead with the plan";

    // Act
    const human = isHumanPrompt(prompt);

    // Assert
    assert.equal(human, true);
  });

  for (const prompt of MACHINE) {
    it(`should reject ${JSON.stringify(prompt.slice(0, 30))}`, () => {
      // Arrange
      const input = prompt;

      // Act
      const human = isHumanPrompt(input);

      // Assert
      assert.equal(human, false);
    });
  }

  it("should reject a missing or empty prompt", () => {
    // Arrange
    const prompts = [undefined, "", "   "];

    // Act
    const verdicts = prompts.map(isHumanPrompt);

    // Assert
    assert.deepEqual(verdicts, [false, false, false]);
  });
});

describe("CLI — receipt files", () => {
  it("should write a 12 h receipt for a human prompt and print nothing", () => {
    // Arrange
    const input = {
      session_id: "sess-1",
      hook_event_name: "UserPromptSubmit",
      prompt: "yes, implement it",
    };

    // Act
    const result = runHook(input);

    // Assert
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
    const written = JSON.parse(readFileSync(receipt("sess-1"), "utf8"));
    assert.equal(written.session_id, "sess-1");
    assert.equal(written.source, "UserPromptSubmit");
    assert.equal(
      Date.parse(written.expires_at) - Date.parse(written.recorded_at),
      TTL_MS
    );
  });

  it("should write no receipt for a task notification", () => {
    // Arrange
    const input = {
      session_id: "sess-2",
      hook_event_name: "UserPromptSubmit",
      prompt: MACHINE[0],
    };

    // Act
    const result = runHook(input);

    // Assert
    assert.equal(result.status, 0);
    assert.equal(existsSync(receipt("sess-2")), false);
  });

  it("should refuse a session id that would escape the guard directory", () => {
    // Arrange
    const input = { session_id: "../../evil", prompt: "hi" };

    // Act
    const result = runHook(input);

    // Assert
    assert.equal(result.status, 0);
    assert.equal(existsSync(join(state, "evil.json")), false);
  });

  it("should never block a prompt, even on garbage input", () => {
    // Arrange
    const input = "not json";

    // Act
    const result = runHook(input);

    // Assert
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
  });
});
