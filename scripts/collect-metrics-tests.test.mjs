import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  readVitestReport,
  summarizeTestResults,
} from "../.github/scripts/test-results.mjs";

const report = (passed, failed, pending = 0) => ({
  numPassedTests: passed,
  numFailedTests: failed,
  numPendingTests: pending,
});

const tmpReport = (content) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vitest-report-"));
  const file = path.join(dir, "out.json");
  if (content !== undefined) fs.writeFileSync(file, content);
  return file;
};

test("readVitestReport reads counts from the JSON report file", () => {
  const file = tmpReport(JSON.stringify(report(233, 2, 1)));
  assert.deepEqual(readVitestReport(file), {
    passed: 233,
    failed: 2,
    skipped: 1,
  });
});

test("readVitestReport flags a missing report file as an error, not zero tests", () => {
  const file = tmpReport(undefined);
  assert.deepEqual(readVitestReport(file), {
    passed: 0,
    failed: 0,
    skipped: 0,
    error: true,
  });
});

test("readVitestReport flags unparseable output as an error", () => {
  const file = tmpReport("JSON report written to somewhere");
  assert.equal(readVitestReport(file).error, true);
});

test("summarizeTestResults computes the real pass rate", () => {
  const s = summarizeTestResults({
    core: { passed: 90, failed: 0, skipped: 0 },
    fit: { passed: 10, failed: 0, skipped: 3 },
  });
  assert.equal(s.passRate, 100);
  assert.deepEqual(s.total, { passed: 100, failed: 0, skipped: 3 });
});

test("summarizeTestResults reflects failures", () => {
  const s = summarizeTestResults({
    core: { passed: 3, failed: 1, skipped: 0 },
  });
  assert.equal(s.passRate, 75);
});

test("summarizeTestResults throws when no package produced a report", () => {
  assert.throws(
    () =>
      summarizeTestResults({
        core: { passed: 0, failed: 0, skipped: 0, error: true },
      }),
    /no test results/i
  );
});
