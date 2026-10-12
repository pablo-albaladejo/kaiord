import fs from "fs";

/**
 * Read a vitest JSON report written with `--reporter=json --outputFile=<file>`.
 *
 * Vitest 5 does not print the JSON report to stdout: it writes it to a file
 * and prints only "JSON report written to ...". A missing or unparseable
 * report is an error, never "zero tests".
 */
export function readVitestReport(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      passed: data.numPassedTests || 0,
      failed: data.numFailedTests || 0,
      skipped: data.numPendingTests || 0,
    };
  } catch {
    return { passed: 0, failed: 0, skipped: 0, error: true };
  }
}

export function summarizeTestResults(results) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  for (const r of Object.values(results)) {
    passed += r.passed;
    failed += r.failed;
    skipped += r.skipped;
  }

  const total = passed + failed;
  if (total === 0) {
    throw new Error(
      "No test results collected from any package; refusing to report a pass rate"
    );
  }

  return {
    packages: results,
    total: { passed, failed, skipped },
    passRate: Math.round((passed / total) * 10000) / 100,
  };
}
