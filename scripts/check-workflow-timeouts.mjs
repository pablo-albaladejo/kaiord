#!/usr/bin/env node
// Enforce the `timeout-minutes` invariant on every job in every workflow:
//
//   .github/workflows/*.yml  →  every entry under top-level `jobs:` MUST
//   declare a positive integer `timeout-minutes` value.
//
// Without this, a stuck workflow inherits GitHub Actions' default 360-minute
// (6-hour) job timeout — long enough to drain queue capacity, mask infra
// regressions, and burn billable minutes. Per repo-quality-maintenance-waves
// §1.3, the per-job timeout is calibrated as `min(P95 × 1.5, family ceiling)`
// (lint=10 / build=20 / test=30 / e2e=45 minutes); this guard enforces only
// the structural invariant — that *some* timeout exists. Calibration is a
// human decision recorded in each PR description.
//
// Exits non-zero on any violation. Tolerates the edge case of a workflow file
// without a `jobs:` block (e.g. a matrix-only / template file) — the
// invariant has nothing to check and the file is silently skipped.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const WORKFLOWS_DIR = join(REPO_ROOT, ".github", "workflows");

function listWorkflowFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files = [];
  for (const name of entries) {
    if (!name.endsWith(".yml") && !name.endsWith(".yaml")) continue;
    const full = join(dir, name);
    if (!statSync(full).isFile()) continue;
    files.push(full);
  }
  return files.sort();
}

function isPositiveTimeout(value) {
  // Accept positive integers (literal `timeout-minutes: 10`) and string
  // expressions that ${{ vars.X }} into a value at runtime — those still
  // satisfy the invariant of "the workflow author picked a bound". Reject
  // 0, negative, NaN, null, undefined.
  if (typeof value === "number") return Number.isInteger(value) && value > 0;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
}

export function checkWorkflowTimeouts(
  files = listWorkflowFiles(WORKFLOWS_DIR)
) {
  const violations = [];

  for (const file of files) {
    let doc;
    try {
      doc = parse(readFileSync(file, "utf8"));
    } catch (err) {
      violations.push(`${file}: malformed YAML — ${err.message}`);
      continue;
    }

    if (!doc || typeof doc !== "object") {
      // Empty file or scalar doc; nothing to enforce.
      continue;
    }

    const jobs = doc.jobs;
    if (!jobs || typeof jobs !== "object") {
      // Workflow without a `jobs:` block (templates, reusable fragments).
      // Spec §1.3 explicitly tolerates this case.
      continue;
    }

    for (const [jobId, jobDef] of Object.entries(jobs)) {
      if (!jobDef || typeof jobDef !== "object") {
        violations.push(`${file}: job "${jobId}" has no body`);
        continue;
      }
      // Reusable workflow callers (`uses:`) do not accept timeout-minutes —
      // their timeout is set inside the reusable workflow itself. Skip.
      if ("uses" in jobDef && !("steps" in jobDef)) continue;

      const timeout = jobDef["timeout-minutes"];
      if (!isPositiveTimeout(timeout)) {
        violations.push(
          `${file}: job "${jobId}" is missing \`timeout-minutes\` (or it is not a positive value)`
        );
      }
    }
  }

  return { violations };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { violations } = checkWorkflowTimeouts();

  if (violations.length > 0) {
    console.error(
      `\n.github/workflows timeout-minutes invariant violations (${violations.length}):\n`
    );
    for (const v of violations) console.error(`  ${v}`);
    console.error(
      "\nEvery job in every workflow MUST set `timeout-minutes`. " +
        "See openspec/changes/repo-quality-maintenance-waves/tasks.md §1.3 " +
        "for the calibration rule (min(P95 × 1.5, family ceiling))."
    );
    process.exit(1);
  }

  console.log(".github/workflows: every job declares `timeout-minutes`.");
}
