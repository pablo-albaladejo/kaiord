#!/usr/bin/env node
// Open-or-bump a GitHub issue for CWS-related auth/publish events.
//
// Idempotent: lists the kind's OWN label and compares titles exactly,
// client-side. It deliberately does NOT use `gh issue list --search`: the
// titles carry `:`, `@` and `/`, and GitHub's search parser reads
// `stalled:` as a qualifier and `@kaiord` as a user reference, so the
// query matched nothing and every run opened a duplicate.
//
// Concurrency: this is a read-then-write, not an atomic upsert. Two
// invocations racing on the same title can both observe "absent" and both
// create. The window is one `gh issue list` round-trip, and the next
// invocation converges back to one issue (it sees the earlier one and
// bumps). Cross-run races are additionally serialized by the
// `cws-issue-writer` job-level concurrency group in cws-publish.yml.
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

// The kind IS the label, and dedupe now depends on it, so the script owns
// its own labels rather than trusting a workflow step to have pre-created
// them. `cws-publish-rejected` was missing from the repo entirely, which is
// how a labelling failure used to swallow the whole notification.
const LABEL_META = {
  "cws-auth-broken": {
    color: "D7263D",
    description: "CWS service-account authentication is failing",
  },
  "cws-publish-verification-timeout": {
    color: "FF9F1C",
    description: "CWS publish did not reach PUBLISHED within the wait budget",
  },
  "cws-publish-rejected": {
    color: "D7263D",
    description: "CWS rejected the submitted extension version",
  },
};

export function buildTitle(kind, suffix) {
  const fn = TITLES[kind];
  if (!fn) throw new Error(`unknown notify kind: ${kind}`);
  if (kind !== "cws-auth-broken" && !suffix) {
    throw new Error(`${kind} requires title suffix (extension+version)`);
  }
  return fn(suffix);
}

// Lists by label, never by search. `gh issue list --label <missing-label>`
// exits 0 with `[]`, so an absent label degrades to "no match" rather than
// throwing — the create path below then recreates the label.
export function findOpenIssue(title, kind, deps = defaultDeps()) {
  const args = [
    "issue",
    "list",
    "--state",
    "open",
    "--label",
    kind,
    "--json",
    "number,title",
    "--limit",
    "100",
  ];
  const out = deps.exec("gh", args);
  const list = JSON.parse(out || "[]");
  const exact = list.find((i) => i.title === title);
  return exact ? exact.number : null;
}

// Best-effort: `--force` makes this an idempotent upsert. Returns false when
// the label could not be ensured (e.g. a token without label-write scope) so
// the caller can still file the issue unlabelled rather than lose the alert.
export function ensureLabel(kind, deps = defaultDeps()) {
  const meta = LABEL_META[kind];
  if (!meta) return false;
  try {
    deps.exec("gh", [
      "label",
      "create",
      kind,
      "--color",
      meta.color,
      "--description",
      meta.description,
      "--force",
    ]);
    return true;
  } catch {
    return false;
  }
}

export function openOrBump(kind, suffix, body, deps = defaultDeps()) {
  const title = buildTitle(kind, suffix);
  const existing = findOpenIssue(title, kind, deps);
  if (existing != null) {
    deps.exec("gh", [
      "issue",
      "comment",
      String(existing),
      "--body",
      `Re-detected at ${new Date().toISOString()}\n\n${body}`,
    ]);
    return { issue: existing, action: "bumped", labeled: true };
  }
  const labeled = ensureLabel(kind, deps);
  const base = ["issue", "create", "--title", title, "--body", body];
  const out = labeled
    ? deps.exec("gh", [...base, "--label", kind])
    : deps.exec("gh", base);
  return {
    issue: parseIssueNumberFromUrl(String(out).trim()),
    action: "created",
    labeled,
  };
}

function parseIssueNumberFromUrl(url) {
  const m = url.match(/\/issues\/(\d+)/);
  return m ? Number(m[1]) : null;
}

function defaultDeps() {
  return {
    exec: (cmd, args) =>
      execFileSync(cmd, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [kind, suffix, ...rest] = process.argv.slice(2);
  const body = rest.join(" ") || "(no body provided)";
  try {
    const result = openOrBump(kind, suffix, body);
    if (result.labeled === false) {
      // The alert was filed, so this is a warning, not a failure — but an
      // unlabelled issue will not dedupe on the next run.
      process.stderr.write(
        `[CwsLabelDegraded] filed issue #${result.issue} without label '${kind}'\n`
      );
    }
    process.stdout.write(JSON.stringify(result) + "\n");
  } catch (err) {
    process.stderr.write(`[CwsStateError] ${err.message}\n`);
    process.exit(1);
  }
}
