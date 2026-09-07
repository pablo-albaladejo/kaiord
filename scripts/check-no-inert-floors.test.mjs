import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { runCheck, fileViolations, isInert } from "./check-no-inert-floors.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = join(ROOT, "packages/ai/src/evals");

const INERT_HEAD = `import { loadEvalModel } from "./load-eval-model";\n`;
const KEYLESS_HEAD = `import { readFixture } from "./fixtures";\n`;

const sandbox = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "floors-"));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
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
  const src = `${INERT_HEAD}const ok = rate >= 0.9;\nprocess.exit(ok ? 0 : 1);\n`;
  const violations = fileViolations(src, "run-x.ts");
  assert.ok(violations.some((v) => v.kind === "score-comparison"));
  assert.ok(violations.some((v) => v.kind === "computed-exit"));
});

test("a keyless runner may gate on a score", () => {
  const src = `${KEYLESS_HEAD}const ok = rate >= 0.9;\nprocess.exit(ok ? 0 : 1);\n`;
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
  const dir = sandbox({});
  const violations = runCheck({ runnersRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(violations[0].kind, "scan-empty");
});

test("an unreadable directory is a fault, not a pass", () => {
  const violations = runCheck({ runnersRoot: join(ROOT, "does-not-exist") });
  assert.equal(violations[0].kind, "scan-failed");
});

test("only run-*.ts files are scanned", () => {
  const dir = sandbox({
    "run-a.ts": `${INERT_HEAD}process.exit(0);\n`,
    "helper.ts": `${INERT_HEAD}process.exit(ok ? 0 : 1);\n`,
  });
  const violations = runCheck({ runnersRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.deepEqual(violations, []);
});
