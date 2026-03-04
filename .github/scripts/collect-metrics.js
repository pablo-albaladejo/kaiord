#!/usr/bin/env node

/**
 * Collect code quality metrics for the Kaiord monorepo.
 * Outputs a JSON file with lint, test, coverage, build, and complexity data.
 *
 * Environment variables:
 * - METRICS_OUTPUT: prefix for output file (default: "current")
 *
 * Output: metrics-{METRICS_OUTPUT}.json
 */

import fs from "fs";
import { execSync } from "child_process";

const output = process.env.METRICS_OUTPUT || "current";

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      timeout: 120_000,
      stdio: ["pipe", "pipe", "pipe"],
      ...opts,
    });
  } catch (e) {
    return e.stdout || e.stderr || "";
  }
}

function countLintWarnings() {
  const result = run("pnpm lint 2>&1");
  // Match ESLint output lines like "  12:5  warning  ..."  or "  12:5  error  ..."
  const lines = result.split("\n");
  const warnings = lines.filter((l) => /\d+:\d+\s+warning\s+/.test(l)).length;
  const errors = lines.filter((l) => /\d+:\d+\s+error\s+/.test(l)).length;
  return { warnings, errors, clean: warnings === 0 && errors === 0 };
}

function countTypeErrors() {
  const result = run("pnpm -r exec tsc --noEmit 2>&1");
  const errors = (result.match(/error TS\d+/g) || []).length;
  return { errors, clean: errors === 0 };
}

function collectTestResults() {
  const packages = [
    "core",
    "fit",
    "tcx",
    "zwo",
    "garmin",
    "garmin-connect",
    "cli",
    "mcp",
  ];
  const results = {};
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const pkg of packages) {
    const result = run(
      `pnpm --filter @kaiord/${pkg} exec vitest --run --reporter=json 2>&1`
    );
    try {
      const lines = result.split("\n");
      const jsonLine = lines.find((l) => l.trim().startsWith("{"));
      if (jsonLine) {
        const data = JSON.parse(jsonLine);
        const passed = data.numPassedTests || 0;
        const failed = data.numFailedTests || 0;
        const skipped = data.numPendingTests || 0;
        results[pkg] = { passed, failed, skipped };
        totalPassed += passed;
        totalFailed += failed;
        totalSkipped += skipped;
      }
    } catch {
      results[pkg] = { passed: 0, failed: 0, skipped: 0, error: true };
    }
  }

  const total = totalPassed + totalFailed;
  const passRate = total > 0 ? (totalPassed / total) * 100 : 0;

  return {
    packages: results,
    total: { passed: totalPassed, failed: totalFailed, skipped: totalSkipped },
    passRate: Math.round(passRate * 100) / 100,
  };
}

function parseCoverageFile(covPath) {
  const cov = JSON.parse(fs.readFileSync(covPath, "utf8"));
  let totalStmts = 0;
  let coveredStmts = 0;

  for (const file in cov) {
    const s = cov[file].s || {};
    totalStmts += Object.keys(s).length;
    coveredStmts += Object.values(s).filter((v) => v > 0).length;
  }

  const pct =
    totalStmts > 0 ? Math.round((coveredStmts / totalStmts) * 10000) / 100 : 0;
  return { statements: pct, files: Object.keys(cov).length };
}

function collectCoverage() {
  const packages = [
    "core",
    "fit",
    "tcx",
    "zwo",
    "garmin",
    "garmin-connect",
    "cli",
    "mcp",
  ];
  const results = {};

  for (const pkg of packages) {
    const covPath = `packages/${pkg}/coverage/coverage-final.json`;
    if (!fs.existsSync(covPath)) {
      run(`pnpm --filter @kaiord/${pkg} test:coverage 2>&1`);
    }
    if (fs.existsSync(covPath)) {
      results[pkg] = parseCoverageFile(covPath);
    } else {
      results[pkg] = { statements: 0, files: 0 };
    }
  }

  const avgCoverage =
    Object.values(results).reduce((sum, r) => sum + r.statements, 0) /
    Math.max(Object.keys(results).length, 1);

  return {
    packages: results,
    average: Math.round(avgCoverage * 100) / 100,
  };
}

function checkBuild() {
  const result = run("pnpm -r build 2>&1");
  const success = !result.includes("ERR_PNPM") && !result.includes("FAIL");
  return { success };
}

function calculateScore(metrics) {
  // Weighted quality score (0-100, higher is better)
  const weights = {
    lint: 0.2,
    typecheck: 0.2,
    tests: 0.25,
    coverage: 0.2,
    build: 0.15,
  };

  // Lint: 0 warnings/errors = 100, each issue subtracts points
  const lintPenalty = Math.min(
    100,
    (metrics.lint.warnings + metrics.lint.errors * 5) * 2
  );
  const lintScore = 100 - lintPenalty;

  // TypeScript: 0 errors = 100
  const tsScore = Math.max(0, 100 - metrics.typecheck.errors * 5);

  // Tests: pass rate directly maps to score
  const testScore = metrics.tests.passRate;

  // Coverage: average coverage percentage
  const covScore = metrics.coverage.average;

  // Build: binary (pass/fail)
  const buildScore = metrics.build.success ? 100 : 0;

  const score =
    lintScore * weights.lint +
    tsScore * weights.typecheck +
    testScore * weights.tests +
    covScore * weights.coverage +
    buildScore * weights.build;

  return Math.round(score * 100) / 100;
}

// Main execution
console.log("Collecting code quality metrics...");

const metrics = {
  timestamp: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || run("git rev-parse HEAD").trim(),
  branch:
    process.env.GITHUB_REF_NAME ||
    run("git rev-parse --abbrev-ref HEAD").trim(),
  lint: countLintWarnings(),
  typecheck: countTypeErrors(),
  tests: collectTestResults(),
  coverage: collectCoverage(),
  build: checkBuild(),
};

metrics.score = calculateScore(metrics);

const outputPath = `metrics-${output}.json`;
fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));

console.log(`Metrics written to ${outputPath}`);
console.log(`Quality score: ${metrics.score}/100`);
console.log("");
console.log("Summary:");
console.log(
  `  Lint: ${metrics.lint.warnings} warnings, ${metrics.lint.errors} errors`
);
console.log(`  TypeScript: ${metrics.typecheck.errors} errors`);
console.log(`  Tests: ${metrics.tests.passRate}% pass rate`);
console.log(`  Coverage: ${metrics.coverage.average}% average`);
console.log(`  Build: ${metrics.build.success ? "OK" : "FAILED"}`);

// Set GitHub Actions outputs if running in CI
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `json=${JSON.stringify(metrics)}\n`
  );
}
