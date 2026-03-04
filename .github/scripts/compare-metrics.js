#!/usr/bin/env node

/**
 * Compare two metrics JSON files and output a summary.
 *
 * Usage: node compare-metrics.js <baseline.json> <current.json>
 *
 * Sets GitHub Actions outputs:
 * - summary: Markdown table with metric comparison
 * - quality-improved: "true" if score improved or stayed same
 * - score-before: baseline quality score
 * - score-after: current quality score
 * - score-delta: formatted delta string (e.g., "+2.5" or "-1.3")
 * - score-delta-numeric: raw numeric delta for threshold checks
 */

import fs from "fs";

const [, , baselinePath, currentPath] = process.argv;

if (!baselinePath || !currentPath) {
  console.error("Usage: compare-metrics.js <baseline.json> <current.json>");
  process.exit(1);
}

function loadMetrics(path) {
  if (!fs.existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function formatDelta(before, after, lowerIsBetter = false) {
  const delta = after - before;
  if (delta === 0) return "0";

  const sign = delta > 0 ? "+" : "";
  const formatted = `${sign}${Math.round(delta * 100) / 100}`;

  // For metrics where lower is better (lint warnings, errors)
  if (lowerIsBetter) {
    return delta < 0 ? `${formatted} (better)` : `${formatted} (worse)`;
  }
  // For metrics where higher is better (coverage, pass rate)
  return delta > 0 ? `${formatted} (better)` : `${formatted} (worse)`;
}

const baseline = loadMetrics(baselinePath);
const current = loadMetrics(currentPath);

// Build comparison table
const rows = [];

rows.push(
  `| Lint Warnings | ${baseline.lint.warnings} | ${current.lint.warnings} | ${formatDelta(baseline.lint.warnings, current.lint.warnings, true)} |`
);
rows.push(
  `| Lint Errors | ${baseline.lint.errors} | ${current.lint.errors} | ${formatDelta(baseline.lint.errors, current.lint.errors, true)} |`
);
rows.push(
  `| TS Errors | ${baseline.typecheck.errors} | ${current.typecheck.errors} | ${formatDelta(baseline.typecheck.errors, current.typecheck.errors, true)} |`
);
rows.push(
  `| Test Pass Rate | ${baseline.tests.passRate}% | ${current.tests.passRate}% | ${formatDelta(baseline.tests.passRate, current.tests.passRate)} |`
);
rows.push(
  `| Tests Passed | ${baseline.tests.total.passed} | ${current.tests.total.passed} | ${formatDelta(baseline.tests.total.passed, current.tests.total.passed)} |`
);
rows.push(
  `| Tests Failed | ${baseline.tests.total.failed} | ${current.tests.total.failed} | ${formatDelta(baseline.tests.total.failed, current.tests.total.failed, true)} |`
);
rows.push(
  `| Avg Coverage | ${baseline.coverage.average}% | ${current.coverage.average}% | ${formatDelta(baseline.coverage.average, current.coverage.average)} |`
);

// Per-package coverage
for (const pkg of Object.keys(current.coverage.packages)) {
  const before = baseline.coverage.packages[pkg]?.statements || 0;
  const after = current.coverage.packages[pkg]?.statements || 0;
  rows.push(
    `| Coverage (@kaiord/${pkg}) | ${before}% | ${after}% | ${formatDelta(before, after)} |`
  );
}

rows.push(
  `| Build | ${baseline.build.success ? "OK" : "FAIL"} | ${current.build.success ? "OK" : "FAIL"} | ${baseline.build.success === current.build.success ? "No change" : current.build.success ? "Fixed" : "Broken"} |`
);

const summary = `| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
${rows.join("\n")}`;

const scoreDelta = Math.round((current.score - baseline.score) * 100) / 100;

// Per-metric monotonicity checks (no individual metric should regress)
const regressions = [];
if (current.lint.warnings > baseline.lint.warnings) {
  regressions.push(
    `Lint warnings increased: ${baseline.lint.warnings} -> ${current.lint.warnings}`
  );
}
if (current.lint.errors > baseline.lint.errors) {
  regressions.push(
    `Lint errors increased: ${baseline.lint.errors} -> ${current.lint.errors}`
  );
}
if (current.typecheck.errors > baseline.typecheck.errors) {
  regressions.push(
    `TypeScript errors increased: ${baseline.typecheck.errors} -> ${current.typecheck.errors}`
  );
}
if (current.tests.passRate < baseline.tests.passRate) {
  regressions.push(
    `Test pass rate decreased: ${baseline.tests.passRate}% -> ${current.tests.passRate}%`
  );
}
if (current.tests.total.passed < baseline.tests.total.passed) {
  regressions.push(
    `Test count decreased: ${baseline.tests.total.passed} -> ${current.tests.total.passed}`
  );
}
if (current.coverage.average < baseline.coverage.average - 0.5) {
  regressions.push(
    `Coverage decreased: ${baseline.coverage.average}% -> ${current.coverage.average}%`
  );
}
if (!current.build.success && baseline.build.success) {
  regressions.push("Build broken");
}

const qualityImproved = scoreDelta >= 0 && regressions.length === 0;

console.log("Metrics Comparison:");
console.log(summary);
console.log("");
console.log(
  `Quality Score: ${baseline.score} -> ${current.score} (${scoreDelta >= 0 ? "+" : ""}${scoreDelta})`
);
if (regressions.length > 0) {
  console.log("");
  console.log("Regressions detected:");
  for (const r of regressions) {
    console.log(`  - ${r}`);
  }
}
console.log(`quality-improved: ${qualityImproved}`);

// Set GitHub Actions outputs
if (process.env.GITHUB_OUTPUT) {
  // Multi-line output needs delimiter
  const delimiter = `METRICS_SUMMARY_${Date.now()}`;
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `summary<<${delimiter}`,
      summary,
      delimiter,
      `quality-improved=${qualityImproved}`,
      `score-before=${baseline.score}`,
      `score-after=${current.score}`,
      `score-delta=${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`,
      `score-delta-numeric=${scoreDelta}`,
      `regressions=${regressions.length}`,
      `regression-details=${regressions.join("; ")}`,
    ].join("\n") + "\n"
  );
}
