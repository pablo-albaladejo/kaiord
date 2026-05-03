/**
 * Co-located unit test for `check-no-perf-marks-in-prod.mjs`.
 *
 * Tests the `runCheck` export against synthetic dist-like fixtures so
 * the script's grep logic can be verified without touching a real
 * production build (the hook's gate already prevents the marks from
 * landing in `dist/`, so a real-build test would be a tautology).
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runCheck } from "./check-no-perf-marks-in-prod.mjs";

const makeDist = () => {
  const dir = mkdtempSync(join(tmpdir(), "perf-marks-test-"));
  const assets = join(dir, "assets");
  mkdirSync(assets, { recursive: true });
  return { dir, assets };
};

test("returns no violations when assets contain no perf-mark calls", () => {
  const { dir, assets } = makeDist();
  try {
    writeFileSync(join(assets, "ok.js"), "export const x = 1;\n");
    writeFileSync(
      join(assets, "ok-2.js"),
      "function load(){return Promise.resolve();}"
    );

    const violations = runCheck({ assetsDir: assets });

    assert.equal(violations.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("flags any direct performance.mark call", () => {
  const { dir, assets } = makeDist();
  try {
    writeFileSync(
      join(assets, "leak.js"),
      "function inner(){performance.mark('something');}"
    );

    const violations = runCheck({ assetsDir: assets });

    assert.ok(violations.length >= 1);
    assert.equal(violations[0].rule, "R-NoPerfMarksInProd");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("flags the useMatchedSessions:start mark name even without a direct mark call", () => {
  const { dir, assets } = makeDist();
  try {
    // The constant could leak via a stray re-export.
    writeFileSync(
      join(assets, "leak.js"),
      "const NAME = 'useMatchedSessions:start';\nexport { NAME };\n"
    );

    const violations = runCheck({ assetsDir: assets });

    assert.ok(violations.length >= 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("returns a single violation when assets dir is missing", () => {
  const violations = runCheck({ assetsDir: "/nonexistent-path-xyz" });

  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "R-NoPerfMarksInProd");
});
