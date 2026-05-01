// Tests for scripts/check-package-deps.mjs using node:test.

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { PACKAGE_DEPS } from "./architecture.vocab.mjs";
import { runCheck } from "./check-package-deps.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_PACKAGES_ROOT = join(REPO_ROOT, "packages");

let sandbox;

function writePackage(name, pkgJson) {
  const dir = join(sandbox, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(pkgJson, null, 2),
    "utf8"
  );
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "check-package-deps-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-package-deps", () => {
  test("disallowed dep is rejected: fit declares @kaiord/tcx", () => {
    writePackage("fit", {
      name: "@kaiord/fit",
      dependencies: {
        "@kaiord/core": "*",
        "@kaiord/tcx": "*",
      },
    });

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-ArchPackageDeps");
    assert.match(violations[0].detail, /@kaiord\/tcx/);
  });

  test("allowed deps pass: fit declares @kaiord/core only", () => {
    writePackage("fit", {
      name: "@kaiord/fit",
      dependencies: { "@kaiord/core": "*" },
    });

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("garmin-connect → garmin allowance", () => {
    writePackage("garmin-connect", {
      name: "@kaiord/garmin-connect",
      dependencies: { "@kaiord/core": "*", "@kaiord/garmin": "*" },
    });

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("non-@kaiord deps are ignored", () => {
    writePackage("fit", {
      name: "@kaiord/fit",
      dependencies: {
        "@kaiord/core": "*",
        zod: "^4.0.0",
        "fast-xml-parser": "*",
      },
    });

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 0);
  });

  test("devDependencies are also checked", () => {
    writePackage("fit", {
      name: "@kaiord/fit",
      dependencies: { "@kaiord/core": "*" },
      devDependencies: { "@kaiord/tcx": "*" },
    });

    const violations = runCheck({ packagesRoot: sandbox });

    assert.equal(violations.length, 1);
    assert.match(violations[0].detail, /@kaiord\/tcx/);
  });

  test("core declares no @kaiord/* deps", () => {
    writePackage("core", {
      name: "@kaiord/core",
      dependencies: { zod: "*" },
    });
    writePackage("core-bad", {
      name: "@kaiord/core",
      dependencies: { "@kaiord/fit": "*" },
    });

    // PACKAGE_DEPS knows "core" allowlist is empty, "core-bad" not in vocab
    // (treated as empty allowlist too) — both flagged correctly.
    const violations = runCheck({
      packagesRoot: sandbox,
      vocab: { core: [], "core-bad": [] },
    });

    // core has no @kaiord deps → 0 violations
    // core-bad has @kaiord/fit but allowlist empty → 1 violation
    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /core-bad/);
  });

  test("real packages/ root passes (allowlist matches PACKAGE_DEPS table)", () => {
    const violations = runCheck({ packagesRoot: REAL_PACKAGES_ROOT });
    assert.equal(
      violations.length,
      0,
      `Unexpected R-ArchPackageDeps violations:\n${violations
        .map((v) => `  - ${v.file}: ${v.detail}`)
        .join("\n")}`
    );
  });

  test("PACKAGE_DEPS covers every package directory under packages/", () => {
    // Mirrors a freshness invariant — when a new package directory is
    // added, PACKAGE_DEPS MUST be updated. Otherwise the check becomes
    // permissive (an unknown package name defaults to empty allowlist).
    const realDirs = new Set();
    for (const entry of readdirSyncSafe(REAL_PACKAGES_ROOT)) {
      const dirPath = join(REAL_PACKAGES_ROOT, entry);
      try {
        const stat = statSyncSafe(dirPath);
        if (!stat?.isDirectory()) continue;
        if (entry.startsWith(".")) continue;
        realDirs.add(entry);
      } catch {
        // ignore
      }
    }
    const knownDirs = new Set(Object.keys(PACKAGE_DEPS));
    const missing = [...realDirs].filter((d) => !knownDirs.has(d));
    assert.deepEqual(
      missing,
      [],
      `PACKAGE_DEPS is missing entries for: ${missing.join(", ")}`
    );
  });
});

import { readdirSync, statSync } from "node:fs";
function readdirSyncSafe(p) {
  try {
    return readdirSync(p);
  } catch {
    return [];
  }
}
function statSyncSafe(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}
