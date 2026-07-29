// Mechanical guard: a guard's own test suite must actually be run by
// something.
//
// packages/docs/scripts/check-privacy-policy.test.mjs sat outside every CI
// command — root `test:scripts` globbed only `scripts/`, and packages/docs
// is not in the CI test matrix — so the privacy-policy lint's negative
// cases had never executed in CI, in any job, ever. A guard whose own
// suite does not run is a guard nobody has checked; its rules can rot into
// tautologies with nothing to say so.

import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEST_SCRIPTS = JSON.parse(
  readFileSync(join(REPO_ROOT, "package.json"), "utf8")
).scripts["test:scripts"];

// Every `packages/<pkg>/scripts` directory that holds a node:test suite.
//
// The relative path is joined with "/" rather than `path.join`: it is
// matched against the `test:scripts` command string, which is always
// POSIX-separated. Using the platform separator would report every
// discovered suite as unwired on a non-POSIX system — a guard that fails
// for a reason unrelated to what it checks.
const suiteDirs = readdirSync(join(REPO_ROOT, "packages"))
  .map((pkg) => ["packages", pkg, "scripts"].join("/"))
  .filter((rel) => {
    const abs = join(REPO_ROOT, rel);
    return (
      existsSync(abs) &&
      statSync(abs).isDirectory() &&
      readdirSync(abs).some((file) => file.endsWith(".test.mjs"))
    );
  });

test("every packages/*/scripts node:test suite is run by `pnpm test:scripts`", () => {
  assert.ok(
    suiteDirs.length > 0,
    "found no packages/*/scripts suites — the discovery here is broken, not the wiring"
  );

  const unwired = suiteDirs.filter(
    (dir) => !TEST_SCRIPTS.includes(`${dir}/*.test.mjs`)
  );

  assert.deepEqual(
    unwired,
    [],
    `these suites are not in root package.json scripts["test:scripts"], so CI never runs them: ${unwired.join(", ")}`
  );
});
