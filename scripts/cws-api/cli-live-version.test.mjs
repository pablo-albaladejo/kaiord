// Tests for scripts/cws-api/cli-live-version.mjs using node:test.
//
// The bug under regression: an earlier revision passed the bare workspace
// name (e.g. `train2go-bridge`) as packageName to the resolver, so the
// resolver's regex `^train2go-bridge@(.+)$` failed to match tags shaped
// like `@kaiord/train2go-bridge@0.1.1`. gitTagVersion came back null,
// PUBLISHED came back empty, and the resolver routed to UNTRUSTED_STATE
// despite having the data right there.
//
// buildResolveArgs is the pure args builder — the test pins the
// canonical `@kaiord/<name>` shape independent of any child_process or
// network I/O.

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildResolveArgs } from "./cli-live-version.mjs";

test("prepends @kaiord/ scope to bare workspace package name", () => {
  const args = buildResolveArgs(
    "abcdefghijklmnopabcdefghijklmnop",
    { package: "train2go-bridge", local: "7.2.1" },
    () => ({}),
    ["@kaiord/train2go-bridge@0.1.1"]
  );
  assert.equal(args.packageName, "@kaiord/train2go-bridge");
});

test("passes localVersion through from --local flag", () => {
  const args = buildResolveArgs(
    "abcdefghijklmnopabcdefghijklmnop",
    { package: "garmin-bridge", local: "4.5.0" },
    () => ({}),
    []
  );
  assert.equal(args.localVersion, "4.5.0");
});

test("localVersion defaults to null when --local omitted", () => {
  const args = buildResolveArgs(
    "abcdefghijklmnopabcdefghijklmnop",
    { package: "garmin-bridge" },
    () => ({}),
    []
  );
  assert.equal(args.localVersion, null);
});

test("forwards the extension id and gitTags unchanged", () => {
  const tags = ["@kaiord/garmin-bridge@0.2.0", "@kaiord/garmin-bridge@0.1.0"];
  const args = buildResolveArgs(
    "extid12345678901234567890123456",
    { package: "garmin-bridge", local: "0.2.0" },
    () => ({}),
    tags
  );
  assert.equal(args.extensionId, "extid12345678901234567890123456");
  assert.deepEqual(args.gitTags, tags);
});

test("getItem function is passed through (not unwrapped)", () => {
  const fn = async () => ({ crxVersion: "0.0.1" });
  const args = buildResolveArgs(
    "abcdefghijklmnopabcdefghijklmnop",
    { package: "train2go-bridge", local: "0.0.1" },
    fn,
    []
  );
  assert.equal(args.getItem, fn);
});
