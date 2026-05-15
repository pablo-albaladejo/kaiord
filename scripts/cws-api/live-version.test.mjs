// Tests for scripts/cws-api/live-version.mjs using node:test.

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { CwsStateError } from "./errors.mjs";
import { resolveLiveVersion, UsageError } from "./live-version.mjs";

const EXT_ID = "abcdefghijklmnopabcdefghijklmnop";
const PKG = "@kaiord/garmin-bridge";

function makeGetItem(impl) {
  return async (sa, id, projection) => impl({ sa, id, projection });
}

test("throws UsageError when extensionId is missing", async () => {
  await assert.rejects(
    () =>
      resolveLiveVersion({
        extensionId: "",
        packageName: PKG,
        getItem: makeGetItem(() => ({})),
        gitTags: [],
      }),
    UsageError
  );
});

test("throws UsageError when packageName is missing", async () => {
  await assert.rejects(
    () =>
      resolveLiveVersion({
        extensionId: EXT_ID,
        packageName: "",
        getItem: makeGetItem(() => ({})),
        gitTags: [],
      }),
    UsageError
  );
});

test("throws UsageError when getItem is not a function", async () => {
  await assert.rejects(
    () =>
      resolveLiveVersion({
        extensionId: EXT_ID,
        packageName: PKG,
        getItem: null,
        gitTags: [],
      }),
    UsageError
  );
});

test("SYNCED: local matches tag, PUBLISHED matches tag", async () => {
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "0.2.0",
    getItem: makeGetItem(() => ({ crxVersion: "0.2.0" })),
    gitTags: [`${PKG}@0.1.0`, `${PKG}@0.2.0`],
  });
  assert.equal(result.status, "SYNCED");
  assert.equal(result.source, "git_tag");
  assert.equal(result.version, "0.2.0");
  assert.deepEqual(result.warnings, []);
});

test("SYNCED: local matches tag and PUBLISHED is unavailable (Scenario C)", async () => {
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "0.2.0",
    getItem: makeGetItem(() => {
      throw new CwsStateError("getItem(PUBLISHED) returned 400: blocked");
    }),
    gitTags: [`${PKG}@0.2.0`],
  });
  assert.equal(result.status, "SYNCED");
  assert.equal(result.source, "git_tag");
  assert.equal(result.version, "0.2.0");
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, "published_projection_400");
  assert.equal(result.warnings[0].severity, "warn");
});

test("DRAFT_AHEAD: local greater than tag and PUBLISHED", async () => {
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "0.3.0",
    getItem: makeGetItem(() => ({ crxVersion: "0.2.0" })),
    gitTags: [`${PKG}@0.2.0`],
  });
  assert.equal(result.status, "DRAFT_AHEAD");
  assert.equal(result.source, "git_tag");
  assert.equal(result.version, "0.2.0");
});

test("STUCK_DRAFT: forceStuck propagates regardless of version match", async () => {
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "0.2.0",
    forceStuck: true,
    getItem: makeGetItem(() => ({ crxVersion: "0.2.0" })),
    gitTags: [`${PKG}@0.2.0`],
  });
  assert.equal(result.status, "STUCK_DRAFT");
});

test("UNTRUSTED_STATE: tag and PUBLISHED disagree", async () => {
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "0.2.0",
    getItem: makeGetItem(() => ({ crxVersion: "0.5.0" })),
    gitTags: [`${PKG}@0.2.0`],
  });
  assert.equal(result.status, "UNTRUSTED_STATE");
  assert.equal(result.source, "git_tag");
  assert.ok(
    result.warnings.some(
      (w) => w.code === "state_mismatch" && w.severity === "error"
    )
  );
});

test("git_tag_missing: no matching tag, falls back to api_PUBLISHED", async () => {
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "0.5.0",
    getItem: makeGetItem(() => ({ crxVersion: "0.5.0" })),
    gitTags: ["@kaiord/other-pkg@1.0.0"],
  });
  assert.equal(result.source, "api_PUBLISHED");
  assert.equal(result.version, "0.5.0");
  assert.ok(result.warnings.some((w) => w.code === "git_tag_missing"));
  assert.equal(result.status, "SYNCED");
});

test("UNTRUSTED_STATE: both tag and PUBLISHED absent (never silently SYNCED)", async () => {
  // Driver #1 applied: "no info about live" must not collapse to SYNCED.
  // Surface as UNTRUSTED_STATE so the workflow opens a tracked issue and
  // requires human force-dispatch.
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: null,
    getItem: makeGetItem(() => {
      throw new CwsStateError("getItem(PUBLISHED) returned 400: blocked");
    }),
    gitTags: [],
  });
  assert.equal(result.source, "unknown");
  assert.equal(result.version, null);
  assert.equal(result.status, "UNTRUSTED_STATE");
  assert.ok(result.warnings.some((w) => w.code === "git_tag_missing"));
  assert.ok(result.warnings.some((w) => w.code === "published_projection_400"));
});

test("UNTRUSTED_STATE: empty-string crxVersion is treated as absent", async () => {
  // CWS returns crxVersion='' for items with no public publish yet (e.g.
  // trusted-tester-only). The resolver must not interpret '' as a valid
  // live version — otherwise it would route to SYNCED with version='',
  // reproducing the very class of silent no-op this PR was opened to fix.
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "7.2.1",
    getItem: makeGetItem(() => ({ crxVersion: "" })),
    gitTags: [],
  });
  assert.equal(result.source, "unknown");
  assert.equal(result.version, null);
  assert.equal(result.status, "UNTRUSTED_STATE");
  assert.ok(result.warnings.some((w) => w.code === "git_tag_missing"));
});

test("getItem is called with projection='PUBLISHED'", async () => {
  let captured = null;
  await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    getItem: makeGetItem(({ projection, id }) => {
      captured = { projection, id };
      return { crxVersion: "0.2.0" };
    }),
    gitTags: [`${PKG}@0.2.0`],
  });
  assert.equal(captured.projection, "PUBLISHED");
  assert.equal(captured.id, EXT_ID);
});

test("latestTagVersion picks the highest matching tag", async () => {
  // String sort suffices for fixed-width semver like 0.0.1 vs 0.0.2 vs 0.1.0;
  // the resolver does not parse semver — it compares whatever the caller
  // feeds it. This test documents the simple "max by string sort" rule.
  const result = await resolveLiveVersion({
    extensionId: EXT_ID,
    packageName: PKG,
    localVersion: "0.2.0",
    getItem: makeGetItem(() => ({ crxVersion: "0.2.0" })),
    gitTags: [
      `${PKG}@0.1.0`,
      `${PKG}@0.0.9`,
      `${PKG}@0.2.0`,
      "@kaiord/other@9.9.9",
    ],
  });
  assert.equal(result.version, "0.2.0");
});

test("non-CwsStateError from getItem propagates", async () => {
  await assert.rejects(
    () =>
      resolveLiveVersion({
        extensionId: EXT_ID,
        packageName: PKG,
        getItem: makeGetItem(() => {
          throw new Error("network down");
        }),
        gitTags: [`${PKG}@0.2.0`],
      }),
    /network down/
  );
});
