// Tests for scripts/check-ai-sdk-containment.mjs using node:test.
//
// Strategy: build a small temp packages/ tree, exercise runCheck against it,
// plus a smoke test against the live monorepo packages/ root (must report
// zero violations now that provider instantiation lives in @kaiord/ai).

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runCheck } from "./check-ai-sdk-containment.mjs";

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
  sandbox = mkdtempSync(join(tmpdir(), "check-ai-sdk-containment-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-ai-sdk-containment", () => {
  test("flags a static @ai-sdk import in a non-ai package src file", () => {
    write(
      "workout-spa-editor/src/lib/x.ts",
      'import { createOpenAI } from "@ai-sdk/openai";\n'
    );

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.equal(violations[0].file, "workout-spa-editor/src/lib/x.ts");
  });

  test("flags a dynamic import() of @ai-sdk outside packages/ai", () => {
    write(
      "workout-spa-editor/src/lib/y.ts",
      'const p = await import("@ai-sdk/anthropic");\n'
    );

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
  });

  test("allows @ai-sdk imports inside packages/ai/src", () => {
    write(
      "ai/src/providers/create-language-model.ts",
      'const p = await import("@ai-sdk/google");\n'
    );

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("ignores test files and dist output", () => {
    write(
      "workout-spa-editor/src/lib/x.test.ts",
      'import { createOpenAI } from "@ai-sdk/openai";\n'
    );
    write(
      "workout-spa-editor/dist/x.js",
      'import { createOpenAI } from "@ai-sdk/openai";\n'
    );

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("does not flag bundler alias strings or bare mentions", () => {
    write(
      "workout-spa-editor/src/lib/note.ts",
      'export const NOTE = "aliases @ai-sdk/gateway to a stub";\n'
    );

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("smoke: the live packages/ tree has zero violations", () => {
    const violations = runCheck({ packagesRoot: REAL_PACKAGES_ROOT });

    assert.deepEqual(violations, []);
  });
});
