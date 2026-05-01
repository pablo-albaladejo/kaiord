// Tests for scripts/check-allowlists-empty.mjs using node:test.

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runCheck } from "./check-allowlists-empty.mjs";

let sandbox;

function write(name, body) {
  const abs = join(sandbox, name);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "check-allowlists-empty-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("REJECT — non-empty ALLOWLIST", () => {
  test('rejects export const ALLOWLIST = new Set(["X"])', () => {
    write(
      "check-foo.mjs",
      `export const ALLOWLIST = new Set([\n  "packages/X/Y.ts",\n]);\n`
    );

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-AllowlistsEmpty");
  });

  test("rejects ALLOWLIST with a path containing brackets [slug].ts", () => {
    write(
      "check-foo.mjs",
      `export const ALLOWLIST = new Set([\n  "packages/landing/src/pages/[slug].ts",\n]);\n`
    );

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects const ALLOWLIST (without export)", () => {
    write("check-foo.mjs", `const ALLOWLIST = new Set([\n  "X",\n]);\n`);

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 1);
  });
});

describe("ALLOW — empty ALLOWLIST", () => {
  test("allows new Set()", () => {
    write("check-foo.mjs", `export const ALLOWLIST = new Set();\n`);

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows new Set([])", () => {
    write("check-foo.mjs", `export const ALLOWLIST = new Set([]);\n`);

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 0);
  });

  test('allows comment fixture mentioning ALLOWLIST = new Set(["X"])', () => {
    write(
      "check-foo.mjs",
      `// historical: ALLOWLIST = new Set(["X"]) was the old form\nexport const ALLOWLIST = new Set();\n`
    );

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows block-comment fixture mentioning ALLOWLIST", () => {
    write(
      "check-foo.mjs",
      `/*\n * Example violation:\n *   export const ALLOWLIST = new Set(["X"]);\n */\nexport const ALLOWLIST = new Set();\n`
    );

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("scope", () => {
  test("ignores *.test.mjs files", () => {
    write("check-foo.test.mjs", `export const ALLOWLIST = new Set(["X"]);\n`);

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("ignores files not starting with check-", () => {
    write("audit-snapshot.mjs", `export const ALLOWLIST = new Set(["X"]);\n`);

    const v = runCheck({ scriptsDir: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("real scripts/ directory", () => {
  test("runs against real scripts/ dir (warn mode expected during PR1)", () => {
    // Real scripts/ has multiple non-empty ALLOWLISTs during PR1 (mapper,
    // converter, no-skip, architecture). They are expected.
    const v = runCheck();
    // Just exercise the function — don't assert count, since it depends
    // on PR phase. Sanity: must not throw.
    assert.ok(Array.isArray(v));
  });
});
