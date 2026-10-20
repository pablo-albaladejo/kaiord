// Tests for .claude/hooks/plan-approval-guard.cjs (R-PlanApprovalReceipt).
//
// Each case builds a throwaway git repository (plus a linked worktree) and a
// separate $TMPDIR for receipts. Every git call drops inherited GIT_*
// variables and writes no config outside the throwaway repository.

import { strict as assert } from "node:assert";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";

const require = createRequire(import.meta.url);
const {
  BLOCK_MESSAGE,
  decide,
  isExemptRepoPath,
  parentSessionFromAncestry,
  receiptIsValid,
} = require("./plan-approval-guard.cjs");
const { buildReceipt, receiptPath } = require("./record-human-approval.cjs");
const { gitEnv } = require("./guard-common.cjs");

const HOOK = join(
  dirname(fileURLToPath(import.meta.url)),
  "plan-approval-guard.cjs"
);
const SESSION = "sess-plan";
const HOUR = 60 * 60 * 1000;

let sandbox;
let repo;
let state;
let env;

const git = (cwd, ...args) =>
  execFileSync(
    "git",
    [
      "-c",
      "user.email=t@example.com",
      "-c",
      "user.name=t",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
      env: gitEnv(),
    }
  );

beforeEach(() => {
  sandbox = realpathSync(mkdtempSync(join(tmpdir(), "plan-approval-guard-")));
  repo = join(sandbox, "repo");
  state = join(sandbox, "state");
  mkdirSync(join(repo, "src"), { recursive: true });
  mkdirSync(state);
  writeFileSync(join(repo, "src", "a.ts"), "export {};\n");
  git(repo, "init", "-q", "-b", "main");
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "init");
  env = { ...gitEnv(), TMPDIR: state, CLAUDE_PROJECT_DIR: repo };
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

const edit = (file, extra = {}) => ({
  session_id: SESSION,
  cwd: repo,
  hook_event_name: "PreToolUse",
  tool_name: "Edit",
  tool_input: { file_path: file },
  ...extra,
});

const grant = (now = Date.now(), session = SESSION) => {
  const file = receiptPath(env, session);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(buildReceipt(session, now)));
};

describe("DENY — repository code without a receipt", () => {
  it("should deny an edit to a tracked file", () => {
    // Arrange
    const input = edit(join(repo, "src", "a.ts"));

    // Act
    const { verdict } = decide(input, { env });

    // Assert
    assert.equal(verdict, "deny");
  });

  it("should deny a new file in a directory that does not exist yet", () => {
    // Arrange
    const input = edit(join(repo, "src", "new", "deep", "b.ts"), {
      tool_name: "Write",
    });

    // Act
    const { verdict, why } = decide(input, { env });

    // Assert
    assert.equal(verdict, "deny");
    assert.match(why, /src\/new\/deep\/b\.ts/);
  });

  it("should deny a write into another worktree of the same repository", () => {
    // Arrange
    const other = join(sandbox, "other-worktree");
    git(repo, "worktree", "add", "-q", "-b", "other", other);
    const input = edit(join(other, "src", "a.ts"));

    // Act
    const { verdict } = decide(input, { env });

    // Assert
    assert.equal(verdict, "deny");
  });

  it("should deny edits to the guard's own wiring", () => {
    // Arrange
    const paths = [
      ".claude/settings.json",
      ".claude/settings.local.json",
      ".claude/hooks/x.cjs",
    ];

    // Act
    const verdicts = paths.map(
      (p) => decide(edit(join(repo, p)), { env }).verdict
    );

    // Assert
    assert.deepEqual(verdicts, ["deny", "deny", "deny"]);
  });

  it("should deny with an expired, foreign or over-long receipt", () => {
    // Arrange
    const now = Date.now();
    const expired = buildReceipt(SESSION, now - 13 * HOUR);
    const foreign = buildReceipt("someone-else", now);
    const overlong = {
      ...buildReceipt(SESSION, now),
      expires_at: new Date(now + 48 * HOUR).toISOString(),
    };

    // Act
    const verdicts = [expired, foreign, overlong].map((r) =>
      receiptIsValid(r, SESSION, now)
    );

    // Assert
    assert.deepEqual(verdicts, [false, false, false]);
  });
});

describe("DENY — spellings of the guard's wiring", () => {
  it("should deny case-folded settings and hooks paths (APFS is case-insensitive)", () => {
    // Arrange
    const paths = [".claude/SETTINGS.json", ".claude/Hooks/x.cjs"];

    // Act
    const exempt = paths.map((p) => isExemptRepoPath(p));

    // Assert
    assert.deepEqual(exempt, [false, false]);
  });

  it("should judge a symlink outside the repo by the repo file it points to", () => {
    // Arrange
    const link = join(sandbox, "outside-link.ts");
    symlinkSync(join(repo, "src", "a.ts"), link);

    // Act
    const { verdict } = decide(edit(link), {
      env,
      parentSession: () => null,
    });

    // Assert
    assert.equal(verdict, "deny");
  });
});

describe("ALLOW — receipt present, or not repository code", () => {
  it("should allow an edit once a human receipt exists", () => {
    // Arrange
    grant();
    const input = edit(join(repo, "src", "a.ts"));

    // Act
    const { verdict } = decide(input, { env });

    // Assert
    assert.equal(verdict, "allow");
  });

  it("should allow a subagent's edit under the parent's session id", () => {
    // Arrange
    grant();
    const input = edit(join(repo, "src", "a.ts"), {
      agent_id: "a37bac8dc91d36557",
      agent_type: "general-purpose",
    });

    // Act
    const { verdict } = decide(input, { env });

    // Assert
    assert.equal(verdict, "allow");
  });

  it("should allow an agent-team teammate's edit under the lead's receipt", () => {
    // Arrange: a teammate has its own session_id and no agent_id
    grant(Date.now(), "lead-session");
    const input = edit(join(repo, "src", "a.ts"), {
      session_id: "teammate-session",
    });

    // Act
    const withLead = decide(input, {
      env,
      parentSession: () => "lead-session",
    });
    const orphan = decide(input, { env, parentSession: () => null });

    // Assert
    assert.equal(withLead.verdict, "allow");
    assert.equal(orphan.verdict, "deny");
  });

  it("should find --parent-session-id in the process ancestry", () => {
    // Arrange: bash keeps the flag in its argv and stays the node's parent
    const script = `const { parentSessionFromAncestry } = require(${JSON.stringify(
      join(dirname(HOOK), "plan-approval-guard.cjs")
    )}); process.stdout.write(String(parentSessionFromAncestry()));`;

    // Act
    const out = execFileSync(
      "bash",
      [
        "-c",
        'node -e "$1"; true',
        "teammate",
        script,
        "--parent-session-id",
        "lead-abc_123",
      ],
      { encoding: "utf8", env: gitEnv() }
    );

    // Assert
    assert.equal(out, "lead-abc_123");
  });

  it("should allow .omc and .claude state without a receipt", () => {
    // Arrange
    const paths = [
      ".omc/state/x.json",
      ".omc/notepad.md",
      ".claude/scheduled_tasks.json",
    ];

    // Act
    const verdicts = paths.map(
      (p) => decide(edit(join(repo, p)), { env }).verdict
    );

    // Assert
    assert.deepEqual(verdicts, ["allow", "allow", "allow"]);
  });

  it("should allow paths outside the repository (scratchpad, temp, other repos)", () => {
    // Arrange
    const outside = join(sandbox, "scratchpad", "notes.md");

    // Act
    const { verdict } = decide(edit(outside), { env });

    // Assert
    assert.equal(verdict, "allow");
  });

  it("should classify exempt repo-relative paths", () => {
    // Arrange
    const rels = [
      ".omc/a",
      ".claude/agents/x.md",
      ".claude/hooks/a.cjs",
      ".claude/settings.json",
      "src/a.ts",
    ];

    // Act
    const exempt = rels.map(isExemptRepoPath);

    // Assert
    assert.deepEqual(exempt, [true, true, false, false, false]);
  });
});

describe("CLI — hook input JSON to hook output", () => {
  const run = (input) =>
    spawnSync(process.execPath, [HOOK], {
      input: typeof input === "string" ? input : JSON.stringify(input),
      encoding: "utf8",
      env,
    });

  it("should print the deny decision with the agreed message", () => {
    // Arrange
    const input = edit(join(repo, "src", "a.ts"));

    // Act
    const result = run(input);

    // Assert
    assert.equal(result.status, 0);
    const out = JSON.parse(result.stdout).hookSpecificOutput;
    assert.equal(out.permissionDecision, "deny");
    assert.equal(out.permissionDecisionReason, BLOCK_MESSAGE);
  });

  it("should print nothing once approved", () => {
    // Arrange
    grant();
    const input = edit(join(repo, "src", "a.ts"));

    // Act
    const result = run(input);

    // Assert
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
  });

  it("should fail closed with exit 2 on unreadable input", () => {
    // Arrange
    const input = "{";

    // Act
    const result = run(input);

    // Assert
    assert.equal(result.status, 2);
  });

  it("should ignore an exported GIT_DIR, as inside a git hook", () => {
    // Arrange
    const decoy = join(sandbox, "decoy");
    mkdirSync(decoy);
    git(decoy, "init", "-q", "-b", "main");
    const input = JSON.stringify(edit(join(repo, "src", "a.ts")));

    // Act
    const result = spawnSync(process.execPath, [HOOK], {
      input,
      encoding: "utf8",
      env: { ...env, GIT_DIR: join(decoy, ".git") },
    });

    // Assert
    assert.equal(
      JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,
      "deny"
    );
  });
});
