import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findViolations } from "./check-hook-collection-map-naming.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

test("compliant useFactory passes", () => {
  const source = `
    const sources = factories.map((useFactory) =>
      useFactory(profileId, days)
    );
  `;
  assert.deepEqual(findViolations(source), []);
});

test("misnamed `f` is flagged", () => {
  const source = `const sources = factories.map((f) => f(profileId, days));`;
  const v = findViolations(source);
  assert.equal(v.length, 1);
  assert.equal(v[0].param, "f");
});

test("misnamed `update` (u-prefix but not `use`) is flagged", () => {
  const source = `const xs = items.map((update) => update(args));`;
  const v = findViolations(source);
  assert.equal(v.length, 1);
  assert.equal(v[0].param, "update");
});

test("misnamed `unused` is flagged", () => {
  const source = `const xs = items.map((unused) => unused());`;
  const v = findViolations(source);
  assert.equal(v.length, 1);
  assert.equal(v[0].param, "unused");
});

test("non-invoking map is exempt regardless of name", () => {
  const source = `const ids = items.map((x) => x.id);`;
  assert.deepEqual(findViolations(source), []);
});

test("non-invoking map with non-use prefix is exempt", () => {
  const source = `const labels = items.map((thing) => thing.label);`;
  assert.deepEqual(findViolations(source), []);
});

test("non-receiver-bound callable map is flagged", () => {
  const source = `const results = [fn1, fn2].map((g) => g());`;
  const v = findViolations(source);
  assert.equal(v.length, 1);
  assert.equal(v[0].param, "g");
});

test("multiple violations in one file are all reported", () => {
  const source = `
    const a = arr.map((f) => f(1));
    const b = other.map((g) => g());
    const c = ok.map((useThing) => useThing());
  `;
  const v = findViolations(source);
  assert.equal(v.length, 2);
  assert.deepEqual(
    v.map((x) => x.param).sort(),
    ["f", "g"]
  );
});

test("post-rollout SPA codebase has zero violations", () => {
  if (!existsSync(SPA_SRC)) return;
  const files = walk(SPA_SRC);
  const violations = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const v of findViolations(source)) {
      violations.push({ file, ...v });
    }
  }
  assert.deepEqual(
    violations,
    [],
    `Hook-collection map naming guard found violations in the live SPA tree: ${JSON.stringify(violations, null, 2)}`
  );
});
