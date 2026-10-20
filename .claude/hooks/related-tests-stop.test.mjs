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
  it("should group package files for vitest and map scripts to co-located suites", () => {
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
      {
        kind: "vitest",
        pkg: "packages/core",
        files: ["src/a.test.ts", "src/a.ts"],
      },
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
    it(`should let a ${outcome} through with a warning and keep the count`, () => {
      // Arrange
      const state = { blocks: 1 };

      // Act
      const { output, next } = verdict(state, { outcome }, ctx);

      // Assert
      assert.equal(output.decision, undefined);
      assert.match(output.systemMessage, /NOT VERIFIED/);
      assert.equal(next.blocks, 1);
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
