#!/usr/bin/env node
// CI-failure issue bot: create-on-red, dedupe-via-comment, close-on-green-with-job-set-match.
// State lives in the GitHub issue body (footer marker); see openspec/specs/ci-failure-bot.
//
// Usage:
//   node scripts/ci-failure-issue.mjs create '["lint","test"]'           # create / dedupe-comment
//   node scripts/ci-failure-issue.mjs create '["canary-job"]' --canary   # canary create
//   node scripts/ci-failure-issue.mjs close <any-skipped:true|false>     # close on fully-green run

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { runClose, runCreate } from "./ci-failure-issue-helpers.mjs";

export function defaultDeps() {
  return {
    exec: (cmd, args) =>
      execFileSync(cmd, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
  };
}

export function envCtx() {
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const runId = process.env.GITHUB_RUN_ID ?? "";
  return {
    sha: process.env.GITHUB_SHA ?? "",
    actor: process.env.GITHUB_ACTOR ?? "",
    runId,
    runUrl: `${server}/${repo}/actions/runs/${runId}`,
    timestamp: new Date().toISOString(),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.CI_ISSUE_BOT_ENABLED === "false") {
    console.log("ci-failure-bot disabled via vars.CI_ISSUE_BOT_ENABLED");
    process.exit(0);
  }
  console.log("ci-failure-bot enabled");
  const [mode, arg] = process.argv.slice(2);
  const isCanary = process.argv.includes("--canary");
  const ctx = envCtx();
  const deps = defaultDeps();
  let result;
  if (mode === "close") {
    const anyJobsSkipped = arg === "true";
    result = runClose({ anyJobsSkipped, ctx }, deps);
  } else {
    const jobs = JSON.parse(arg || "[]");
    result = runCreate({ failedJobs: jobs, isCanary, ctx }, deps);
  }
  process.stdout.write(JSON.stringify(result) + "\n");
}
