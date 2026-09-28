import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  apiSourcePaths,
  gitHistoryStatus,
  gitLastmod,
  hasFullHistory,
  isNoindexPath,
  isNoindexUrl,
} from "../.vitepress/indexing.mjs";

test("API symbol pages are noindex, whatever form their path takes", () => {
  for (const path of [
    "api/core/functions/fromBinary.md",
    "/api/core/functions/fromBinary",
    "api/core/type-aliases/KRD.html",
    "api/garmin-connect/variables/x.md",
    "api/core/functions/index.md",
  ]) {
    assert.equal(isNoindexPath(path), true, path);
  }
});

test("the API root, per-package indexes and every other page stay indexable", () => {
  for (const path of [
    "api/index.md",
    "api/",
    "api/core/README.md",
    "api/core/README",
    "api/cli/index.md",
    "api/cli/",
    "index.md",
    "guide/quick-start.md",
    "convert/index.md",
    "apis/foo.md",
  ]) {
    assert.equal(isNoindexPath(path), false, path);
  }
});

test("isNoindexUrl accepts sitemap-relative and absolute docs URLs", () => {
  assert.equal(isNoindexUrl("api/core/functions/fromBinary"), true);
  assert.equal(
    isNoindexUrl("https://kaiord.com/docs/api/core/functions/fromBinary"),
    true
  );
  assert.equal(isNoindexUrl("https://kaiord.com/docs/api/core/README"), false);
  assert.equal(isNoindexUrl(""), false);
});

// A fake `git`: answers `rev-parse --is-shallow-repository` with `shallow`
// and `log` with `log`; null stands for "git failed".
const fakeGit =
  ({ shallow, log = "1767225600" }) =>
  (args) =>
    args[0] === "rev-parse" ? shallow : log;

test("full history dates a path from its last commit", () => {
  const git = fakeGit({ shallow: "false" });

  assert.equal(
    gitLastmod(["packages/core/src"], { git, env: {} }),
    "2026-01-01T00:00:00.000Z"
  );
});

test("a shallow clone omits lastmod instead of dating everything HEAD", () => {
  const git = fakeGit({ shallow: "true" });

  assert.deepEqual(gitHistoryStatus({ git }), {
    ok: false,
    reason: "shallow clone",
  });
  assert.equal(hasFullHistory({ git, env: {} }), false);
  assert.equal(gitLastmod(["packages/core/src"], { git, env: {} }), null);
});

test("a shallow clone throws when REQUIRE_FULL_HISTORY=1", () => {
  const git = fakeGit({ shallow: "true" });
  const env = { REQUIRE_FULL_HISTORY: "1" };

  assert.throws(() => hasFullHistory({ git, env }), /fetch-depth: 0/);
  assert.throws(
    () => gitLastmod(["packages/core/src"], { git, env }),
    /shallow clone/
  );
});

test("no git checkout reads as no history, and throws when required", () => {
  const git = fakeGit({ shallow: null });

  assert.equal(hasFullHistory({ git, env: {} }), false);
  assert.throws(
    () => hasFullHistory({ git, env: { REQUIRE_FULL_HISTORY: "1" } }),
    /not a git checkout/
  );
});

test("a path no commit touched has no lastmod", () => {
  const git = fakeGit({ shallow: "false", log: "" });

  assert.equal(gitLastmod(["nowhere"], { git, env: {} }), null);
});

// The CI `lint` job checks out at depth 1; there the skip names the reason.
const history = gitHistoryStatus();
test(
  "this checkout dates a real path",
  { skip: !history.ok && `no git history here (${history.reason})` },
  () => {
    assert.match(
      gitLastmod(["packages/docs/.vitepress/config.ts"]),
      /^\d{4}-\d{2}-\d{2}T/
    );
  }
);

test("an API entry page is dated by its package sources", () => {
  const packages = ["core", "fit"];

  assert.deepEqual(apiSourcePaths("api/core/README", packages), [
    "packages/core/src",
  ]);
  assert.deepEqual(apiSourcePaths("api/cli/", packages), ["packages/cli/src"]);
  assert.deepEqual(apiSourcePaths("api/", packages), [
    "packages/core/src",
    "packages/fit/src",
  ]);
});
