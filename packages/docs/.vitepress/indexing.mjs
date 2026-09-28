// Which docs pages search engines should index, and the git dates behind
// their `lastmod`. One module feeds both `transformHead` (the robots meta)
// and `sitemap.transformItems` (which URLs are listed), so the two cannot
// disagree. Plain .mjs so `node --test` can import it without a TypeScript
// loader (the `head-config.mjs` pattern).

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DOCS_URL_PREFIX = /^https?:\/\/(www\.)?kaiord\.com\/docs\//;

// The API reference is 340+ TypeDoc symbol pages. Engines index a handful
// of them and skip the rest (GSC: 37 of 377), so only the entry points stay
// indexable: `api/` itself and each package's index (`api/<pkg>/README` from
// TypeDoc, `api/<pkg>/index` for placeholders). Symbol pages stay reachable,
// linked and in llms-full.txt; they just carry `noindex,follow`.
const API_ENTRY = /^api(\/[^/]+(\/(README|index))?)?$/;

// "api/core/functions/foo.md", "/api/core/functions/foo", "api/core/" and
// "api/core/functions/foo.html" all name the same page.
function normalizePath(path) {
  return path
    .replace(/^\/+/, "")
    .replace(/\.(md|html)$/, "")
    .replace(/(^|\/)index$/, "")
    .replace(/\/+$/, "");
}

/** @param {string} relativePath a docs page path relative to the docs root */
export function isNoindexPath(relativePath) {
  const path = normalizePath(relativePath);
  return (path === "api" || path.startsWith("api/")) && !API_ENTRY.test(path);
}

/** @param {string} url a sitemap item url (relative) or an absolute docs URL */
export function isNoindexUrl(url) {
  return isNoindexPath(url.replace(DOCS_URL_PREFIX, ""));
}

function runGit(args) {
  const out = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
  return out.status === 0 ? out.stdout.trim() : null;
}

/**
 * Whether this checkout has the history `lastmod` needs. In a depth-1 clone
 * `git log -1 -- <path>` answers HEAD's date for every path, so a shallow
 * clone reads as "no history" rather than as a wrong date.
 *
 * @param {{ git?: (args: string[]) => string | null }} [deps]
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function gitHistoryStatus({ git = runGit } = {}) {
  const shallow = git(["rev-parse", "--is-shallow-repository"]);
  if (shallow === null) return { ok: false, reason: "not a git checkout" };
  if (shallow === "true") return { ok: false, reason: "shallow clone" };
  return { ok: true };
}

/**
 * Throws when history is missing but required (REQUIRE_FULL_HISTORY=1, set
 * in the CI `build` job and in deploy); otherwise reports whether it exists.
 *
 * @param {{ git?: (args: string[]) => string | null, env?: Record<string, string | undefined> }} [deps]
 * @returns {boolean}
 */
export function hasFullHistory({ git = runGit, env = process.env } = {}) {
  const status = gitHistoryStatus({ git });
  if (status.ok) return true;
  if (env.REQUIRE_FULL_HISTORY === "1") {
    throw new Error(
      `REQUIRE_FULL_HISTORY=1 but the checkout has no usable git history (${status.reason}); ` +
        "check out with fetch-depth: 0"
    );
  }
  return false;
}

/**
 * ISO date of the last commit touching any of `paths` (relative to the repo
 * root), or null when history is missing (see `hasFullHistory`) or nothing
 * touched them.
 *
 * @param {string[]} paths
 * @param {{ git?: (args: string[]) => string | null, env?: Record<string, string | undefined> }} [deps]
 * @returns {string | null}
 */
export function gitLastmod(paths, { git = runGit, env = process.env } = {}) {
  if (!hasFullHistory({ git, env })) return null;
  const seconds = Number.parseInt(
    git(["log", "-1", "--format=%at", "--", ...paths]) ?? "",
    10
  );
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

// Tests and stories do not change what a page documents; a commit touching
// only them must not move its `lastmod`.
export const NON_CONTENT_PATHSPECS = [
  ":(exclude,glob)**/*.test.*",
  ":(exclude,glob)**/*.stories.*",
];

/**
 * The git pathspecs an API entry page is generated from: `api/<pkg>/…` comes
 * from `packages/<pkg>/src`, `api/` itself lists every package, and the
 * generator shapes them all. Tests and stories are excluded.
 *
 * @param {string} url a sitemap item url for an indexable API page
 * @param {string[]} packages the documented package names
 */
export function apiSourcePaths(url, packages) {
  const pkg = normalizePath(url.replace(DOCS_URL_PREFIX, "")).split("/")[1];
  return [
    ...(pkg ? [pkg] : packages).map((name) => `packages/${name}/src`),
    "packages/docs/scripts/generate-api-docs.mjs",
    ...NON_CONTENT_PATHSPECS,
  ];
}

// Pages published in both English and Spanish. Only these carry hreflang
// alternates: every other page exists in English alone, and an hreflang to a
// page that does not exist is ignored by engines at best.
export const HREFLANG_PAIRS = [
  "guide/zwift-to-garmin",
  "guide/ai-planning-byok",
  "guide/whoop-recovery-in-plan",
  "guide/kaiord-vs-trainingpeaks-intervals-garmin",
].map((path) => ({ en: `${path}.md`, es: `es/${path}.md` }));

/**
 * The EN/ES pair a page belongs to, or null when it has no translation.
 *
 * @param {string} relativePath a docs page path relative to the docs root
 * @returns {{ en: string, es: string } | null}
 */
export function hreflangPair(relativePath) {
  return (
    HREFLANG_PAIRS.find(
      (pair) => pair.en === relativePath || pair.es === relativePath
    ) ?? null
  );
}
