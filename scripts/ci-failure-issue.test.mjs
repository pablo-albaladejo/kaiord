// Tests for scripts/ci-failure-issue-helpers.mjs.
// 12 branches per the ci-failure-bot capability spec; assertion style mirrors
// scripts/check-archive-dates.test.mjs and scripts/cws-notify-issue.test.mjs.

import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { describe, it } from "node:test";

import {
  buildIssueBody,
  parseFooter,
  runClose,
  runCreate,
} from "./ci-failure-issue-helpers.mjs";

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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
    strictEqual(result.length, 1);
    strictEqual(result[0].action, "closed");
    strictEqual(result[0].issue, 50);
    ok(result[0].comment.includes("Auto-closed"));
    ok(result[0].comment.includes("lint, test"));
  });

  it("[5] open-issue + close on partial-green run (any job skipped) → skipped: jobs-skipped-on-green-run", () => {
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
    const result = runClose({ anyJobsSkipped: true, ctx: CTX }, deps);
    strictEqual(result[0].action, "skipped");
    strictEqual(result[0].reason, "jobs-skipped-on-green-run");
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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
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
    const result = runClose({ anyJobsSkipped: false, ctx: CTX }, deps);
    deepStrictEqual(result[0], {
      issue: 9,
      action: "skipped",
      reason: "canary-issue",
    });
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
