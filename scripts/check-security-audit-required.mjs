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

import { failIfAny } from "./lib/guard-failure.mjs";
import {
  AUDIT_JOB_NAME,
  jobViolations,
  triggerViolations,
} from "./lib/security-audit-rules.mjs";

export { AUDIT_JOB_NAME };

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SECURITY_WORKFLOW = join(
  REPO_ROOT,
  ".github/workflows/security.yml"
);

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
  failIfAny("R-SecurityAuditAlwaysReports violation(s)", violations);
  process.stdout.write(`"${AUDIT_JOB_NAME}" reports on every pull request.\n`);
}
