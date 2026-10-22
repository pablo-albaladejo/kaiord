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
  const src = `${INERT_HEAD}// it used to be rate >= 0.9 here\n/*\n * or score < 1\n */\n`;
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

// Provoked reds for the evasions the review found: each one passed the guard
// with a gating runner and zero violations before the guard moved to the
// TypeScript AST, every string literal as a specifier, and a transitive walk.

const kindsOf = (files) => checkSandbox(files).map((v) => v.kind);

test("a transitive re-export through a helper makes the runner inert", () => {
  const kinds = kindsOf({
    "live-helpers.ts": `export { loadLiveModel } from "./claude-cli/load-live-model";\n`,
    "run-t.ts": `import { loadLiveModel } from "./live-helpers";\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
  assert.ok(kinds.includes("score-comparison"));
});

test("a helper two hops away is still followed", () => {
  const kinds = kindsOf({
    "a.ts": `export * from "./b";\n`,
    "b.ts": `export * from "./claude-cli/spawn-claude";\n`,
    "run-t.ts": `import { x } from "./a.js";\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("createRequire makes the runner inert", () => {
  const kinds = kindsOf({
    "run-c.ts": `import { createRequire } from "node:module";\nconst req = createRequire(import.meta.url);\nconst m = req("./x");\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("a string constant passed to import() is a specifier", () => {
  const kinds = kindsOf({
    "run-s.ts": `const p = "./claude-cli/load-live-model";\nconst m = await import(p);\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("a concatenated import path is an opaque loader", () => {
  const kinds = kindsOf({
    "run-k.ts": `const m = await import("./claude-" + "cli/load-live-model");\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("a computed process.exitCode is a computed exit", () => {
  const kinds = kindsOf({
    "run-e.ts": `import { x } from "./claude-cli/load-live-model";\nconst ok = r >= 0.9;\nprocess.exitCode = ok ? 0 : 1;\n`,
  });
  assert.deepEqual(kinds, ["computed-exit"]);
});

test("a literal process.exitCode is allowed", () => {
  const kinds = kindsOf({
    "run-e.ts": `import { x } from "./claude-cli/load-live-model";\nprocess.exitCode = 1;\nprocess["exitCode"] = 2;\n`,
  });
  assert.deepEqual(kinds, []);
});

test("run-*.mts and run-*.cts runners are scanned, their tests are not", () => {
  const head = `import { x } from "./claude-cli/load-live-model";\n${GATE}`;
  const violations = checkSandbox({
    "run-m.mts": head,
    "run-c.cts": head,
    "run-m.test.mts": head,
  });
  const files = new Set(violations.map((v) => v.file));
  assert.deepEqual([...files].sort(), ["run-c.cts", "run-m.mts"]);
});

test("a keyless runner whose helpers stay local may still gate", () => {
  const kinds = kindsOf({
    "helpers.ts": `export const readFixture = () => 1;\n`,
    "run-keyless.ts": `import { readFixture } from "./helpers";\n${GATE}`,
  });
  assert.deepEqual(kinds, []);
});

test("a plain .mjs helper re-exporting claude-cli is followed", () => {
  const kinds = kindsOf({
    "helpers.mjs": `export { loadLiveModel } from "./claude-cli/load-live-model.js";\n`,
    "run-j.ts": `import { loadLiveModel } from "./helpers.mjs";\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
  assert.ok(kinds.includes("score-comparison"));
});

test("an extensionless import of a .cjs helper is followed", () => {
  const kinds = kindsOf({
    "helpers.cjs": `module.exports = require("./claude-cli/spawn-claude");\n`,
    "run-j.ts": `import helpers from "./helpers";\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("an ambiguous stem follows both files, so the offending one is found", () => {
  const kinds = kindsOf({
    "helpers.js": `export const readFixture = () => 1;\n`,
    "helpers.ts": `export * from "./claude-cli/spawn-claude";\n`,
    "run-a.ts": `import { readFixture } from "./helpers.js";\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("a local package directory without an index is opaque, so inert", () => {
  const kinds = kindsOf({
    "lib/package.json": `{ "main": "../claude-cli/spawn-claude.js" }\n`,
    "lib/main.txt": "",
    "run-p.ts": `import { x } from "./lib";\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("a .jsx helper is followed", () => {
  const kinds = kindsOf({
    "view.jsx": `export * from "./claude-cli/spawn-claude";\n`,
    "run-v.ts": `import { x } from "./view";\n${GATE}`,
  });
  assert.ok(kinds.includes("computed-exit"));
});

test("a plain JavaScript runner is scanned and fails", () => {
  const violations = checkSandbox({
    "run-j.mjs": `import { spawnClaude } from "./claude-cli/spawn-claude.js";\nconst ok = rate >= 0.9;\nprocess.exit(ok ? 0 : 1);\n`,
    "run-j.test.mjs": `import { spawnClaude } from "./claude-cli/spawn-claude.js";\n${GATE}`,
  });
  assert.deepEqual(
    [...new Set(violations.map((v) => `${v.file} ${v.kind}`))].sort(),
    ["run-j.mjs computed-exit", "run-j.mjs score-comparison"]
  );
});

// Only import positions are walked: a path literal that is not imported is
// never read as a module, so a keyless runner naming its package root keeps
// its gate. Reaching claude-cli/ still scans every literal.

test("a keyless runner resolving a path to its package root still gates", () => {
  const kinds = kindsOf({
    "package.json": "{}\n",
    "a/b/run-k.ts": `import { resolve } from "node:path";\nconst ROOT = resolve(import.meta.dirname, "../..");\n${GATE}`,
  });
  assert.deepEqual(kinds, []);
});

test("a keyless runner joining to a parent with a package.json still gates", () => {
  const kinds = kindsOf({
    "package.json": "{}\n",
    "sub/run-k.ts": `import { join } from "node:path";\nconst ROOT = join(import.meta.dirname, "..");\nconst p = ["a", "b"].join(".");\n${GATE}`,
  });
  assert.deepEqual(kinds, []);
});

test("require.resolve and import = require() are import positions, followed", () => {
  for (const head of [
    `const p = require.resolve("./helpers");\n`,
    `import h = require("./helpers");\n`,
  ]) {
    const kinds = kindsOf({
      "helpers.ts": `export * from "./claude-cli/spawn-claude";\n`,
      "run-r.ts": `${head}${GATE}`,
    });
    assert.ok(kinds.includes("computed-exit"), head);
  }
});
