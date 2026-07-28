// Pure helpers + gh-CLI orchestration for the ci-failure-issue bot.
// All gh CLI calls flow through `deps.exec` so tests can inject a stub.
// The bot's footer marker is the canonical state contract — see the
// ci-failure-bot capability spec for the grammar.

const FOOTER_RE = /<!--\s*ci-failure-bot\s+([\s\S]*?)-->/;
const BOT_LABELS = ["ci", "automated"];

export const SCHEMA_V1 = 1;

export function parseFooter(body) {
  if (typeof body !== "string") return null;
  const match = FOOTER_RE.exec(body);
  if (!match) return null;
  const inner = match[1];
  const jobsLine = /failed-jobs:\s*(\[.*?\])/.exec(inner);
  const schemaLine = /schema:\s*(\d+)/.exec(inner);
  if (!jobsLine) return { error: "malformed-footer" };
  let failedJobs;
  try {
    failedJobs = JSON.parse(jobsLine[1]);
  } catch {
    return { error: "malformed-footer" };
  }
  if (
    !Array.isArray(failedJobs) ||
    !failedJobs.every((j) => typeof j === "string")
  ) {
    return { error: "malformed-footer" };
  }
  const schema = schemaLine ? Number(schemaLine[1]) : SCHEMA_V1;
  return { failedJobs, schema };
}

export function buildIssueBody({
  sha,
  actor,
  runUrl,
  failedJobs,
  timestamp,
  isCanary,
}) {
  const tag = isCanary ? "[CANARY] " : "";
  const jobsList = failedJobs.map((j) => `- ❌ ${j}`).join("\n");
  return [
    `## ${tag}CI Workflow Failed on Main Branch`,
    ``,
    `**Commit:** ${sha.slice(0, 7)}`,
    `**Author:** @${actor}`,
    `**Workflow Run:** ${runUrl}`,
    `**Triggered:** ${timestamp}`,
    ``,
    `### Failed Jobs`,
    ``,
    jobsList,
    ``,
    `<!-- ci-failure-bot`,
    `     failed-jobs: ${JSON.stringify(failedJobs)}`,
    `     schema: ${SCHEMA_V1}`,
    `-->`,
  ].join("\n");
}

export function formatBumpComment({
  sha,
  actor,
  runUrl,
  failedJobs,
  timestamp,
}) {
  const jobsList = failedJobs.map((j) => `\`${j}\``).join(", ");
  return `Re-detected at ${timestamp}\nCommit ${sha.slice(0, 7)} by @${actor}; failed jobs: ${jobsList}\nRun: ${runUrl}`;
}

export function formatAuditComment({ sha, jobs }) {
  return `Auto-closed: main green at ${sha.slice(0, 7)}; jobs covered: ${jobs.join(", ")}.`;
}

export function formatLabelArgs(labels) {
  return labels.flatMap((label) => ["--label", label]);
}

export function listOpenBotIssues(deps) {
  const out = deps.exec("gh", [
    "issue",
    "list",
    "--state",
    "open",
    "--label",
    BOT_LABELS.join(","),
    "--json",
    "number,title,body",
    "--limit",
    "50",
  ]);
  return JSON.parse(out || "[]");
}

export function getIssue(num, deps) {
  const out = deps.exec("gh", [
    "issue",
    "view",
    String(num),
    "--json",
    "number,state,body",
  ]);
  return JSON.parse(out);
}

export function runCreate({ failedJobs, isCanary, ctx }, deps) {
  const open = listOpenBotIssues(deps);
  const target = open.find((i) => !isCanaryIssue(i));
  if (target && !isCanary) {
    deps.exec("gh", [
      "issue",
      "comment",
      String(target.number),
      "--body",
      formatBumpComment({ ...ctx, failedJobs }),
    ]);
    return { action: "bumped", issue: target.number };
  }
  const body = buildIssueBody({ ...ctx, failedJobs, isCanary });
  const title = isCanary
    ? "[CANARY] 🚨 CI Failure on main branch"
    : "🚨 CI Failure on main branch";
  const labelArgs = formatLabelArgs([
    ...BOT_LABELS,
    "bug",
    "priority-high",
    ...(isCanary ? ["canary"] : []),
  ]);
  const out = deps.exec("gh", [
    "issue",
    "create",
    "--title",
    title,
    ...labelArgs,
    "--body",
    body,
  ]);
  return {
    action: "created",
    issue: parseIssueNumberFromUrl(String(out).trim()),
  };
}

// The create-pass records job IDs (from `needs.<id>.result`), but the
// workflow_run jobs API reports each job's DISPLAY name (`name:`). They differ
// only where ci.yml overrides `name:`. Of the ten job IDs the create-pass can
// emit, exactly one overrides its display name today; the aggregator jobs
// (`lint-summary` → `lint`, etc.) are never emitted into a footer, so they
// need no alias — but they DO collide by name, which matchRunJobs handles by
// requiring every same-named job to be green.
const JOB_DISPLAY_NAMES = { "check-links": "Link checker" };

// A footer job maps to the run's exact-name job plus every matrix shard,
// which the API renders as `<name> (<matrix values>)`.
export function matchRunJobs(footerJob, runJobs) {
  const display = JOB_DISPLAY_NAMES[footerJob] ?? footerJob;
  const prefix = `${display} (`;
  return runJobs.filter(
    (j) =>
      j.name === display || (j.name.startsWith(prefix) && j.name.endsWith(")"))
  );
}

// v2 close-rule: an issue is covered iff EVERY job named in its footer both
// ran and succeeded on the green run. Anything else — a job absent from the
// run, a shard skipped, an empty job set, an unreadable job list — is
// uncertainty and leaves the issue open.
export function evaluateJobCoverage(failedJobs, runJobs) {
  if (!Array.isArray(runJobs) || runJobs.length === 0)
    return { covered: false, reason: "run-jobs-unavailable" };
  if (failedJobs.length === 0)
    return { covered: false, reason: "empty-job-set" };
  for (const job of failedJobs) {
    const matches = matchRunJobs(job, runJobs);
    if (matches.length === 0)
      return { covered: false, reason: "job-missing-on-run" };
    if (matches.some((m) => m.conclusion !== "success"))
      return { covered: false, reason: "job-not-green-on-run" };
  }
  return { covered: true };
}

// Close-pass v2 rule: close iff every job in the issue's footer ran AND
// succeeded on the green run (see evaluateJobCoverage).
//
// This replaces the v1 "no job anywhere on the run was skipped" gate, which
// was unsatisfiable by construction: ci.yml's `log-bot-skip` is gated on
// `github.actor == 'github-actions[bot]'` and `notify-failure` requires a
// failed job, so at least one of the two is skipped on EVERY green run. The
// gate was therefore always true and the bot never closed anything.
//
// Scoping the check to the footer's own jobs is also strictly safer than the
// coarse gate: it refuses a docs-only green run where the `test` aggregator
// exits 0 while the real `test` matrix job was skipped.
//
// Safety defaults — bot must never close on uncertainty:
//   - Skipped issues with missing footer    → skip (legacy issues stay open)
//   - Skipped issues with malformed footer  → skip (no throw)
//   - Skipped issues with unknown schema    → skip (forward-compat)
//   - Canary issues (failed-jobs ["canary-job"]) → skip (real green never covers)
//   - Footer job absent / not green on the run → skip
//   - Stale-race (issue closed between list and close) → skip
export function runClose({ runJobs, ctx }, deps) {
  const open = listOpenBotIssues(deps);
  return open.map((issue) => {
    const decision = decideClose(issue, runJobs, ctx, deps);
    if (decision.action === "closed") {
      deps.exec("gh", [
        "issue",
        "close",
        String(issue.number),
        "--comment",
        decision.comment,
      ]);
    }
    return decision;
  });
}

function decideClose(issue, runJobs, ctx, deps) {
  const parsed = parseFooter(issue.body);
  if (!parsed)
    return { issue: issue.number, action: "skipped", reason: "missing-footer" };
  if (parsed.error)
    return { issue: issue.number, action: "skipped", reason: parsed.error };
  if (parsed.schema !== SCHEMA_V1)
    return { issue: issue.number, action: "skipped", reason: "unknown-schema" };
  if (parsed.failedJobs.includes("canary-job"))
    return { issue: issue.number, action: "skipped", reason: "canary-issue" };
  const coverage = evaluateJobCoverage(parsed.failedJobs, runJobs);
  if (!coverage.covered)
    return { issue: issue.number, action: "skipped", reason: coverage.reason };
  const fresh = getIssue(issue.number, deps);
  if (fresh.state !== "OPEN")
    return { issue: issue.number, action: "skipped", reason: "race-closed" };
  return {
    issue: issue.number,
    action: "closed",
    comment: formatAuditComment({ ...ctx, jobs: parsed.failedJobs }),
  };
}

function isCanaryIssue(issue) {
  return issue.title?.startsWith("[CANARY]");
}

function parseIssueNumberFromUrl(url) {
  const m = url.match(/\/issues\/(\d+)/);
  return m ? Number(m[1]) : null;
}
