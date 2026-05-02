// Tests for scripts/check-no-pii-leakage.mjs using node:test.
//
// Strategy: each test creates a temp directory mirroring the SPA's
// {components, hooks, lib} layout, drops fixture files, and exercises
// `runCheck` against that root via the `src` override. The actual SPA
// editor source is exercised once as the "post-rollout passes" smoke.

import { strict as assert } from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-no-pii-leakage.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

let sandbox;
let componentsDir;

function write(rel, body) {
  const abs = join(sandbox, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "no-pii-leakage-"));
  componentsDir = join(sandbox, "components");
  mkdirSync(componentsDir, { recursive: true });
  mkdirSync(join(sandbox, "hooks"), { recursive: true });
  mkdirSync(join(sandbox, "lib"), { recursive: true });
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

const sandboxRun = () => runCheck({ src: sandbox });

describe("check-no-pii-leakage", () => {
  test("post-rollout codebase passes (no violations under real SPA src)", () => {
    if (!existsSync(REAL_SPA_SRC)) return;

    const violations = runCheck();

    assert.deepEqual(violations, []);
  });

  test("template literal interpolating error.message is rejected", () => {
    write(
      "components/leak.ts",
      "import { useToastContext } from '../x';\n" +
        "export function f(error: Error) {\n" +
        "  const { error: toastError } = useToastContext();\n" +
        "  toastError(`Failed: ${error.message}`);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) => v.rule === "R-PIIInterpolation" && v.file.endsWith("leak.ts")
      ),
      "expected template-literal rejection"
    );
  });

  test("string concatenation with closure-captured error is rejected", () => {
    write(
      "components/concat.ts",
      "export function f(err: Error) {\n" +
        "  console.error('Failed: ' + err.message);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) => v.rule === "R-PIIInterpolation" && v.file.endsWith("concat.ts")
      ),
      "expected concatenation rejection"
    );
  });

  test("identifier reference to a non-top-level binding is rejected", () => {
    write(
      "components/local.ts",
      "import { useToastContext } from '../x';\n" +
        "export function f(err: Error) {\n" +
        "  const { error } = useToastContext();\n" +
        "  try { /* … */ } catch (caught) {\n" +
        "    const msg = caught.message;\n" +
        "    error(msg);\n" +
        "  }\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) => v.rule === "R-PIIInterpolation" && v.file.endsWith("local.ts")
      ),
      "expected non-top-level identifier rejection"
    );
  });

  test("helper-call indirection at definition time is rejected", () => {
    write(
      "components/indirect.ts",
      "import { useToastContext } from '../x';\n" +
        "const SAVE_FAILED = formatError(new Error('x'));\n" +
        "function formatError(e: Error) { return e.message; }\n" +
        "export function f() {\n" +
        "  const { error } = useToastContext();\n" +
        "  error(SAVE_FAILED);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) => v.rule === "R-PIIInterpolation" && v.file.endsWith("indirect.ts")
      ),
      "expected helper-call indirection rejection"
    );
  });

  test("computed-member dispatch (toast['error']) is caught", () => {
    write(
      "components/computed.ts",
      "export function f(err: Error) {\n" +
        "  toast['error'](`Failed: ${err.message}`);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) => v.rule === "R-PIIInterpolation" && v.file.endsWith("computed.ts")
      ),
      "expected computed-member dispatch to be flagged"
    );
  });

  test("destructured dispatch (const { error } = useToastContext()) is caught", () => {
    write(
      "components/destructured.ts",
      "import { useToastContext } from '../x';\n" +
        "export function f(err: Error) {\n" +
        "  const { error } = useToastContext();\n" +
        "  error(`Failed: ${err.message}`);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) =>
          v.rule === "R-PIIInterpolation" && v.file.endsWith("destructured.ts")
      ),
      "expected destructured dispatch to be flagged"
    );
  });

  test("re-bound dispatch (const ctx = useToastContext()) is caught", () => {
    write(
      "components/rebound.ts",
      "import { useToastContext } from '../x';\n" +
        "export function f(err: Error) {\n" +
        "  const ctx = useToastContext();\n" +
        "  ctx.error(`Failed: ${err.message}`);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) => v.rule === "R-PIIInterpolation" && v.file.endsWith("rebound.ts")
      ),
      "expected re-bound dispatch to be flagged"
    );
  });

  test("identifier chain (depth-1 only) is rejected", () => {
    write(
      "components/chain.ts",
      "const A = B;\n" +
        "const B = 'x';\n" +
        "export function f() {\n" +
        "  toast.error(A);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.ok(
      violations.some(
        (v) => v.rule === "R-PIIInterpolation" && v.file.endsWith("chain.ts")
      ),
      "expected identifier chain to be rejected"
    );
  });

  test("bare string literal (including inner colons / plus signs) is accepted", () => {
    write(
      "components/literal.ts",
      "export function f() {\n" +
        '  toast.error("URL: https://example.com");\n' +
        '  toast.error("a + b > c");\n' +
        "  console.log('plain');\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.deepEqual(
      violations.filter((v) => v.file.endsWith("literal.ts")),
      []
    );
  });

  test("bare SCREAMING_SNAKE_CASE identifier with literal RHS is accepted", () => {
    write(
      "components/snake.ts",
      "const SAVE_FAILED_TOAST = 'Failed to save profile';\n" +
        "export function f() {\n" +
        "  toast.error(SAVE_FAILED_TOAST);\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.deepEqual(
      violations.filter((v) => v.file.endsWith("snake.ts")),
      []
    );
  });

  test("allowlisted file with a template literal passes (test-injected)", () => {
    // Use a hidden-prefix path within the real SPA tree so the script's
    // file-walk picks it up but the name is unlikely to collide with
    // tracked source. If a file at this path already exists for any
    // reason, snapshot its bytes and restore them in the finally block
    // so the test can never clobber tracked content.
    const target =
      "packages/workout-spa-editor/src/components/__alw_pii_guard_fixture.ts";
    const realFile = join(REPO_ROOT, target);
    const hadPriorContent = existsSync(realFile);
    const priorContent = hadPriorContent
      ? readFileSync(realFile, "utf8")
      : null;

    mkdirSync(dirname(realFile), { recursive: true });
    writeFileSync(
      realFile,
      "import { useToastContext } from '../x';\n" +
        "export function f(err: Error) {\n" +
        "  const { error } = useToastContext();\n" +
        "  error(`Failed: ${err.message}`);\n" +
        "}\n",
      "utf8"
    );
    ALLOWLIST.add(target);

    try {
      const violations = runCheck();

      assert.equal(
        violations.find((v) => v.file === target),
        undefined,
        "allowlisted file must not be flagged"
      );
    } finally {
      ALLOWLIST.delete(target);
      if (hadPriorContent && priorContent !== null) {
        writeFileSync(realFile, priorContent, "utf8");
      } else {
        rmSync(realFile, { force: true });
      }
    }
  });

  test("analytics.event with bare string literal first arg passes", () => {
    write(
      "components/Comp.tsx",
      "import { useAnalytics } from '../x';\n" +
        "export function f() {\n" +
        "  const analytics = useAnalytics();\n" +
        "  analytics.event('workout-saved', { id: 1 });\n" +
        "}\n"
    );

    assert.deepEqual(sandboxRun(), []);
  });

  test("analytics.event with template-literal first arg is rejected", () => {
    write(
      "components/Comp.tsx",
      "import { useAnalytics } from '../x';\n" +
        "export function f(id: string) {\n" +
        "  const analytics = useAnalytics();\n" +
        "  analytics.event(`workout-${id}-saved`, {});\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-PIIInterpolation");
  });

  test("destructured analytics dispatch is covered", () => {
    write(
      "components/Comp.tsx",
      "import { useAnalytics } from '../x';\n" +
        "export function f(y: string) {\n" +
        "  const { event } = useAnalytics();\n" +
        "  event(`x-${y}`, {});\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-PIIInterpolation");
  });

  test("re-bound analytics dispatch is covered", () => {
    write(
      "components/Comp.tsx",
      "import { useAnalytics } from '../x';\n" +
        "export function f(z: string) {\n" +
        "  const a = useAnalytics();\n" +
        "  a.event(`evt-${z}`, {});\n" +
        "}\n"
    );

    const violations = sandboxRun();

    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-PIIInterpolation");
  });
});
