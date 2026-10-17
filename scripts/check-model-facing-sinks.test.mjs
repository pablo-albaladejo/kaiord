import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { runCaughtErrorCheck, runCheck } from "./check-model-facing-sinks.mjs";
import { SINKS, FENCED_FIELD_NAMES } from "./model-facing-sinks.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = join(
  ROOT,
  "packages/workout-spa-editor/src/application/chat/tools"
);

const sandbox = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "sinks-"));
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
};

const tool = (name) => `
export const create = () => ({
  name: "${name}",
  execute: async () => ({ ok: true }),
});
`;

test("the live tree passes", () => {
  const violations = runCheck({ toolsRoot: LIVE });
  assert.deepEqual(violations, []);
});

test("an undeclared tool fails", () => {
  const dir = sandbox({ "brand-new-tool.ts": tool("brand_new_tool") });
  const violations = runCheck({ toolsRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.ok(violations.some((v) => v.kind === "undeclared"));
});

test("several tools in one file are all seen", () => {
  const dir = sandbox({
    "many.ts": tool("first_tool") + tool("second_tool"),
  });
  const violations = runCheck({ toolsRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  const names = violations.map((v) => v.tool);
  assert.ok(names.includes("first_tool"));
  assert.ok(names.includes("second_tool"));
});

test("a tool in a subdirectory is scanned", () => {
  const dir = sandbox({});
  mkdirSync(join(dir, "nested"), { recursive: true });
  writeFileSync(join(dir, "nested", "buried-tool.ts"), tool("buried_tool"));
  const violations = runCheck({ toolsRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.ok(violations.some((v) => v.tool === "buried_tool"));
});

test("execute written as a method is recognized", () => {
  const dir = sandbox({
    "method-form.ts": `
export const create = () => ({
  name: "method_form_tool",
  async execute() { return { ok: true }; },
});
`,
  });
  const violations = runCheck({ toolsRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.ok(violations.some((v) => v.tool === "method_form_tool"));
});

test("a duplicate declaration fails", () => {
  const clone = { ...SINKS[0] };
  SINKS.push(clone);
  const violations = runCheck({ toolsRoot: LIVE });
  SINKS.pop();
  assert.ok(
    violations.some((v) => v.kind === "duplicate" && v.tool === clone.tool)
  );
});

test("an unrecognized status fails", () => {
  const original = SINKS[0].status;
  SINKS[0].status = "probably-fine";
  const violations = runCheck({ toolsRoot: LIVE });
  SINKS[0].status = original;
  assert.ok(violations.some((v) => v.kind === "bad-status"));
});

test("zero files scanned is a fault, not a pass", () => {
  const dir = sandbox({});
  const violations = runCheck({ toolsRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "scan-empty");
});

test("an unreadable directory is a fault, not a pass", () => {
  const violations = runCheck({ toolsRoot: join(ROOT, "does-not-exist") });
  assert.equal(violations[0].kind, "scan-failed");
});

test("a declaration without provenance fails", () => {
  const original = SINKS[0].provenance;
  SINKS[0].provenance = "";
  const violations = runCheck({ toolsRoot: LIVE });
  SINKS[0].provenance = original;
  assert.ok(violations.some((v) => v.kind === "no-provenance"));
});

test("the recognized field set is declared in one place", () => {
  assert.ok(FENCED_FIELD_NAMES.includes("error"));
  assert.ok(FENCED_FIELD_NAMES.includes("name"));
});

test("query_health is recorded as unbounded, not clean", () => {
  const health = SINKS.find((s) => s.tool === "query_health");
  assert.equal(health.status, "unbounded");
});

const HOOKS_LIVE = join(ROOT, "packages/workout-spa-editor/src/hooks/chat");

// The pre-fix body of hooks/chat/run-confirmed-tool.ts, verbatim: the fixture
// the hooks scan exists to reject.
const LEAKING_RUN_CONFIRMED_TOOL = `
export const runConfirmedTool = async (tools, toolName, input) => {
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) return { output: { error: "unknown_tool" }, ok: false };
  try {
    return { output: await tool.execute(input), ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { output: { error: message }, ok: false };
  }
};
`;

const hookViolations = (files) => {
  const dir = sandbox(files);
  const violations = runCaughtErrorCheck({ hooksRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  return violations;
};

const catchBody = (body) => `
export const run = async () => {
  try { await work(); } catch (err) { ${body} }
};
`;

test("the live hooks/chat tree keeps caught error text away from the model", () => {
  assert.deepEqual(runCaughtErrorCheck({ hooksRoot: HOOKS_LIVE }), []);
});

test("a reintroduced e.message in run-confirmed-tool fails", () => {
  const violations = hookViolations({
    "run-confirmed-tool.ts": LEAKING_RUN_CONFIRMED_TOOL,
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "caught-error-text");
  assert.match(violations[0].detail, /run-confirmed-tool\.ts:7/);
});

for (const [label, body] of [
  ["optional-chained message", "return { error: err?.message };"],
  ["stack", "return { error: err.stack };"],
  ["String()", "return { error: String(err) };"],
  ["template literal", "return { error: `failed: ${err}` };"],
  ["toString()", "return { error: err.toString() };"],
  ["an `as` cast", "return { error: (err as Error).message };"],
  ["a bracket key", 'return { error: err["message"] };'],
  ["destructuring the binding", "const { message } = err; return { message };"],
  ["JSON.stringify()", "return { error: JSON.stringify(err) };"],
  ["string concatenation", 'return { error: "failed: " + err };'],
  ["trailing concatenation", 'return { error: err + " failed" };'],
  ["a spread", "return { ...err };"],
  ["the raw value as a property", "return { error: err };"],
  ["the raw value as a shorthand property", "return { ok: false, err };"],
  ["the raw value returned", "return err;"],
]) {
  test(`reading a caught error's text via ${label} fails`, () => {
    const violations = hookViolations({ "leak.ts": catchBody(body) });
    assert.ok(violations.some((v) => v.kind === "caught-error-text"));
  });
}

test("a destructured catch binding fails", () => {
  const violations = hookViolations({
    "leak.ts": `try { run(); } catch ({ message }) { return { error: message }; }`,
  });
  assert.ok(violations.some((v) => v.kind === "caught-error-text"));
});

const promiseCatch = (handler) => `
export const run = () => work().catch(${handler});
`;

for (const [label, handler] of [
  ["an arrow with parens", "(err) => ({ error: err.message })"],
  ["an arrow without parens", "err => ({ error: String(err) })"],
  [
    "an async arrow with a block",
    "async (err) => { return { error: `${err}` }; }",
  ],
  ["a function expression", "function (err) { return { error: err.stack }; }"],
  ["a typed arrow", "(err: unknown) => ({ error: (err as Error).message })"],
  ["an arrow returning the value", "(err) => err"],
]) {
  test(`a promise .catch via ${label} that reads the error's text fails`, () => {
    const violations = hookViolations({ "leak.ts": promiseCatch(handler) });
    assert.ok(violations.some((v) => v.kind === "caught-error-text"));
  });
}

test("a promise .catch that destructures its binding fails", () => {
  const violations = hookViolations({
    "leak.ts": promiseCatch("({ message }) => ({ error: message })"),
  });
  assert.ok(violations.some((v) => v.kind === "caught-error-text"));
});

test("a promise .catch that logs and returns a code passes", () => {
  const violations = hookViolations({
    "ok.ts": promiseCatch(
      '(err) => { logFailure(err); return { error: "x" }; }'
    ),
  });
  assert.deepEqual(violations, []);
});

test("a promise .catch with a function expression that returns a code passes", () => {
  const violations = hookViolations({
    "ok.ts": promiseCatch(
      'function (err) { logFailure(err); return { error: "x" }; }'
    ),
  });
  assert.deepEqual(violations, []);
});

test("a typed catch binding is read as its identifier, not destructured", () => {
  const violations = hookViolations({
    "ok.ts": `try { run(); } catch (err: unknown) { logFailure(err); return { error: "x" }; }`,
  });
  assert.deepEqual(violations, []);
});

test("a typed catch binding that reads the text fails", () => {
  const violations = hookViolations({
    "leak.ts": `try { run(); } catch (err: unknown) { return { error: String(err) }; }`,
  });
  assert.ok(violations.some((v) => v.kind === "caught-error-text"));
});

test("a comment naming the error's text is not a leak", () => {
  const violations = hookViolations({
    "ok.ts": catchBody(
      '// never return err.message here\n /* nor String(err) */ return { error: "x" };'
    ),
  });
  assert.deepEqual(violations, []);
});

test("a comment marker inside a string does not hide the code after it", () => {
  const violations = hookViolations({
    "leak.ts": catchBody(
      'const url = "https://x"; return { error: err.message };'
    ),
  });
  assert.ok(violations.some((v) => v.kind === "caught-error-text"));
});

test("a binding with regex metacharacters is matched literally", () => {
  const violations = hookViolations({
    "leak.ts": `try { run(); } catch ($e) { return { error: $e.message }; }`,
    "ok.ts": `try { run(); } catch ($e) { return { error: e.message }; }`,
  });
  assert.deepEqual(
    violations.map((v) => v.file),
    ["leak.ts"]
  );
});

test("passing the error as a call argument passes", () => {
  const violations = hookViolations({
    "ok.ts": catchBody('report(ctx, err, 1); return { error: "x" };'),
  });
  assert.deepEqual(violations, []);
});

test("logging the whole error and returning a code passes", () => {
  const violations = hookViolations({
    "ok.ts": catchBody('logFailure(err); return { error: "action_failed" };'),
  });
  assert.deepEqual(violations, []);
});

test("a .tsx hook source and a nested directory are scanned", () => {
  const dir = sandbox({});
  mkdirSync(join(dir, "nested"), { recursive: true });
  writeFileSync(
    join(dir, "nested", "leak.tsx"),
    catchBody("return { error: err.message };")
  );
  const violations = runCaughtErrorCheck({ hooksRoot: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.ok(violations.some((v) => v.kind === "caught-error-text"));
});

test("test files under hooks/chat are not scanned", () => {
  const violations = hookViolations({
    "ok.ts": "export const x = 1;",
    "leak.test.ts": catchBody("return { error: err.message };"),
  });
  assert.deepEqual(violations, []);
});

test("an empty hooks directory is a fault, not a pass", () => {
  const violations = hookViolations({});
  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "scan-empty");
});

test("an unreadable hooks directory is a fault, not a pass", () => {
  const violations = runCaughtErrorCheck({
    hooksRoot: join(ROOT, "does-not-exist"),
  });
  assert.equal(violations[0].kind, "scan-failed");
});
