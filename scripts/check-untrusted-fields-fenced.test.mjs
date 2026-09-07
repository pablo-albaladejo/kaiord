import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { runCheck, fileViolations } from "./check-untrusted-fields-fenced.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = join(
  ROOT,
  "packages/workout-spa-editor/src/application/chat/tools"
);

const sandbox = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "fenced-"));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
};

const inSandbox = (files) => {
  const dir = sandbox(files);
  const violations = runCheck({ toolsRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  return violations;
};

test("the live tree passes", () => {
  assert.deepEqual(runCheck({ toolsRoot: LIVE }), []);
});

test("it catches the defect that actually happened", () => {
  // summarizeWorkouts passed workout.name through raw for the life of the
  // function while the fence docstring claimed the field was covered. Nothing
  // failed, because the failure was an omission. Put the omission back and the
  // guard must name it — a synthetic fixture cannot make that claim.
  const live = readFileSync(join(LIVE, "summarize-workouts.ts"), "utf8");
  const unfenced = live.replace(
    "workout?.name ? fenceUntrusted(workout.name) : null",
    "workout?.name ?? null"
  );
  assert.notEqual(
    unfenced,
    live,
    "the live call site changed shape; update this fixture"
  );

  const violations = fileViolations(unfenced, "summarize-workouts.ts");

  assert.equal(violations.length, 1);
  assert.equal(violations[0].field, "name");
});

test("an unfenced recognized field fails, naming the file and the field", () => {
  const violations = inSandbox({
    "summarize-leaky.ts": `
export const summarize = (record) => ({
  date: record.date,
  name: record.krd.name,
});
`,
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "unfenced");
  assert.equal(violations[0].field, "name");
  assert.equal(violations[0].file, "summarize-leaky.ts");
  assert.equal(violations[0].line, 4);
});

test("a fenced field passes", () => {
  const violations = inSandbox({
    "summarize-ok.ts": `
export const summarize = (record) => ({
  name: record.krd.name ? fenceUntrusted(record.krd.name) : null,
});
`,
  });
  assert.deepEqual(violations, []);
});

test("every recognized field name is enforced, not just the first", () => {
  const violations = inSandbox({
    "summarize-all.ts": `
export const summarize = (r) => ({
  title: r.title,
  description: r.description,
  notes: r.notes,
  error: r.error,
  message: r.message,
  reason: r.reason,
});
`,
  });
  assert.deepEqual(
    violations.map((v) => v.field).sort(),
    ["description", "error", "message", "notes", "reason", "title"]
  );
});

test("a field outside the recognized set is a KNOWN gap, not caught", () => {
  const violations = inSandbox({
    "summarize-gap.ts": `
export const summarize = (r) => ({
  coachRemark: r.coachRemark,
});
`,
  });
  assert.deepEqual(violations, []);
});

test("an opaque nested payload is not seen — the guard is syntactic", () => {
  const violations = inSandbox({
    "summarize-opaque.ts": `
export const summarize = (r) => ({
  krd: r.krd,
});
`,
  });
  assert.deepEqual(violations, []);
});

test("a tool's own name and description literals are not data paths", () => {
  const violations = inSandbox({
    "a-tool.ts": `
export const create = () => ({
  name: "query_workouts",
  description:
    "Read the user's workouts in a date range. " +
    "Returns count and totals.",
  execute: async () => ({ ok: true }),
});
`,
  });
  assert.deepEqual(violations, []);
});

test("a zod input-schema field is a shape, not a returned value", () => {
  const violations = inSandbox({
    "zod-tool.ts": `
export const create = () => ({
  inputSchema: z.object({
    description: z.string().min(1).describe("What to generate"),
  }),
});
`,
  });
  assert.deepEqual(violations, []);
});

test("a type member is a declaration, not a value", () => {
  const violations = inSandbox({
    "summarize-typed.ts": `
export type Row = {
  name: string | null;
  description: string;
};

export const summarize = (r) => ({
  name: fenceUntrusted(r.name),
  description: fenceUntrusted(r.description),
});
`,
  });
  assert.deepEqual(violations, []);
});

test("a field inside a comment is not a value", () => {
  const violations = fileViolations(
    `/**
 * The name: field arrives from an import.
 */
export const x = 1;
`,
    "commented.ts"
  );
  assert.deepEqual(violations, []);
});

test("a test file is not scanned", () => {
  const violations = inSandbox({
    "summarize-ok.ts": "export const x = 1;\n",
    "summarize-leaky.test.ts": "const y = { name: record.name };\n",
  });
  assert.deepEqual(violations, []);
});

test("a nested source is scanned", () => {
  const dir = sandbox({});
  mkdirSync(join(dir, "nested"), { recursive: true });
  writeFileSync(
    join(dir, "nested", "summarize-buried.ts"),
    "export const s = (r) => ({ notes: r.notes });\n"
  );
  const violations = runCheck({ toolsRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].field, "notes");
});

test("zero files scanned is a fault, not a pass", () => {
  const violations = inSandbox({});
  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "scan-empty");
});

test("an unreadable directory is a fault, not a pass", () => {
  const violations = runCheck({ toolsRoot: join(ROOT, "does-not-exist") });
  assert.equal(violations[0].kind, "scan-failed");
});
