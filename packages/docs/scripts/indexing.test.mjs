import { strict as assert } from "node:assert";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  apiSourcePaths,
  gitHistoryStatus,
  gitLastmod,
  hasFullHistory,
  HREFLANG_PAIRS,
  hreflangPair,
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

// Skipped, with the reason, in any shallow clone (the CI jobs that run this
// suite check out with fetch-depth 0).
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

test("an API entry page is dated by its package sources and the generator", () => {
  const packages = ["core", "fit"];
  const extra = [
    "packages/docs/scripts/generate-api-docs.mjs",
    ":(exclude,glob)**/*.test.*",
    ":(exclude,glob)**/*.stories.*",
  ];

  assert.deepEqual(apiSourcePaths("api/core/README", packages), [
    "packages/core/src",
    ...extra,
  ]);
  assert.deepEqual(apiSourcePaths("api/cli/", packages), [
    "packages/cli/src",
    ...extra,
  ]);
  assert.deepEqual(apiSourcePaths("api/", packages), [
    "packages/core/src",
    "packages/fit/src",
    ...extra,
  ]);
});

test("gitLastmod passes the test/story exclusions through to git log", () => {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    return args[0] === "rev-parse" ? "false" : "1767225600";
  };

  gitLastmod(apiSourcePaths("api/core/README", ["core"]), { git, env: {} });

  const log = calls.find((args) => args[0] === "log");
  assert.deepEqual(log.slice(log.indexOf("--") + 1), [
    "packages/core/src",
    "packages/docs/scripts/generate-api-docs.mjs",
    ":(exclude,glob)**/*.test.*",
    ":(exclude,glob)**/*.stories.*",
  ]);
});

const DOCS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("should find both pages of every hreflang pair on disk", () => {
  // Arrange
  const paths = HREFLANG_PAIRS.flatMap((pair) => [pair.en, pair.es]);

  // Act
  const missing = paths.filter((path) => !existsSync(resolve(DOCS_ROOT, path)));

  // Assert
  assert.ok(HREFLANG_PAIRS.length >= 3, "the athlete guides are paired");
  assert.deepEqual(missing, []);
});

test("should resolve a pair from either language and none for other pages", () => {
  // Arrange
  const [first] = HREFLANG_PAIRS;

  // Act
  const fromEn = hreflangPair(first.en);
  const fromEs = hreflangPair(first.es);
  const other = hreflangPair("guide/quick-start.md");

  // Assert
  assert.equal(fromEn, first);
  assert.equal(fromEs, first);
  assert.equal(other, null);
});
