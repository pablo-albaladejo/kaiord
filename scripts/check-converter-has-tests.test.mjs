// Tests for scripts/check-converter-has-tests.mjs using node:test.

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-converter-has-tests.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_PACKAGES_ROOT = join(REPO_ROOT, "packages");

let sandbox;

function write(rel, body = "") {
  const abs = join(sandbox, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "check-converter-has-tests-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-converter-has-tests", () => {
  test("converter with sibling .test.ts → no violation", () => {
    write("pkg-a/src/foo.converter.ts", "export const c = (x) => x;");
    write("pkg-a/src/foo.converter.test.ts", "test('x', () => {});");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("converter without sibling test → violation", () => {
    write("pkg-a/src/foo.converter.ts", "export const c = (x) => x;");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-ConverterHasTests");
    assert.match(violations[0].file, /foo\.converter\.ts$/);
  });

  test("converter with .test.tsx sibling → no violation", () => {
    write("pkg-a/src/foo.converter.tsx", "export const c = (x) => x;");
    write("pkg-a/src/foo.converter.test.tsx", "test('x', () => {});");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("converter with .spec.ts sibling → no violation", () => {
    write("pkg-a/src/foo.converter.ts", "export const c = (x) => x;");
    write("pkg-a/src/foo.converter.spec.ts", "test('x', () => {});");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("test in NESTED directory does NOT satisfy the rule", () => {
    write("pkg-a/src/foo.converter.ts", "export const c = (x) => x;");
    write("pkg-a/src/__tests__/foo.converter.test.ts", "test('x', () => {});");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /foo\.converter\.ts$/);
  });

  test("ignores node_modules and dist", () => {
    write("pkg-a/node_modules/x/foo.converter.ts", "");
    write("pkg-a/dist/foo.converter.ts", "");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("real packages/ root passes with the seeded allowlist", () => {
    const violations = runCheck({ packagesRoot: REAL_PACKAGES_ROOT });
    assert.equal(
      violations.length,
      0,
      `Unexpected R-ConverterHasTests violations:\n${violations
        .map((v) => `  - ${v.file}`)
        .join("\n")}`
    );
  });

  test("ALLOWLIST is empty (drained in PR3)", () => {
    assert.equal(ALLOWLIST.size, 0);
  });
});
