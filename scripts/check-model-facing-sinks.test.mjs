import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { runCheck } from "./check-model-facing-sinks.mjs";
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
