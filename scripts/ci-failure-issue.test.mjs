// Tests for scripts/ci-failure-issue-helpers.mjs.
// 12 branches per the ci-failure-bot capability spec; assertion style mirrors
// scripts/check-archive-dates.test.mjs and scripts/cws-notify-issue.test.mjs.

import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { describe, it } from "node:test";

import {
  buildIssueBody,
  evaluateJobCoverage,
  matchRunJobs,
  parseFooter,
  runClose,
  runCreate,
} from "./ci-failure-issue-helpers.mjs";
import { parseRunJobs } from "./ci-failure-issue.mjs";

// Job entries below use the exact `{name, conclusion}` shape and the exact
// display names returned by `repos/{owner}/{repo}/actions/runs/{id}/jobs`,
// sampled from the live repo on 2026-07-29.

// Modelled on run 30348079209, an "everything ran" green run. That run has 54
// jobs; this is a hand-picked 19-entry SUBSET — one or two shards per matrix
// rather than all 28 `test` shards — kept small enough to read.
//
// It deliberately OMITS `round-trip` and `test-frontend`, which the real run
// does contain, so that the "footer job absent from the green run" case has a
// target. Do not read this array as an inventory of what CI runs.
//
// The two skipped entries are the structural ones that can never run on a
// green build, and are the whole reason the v1 gate was unsatisfiable:
//   log-bot-skip      → `if: github.actor == 'github-actions[bot]'`
//   Notify on Failure → `if:` requires some job to have failed
const GREEN_ALL_RAN = [
  { name: "log-bot-skip", conclusion: "skipped" },
  { name: "Notify on Failure", conclusion: "skipped" },
  { name: "detect-changes", conclusion: "success" },
  { name: "Link checker", conclusion: "success" },
  { name: "build", conclusion: "success" },
  { name: "typecheck", conclusion: "success" },
  { name: "lint (22.18.0)", conclusion: "success" },
  { name: "lint (24.x)", conclusion: "success" },
  { name: "lint", conclusion: "success" },
  { name: "test (22.18.0, core)", conclusion: "success" },
  { name: "test (24.x, core)", conclusion: "success" },
  { name: "test", conclusion: "success" },
  { name: "test-cli (22.18.0)", conclusion: "success" },
  { name: "test-cli (24.x)", conclusion: "success" },
  { name: "e2e-frontend (1)", conclusion: "success" },
  { name: "e2e-frontend (2)", conclusion: "success" },
  { name: "e2e-frontend (3)", conclusion: "success" },
  { name: "e2e-frontend (4)", conclusion: "success" },
  { name: "e2e-prod-base", conclusion: "success" },
];

// Modelled on run 30387496718, a docs-only green run (subset, same caveat).
// `build` is skipped, so the aggregator jobs (`name: lint|test|round-trip|
// test-frontend`) short-circuit to exit 0 while the REAL matrix jobs are
// skipped. GitHub collapses a fully gated-off matrix job to its bare name, so
// both land under the SAME display name with opposite conclusions — which is
// what makes a naive exact-name match unsafe.
const GREEN_DOCS_ONLY = [
  { name: "log-bot-skip", conclusion: "skipped" },
  { name: "Notify on Failure", conclusion: "skipped" },
  { name: "detect-changes", conclusion: "success" },
  { name: "Link checker", conclusion: "success" },
  { name: "build", conclusion: "skipped" },
  { name: "typecheck", conclusion: "skipped" },
  { name: "test", conclusion: "success" }, // test-summary aggregator
  { name: "test", conclusion: "skipped" }, // real matrix job, never expanded
  { name: "lint", conclusion: "success" }, // lint-summary aggregator
  { name: "lint", conclusion: "skipped" }, // real matrix job
];

const CTX = {
  sha: "abcdef1234567890",
  actor: "alice",
  runId: "777",
  runUrl: "https://example/runs/777",
  timestamp: "2026-05-03T10:00:00Z",
};

function fakeDeps(behaviors) {
  const calls = [];
  return {
    calls,
    exec: (cmd, args) => {
      calls.push({ cmd, args });
      const handler = behaviors.shift();
      if (!handler)
        throw new Error(`unexpected gh call: ${cmd} ${args.join(" ")}`);
      return handler(cmd, args);
    },
  };
}

const issueBody = (failedJobs, opts = {}) =>
  buildIssueBody({ ...CTX, failedJobs, isCanary: opts.isCanary ?? false });

describe("ci-failure-issue.mjs — 12 branches", () => {
  it("[1] no-open-issue + create → opens new issue with footer", () => {
    const deps = fakeDeps([
      () => JSON.stringify([]),
      () => "https://github.com/x/y/issues/42",
    ]);
    const result = runCreate(
      { failedJobs: ["lint"], isCanary: false, ctx: CTX },
      deps
    );
    deepStrictEqual(result, { action: "created", issue: 42 });
    const createCall = deps.calls[1];
    const bodyArg = createCall.args[createCall.args.indexOf("--body") + 1];
    ok(bodyArg.includes("<!-- ci-failure-bot"));
    ok(bodyArg.includes('failed-jobs: ["lint"]'));
    ok(bodyArg.includes("schema: 1"));
  });

  it("[2] open-issue + create → comments (dedupe), does NOT create", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 99,
            title: "🚨 CI Failure on main branch",
            body: issueBody(["lint"]),
          },
        ]),
      () => "",
    ]);
    const result = runCreate(
      { failedJobs: ["test"], isCanary: false, ctx: CTX },
      deps
    );
    deepStrictEqual(result, { action: "bumped", issue: 99 });
    strictEqual(deps.calls[1].args[0], "issue");
    strictEqual(deps.calls[1].args[1], "comment");
  });

  it("[3] no-open-issue + close → no-op", () => {
    const deps = fakeDeps([() => JSON.stringify([])]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    deepStrictEqual(result, []);
  });

  it("[4] open-issue + close on fully-green run (no skipped jobs) → close + audit", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 50,
            title: "🚨 CI Failure on main branch",
            body: issueBody(["lint", "test"]),
          },
        ]),
      () =>
        JSON.stringify({
          number: 50,
          state: "OPEN",
          body: issueBody(["lint", "test"]),
        }),
      () => "",
    ]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    strictEqual(result.length, 1);
    strictEqual(result[0].action, "closed");
    strictEqual(result[0].issue, 50);
    ok(result[0].comment.includes("Auto-closed"));
    ok(result[0].comment.includes("lint, test"));
  });

  it("[5] open-issue + close on a run that did not re-run the footer's jobs → skipped", () => {
    // v2 replaces v1's "any job anywhere was skipped" veto with a check
    // scoped to this issue's own jobs.
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 50,
            title: "🚨 CI Failure on main branch",
            body: issueBody(["lint", "test"]),
          },
        ]),
    ]);
    const result = runClose({ runJobs: GREEN_DOCS_ONLY, ctx: CTX }, deps);
    strictEqual(result[0].action, "skipped");
    strictEqual(result[0].reason, "job-not-green-on-run");
  });

  it("[6] sequential creates: second sees first's issue, dedupes via comment", () => {
    const deps1 = fakeDeps([
      () => JSON.stringify([]),
      () => "https://github.com/x/y/issues/42",
    ]);
    const r1 = runCreate(
      { failedJobs: ["lint"], isCanary: false, ctx: CTX },
      deps1
    );
    strictEqual(r1.action, "created");
    const deps2 = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 42,
            title: "🚨 CI Failure on main branch",
            body: issueBody(["lint"]),
          },
        ]),
      () => "",
    ]);
    const r2 = runCreate(
      { failedJobs: ["test"], isCanary: false, ctx: CTX },
      deps2
    );
    strictEqual(r2.action, "bumped");
    strictEqual(r2.issue, 42);
  });

  it("[7] open issue without footer (legacy) + close → skipped: missing-footer", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 11,
            title: "🚨 CI Failure on main branch",
            body: "Legacy issue, no footer.",
          },
        ]),
    ]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    deepStrictEqual(result[0], {
      issue: 11,
      action: "skipped",
      reason: "missing-footer",
    });
  });

  it("[8] malformed footer JSON + close → skipped: malformed-footer, no throw", () => {
    const malformed =
      "<!-- ci-failure-bot\n     failed-jobs: not-json\n     schema: 1\n-->";
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 12,
            title: "🚨 CI Failure on main branch",
            body: malformed,
          },
        ]),
    ]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    deepStrictEqual(result[0], {
      issue: 12,
      action: "skipped",
      reason: "malformed-footer",
    });
  });

  it("[9] staleness re-check: list says OPEN, pre-close get says CLOSED → skipped: race-closed", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 13,
            title: "🚨 CI Failure on main branch",
            body: issueBody(["lint"]),
          },
        ]),
      () =>
        JSON.stringify({
          number: 13,
          state: "CLOSED",
          body: issueBody(["lint"]),
        }),
    ]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    deepStrictEqual(result[0], {
      issue: 13,
      action: "skipped",
      reason: "race-closed",
    });
  });

  it("[10] footer with schema: 2 + close → skipped: unknown-schema", () => {
    const future = issueBody(["lint"]).replace("schema: 1", "schema: 2");
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          { number: 14, title: "🚨 CI Failure on main branch", body: future },
        ]),
    ]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    deepStrictEqual(result[0], {
      issue: 14,
      action: "skipped",
      reason: "unknown-schema",
    });
  });

  it("[11] footer with failed-jobs and NO schema line → treated as schema 1, closes like [4]", () => {
    const v0 = issueBody(["lint"]).replace(/\n\s+schema: 1/, "");
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          { number: 15, title: "🚨 CI Failure on main branch", body: v0 },
        ]),
      () => JSON.stringify({ number: 15, state: "OPEN", body: v0 }),
      () => "",
    ]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    strictEqual(result[0].action, "closed");
  });

  it("[12] --canary on create → [CANARY] title, canary label, footer failed-jobs ['canary-job']", () => {
    const deps = fakeDeps([
      () => JSON.stringify([]),
      () => "https://github.com/x/y/issues/77",
    ]);
    const result = runCreate(
      { failedJobs: ["canary-job"], isCanary: true, ctx: CTX },
      deps
    );
    deepStrictEqual(result, { action: "created", issue: 77 });
    const createCall = deps.calls[1];
    const titleArg = createCall.args[createCall.args.indexOf("--title") + 1];
    strictEqual(titleArg, "[CANARY] 🚨 CI Failure on main branch");
    const labelArgs = createCall.args.filter(
      (_, i, a) => a[i - 1] === "--label"
    );
    ok(labelArgs.includes("canary"));
    ok(labelArgs.includes("ci"));
    ok(labelArgs.includes("automated"));
    const bodyArg = createCall.args[createCall.args.indexOf("--body") + 1];
    ok(bodyArg.includes('failed-jobs: ["canary-job"]'));
  });
});

describe("ci-failure-issue.mjs — canary issues are not deduped against", () => {
  it("create with isCanary=false ignores existing [CANARY] issues and opens fresh", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 9,
            title: "[CANARY] 🚨 CI Failure on main branch",
            body: issueBody(["canary-job"], { isCanary: true }),
          },
        ]),
      () => "https://github.com/x/y/issues/100",
    ]);
    const result = runCreate(
      { failedJobs: ["lint"], isCanary: false, ctx: CTX },
      deps
    );
    strictEqual(result.action, "created");
    strictEqual(result.issue, 100);
  });

  it("close on fully-green run does NOT close canary issues (footer carries 'canary-job')", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          {
            number: 9,
            title: "[CANARY] 🚨 CI Failure on main branch",
            body: issueBody(["canary-job"], { isCanary: true }),
          },
        ]),
    ]);
    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);
    deepStrictEqual(result[0], {
      issue: 9,
      action: "skipped",
      reason: "canary-issue",
    });
  });
});

describe("v2 close-rule — per-job coverage on the green run", () => {
  const openIssue = (failedJobs, number = 500) => [
    () =>
      JSON.stringify([
        {
          number,
          title: "🚨 CI Failure on main branch",
          body: issueBody(failedJobs),
        },
      ]),
    () =>
      JSON.stringify({
        number,
        state: "OPEN",
        body: issueBody(failedJobs),
      }),
    () => "",
  ];

  it("closes when the two structural always-skipped jobs are the only skips", () => {
    // The v1 boolean gate vetoed on exactly this run shape, which is why the
    // bot never closed a single issue: `log-bot-skip` and `Notify on Failure`
    // are skipped on EVERY green run by construction.
    const deps = fakeDeps(openIssue(["lint", "test"]));

    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);

    strictEqual(result[0].action, "closed");
    ok(result[0].comment.includes("lint, test"));
  });

  it("does NOT close when a footer job's real matrix run was skipped", () => {
    // The aggregator named `test` succeeded (build was skipped, so it exits 0)
    // but the real `test` matrix job was skipped. Closing here would discard a
    // failure that was never actually re-run.
    const deps = fakeDeps([openIssue(["test"])[0]]);

    const result = runClose({ runJobs: GREEN_DOCS_ONLY, ctx: CTX }, deps);

    deepStrictEqual(result[0], {
      issue: 500,
      action: "skipped",
      reason: "job-not-green-on-run",
    });
  });

  it("does NOT close when a footer job is absent from the green run", () => {
    // Explicit fixture: the point is a footer job with NO counterpart of any
    // conclusion, so state it locally instead of leaning on what a shared
    // fixture happens to omit.
    const runJobs = [
      { name: "lint", conclusion: "success" },
      { name: "build", conclusion: "success" },
    ];
    const deps = fakeDeps([openIssue(["round-trip"])[0]]);

    const result = runClose({ runJobs, ctx: CTX }, deps);

    strictEqual(result[0].reason, "job-missing-on-run");
  });

  it("does NOT close when the run's job list is unavailable", () => {
    const deps = fakeDeps([openIssue(["lint"])[0]]);

    const result = runClose({ runJobs: [], ctx: CTX }, deps);

    strictEqual(result[0].reason, "run-jobs-unavailable");
  });

  it("does NOT close on an empty footer job set", () => {
    const deps = fakeDeps([openIssue([])[0]]);

    const result = runClose({ runJobs: GREEN_ALL_RAN, ctx: CTX }, deps);

    strictEqual(result[0].reason, "empty-job-set");
  });

  it("closes a path-filtered green run when the footer's own jobs all ran", () => {
    // Partial coverage is fine as long as it covers THIS issue's jobs — the
    // v1 rule threw away every such run.
    const deps = fakeDeps(openIssue(["lint"]));

    const result = runClose(
      {
        runJobs: [
          ...GREEN_ALL_RAN,
          { name: "bundle-analysis", conclusion: "skipped" },
          { name: "e2e-prod-base", conclusion: "skipped" },
        ],
        ctx: CTX,
      },
      deps
    );

    strictEqual(result[0].action, "closed");
  });
});

describe("matchRunJobs — display-name and matrix reconciliation", () => {
  it("resolves the check-links job id to its 'Link checker' display name", () => {
    // ci.yml declares `check-links:` with `name: Link checker`; the create
    // pass records the job ID, the jobs API reports the display name.
    const matches = matchRunJobs("check-links", GREEN_ALL_RAN);

    deepStrictEqual(matches, [{ name: "Link checker", conclusion: "success" }]);
  });

  it("collects every shard of a matrix job", () => {
    const matches = matchRunJobs("e2e-frontend", GREEN_ALL_RAN);

    strictEqual(matches.length, 4);
    ok(matches.every((m) => m.conclusion === "success"));
  });

  it("collects both the aggregator and the real job when names collide", () => {
    const matches = matchRunJobs("test", GREEN_DOCS_ONLY);

    deepStrictEqual(matches.map((m) => m.conclusion).sort(), [
      "skipped",
      "success",
    ]);
  });

  it("does not match a job whose name merely shares a prefix", () => {
    const runJobs = [{ name: "test-cli", conclusion: "success" }];

    deepStrictEqual(matchRunJobs("test", runJobs), []);
  });

  it("treats inherited Object keys in a footer as plain identifiers", () => {
    // Footer content is editable by anyone who can edit a ci+automated issue.
    const runJobs = [{ name: "constructor", conclusion: "success" }];

    deepStrictEqual(matchRunJobs("constructor", runJobs), runJobs);
    deepStrictEqual(matchRunJobs("toString", runJobs), []);
  });
});

describe("evaluateJobCoverage — direct unit coverage", () => {
  it("covers every real footer job on an all-ran green run", () => {
    const jobs = ["lint", "check-links", "typecheck", "test", "test-cli"];

    deepStrictEqual(evaluateJobCoverage(jobs, GREEN_ALL_RAN), {
      covered: true,
    });
  });

  it("reports the first uncovered job", () => {
    deepStrictEqual(evaluateJobCoverage(["lint", "test"], GREEN_DOCS_ONLY), {
      covered: false,
      reason: "job-not-green-on-run",
    });
  });
});

describe("parseRunJobs — GREEN_RUN_JOBS env decoding", () => {
  it("decodes the workflow's jq output", () => {
    const raw = '[{"name":"lint (24.x)","conclusion":"success"}]';

    deepStrictEqual(parseRunJobs(raw), [
      { name: "lint (24.x)", conclusion: "success" },
    ]);
  });

  it("degrades to an empty list instead of throwing", () => {
    // An empty list makes the close-rule report run-jobs-unavailable, so a
    // broken collection step closes nothing rather than closing everything.
    deepStrictEqual(parseRunJobs(undefined), []);
    deepStrictEqual(parseRunJobs(""), []);
    deepStrictEqual(parseRunJobs("not json"), []);
    deepStrictEqual(parseRunJobs('{"jobs":[]}'), []);
  });

  it("drops entries missing a name or conclusion", () => {
    const raw = '[{"name":"lint"},{"name":"test","conclusion":"success"}]';

    deepStrictEqual(parseRunJobs(raw), [
      { name: "test", conclusion: "success" },
    ]);
  });
});

describe("parseFooter — direct unit coverage", () => {
  it("returns null when body has no marker", () => {
    strictEqual(parseFooter("plain body"), null);
  });

  it("parses canonical schema 1 footer", () => {
    const body = buildIssueBody({
      ...CTX,
      failedJobs: ["lint", "test"],
      isCanary: false,
    });
    deepStrictEqual(parseFooter(body), {
      failedJobs: ["lint", "test"],
      schema: 1,
    });
  });

  it("flags non-array failed-jobs as malformed", () => {
    const bad =
      '<!-- ci-failure-bot\n     failed-jobs: "not-an-array"\n     schema: 1\n-->';
    deepStrictEqual(parseFooter(bad), { error: "malformed-footer" });
  });
});
