import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  isInScope,
  isPureReexportBarrel,
  runCheck,
} from "./check-no-barrel-test-suites.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SCRIPT = join(__dirname, "check-no-barrel-test-suites.mjs");

function makeSandbox() {
  const root = mkdtempSync(join(tmpdir(), "barrel-guard-"));
  const pkgDir = join(root, "demo", "src", "adapters");
  mkdirSync(pkgDir, { recursive: true });
  return { root, pkgDir };
}

test("flags a test suite whose subject module is a pure re-export barrel", () => {
  const { root, pkgDir } = makeSandbox();
  try {
    writeFileSync(
      join(pkgDir, "duration.converter.ts"),
      [
        "// Barrel kept for import ergonomics.",
        'export { convertTcxDuration } from "./tcx-to-krd.converter";',
        'export type { KrdDurationConversionResult } from "./krd-to-tcx.converter";',
        'export * from "./shared";',
      ].join("\n")
    );
    writeFileSync(join(pkgDir, "duration.converter.test.ts"), "// suite\n");
    const violations = runCheck({ packagesRoot: root });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-NoBarrelTestSuite");
    assert.match(violations[0].detail, /R-NoBarrelTestSuite: /);
    assert.match(violations[0].detail, /pure re-export barrel/);
    assert.match(violations[0].detail, /test the source modules instead/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("accepts a test suite whose subject module has executable logic", () => {
  const { root, pkgDir } = makeSandbox();
  try {
    writeFileSync(
      join(pkgDir, "target.converter.ts"),
      [
        'export { helper } from "./helper";',
        "export const convertTarget = (value) => value * 2;",
      ].join("\n")
    );
    writeFileSync(join(pkgDir, "target.converter.test.ts"), "// suite\n");
    const violations = runCheck({ packagesRoot: root });
    assert.equal(violations.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ignores test files without a resolvable subject module", () => {
  const { root, pkgDir } = makeSandbox();
  try {
    writeFileSync(join(pkgDir, "round-trip.test.ts"), "// integration\n");
    const violations = runCheck({ packagesRoot: root });
    assert.equal(violations.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scopes to *.test.{ts,tsx} excluding test-utils, e2e, stories, and test-setup", () => {
  assert.equal(isInScope("packages/tcx/src/adapters/x.test.ts"), true);
  assert.equal(isInScope("packages/spa/src/components/X.test.tsx"), true);
  assert.equal(
    isInScope("packages/core/src/test-utils/fixtures.test.ts"),
    false
  );
  assert.equal(isInScope("packages/spa/e2e/editor.test.ts"), false);
  assert.equal(isInScope("packages/spa/src/Badge.stories.test.tsx"), false);
  assert.equal(isInScope("packages/spa/src/test-setup.ts"), false);
  assert.equal(isInScope("packages/core/src/domain/types.ts"), false);
});

test("classifies barrel sources correctly", () => {
  assert.equal(
    isPureReexportBarrel(
      'export { a } from "./a";\nexport type { B } from "./b";'
    ),
    true
  );
  assert.equal(isPureReexportBarrel('export * as ns from "./ns";'), true);
  assert.equal(
    isPureReexportBarrel(
      '/* doc */\n// comment\nexport {\n  a,\n  b,\n} from "./ab";'
    ),
    true
  );
  assert.equal(
    isPureReexportBarrel('export const x = 1;\nexport { a } from "./a";'),
    false
  );
  assert.equal(isPureReexportBarrel("export type X = { a: number };"), false);
  assert.equal(isPureReexportBarrel(""), false);
});

test("real tree has zero violations (whole-tree smoke)", () => {
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No test suite targets a pure re-export barrel/);
});

test("--changed-files exits zero silently when no in-scope test file is staged", () => {
  const repo = mkdtempSync(join(tmpdir(), "barrel-guard-git-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: repo });
    const result = spawnSync(process.execPath, [SCRIPT, "--changed-files"], {
      cwd: repo,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
