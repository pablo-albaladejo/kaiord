#!/usr/bin/env node
// CI-failure issue bot: create-on-red, dedupe-via-comment, close-on-green-with-job-set-match.
// State lives in the GitHub issue body (footer marker); see openspec/specs/ci-failure-bot.
//
// Usage:
//   node scripts/ci-failure-issue.mjs create '["lint","test"]'           # create / dedupe-comment
//   node scripts/ci-failure-issue.mjs create '["canary-job"]' --canary   # canary create
//   node scripts/ci-failure-issue.mjs close                              # close on green run
//
// `close` reads the green run's job list from the GREEN_RUN_JOBS env var:
// a JSON array of `{name, conclusion}` straight from the workflow_run jobs
// API. It is passed via env rather than argv because job display names
// contain spaces and parentheses. An unset/unparseable value yields an empty
// list, which the close-rule treats as "cannot verify" and closes nothing.

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

// Never throws: an unreadable job list must degrade to "cannot verify
// coverage" (close nothing), not crash the close-pass.
export function parseRunJobs(raw) {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (j) => j && typeof j.name === "string" && typeof j.conclusion === "string"
  );
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
    result = runClose(
      { runJobs: parseRunJobs(process.env.GREEN_RUN_JOBS), ctx },
      deps
    );
  } else {
    const jobs = JSON.parse(arg || "[]");
    result = runCreate({ failedJobs: jobs, isCanary, ctx }, deps);
  }
  process.stdout.write(JSON.stringify(result) + "\n");
}
