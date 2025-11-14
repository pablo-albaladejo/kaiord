#!/usr/bin/env node

import fs from "fs";

const path = process.argv[2];
const threshold = 80;

if (!fs.existsSync(path)) {
  console.log(`⚠️  Coverage file not found at ${path}`);
  console.log("Skipping coverage check (package may not have tests yet)");
  process.exit(0);
}

const coverage = JSON.parse(fs.readFileSync(path, "utf8"));

let totalStatements = 0,
  coveredStatements = 0;
let totalBranches = 0,
  coveredBranches = 0;
let totalFunctions = 0,
  coveredFunctions = 0;
let totalLines = 0,
  coveredLines = 0;

for (const file in coverage) {
  const fileCov = coverage[file];
  totalStatements += fileCov.s ? Object.keys(fileCov.s).length : 0;
  coveredStatements += fileCov.s
    ? Object.values(fileCov.s).filter((v) => v > 0).length
    : 0;
  totalBranches += fileCov.b ? Object.keys(fileCov.b).length : 0;
  coveredBranches += fileCov.b
    ? Object.values(fileCov.b)
        .flat()
        .filter((v) => v > 0).length
    : 0;
  totalFunctions += fileCov.f ? Object.keys(fileCov.f).length : 0;
  coveredFunctions += fileCov.f
    ? Object.values(fileCov.f).filter((v) => v > 0).length
    : 0;
  totalLines += fileCov.l ? Object.keys(fileCov.l).length : 0;
  coveredLines += fileCov.l
    ? Object.values(fileCov.l).filter((v) => v > 0).length
    : 0;
}

const stmtPct =
  totalStatements > 0
    ? ((coveredStatements / totalStatements) * 100).toFixed(2)
    : 100;
const branchPct =
  totalBranches > 0
    ? ((coveredBranches / totalBranches) * 100).toFixed(2)
    : 100;
const funcPct =
  totalFunctions > 0
    ? ((coveredFunctions / totalFunctions) * 100).toFixed(2)
    : 100;
const linePct =
  totalLines > 0 ? ((coveredLines / totalLines) * 100).toFixed(2) : 100;

console.log("Coverage Summary:");
console.log(`  Statements: ${stmtPct}%`);
console.log(`  Branches: ${branchPct}%`);
console.log(`  Functions: ${funcPct}%`);
console.log(`  Lines: ${linePct}%`);

const failed = [];
if (parseFloat(stmtPct) < threshold) failed.push(`Statements: ${stmtPct}%`);
if (parseFloat(branchPct) < threshold) failed.push(`Branches: ${branchPct}%`);
if (parseFloat(funcPct) < threshold) failed.push(`Functions: ${funcPct}%`);
if (parseFloat(linePct) < threshold) failed.push(`Lines: ${linePct}%`);

if (failed.length > 0) {
  console.error(`\nCoverage threshold of ${threshold}% not met:`);
  failed.forEach((f) => console.error(`  ❌ ${f}`));
  process.exit(1);
}

console.log(`\n✅ All coverage thresholds met (>= ${threshold}%)`);
