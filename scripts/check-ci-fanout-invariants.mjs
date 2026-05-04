#!/usr/bin/env node
// SCOPE: enforces ONLY ci.yml fanout invariants — consumer-needs-build,
// no always() in consumers, non-consumer build dependency,
// pull_request_target prohibition, no pnpm -r build in consumer steps.
// Adding new checks requires a separate guard with its own design entry.
//
// Rule R-CIFanout: keeps the artifact fan-out shape from drifting.
// See openspec/specs/ci-build-fanout/spec.md.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_CI_PATH = resolve(REPO_ROOT, ".github", "workflows", "ci.yml");

const CONSUMERS = new Set([
  "lint",
  "typecheck",
  "test",
  "test-cli",
  "test-frontend",
  "round-trip",
  "e2e-frontend",
  "e2e-prod-base",
]);

const NON_CONSUMERS = new Set([
  "check-links",
  "log-bot-skip",
  "bundle-analysis",
]);

// WHITELIST: only 'notify-failure' qualifies under the spec Exception.
// Adding a new job here REQUIRES amending openspec/specs/ci-build-fanout/spec.md first.
const FAILURE_AGGREGATION_WHITELIST = new Set(["notify-failure"]);

const BUILD_COMMAND_RE = /^pnpm (-r )?build($|\s)/;

function needsList(job) {
  if (!job?.needs) return [];
  if (Array.isArray(job.needs)) return job.needs;
  return [job.needs];
}

function ifClauseText(job) {
  if (!job || job.if == null) return "";
  return String(job.if);
}

function checkConsumer(jobName, job, violations) {
  const ifClause = ifClauseText(job);
  if (ifClause.includes("always()")) {
    violations.push({
      rule: "R-CIFanout",
      detail: `consumer job '${jobName}' has 'always()' in if: clause; this defeats fail-fast on build failure`,
    });
  }
  if (!needsList(job).includes("build")) {
    violations.push({
      rule: "R-CIFanout",
      detail: `consumer job '${jobName}' must include 'build' in needs:`,
    });
  }
  for (const step of job.steps ?? []) {
    const run = typeof step.run === "string" ? step.run : "";
    for (const line of run.split(/\n+/)) {
      if (BUILD_COMMAND_RE.test(line.trim())) {
        violations.push({
          rule: "R-CIFanout",
          detail: `consumer job '${jobName}' has a step running '${line.trim()}'; consumers download the artifact, never rebuild`,
        });
        break;
      }
    }
  }
}

function checkNonConsumer(jobName, job, violations) {
  if (FAILURE_AGGREGATION_WHITELIST.has(jobName)) return;
  if (needsList(job).includes("build")) {
    violations.push({
      rule: "R-CIFanout",
      detail: `non-consumer job '${jobName}' must NOT include 'build' in needs: (only 'notify-failure' is whitelisted as a failure-aggregator)`,
    });
  }
}

function checkTriggers(workflow, violations) {
  const on = workflow?.on;
  if (!on) return;
  if (typeof on === "string") {
    if (on === "pull_request_target") {
      violations.push({
        rule: "R-CIFanout",
        detail:
          "workflow trigger SHALL NOT be 'pull_request_target' — exposes secrets to fork PRs",
      });
    }
    return;
  }
  if (Array.isArray(on)) {
    if (on.includes("pull_request_target")) {
      violations.push({
        rule: "R-CIFanout",
        detail:
          "workflow trigger SHALL NOT include 'pull_request_target' — exposes secrets to fork PRs",
      });
    }
    return;
  }
  if (typeof on === "object" && "pull_request_target" in on) {
    violations.push({
      rule: "R-CIFanout",
      detail:
        "workflow trigger SHALL NOT include 'pull_request_target' — exposes secrets to fork PRs",
    });
  }
}

export function runCheck({ ciPath } = {}) {
  const path = ciPath ?? DEFAULT_CI_PATH;
  const text = readFileSync(path, "utf8");
  const workflow = parse(text);
  const violations = [];
  checkTriggers(workflow, violations);
  const jobs = workflow?.jobs ?? {};
  for (const [name, job] of Object.entries(jobs)) {
    if (CONSUMERS.has(name)) {
      checkConsumer(name, job, violations);
    } else if (NON_CONSUMERS.has(name)) {
      checkNonConsumer(name, job, violations);
    }
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const violations = runCheck();
  if (violations.length === 0) {
    console.log("✅ No ci-fanout invariant violations detected.");
    process.exit(0);
  }
  console.error("❌ R-CIFanout violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.detail}`);
  }
  process.exit(1);
}
