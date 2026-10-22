// Tests for .claude/hooks/related-tests-stop.cjs (R-RelatedTestsStop).
//
// The CLI cases build a throwaway git repository whose related tests are
// node:test suites under scripts/, so they need no vitest install. The hook
// runs with CLAUDE_GUARDS_HG_GATE=none (or a fake gate) and a private TMPDIR.

import { strict as assert } from "node:assert";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";

const require = createRequire(import.meta.url);
const {
  MAX_CONSECUTIVE_BLOCKS,
  planRuns,
  subagentWrote,
  turnWrote,
  tapFailures,
  verdict,
  vitestFailures,
} = require("./related-tests-stop.cjs");
const { gitEnv } = require("./guard-common.cjs");

const HOOK = join(
  dirname(fileURLToPath(import.meta.url)),
  "related-tests-stop.cjs"
);
const SESSION = "sess-stop";

describe("planRuns", () => {
  it("should group package files for vitest, run a package's full suite when it lost a file, and map scripts to co-located suites", () => {
    // Arrange
    const files = [
      "packages/core/src/a.ts",
      "packages/core/src/a.test.ts",
      "packages/fit/src/b.ts",
      "packages/core/dist/a.js",
      "packages/nolib/src/c.ts",
      "scripts/check-x.mjs",
      "scripts/no-suite.mjs",
      ".claude/hooks/never-auto-remediate.test.mjs",
      "README.md",
      "packages/core/src/deleted.ts",
    ];
    const present = new Set(
      files
        .filter((f) => !f.includes("deleted"))
        .concat("scripts/check-x.test.mjs")
    );

    // Act
    const lanes = planRuns(files, {
      exists: (f) => present.has(f),
      isVitestPackage: (pkg) => pkg !== "packages/nolib",
    });

    // Assert
    assert.deepEqual(lanes, [
      { kind: "vitest", pkg: "packages/core", files: [], full: true },
      { kind: "vitest", pkg: "packages/fit", files: ["src/b.ts"] },
      {
        kind: "node",
        files: [
          ".claude/hooks/never-auto-remediate.test.mjs",
          "scripts/check-x.test.mjs",
        ],
      },
    ]);
  });

  it("should plan nothing for docs-only changes", () => {
    // Arrange
    const files = [
      "README.md",
      "openspec/specs/x/spec.md",
      "packages/core/README.md",
    ];

    // Act
    const lanes = planRuns(files, {
      exists: () => true,
      isVitestPackage: () => true,
    });

    // Assert
    assert.deepEqual(lanes, []);
  });
});

describe("failure parsing", () => {
  it("should name each failed vitest assertion and each crashed suite", () => {
    // Arrange
    const report = {
      testResults: [
        {
          name: "/r/packages/core/src/a.test.ts",
          status: "failed",
          assertionResults: [
            { fullName: "a > adds", status: "failed" },
            { fullName: "a > ok", status: "passed" },
          ],
        },
        {
          name: "/r/packages/core/src/b.test.ts",
          status: "failed",
          message: "SyntaxError: x\n at y",
          assertionResults: [],
        },
      ],
    };

    // Act
    const failures = vitestFailures(report, "/r/packages/core");

    // Assert
    assert.deepEqual(failures, [
      "src/a.test.ts > a > adds",
      "src/b.test.ts: SyntaxError: x",
    ]);
  });

  it("should read failing names from TAP and skip SKIP/TODO", () => {
    // Arrange
    const tap =
      "TAP version 13\n# Subtest: suite\n    not ok 1 - inner case\nnot ok 1 - suite\nok 2 - fine\nnot ok 3 - later # SKIP\n";

    // Act
    const failures = tapFailures(tap);

    // Assert
    assert.deepEqual(failures, ["  inner case", "suite"]);
  });
});

describe("verdict — block cap and outcomes", () => {
  const ctx = {
    root: "/r",
    fp: "fp1",
    lanes: [{ kind: "node", files: ["scripts/a.test.mjs"] }],
  };
  const red = {
    outcome: "red",
    red: [{ failures: ["scripts/a.test.mjs > breaks"] }],
  };

  it("should block three times in a row, then let the fourth through loudly and reset", () => {
    // Arrange
    let state = null;
    const outputs = [];

    // Act
    for (let i = 0; i < MAX_CONSECUTIVE_BLOCKS + 1; i++) {
      const { output, next } = verdict(state, red, ctx);
      outputs.push(output);
      state = next;
    }

    // Assert
    assert.deepEqual(
      outputs.slice(0, 3).map((o) => o.decision),
      ["block", "block", "block"]
    );
    assert.match(outputs[0].reason, /breaks/);
    assert.match(outputs[2].reason, /block 3\/3/);
    assert.equal(outputs[3].decision, undefined);
    assert.match(outputs[3].systemMessage, /STILL RED after 3/);
    assert.equal(state.blocks, 0);
  });

  it("should reset the count and remember the fingerprint on green", () => {
    // Arrange
    const state = { blocks: 2, lastGreen: null };

    // Act
    const { output, next } = verdict(state, { outcome: "green" }, ctx);

    // Assert
    assert.equal(output, null);
    assert.equal(next.blocks, 0);
    assert.equal(next.lastGreen, "/r:fp1");
  });

  for (const outcome of ["timeout", "host", "infra"]) {
    it(`should let a ${outcome} through with a warning and end the run of blocks`, () => {
      // Arrange
      const state = { blocks: 1 };

      // Act
      const { output, next } = verdict(state, { outcome }, ctx);

      // Assert
      assert.equal(output.decision, undefined);
      assert.match(output.systemMessage, /NOT VERIFIED/);
      assert.equal(next.blocks, 0);
    });
  }
});

describe("subagentWrote", () => {
  it("should assume a write when the transcript is missing or unreadable", () => {
    // Arrange
    const inputs = [{}, { agent_transcript_path: "/nonexistent/x.jsonl" }];

    // Act
    const wrote = inputs.map((i) => subagentWrote(i));

    // Assert
    assert.deepEqual(wrote, [true, true]);
  });
});

describe("turnWrote", () => {
  const transcript = (entries) => {
    const dir = mkdtempSync(join(tmpdir(), "turn-wrote-"));
    const file = join(dir, "t.jsonl");
    writeFileSync(file, entries.map((e) => JSON.stringify(e)).join("\n"));
    return file;
  };
  const prompt = { type: "user", message: { content: "fix it" } };
  const edit = {
    type: "assistant",
    message: { content: [{ type: "tool_use", id: "t1", name: "Edit" }] },
  };
  const answer = { type: "assistant", message: { content: [] } };

  it("should not treat Stop hook feedback as the start of a turn", () => {
    // Arrange
    const feedback = {
      type: "user",
      isMeta: true,
      message: { content: "Caveat: the messages below were generated locally" },
    };
    const plain = {
      type: "user",
      message: { content: "Stop hook feedback:\nRelated tests are RED" },
    };

    // Act
    const meta = turnWrote({
      transcript_path: transcript([prompt, edit, answer, feedback, answer]),
    });
    const text = turnWrote({
      transcript_path: transcript([prompt, edit, answer, plain, answer]),
    });

    // Assert
    assert.equal(meta, true);
    assert.equal(text, true);
  });

  it("should keep counting an Edit made before a mid-turn task notification", () => {
    // Arrange
    const note = {
      type: "user",
      message: { content: "<task-notification>done</task-notification>" },
    };

    // Act
    const wrote = turnWrote({
      transcript_path: transcript([prompt, edit, answer, note, answer]),
    });

    // Assert
    assert.equal(wrote, true);
  });
});

describe("CLI — a throwaway repository", () => {
  let sandbox;
  let repo;
  let state;

  const git = (...args) =>
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
        cwd: repo,
        encoding: "utf8",
        stdio: "pipe",
        env: gitEnv(),
      }
    );
  const write = (rel, body) => {
    mkdirSync(dirname(join(repo, rel)), { recursive: true });
    writeFileSync(join(repo, rel), body);
  };
  const suite = (body) =>
    `import { test } from "node:test";\nimport { strict as assert } from "node:assert";\n${body}\n`;
  const run = (extraEnv = {}, input = {}) =>
    spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify({
        session_id: SESSION,
        cwd: repo,
        hook_event_name: "Stop",
        stop_hook_active: false,
        ...input,
      }),
      encoding: "utf8",
      env: {
        ...gitEnv(),
        TMPDIR: state,
        CLAUDE_GUARDS_HG_GATE: "none",
        ...extraEnv,
      },
    });
  const counter = () =>
    JSON.parse(
      readFileSync(join(state, "claude-guards", `${SESSION}.json`), "utf8")
    );

  beforeEach(() => {
    sandbox = realpathSync(mkdtempSync(join(tmpdir(), "related-tests-stop-")));
    repo = join(sandbox, "repo");
    state = join(sandbox, "state");
    mkdirSync(repo);
    mkdirSync(state);
    write("scripts/sum.mjs", "export const sum = (a, b) => a + b;\n");
    write(
      "scripts/sum.test.mjs",
      suite(
        'import { sum } from "./sum.mjs";\ntest("sum adds", () => assert.equal(sum(1, 2), 3));'
      )
    );
    git("init", "-q", "-b", "main");
    git("add", "-A");
    git("commit", "-q", "-m", "init");
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  it("should exit 0 with no output on a clean tree", () => {
    // Arrange
    // (nothing changed)

    // Act
    const result = run();

    // Assert
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
  });

  it("should block a Stop whose related test is red, naming the test", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");

    // Act
    const result = run();

    // Assert
    assert.equal(result.status, 0);
    const out = JSON.parse(result.stdout);
    assert.equal(out.decision, "block");
    assert.match(out.reason, /sum adds/);
    assert.match(out.reason, /node --test scripts\/sum\.test\.mjs/);
  });

  it("should still check when stop_hook_active is true (no skip-all)", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");

    // Act
    const result = run(
      {},
      { stop_hook_active: true, hook_event_name: "SubagentStop" }
    );

    // Assert
    assert.equal(JSON.parse(result.stdout).decision, "block");
  });

  it("should not block a read-only subagent, but should block one that edited", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");
    const transcript = (tool) => {
      const file = join(sandbox, `${tool}.jsonl`);
      const line = {
        type: "assistant",
        message: { content: [{ type: "tool_use", id: "t1", name: tool }] },
      };
      writeFileSync(file, `${JSON.stringify(line)}\n`);
      return file;
    };
    const stop = (tool) => ({
      hook_event_name: "SubagentStop",
      agent_id: `agent-${tool}`,
      agent_transcript_path: transcript(tool),
    });

    // Act
    const reader = run({}, stop("Grep"));
    const editor = run({}, stop("Edit"));

    // Assert
    assert.equal(reader.stdout, "");
    assert.equal(JSON.parse(editor.stdout).decision, "block");
    assert.equal(counter()["agent:agent-Grep"], undefined);
    assert.equal(counter()["agent:agent-Edit"].blocks, 1);
  });

  it("should not block a question-only Stop, but should block once the turn edited", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");
    const transcript = (name, entries) => {
      const file = join(sandbox, `${name}.jsonl`);
      writeFileSync(file, entries.map((e) => JSON.stringify(e)).join("\n"));
      return file;
    };
    const prompt = { type: "user", message: { content: "question?" } };
    const edit = {
      type: "assistant",
      message: { content: [{ type: "tool_use", id: "t1", name: "Edit" }] },
    };
    const result = {
      type: "user",
      message: { content: [{ type: "tool_result", tool_use_id: "t1" }] },
    };
    const answer = { type: "assistant", message: { content: [] } };
    const oldEdit = [prompt, edit, result, answer];

    // Act
    const asked = run(
      {},
      { transcript_path: transcript("q", [...oldEdit, prompt, answer]) }
    );
    const edited = run(
      {},
      { transcript_path: transcript("e", [prompt, edit, result, answer]) }
    );

    // Assert
    assert.equal(asked.stdout, "");
    assert.equal(JSON.parse(edited.stdout).decision, "block");
  });

  it("should keep blocking a red tree after a block even if the next turn wrote nothing", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");
    const prompt = { type: "user", message: { content: "q" } };
    const edit = {
      type: "assistant",
      message: { content: [{ type: "tool_use", id: "t1", name: "Edit" }] },
    };
    const file = join(sandbox, "blocked.jsonl");
    writeFileSync(
      file,
      [prompt, edit].map((e) => JSON.stringify(e)).join("\n")
    );
    const quiet = join(sandbox, "quiet.jsonl");
    writeFileSync(quiet, JSON.stringify(prompt));

    // Act
    const first = run({}, { transcript_path: file });
    const second = run({}, { transcript_path: quiet });

    // Assert
    assert.equal(JSON.parse(first.stdout).decision, "block");
    assert.equal(JSON.parse(second.stdout).decision, "block");
    assert.equal(counter().main.blocks, 2);
  });

  it("should skip a new human prompt that wrote nothing even after an earlier block", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");
    const user = (text) => ({ type: "user", message: { content: text } });
    const edit = {
      type: "assistant",
      message: { content: [{ type: "tool_use", id: "t1", name: "Edit" }] },
    };
    const save = (name, entries) => {
      const f = join(sandbox, `${name}.jsonl`);
      writeFileSync(f, entries.map((e) => JSON.stringify(e)).join("\n"));
      return f;
    };
    const blocked = save("blocked2", [user("fix"), edit]);
    const next = save("next", [user("fix"), edit, user("what is this?")]);

    // Act
    const first = run({}, { transcript_path: blocked });
    const second = run({}, { transcript_path: next });

    // Assert
    assert.equal(JSON.parse(first.stdout).decision, "block");
    assert.equal(second.stdout, "");
  });

  it("should pass a green change and record it so the same tree is not re-run", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => b + a;\n");

    // Act
    const first = run();
    const second = run();

    // Assert
    assert.equal(first.stdout, "");
    assert.equal(second.stdout, "");
    assert.equal(counter().main.blocks, 0);
    assert.match(counter().main.lastGreen, /:[0-9a-f]{64}$/);
  });

  it("should see an untracked new suite", () => {
    // Arrange
    write("scripts/new.mjs", "export const x = 1;\n");
    write(
      "scripts/new.test.mjs",
      suite('test("new is two", () => assert.equal(1, 2));')
    );

    // Act
    const result = run();

    // Assert
    assert.match(JSON.parse(result.stdout).reason, /new is two/);
  });

  it("should let the turn close with a warning when the budget runs out", () => {
    // Arrange
    write(
      "scripts/sum.test.mjs",
      suite('test("hangs", () => new Promise((r) => setTimeout(r, 60000)));')
    );

    // Act
    const result = run({ CLAUDE_GUARDS_TEST_BUDGET_MS: "1500" });

    // Assert
    const out = JSON.parse(result.stdout);
    assert.equal(out.decision, undefined);
    assert.match(out.systemMessage, /NOT VERIFIED.*budget/);
  });

  it("should let the turn close with a warning when hostguard exits 75", () => {
    // Arrange
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");
    const gate = join(sandbox, "fake-gate.sh");
    writeFileSync(gate, "#!/bin/bash\necho 'REFUSING TO START' >&2\nexit 75\n");
    chmodSync(gate, 0o755);

    // Act
    const result = run({ CLAUDE_GUARDS_HG_GATE: gate });

    // Assert
    const out = JSON.parse(result.stdout);
    assert.equal(out.decision, undefined);
    assert.match(out.systemMessage, /exit 75/);
  });

  it("should check a tree whose `git diff HEAD` is larger than 1 MiB", () => {
    // Arrange: a tracked data file rewritten past execFileSync's default
    // 1 MiB buffer, next to a green code change
    write("data/big.txt", "a\n");
    git("add", "-A");
    git("commit", "-q", "-m", "data");
    write("data/big.txt", "b".repeat(80).concat("\n").repeat(20_000));
    write("scripts/sum.mjs", "export const sum = (a, b) => b + a;\n");

    // Act
    const result = run();

    // Assert: verified green, not "crashed … NOT verified"
    assert.equal(result.stdout, "");
    assert.match(counter().main.lastGreen, /:[0-9a-f]{64}$/);
  });

  it("should report a crash as NOT verified, never as a silent pass", () => {
    // Arrange: a repository with no commit, so `git diff HEAD` throws
    const fresh = join(sandbox, "fresh");
    mkdirSync(join(fresh, "scripts"), { recursive: true });
    writeFileSync(join(fresh, "scripts", "a.mjs"), "export {};\n");
    execFileSync("git", ["init", "-q", "-b", "main"], {
      cwd: fresh,
      env: gitEnv(),
    });

    // Act
    const result = run({}, { cwd: fresh });

    // Assert
    assert.equal(result.status, 0);
    const out = JSON.parse(result.stdout);
    assert.equal(out.decision, undefined);
    assert.match(out.systemMessage, /crashed[\s\S]*NOT verified/);
  });

  it("should reuse the cached failures on an unchanged red tree", () => {
    // Arrange: a first red run, then a gate that would refuse any re-run
    write("scripts/sum.mjs", "export const sum = (a, b) => a - b;\n");
    run();
    const gate = join(sandbox, "refusing-gate.sh");
    writeFileSync(gate, "#!/bin/bash\nexit 75\n");
    chmodSync(gate, 0o755);

    // Act
    const second = JSON.parse(run({ CLAUDE_GUARDS_HG_GATE: gate }).stdout);

    // Assert
    assert.equal(second.decision, "block");
    assert.match(second.reason, /block 2\/3/);
    assert.match(second.reason, /sum adds/);
    assert.equal(counter().main.lastRed.failures.length > 0, true);
  });

  it("should do nothing outside a git worktree", () => {
    // Arrange
    const outside = join(sandbox, "state");

    // Act
    const result = spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify({
        session_id: SESSION,
        cwd: outside,
        hook_event_name: "Stop",
      }),
      encoding: "utf8",
      env: { ...gitEnv(), TMPDIR: state, CLAUDE_GUARDS_HG_GATE: "none" },
    });

    // Assert
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
  });
});
