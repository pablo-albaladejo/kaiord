#!/usr/bin/env node
// Open-or-bump a GitHub issue for CWS-related auth/publish events.
// Idempotent: searches by exact title (NOT just label) — two concurrent
// invocations targeting the same title settle to one issue (one creates,
// the other reads it on its retry and bumps via comment).
//
// Usage:
//   node scripts/cws-notify-issue.mjs <kind> [title-suffix]
//
// Where <kind> is one of:
//   cws-auth-broken                  → singleton (no suffix)
//   cws-publish-verification-timeout → suffix is "@kaiord/<ext>@<version>"
//   cws-publish-rejected             → suffix is "@kaiord/<ext>@<version>"

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const TITLES = {
  "cws-auth-broken": () => "CWS authentication broken",
  "cws-publish-verification-timeout": (suffix) =>
    `CWS publish stalled: ${suffix}`,
  "cws-publish-rejected": (suffix) => `CWS publish rejected: ${suffix}`,
};

export function buildTitle(kind, suffix) {
  const fn = TITLES[kind];
  if (!fn) throw new Error(`unknown notify kind: ${kind}`);
  if (kind !== "cws-auth-broken" && !suffix) {
    throw new Error(`${kind} requires title suffix (extension+version)`);
  }
  return fn(suffix);
}

export function findOpenIssue(title, deps = defaultDeps()) {
  const args = [
    "issue",
    "list",
    "--state",
    "open",
    "--search",
    `${title} in:title`,
    "--json",
    "number,title",
    "--limit",
    "20",
  ];
  const out = deps.exec("gh", args);
  const list = JSON.parse(out || "[]");
  const exact = list.find((i) => i.title === title);
  return exact ? exact.number : null;
}

export function openOrBump(kind, suffix, body, deps = defaultDeps()) {
  const title = buildTitle(kind, suffix);
  const existing = findOpenIssue(title, deps);
  if (existing != null) {
    deps.exec("gh", [
      "issue",
      "comment",
      String(existing),
      "--body",
      `Re-detected at ${new Date().toISOString()}\n\n${body}`,
    ]);
    return { issue: existing, action: "bumped" };
  }
  const out = deps.exec("gh", [
    "issue",
    "create",
    "--title",
    title,
    "--label",
    kind,
    "--body",
    body,
  ]);
  const created = parseIssueNumberFromUrl(String(out).trim());
  return { issue: created, action: "created" };
}

function parseIssueNumberFromUrl(url) {
  const m = url.match(/\/issues\/(\d+)/);
  return m ? Number(m[1]) : null;
}

function defaultDeps() {
  return {
    exec: (cmd, args) =>
      execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [kind, suffix, ...rest] = process.argv.slice(2);
  const body = rest.join(" ") || "(no body provided)";
  try {
    const result = openOrBump(kind, suffix, body);
    process.stdout.write(JSON.stringify(result) + "\n");
  } catch (err) {
    process.stderr.write(`[CwsStateError] ${err.message}\n`);
    process.exit(1);
  }
}
