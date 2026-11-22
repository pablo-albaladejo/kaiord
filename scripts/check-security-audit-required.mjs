#!/usr/bin/env node
// `Dependency Security Audit` is a required check on `main`. Branch protection
// matches a check by its exact name and waits for it on every pull request, so
// a run that is never created blocks the PR forever and a renamed job is a
// check nobody requires. Rule R-SecurityAuditAlwaysReports:
//
//   1. security.yml triggers on every pull request (no paths, branches or
//      types filter) and on pushes to main.
//   2. One job carries the exact name, with no job-level `if:`, `needs:`,
//      matrix or `continue-on-error` — any of them can skip, rename or soften
//      it. Scoping the audit to dependency changes happens inside the job.
//   3. The job fails on a high or critical finding, and fails when the audit
//      produced no report (a registry outage must not read as clean).
//
// Usage: node scripts/check-security-audit-required.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parse } from "yaml";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SECURITY_WORKFLOW = join(
  REPO_ROOT,
  ".github/workflows/security.yml"
);
export const AUDIT_JOB_NAME = "Dependency Security Audit";

const PR_FILTERS = ["paths", "paths-ignore", "branches", "branches-ignore"];
const DEFAULT_PR_TYPES = ["opened", "synchronize", "reopened"];
const JOB_SKIPPERS = ["if", "needs", "strategy", "continue-on-error"];

function triggerViolations(on) {
  const violations = [];
  if (!on || typeof on !== "object" || !("pull_request" in on)) {
    return ["security.yml has no pull_request trigger"];
  }
  const pr = on.pull_request ?? {};
  for (const key of PR_FILTERS.filter((k) => k in pr)) {
    violations.push(
      `pull_request is filtered by \`${key}\`: a PR it excludes never gets the required check and cannot merge`
    );
  }
  if ("types" in pr) {
    const types = [pr.types].flat();
    const missing = DEFAULT_PR_TYPES.filter((t) => !types.includes(t));
    if (missing.length > 0) {
      violations.push(
        `pull_request \`types\` omits ${missing.join(", ")}: those PR events would not report the check`
      );
    }
  }
  if (![on.push?.branches].flat().includes("main")) {
    violations.push("security.yml no longer audits every push to main");
  }
  return violations;
}

const hasFailStep = (steps, condition) =>
  steps.some(
    (s) =>
      typeof s?.if === "string" &&
      s.if.includes(condition) &&
      /\bexit 1\b/.test(s?.run ?? "")
  );

function jobViolations(jobs) {
  const named = Object.entries(jobs ?? {}).filter(
    ([, job]) => job?.name === AUDIT_JOB_NAME
  );
  if (named.length !== 1) {
    return [
      `expected exactly one job named "${AUDIT_JOB_NAME}" (branch protection matches this exact name), found ${named.length}`,
    ];
  }
  const [id, job] = named[0];
  const violations = JOB_SKIPPERS.filter((k) => k in job).map(
    (k) =>
      `job "${id}" sets \`${k}\` at job level: it can skip, rename or soften the required check`
  );
  const steps = Array.isArray(job.steps) ? job.steps : [];
  if (!hasFailStep(steps, "has_critical == 'true'")) {
    violations.push(`job "${id}" never fails on a high or critical finding`);
  }
  if (!hasFailStep(steps, "parsed != 'true'")) {
    violations.push(
      `job "${id}" does not fail when the audit produced no report`
    );
  }
  return violations;
}

export function findViolations(src) {
  let doc;
  try {
    doc = parse(src);
  } catch (err) {
    return [`security.yml is malformed YAML: ${err.message}`];
  }
  return [...triggerViolations(doc?.on), ...jobViolations(doc?.jobs)];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = findViolations(readFileSync(SECURITY_WORKFLOW, "utf8"));
  if (violations.length > 0) {
    process.stderr.write("R-SecurityAuditAlwaysReports violations:\n");
    for (const v of violations) process.stderr.write(`  - ${v}\n`);
    process.exit(1);
  }
  process.stdout.write(`"${AUDIT_JOB_NAME}" reports on every pull request.\n`);
}
