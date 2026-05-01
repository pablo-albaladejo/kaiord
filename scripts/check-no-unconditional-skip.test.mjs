// Tests for scripts/check-no-unconditional-skip.mjs using node:test.

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-no-unconditional-skip.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_PACKAGES_ROOT = join(REPO_ROOT, "packages");

let sandbox;

function write(rel, body) {
  const abs = join(sandbox, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "check-no-skip-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("Vitest unconditional pattern (REJECT)", () => {
  test("rejects it.skip('name', fn)", () => {
    write("a/x.test.ts", `it.skip("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-NoUnconditionalSkip");
    assert.equal(v[0].line, 1);
  });

  test("rejects test.only('name', fn)", () => {
    write("a/x.test.ts", `test.only("focused", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects describe.todo('name', fn)", () => {
    write("a/x.test.ts", `describe.todo("planned", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skip with template-literal name", () => {
    write("a/x.test.ts", "it.skip(`renders`, () => {});\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects computed-member dispatch it['skip']", () => {
    write("a/x.test.ts", `it["skip"]("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects computed-member dispatch test['only']", () => {
    write("a/x.test.ts", `test["only"]("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("line number is correct after preceding comments", () => {
    write(
      "a/x.test.ts",
      `// header\n/* block\n   block */\n\nit.skip("renders", () => {});\n`
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].line, 5);
  });
});

describe("Playwright runtime pattern (ALLOW)", () => {
  test("allows test.skip(condition, reason)", () => {
    write("e2e/x.spec.ts", `test.skip(!ENABLED, "Production gated");\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows test.skip() with no args", () => {
    write("e2e/x.spec.ts", `test("...", async () => { test.skip(); });\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows test.skip(isMobile, reason)", () => {
    write(
      "e2e/x.spec.ts",
      `test.skip(isMobile, "Keyboard shortcuts not on mobile");\n`
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows test.skip(browserName !== 'chromium')", () => {
    write("e2e/x.spec.ts", `test.skip(browserName !== "chromium");\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("skipIf — runtime expr ALLOWED", () => {
  test("allows it.skipIf(process.env.X)", () => {
    write(
      "a/x.test.ts",
      `describe.skipIf(!process.env.GARMIN_EMAIL)("...", () => {});\n`
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows it.skipIf(typeof window !== 'undefined')", () => {
    write(
      "a/x.test.ts",
      `it.skipIf(typeof window !== "undefined")("...", () => {});\n`
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows it.skipIf(someFn())", () => {
    write("a/x.test.ts", `it.skipIf(someFn())("...", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows it.skipIf(new URL(...).hostname === 'ci')", () => {
    write(
      "a/x.test.ts",
      `it.skipIf(new URL(import.meta.url).hostname === "ci")("...", () => {});\n`
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows backtick template with substitution", () => {
    write(
      "a/x.test.ts",
      "it.skipIf(`${process.env.X}` === '1')(\"...\", () => {});\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("skipIf — literal-only REJECTED", () => {
  test("rejects it.skipIf(true)", () => {
    write("a/x.test.ts", `it.skipIf(true)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skipIf(false)", () => {
    write("a/x.test.ts", `it.skipIf(false)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skipIf(1)", () => {
    write("a/x.test.ts", `it.skipIf(1)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skipIf('x')", () => {
    write("a/x.test.ts", `it.skipIf("x")("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skipIf(null)", () => {
    write("a/x.test.ts", `it.skipIf(null)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skipIf(!!1)", () => {
    write("a/x.test.ts", `it.skipIf(!!1)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skipIf(1+1)", () => {
    write("a/x.test.ts", `it.skipIf(1+1)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects it.skipIf(true && true)", () => {
    write("a/x.test.ts", `it.skipIf(true && true)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects backtick template without substitution", () => {
    write("a/x.test.ts", 'it.skipIf(`true`)("renders", () => {});\n');

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects computed-member: it['skipIf'](true)", () => {
    write("a/x.test.ts", `it["skipIf"](true)("renders", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
  });
});

describe("scope", () => {
  test("only test/spec files are scanned", () => {
    write("a/regular.ts", `it.skip("not a test", () => {});\n`);

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("comments containing it.skip(...) do NOT trigger", () => {
    write(
      "a/x.test.ts",
      `// example: it.skip("renders", () => {})\n/* it.skip("foo", () => {}) */\nit("does", () => {});\n`
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("real packages/ root passes with the seeded allowlist", () => {
    const v = runCheck();
    assert.equal(
      v.length,
      0,
      `Unexpected R-NoUnconditionalSkip violations:\n${v
        .map((x) => `  ${x.file}:${x.line}: ${x.detail}`)
        .join("\n")}`
    );
  });

  test("ALLOWLIST contains exactly 5 entries (drained in PR4)", () => {
    assert.equal(ALLOWLIST.size, 5);
  });
});
