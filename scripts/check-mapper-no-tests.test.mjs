// Tests for scripts/check-mapper-no-tests.mjs using node:test.
//
// Strategy: build a small temp packages/ tree, exercise runCheck against
// it. Real-world coverage is asserted via a smoke test against the live
// monorepo packages/ root (must pass with the ALLOWLIST applied).

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-mapper-no-tests.mjs";

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
  sandbox = mkdtempSync(join(tmpdir(), "check-mapper-no-tests-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-mapper-no-tests", () => {
  test("clean tree: no *.mapper.test.* files → no violations", () => {
    write("pkg-a/src/foo.mapper.ts", "export const f = (x) => x;");
    write("pkg-a/src/foo.converter.ts", "export const c = (x) => x;");
    write("pkg-a/src/foo.converter.test.ts", "test('x', () => {});");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("flags a *.mapper.test.ts file", () => {
    write(
      "pkg-a/src/foo.mapper.test.ts",
      "import { test } from 'vitest'; test('x', () => {});"
    );

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-MapperNoTests");
    assert.match(violations[0].file, /foo\.mapper\.test\.ts$/);
  });

  test("flags a *.mapper.test.tsx file", () => {
    write("pkg-a/src/foo.mapper.test.tsx", "test('x', () => {});");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /foo\.mapper\.test\.tsx$/);
  });

  test("flags a *.mapper.spec.ts file too", () => {
    write("pkg-a/src/foo.mapper.spec.ts", "test('x', () => {});");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /foo\.mapper\.spec\.ts$/);
  });

  test("ignores node_modules and dist", () => {
    write("pkg-a/node_modules/x/foo.mapper.test.ts", "");
    write("pkg-a/dist/foo.mapper.test.ts", "");

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("real packages/ root passes with the seeded allowlist", () => {
    const violations = runCheck({ packagesRoot: REAL_PACKAGES_ROOT });
    // After the audit, the only mapper test files are the 7 seeded entries.
    // Any additional violation indicates either a new mapper test file
    // landed (must be drained or added to allowlist) or the allowlist is
    // out of sync.
    assert.equal(
      violations.length,
      0,
      `Unexpected R-MapperNoTests violations:\n${violations
        .map((v) => `  - ${v.file}`)
        .join("\n")}`
    );
  });

  test("ALLOWLIST is empty (drained in PR3)", () => {
    assert.equal(ALLOWLIST.size, 0);
  });
});
