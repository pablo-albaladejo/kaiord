import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  runCheck,
  fileViolations,
  importTargets,
  isInert,
} from "./check-no-inert-floors.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = join(ROOT, "packages/ai/src/evals");

const INERT_HEAD = `import { loadEvalModel } from "./load-eval-model";\n`;
const KEYLESS_HEAD = `import { readFixture } from "./fixtures";\n`;
const GATE = `const ok = rate >= 0.9;\nprocess.exit(ok ? 0 : 1);\n`;

/** A throwaway evals root; nested paths create their directories. */
const sandbox = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "floors-"));
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
};

const checkSandbox = (files) => {
  const dir = sandbox(files);
  try {
    return runCheck({ runnersRoot: dir });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test("the live tree passes", () => {
  assert.deepEqual(runCheck({ runnersRoot: LIVE }), []);
});

test("a comparison inside the exit call fails", () => {
  const src = `${INERT_HEAD}process.exit(rate >= 0.9 ? 0 : 1);\n`;
  const violations = fileViolations(src, "run-x.ts");
  assert.ok(violations.some((v) => v.kind === "computed-exit"));
});

test("binding the comparison first does NOT evade it", () => {
  // The evasion the plain grep could not see.
  const src = `${INERT_HEAD}${GATE}`;
  const violations = fileViolations(src, "run-x.ts");
  assert.ok(violations.some((v) => v.kind === "score-comparison"));
  assert.ok(violations.some((v) => v.kind === "computed-exit"));
});

test("a keyless runner may gate on a score", () => {
  const src = `${KEYLESS_HEAD}${GATE}`;
  assert.deepEqual(fileViolations(src, "run-keyless.ts"), []);
  assert.equal(isInert(src), false);
});

test("an inert runner exiting on a literal passes", () => {
  const src = `${INERT_HEAD}process.exit(2);\nprocess.exit(1);\n`;
  assert.deepEqual(fileViolations(src, "run-x.ts"), []);
});

test("an arrow function is not a comparison", () => {
  const src = `${INERT_HEAD}const n = results.filter((r) => passed(r)).length;\n`;
  assert.deepEqual(fileViolations(src, "run-x.ts"), []);
});

test("a generic type argument is not a comparison", () => {
  const src = `${INERT_HEAD}const all: Array<Score> = [];\nconst m: Map<string, Rate> = new Map();\n`;
  assert.deepEqual(fileViolations(src, "run-x.ts"), []);
});

test("a comparison inside a comment is not a floor", () => {
  const src = `${INERT_HEAD}// it used to be rate >= 0.9 here\n * or score < 1\n`;
  assert.deepEqual(fileViolations(src, "run-x.ts"), []);
});

test("zero runners scanned is a fault, not a pass", () => {
  const violations = checkSandbox({});
  assert.equal(violations[0].kind, "scan-empty");
});

test("an unreadable directory is a fault, not a pass", () => {
  const violations = runCheck({ runnersRoot: join(ROOT, "does-not-exist") });
  assert.equal(violations[0].kind, "scan-failed");
});

test("only run-*.ts files are scanned", () => {
  const violations = checkSandbox({
    "run-a.ts": `${INERT_HEAD}process.exit(0);\n`,
    "helper.ts": `${INERT_HEAD}process.exit(ok ? 0 : 1);\n`,
    "run-a.test.ts": `${INERT_HEAD}process.exit(ok ? 0 : 1);\n`,
  });
  assert.deepEqual(violations, []);
});

// Provoked reds for what the guard now recognizes (tasks.md 3.7). Each one
// passed the guard before it scanned recursively and resolved imports.

test("a nested runner importing the live loader is found and fails", () => {
  const violations = checkSandbox({
    "run-a.ts": `${KEYLESS_HEAD}process.exit(0);\n`,
    "nested/deeper/run-live.ts": `import { loadLiveModel } from "../../claude-cli/load-live-model";\n${GATE}`,
  });
  assert.ok(violations.length > 0);
  assert.ok(
    violations.every((v) => v.file === join("nested", "deeper", "run-live.ts"))
  );
  assert.ok(violations.some((v) => v.kind === "score-comparison"));
});

test("a runner importing the CLI adapter directly fails", () => {
  const violations = checkSandbox({
    "run-direct.ts": `import { createClaudeCliLanguageModel } from "./claude-cli/claude-cli-language-model";\n${GATE}`,
  });
  assert.ok(violations.some((v) => v.kind === "computed-exit"));
  assert.ok(violations.some((v) => v.kind === "score-comparison"));
});

test("a runner inside claude-cli importing siblings as ./x fails", () => {
  const violations = checkSandbox({
    "claude-cli/run-inside.ts": `import { spawnClaude } from "./spawn-claude";\n${GATE}`,
  });
  assert.ok(violations.length > 0);
  assert.ok(
    violations.every((v) => v.file === join("claude-cli", "run-inside.ts"))
  );
});

test("a dynamic import or require of the adapter makes a runner inert", () => {
  const root = "/evals";
  const file = "/evals/run-x.ts";
  for (const head of [
    `const m = await import("./claude-cli/spawn-claude");\n`,
    `const m = require("./claude-cli/spawn-claude");\n`,
    `export { x } from "./claude-cli/spawn-claude";\n`,
  ]) {
    assert.equal(isInert(head, file, root), true, head);
  }
});

test("a path that only resembles claude-cli is not under it", () => {
  const root = "/evals";
  const src = `import { x } from "./claude-cli-notes/x";\n${GATE}`;
  assert.equal(isInert(src, "/evals/run-x.ts", root), false);
});

test("import specifiers are resolved against the importing file", () => {
  const targets = importTargets(
    `import a from "../claude-cli/x";\nimport b from "zod";\n`,
    "/evals/nested/run-x.ts"
  );
  assert.deepEqual(targets, ["/evals/claude-cli/x"]);
});
