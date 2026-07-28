#!/usr/bin/env node
// Guards the contract between ci.yml's `notify-failure` job (which WRITES a
// failed-jobs footer) and the close-pass (which READS it). Both halves live in
// different files and neither fails loudly when they drift, so the drift is
// only observable as issues that silently never close.
//
// Rule R-CiFailureBotContract. Three invariants:
//
//   1. Every job named as a failure trigger in `notify-failure`'s `if:` is
//      also appended by its "Assemble failed-jobs JSON" step. A trigger that
//      is never recorded produces a footer no green run can satisfy, i.e. a
//      permanently unclosable issue. (`jscpd` was exactly this.)
//   2. Nothing is recorded that is not a trigger — otherwise the footer names
//      a job whose failure could not have opened the issue.
//   3. Every recorded job whose ci.yml `name:` differs from its job ID has a
//      matching entry in the close-pass's JOB_DISPLAY_NAMES alias table. The
//      workflow_run jobs API reports display names, so an unaliased override
//      makes that job unmatchable.
//
// Usage: node scripts/check-ci-failure-bot-contract.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parse } from "yaml";

import { JOB_DISPLAY_NAMES } from "./ci-failure-issue-helpers.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CI_WORKFLOW = join(REPO_ROOT, ".github/workflows/ci.yml");

// The notify-failure job, from its key to the create invocation, with
// comment-only lines removed. Stripping them matters: the step documents the
// very `printf` idiom this guard rejects, and a naive scan would match the
// prose describing the bug rather than the bug.
function notifyFailureBlock(src) {
  const m = /\n {2}notify-failure:[\s\S]*?ci-failure-issue\.mjs create/.exec(
    src
  );
  if (!m) return "";
  return m[0]
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

export function extractContract(src) {
  const block = notifyFailureBlock(src);
  const uniq = (re) => [...new Set([...block.matchAll(re)].map((m) => m[1]))];
  return {
    found: block !== "",
    triggers: uniq(/needs\.([a-z0-9-]+)\.result == 'failure'/g),
    recorded: uniq(/jobs\+=\("([a-z0-9-]+)"\)/g),
    // `printf '%s\n' "${arr[@]}"` emits one EMPTY line for an empty array,
    // which jq -R/-s turns into [""] rather than [].
    emptyArrayBug: /printf '%s\\n' "\$\{jobs\[@\]\}"/.test(block),
  };
}

export function displayNameOverrides(src) {
  const jobs = parse(src)?.jobs ?? {};
  return Object.fromEntries(
    Object.entries(jobs)
      .filter(([id, job]) => typeof job?.name === "string" && job.name !== id)
      .map(([id, job]) => [id, job.name])
  );
}

export function findViolations(src, aliases = JOB_DISPLAY_NAMES) {
  const { found, triggers, recorded, emptyArrayBug } = extractContract(src);
  if (!found) return ["could not locate the notify-failure job in ci.yml"];
  const overrides = displayNameOverrides(src);
  const violations = [];

  for (const job of triggers.filter((j) => !recorded.includes(j))) {
    violations.push(
      `"${job}" triggers notify-failure but is never appended in the assemble step — ` +
        `an issue filed for it could never be auto-closed`
    );
  }
  for (const job of recorded.filter((j) => !triggers.includes(j))) {
    violations.push(
      `"${job}" is recorded into the footer but is not a notify-failure trigger`
    );
  }
  for (const job of recorded) {
    const override = overrides[job];
    if (override && aliases[job] !== override) {
      violations.push(
        `"${job}" is declared in ci.yml as \`name: ${override}\` but JOB_DISPLAY_NAMES ` +
          `maps it to ${aliases[job] ? `"${aliases[job]}"` : "nothing"} — ` +
          `the close-pass would never match it`
      );
    }
  }
  for (const job of Object.keys(aliases)) {
    if (!overrides[job]) {
      violations.push(
        `JOB_DISPLAY_NAMES aliases "${job}" but ci.yml declares no differing \`name:\` for it`
      );
    }
  }
  if (emptyArrayBug) {
    violations.push(
      `the assemble step serialises via \`printf | jq -R\`, which turns an empty ` +
        `job array into [""] instead of [] — use \`jq -nc '$ARGS.positional' --args\``
    );
  }
  return violations;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = findViolations(readFileSync(CI_WORKFLOW, "utf8"));
  if (violations.length > 0) {
    process.stderr.write("R-CiFailureBotContract violations:\n");
    for (const v of violations) process.stderr.write(`  - ${v}\n`);
    process.exit(1);
  }
  process.stdout.write("ci-failure-bot create/close contract holds.\n");
}
