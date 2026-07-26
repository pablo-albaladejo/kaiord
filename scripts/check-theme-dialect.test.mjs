// Tests for scripts/check-theme-dialect.mjs using node:test.
//
// Strategy: spin up a temp tree mirroring the SPA components layout and
// drive `runCheck` against it. Cover (a) unconditional dark-palette
// utilities, (b) the dark:-variant exemption, (c) adaptive semantic
// utilities passing, (d) bare `border` with and without a color token,
// and (e) the real components tree as a post-migration baseline.

import { strict as assert } from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-theme-dialect.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_COMPONENTS = join(
  REPO_ROOT,
  "packages",
  "workout-spa-editor",
  "src",
  "components"
);

let sandbox;
let srcRoot;

function write(rel, body) {
  const abs = join(srcRoot, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "theme-dialect-"));
  srcRoot = join(sandbox, "components");
  mkdirSync(srcRoot, { recursive: true });
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-theme-dialect", () => {
  test("allowlist ships empty", () => {
    assert.equal(ALLOWLIST.size, 0);
  });

  test("flags unconditional dark-palette utilities", () => {
    write(
      "pages/Sample/Sample.tsx",
      'export const c = <div className="rounded bg-slate-900 text-slate-100 border-slate-700/60" />;\n'
    );
    const violations = runCheck({ srcRoot });
    const tokens = violations.map((v) => v.detail).sort();
    assert.deepEqual(tokens, [
      "bg-slate-900",
      "border-slate-700",
      "text-slate-100",
    ]);
    assert.ok(violations.every((v) => v.rule === "R-ThemeDarkOnly"));
  });

  test("accepts dark:-prefixed palette utilities and adaptive tokens", () => {
    write(
      "pages/Sample/Paired.tsx",
      'export const c = <div className="bg-white text-ink-strong border-edge dark:bg-slate-900 dark:hover:bg-slate-800 dark:[&>*+*]:border-slate-800" />;\n'
    );
    const violations = runCheck({ srcRoot });
    assert.deepEqual(violations, []);
  });

  test("flags bare border with no color token", () => {
    write(
      "molecules/Sample/Bare.tsx",
      'export const c = <div className="rounded-lg border p-2" />;\n'
    );
    const violations = runCheck({ srcRoot });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-ThemeBareBorder");
  });

  test("accepts border paired with a color token", () => {
    write(
      "molecules/Sample/Colored.tsx",
      'export const a = <div className="rounded-lg border border-edge p-2" />;\n' +
        'export const b = <div className="border border-gray-200 dark:border-gray-700" />;\n'
    );
    const violations = runCheck({ srcRoot });
    assert.deepEqual(violations, []);
  });

  test("skips test and story files", () => {
    write(
      "pages/Sample/Sample.test.tsx",
      'export const c = <div className="bg-slate-900" />;\n'
    );
    write(
      "pages/Sample/Sample.stories.tsx",
      'export const c = <div className="bg-slate-900" />;\n'
    );
    const violations = runCheck({ srcRoot });
    assert.deepEqual(violations, []);
  });

  test("real components tree passes (post-migration baseline)", () => {
    if (!existsSync(REAL_COMPONENTS)) return;
    const violations = runCheck();
    assert.deepEqual(violations, []);
  });
});
