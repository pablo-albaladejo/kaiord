// Tests for scripts/cws-notify-issue.mjs

import { describe, it } from "node:test";
import { strictEqual, ok, deepStrictEqual } from "node:assert";

import {
  buildTitle,
  findOpenIssue,
  openOrBump,
} from "./cws-notify-issue.mjs";

function fakeDeps(behaviors) {
  const calls = [];
  return {
    calls,
    exec: (cmd, args) => {
      calls.push({ cmd, args });
      const handler = behaviors.shift();
      if (!handler) throw new Error("unexpected call");
      return handler(cmd, args);
    },
  };
}

describe("buildTitle", () => {
  it("returns singleton title for cws-auth-broken without suffix", () => {
    strictEqual(buildTitle("cws-auth-broken"), "CWS authentication broken");
  });

  it("requires suffix for verification-timeout kind", () => {
    let caught;
    try {
      buildTitle("cws-publish-verification-timeout");
    } catch (e) {
      caught = e;
    }
    ok(caught);
  });

  it("scopes verification-timeout title with suffix", () => {
    strictEqual(
      buildTitle("cws-publish-verification-timeout", "@kaiord/garmin-bridge@7.1.1"),
      "CWS publish stalled: @kaiord/garmin-bridge@7.1.1",
    );
  });

  it("scopes rejected title with suffix", () => {
    strictEqual(
      buildTitle("cws-publish-rejected", "@kaiord/train2go-bridge@7.1.1"),
      "CWS publish rejected: @kaiord/train2go-bridge@7.1.1",
    );
  });

  it("rejects unknown kind", () => {
    let caught;
    try {
      buildTitle("bogus");
    } catch (e) {
      caught = e;
    }
    ok(caught);
  });
});

describe("findOpenIssue", () => {
  it("returns null when no exact title match", () => {
    const deps = fakeDeps([() => JSON.stringify([])]);
    strictEqual(findOpenIssue("CWS authentication broken", deps), null);
  });

  it("returns issue number on exact title match", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          { number: 42, title: "CWS authentication broken" },
        ]),
    ]);
    strictEqual(findOpenIssue("CWS authentication broken", deps), 42);
  });

  it("ignores label-only fuzzy matches and requires exact title", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          { number: 99, title: "CWS authentication broken (legacy)" },
        ]),
    ]);
    strictEqual(findOpenIssue("CWS authentication broken", deps), null);
  });
});

describe("openOrBump", () => {
  it("creates a new issue when none exists", () => {
    const deps = fakeDeps([
      () => JSON.stringify([]), // findOpenIssue list returns empty
      () => "https://github.com/owner/repo/issues/123\n", // create returns URL
    ]);

    const result = openOrBump(
      "cws-auth-broken",
      undefined,
      "Pre-flight returned 401",
      deps,
    );

    strictEqual(result.action, "created");
    strictEqual(result.issue, 123);
    strictEqual(deps.calls.length, 2);
    strictEqual(deps.calls[1].args[0], "issue");
    strictEqual(deps.calls[1].args[1], "create");
  });

  it("bumps existing issue with comment when title matches", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          { number: 7, title: "CWS authentication broken" },
        ]),
      () => "", // gh issue comment returns nothing meaningful
    ]);

    const result = openOrBump(
      "cws-auth-broken",
      undefined,
      "Re-detected at next pre-flight",
      deps,
    );

    strictEqual(result.action, "bumped");
    strictEqual(result.issue, 7);
    deepStrictEqual(deps.calls[1].args.slice(0, 3), ["issue", "comment", "7"]);
  });

  it("scopes verification-timeout title per extension+version", () => {
    const deps = fakeDeps([
      () => JSON.stringify([]),
      () => "https://github.com/owner/repo/issues/200",
    ]);

    openOrBump(
      "cws-publish-verification-timeout",
      "@kaiord/garmin-bridge@7.1.1",
      "stuck",
      deps,
    );

    const createArgs = deps.calls[1].args;
    const titleIdx = createArgs.indexOf("--title");
    strictEqual(
      createArgs[titleIdx + 1],
      "CWS publish stalled: @kaiord/garmin-bridge@7.1.1",
    );
  });

  it("simulates concurrent writers: second invocation bumps instead of duplicating", () => {
    // Writer A: list returns empty, then creates issue 50.
    const writerA = fakeDeps([
      () => JSON.stringify([]),
      () => "https://github.com/owner/repo/issues/50",
    ]);
    const a = openOrBump(
      "cws-auth-broken",
      undefined,
      "first detection",
      writerA,
    );
    strictEqual(a.action, "created");

    // Writer B (slightly later): list returns issue 50; bumps it instead of creating.
    const writerB = fakeDeps([
      () =>
        JSON.stringify([
          { number: 50, title: "CWS authentication broken" },
        ]),
      () => "",
    ]);
    const b = openOrBump(
      "cws-auth-broken",
      undefined,
      "second detection",
      writerB,
    );
    strictEqual(b.action, "bumped");
    strictEqual(b.issue, 50);
  });
});
