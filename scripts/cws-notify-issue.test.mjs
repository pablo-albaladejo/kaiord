// Tests for scripts/cws-notify-issue.mjs

import { describe, it } from "node:test";
import { strictEqual, ok, deepStrictEqual } from "node:assert";

import { buildTitle, findOpenIssue, openOrBump } from "./cws-notify-issue.mjs";

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

// A `gh` stub that models the two behaviours verified against the live repo
// (pablo-albaladejo/kaiord) on 2026-07-29:
//
//   1. `gh issue list --search "<title> in:title"` matches NOTHING when the
//      title contains `:` or `@`. GitHub parses `stalled:` as a search
//      qualifier and `@kaiord` as a user reference. Measured: the query the
//      script used to build returned 0 results, while the same query with the
//      title double-quoted returned 8.
//   2. `gh issue list --label <name>` returns every open issue carrying that
//      label, regardless of what characters the title contains, and exits 0
//      with `[]` when the label does not exist.
//   3. `gh issue create --label <name>` FAILS when <name> does not exist
//      ("could not add label: '<name>' not found").
function ghStore({ labels = [], issues = [] } = {}) {
  return { labels: [...labels], issues: [...issues], comments: [], next: 900 };
}

function ghFake(store) {
  const calls = [];
  const flag = (args, name) => {
    const i = args.indexOf(name);
    return i === -1 ? null : args[i + 1];
  };
  return {
    calls,
    store,
    exec: (cmd, args) => {
      calls.push({ cmd, args });
      const verb = `${args[0]} ${args[1]}`;
      if (verb === "issue list") {
        const search = flag(args, "--search");
        if (search !== null) {
          // Unquoted `:`/`@` in the term makes GitHub's parser drop it.
          const term = search.replace(/\s*in:title\s*$/, "");
          if (/[:@]/.test(term)) return JSON.stringify([]);
          return JSON.stringify(
            store.issues
              .filter((i) => i.title.includes(term))
              .map(({ number, title }) => ({ number, title }))
          );
        }
        const label = flag(args, "--label");
        // No --label and no --search: an unfiltered scan of open issues.
        const matched =
          label === null
            ? store.issues
            : store.issues.filter((i) => i.labels.includes(label));
        return JSON.stringify(
          matched.map(({ number, title }) => ({ number, title }))
        );
      }
      if (verb === "label create") {
        if (!store.labels.includes(args[2])) store.labels.push(args[2]);
        return "";
      }
      if (verb === "issue create") {
        const label = flag(args, "--label");
        if (label !== null && !store.labels.includes(label)) {
          throw new Error(`could not add label: '${label}' not found`);
        }
        const number = store.next++;
        store.issues.push({
          number,
          title: flag(args, "--title"),
          labels: label === null ? [] : [label],
        });
        return `https://github.com/owner/repo/issues/${number}\n`;
      }
      if (verb === "issue edit") {
        const add = flag(args, "--add-label");
        const target = store.issues.find((i) => i.number === Number(args[2]));
        if (add !== null && target && !target.labels.includes(add)) {
          target.labels.push(add);
        }
        return "";
      }
      if (verb === "issue comment") {
        store.comments.push({
          issue: Number(args[2]),
          body: flag(args, "--body"),
        });
        return "";
      }
      throw new Error(`unexpected gh call: ${args.join(" ")}`);
    },
  };
}

// A gh whose token cannot write labels (e.g. a restricted GITHUB_TOKEN).
function labelDenied(store) {
  const inner = ghFake(store);
  return {
    exec: (cmd, args) => {
      if (`${args[0]} ${args[1]}` === "label create") {
        throw new Error("HTTP 403: Resource not accessible by integration");
      }
      return inner.exec(cmd, args);
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
      buildTitle(
        "cws-publish-verification-timeout",
        "@kaiord/garmin-bridge@7.1.1"
      ),
      "CWS publish stalled: @kaiord/garmin-bridge@7.1.1"
    );
  });

  it("scopes rejected title with suffix", () => {
    strictEqual(
      buildTitle("cws-publish-rejected", "@kaiord/train2go-bridge@7.1.1"),
      "CWS publish rejected: @kaiord/train2go-bridge@7.1.1"
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
    strictEqual(
      findOpenIssue("CWS authentication broken", "cws-auth-broken", deps),
      null
    );
  });

  it("returns issue number on exact title match", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([{ number: 42, title: "CWS authentication broken" }]),
    ]);
    strictEqual(
      findOpenIssue("CWS authentication broken", "cws-auth-broken", deps),
      42
    );
  });

  it("ignores label-only fuzzy matches and requires exact title", () => {
    const deps = fakeDeps([
      () =>
        JSON.stringify([
          { number: 99, title: "CWS authentication broken (legacy)" },
        ]),
    ]);
    strictEqual(
      findOpenIssue("CWS authentication broken", "cws-auth-broken", deps),
      null
    );
  });

  it("lists by the kind's label and never by --search", () => {
    const deps = fakeDeps([() => JSON.stringify([])]);

    findOpenIssue(
      "CWS publish stalled: @kaiord/x@1.0.0",
      "cws-publish-rejected",
      deps
    );

    const { args } = deps.calls[0];
    strictEqual(args.includes("--search"), false);
    strictEqual(args[args.indexOf("--label") + 1], "cws-publish-rejected");
  });
});

describe("openOrBump", () => {
  it("creates a new issue when none exists", () => {
    const deps = fakeDeps([
      () => JSON.stringify([]), // findOpenIssue: list by label, empty
      () => "", // gh label create --force
      () => JSON.stringify([]), // title scan: no unlabelled orphan
      () => "https://github.com/owner/repo/issues/123\n", // create returns URL
    ]);

    const result = openOrBump(
      "cws-auth-broken",
      undefined,
      "Pre-flight returned 401",
      deps
    );

    strictEqual(result.action, "created");
    strictEqual(result.issue, 123);
    strictEqual(deps.calls.length, 4);
    strictEqual(deps.calls[3].args[0], "issue");
    strictEqual(deps.calls[3].args[1], "create");
  });

  it("bumps existing issue with comment when title matches", () => {
    const deps = fakeDeps([
      () => JSON.stringify([{ number: 7, title: "CWS authentication broken" }]),
      () => "", // gh issue comment returns nothing meaningful
    ]);

    const result = openOrBump(
      "cws-auth-broken",
      undefined,
      "Re-detected at next pre-flight",
      deps
    );

    strictEqual(result.action, "bumped");
    strictEqual(result.issue, 7);
    deepStrictEqual(deps.calls[1].args.slice(0, 3), ["issue", "comment", "7"]);
  });

  it("scopes verification-timeout title per extension+version", () => {
    const deps = fakeDeps([
      () => JSON.stringify([]),
      () => "",
      () => JSON.stringify([]),
      () => "https://github.com/owner/repo/issues/200",
    ]);

    openOrBump(
      "cws-publish-verification-timeout",
      "@kaiord/garmin-bridge@7.1.1",
      "stuck",
      deps
    );

    const createArgs = deps.calls[3].args;
    const titleIdx = createArgs.indexOf("--title");
    strictEqual(
      createArgs[titleIdx + 1],
      "CWS publish stalled: @kaiord/garmin-bridge@7.1.1"
    );
  });

  it("simulates concurrent writers: second invocation bumps instead of duplicating", () => {
    // Writer A: list returns empty, then creates issue 50.
    const writerA = fakeDeps([
      () => JSON.stringify([]),
      () => "",
      () => JSON.stringify([]),
      () => "https://github.com/owner/repo/issues/50",
    ]);
    const a = openOrBump(
      "cws-auth-broken",
      undefined,
      "first detection",
      writerA
    );
    strictEqual(a.action, "created");

    // Writer B (slightly later): list returns issue 50; bumps it instead of creating.
    const writerB = fakeDeps([
      () =>
        JSON.stringify([{ number: 50, title: "CWS authentication broken" }]),
      () => "",
    ]);
    const b = openOrBump(
      "cws-auth-broken",
      undefined,
      "second detection",
      writerB
    );
    strictEqual(b.action, "bumped");
    strictEqual(b.issue, 50);
  });
});

describe("openOrBump — dedupe against a realistic gh (regression)", () => {
  const TITLE = "CWS publish stalled: @kaiord/train2go-bridge@10.0.0";
  const KIND = "cws-publish-verification-timeout";

  it("bumps instead of duplicating when the title contains ':' and '@'", () => {
    const store = ghStore({
      labels: [KIND],
      issues: [{ number: 960, title: TITLE, labels: [KIND] }],
    });
    const deps = ghFake(store);

    const result = openOrBump(
      KIND,
      "@kaiord/train2go-bridge@10.0.0",
      "still stalled",
      deps
    );

    strictEqual(result.action, "bumped");
    strictEqual(result.issue, 960);
    strictEqual(store.issues.length, 1);
    strictEqual(store.comments.length, 1);
  });

  it("does not accumulate duplicates across repeated invocations", () => {
    const store = ghStore({ labels: [KIND] });
    const runs = [];
    for (let i = 0; i < 4; i++) {
      runs.push(
        openOrBump(
          KIND,
          "@kaiord/train2go-bridge@10.0.0",
          "stalled",
          ghFake(store)
        ).action
      );
    }

    deepStrictEqual(runs, ["created", "bumped", "bumped", "bumped"]);
    strictEqual(store.issues.length, 1);
  });

  it("keeps distinct extensions/versions on distinct issues", () => {
    const store = ghStore({ labels: [KIND] });

    openOrBump(KIND, "@kaiord/train2go-bridge@10.0.0", "a", ghFake(store));
    openOrBump(KIND, "@kaiord/garmin-bridge@10.0.0", "b", ghFake(store));
    openOrBump(KIND, "@kaiord/train2go-bridge@10.0.0", "c", ghFake(store));

    strictEqual(store.issues.length, 2);
  });
});

describe("openOrBump — missing label must not swallow the alert", () => {
  it("creates the kind's label when the repo does not have it yet", () => {
    // `cws-publish-rejected` was verified ABSENT from the live repo on
    // 2026-07-29 while the other two notify labels existed.
    const store = ghStore({ labels: [] });
    const deps = ghFake(store);

    const result = openOrBump(
      "cws-publish-rejected",
      "@kaiord/whoop-bridge@1.2.3",
      "rejected by review",
      deps
    );

    strictEqual(result.action, "created");
    strictEqual(result.labeled, true);
    ok(store.labels.includes("cws-publish-rejected"));
    deepStrictEqual(store.issues[0].labels, ["cws-publish-rejected"]);
  });

  it("still files the issue unlabelled if the label cannot be created", () => {
    const store = ghStore({ labels: [] });
    const result = openOrBump(
      "cws-publish-rejected",
      "@kaiord/whoop-bridge@1.2.3",
      "rejected by review",
      labelDenied(store)
    );

    strictEqual(result.action, "created");
    strictEqual(result.labeled, false);
    strictEqual(store.issues.length, 1);
  });

  it("does not re-duplicate across runs while label writes stay denied", () => {
    // The degraded path cannot dedupe by label (there is no label), so without
    // a title-scan fallback the cycle list-by-label → empty → file unlabelled
    // repeats unbounded, silently, at exit 0.
    const store = ghStore({ labels: [] });
    const runs = [];
    for (let i = 0; i < 3; i++) {
      runs.push(
        openOrBump(
          "cws-publish-rejected",
          "@kaiord/whoop-bridge@1.2.3",
          "rejected by review",
          labelDenied(store)
        ).action
      );
    }

    deepStrictEqual(runs, ["created", "bumped", "bumped"]);
    strictEqual(store.issues.length, 1);
  });

  it("recovers onto the labelled path once label writes succeed again", () => {
    const store = ghStore({ labels: [] });
    openOrBump(
      "cws-publish-rejected",
      "@kaiord/x@1.0.0",
      "a",
      labelDenied(store)
    );

    const recovered = openOrBump(
      "cws-publish-rejected",
      "@kaiord/x@1.0.0",
      "b",
      ghFake(store)
    );

    strictEqual(recovered.action, "bumped");
    strictEqual(store.issues.length, 1);
  });
});
