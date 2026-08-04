#!/usr/bin/env node
/**
 * Mechanical guard: magenta is rationed to marketing.
 *
 * The brand decision is that inside the login the brand is ink — a surface
 * showing athlete data gets no magenta. The `--mkt-*` roles are declared in
 * the same two role blocks as every other token, because a theme-dependent
 * value has to live inside the blocks that exist (that is the same invariant
 * that keeps `.dark` flat). So the token file itself cannot hold the
 * boundary, and neither can a separate stylesheet: any consumer that imports
 * `styles/brand-tokens.css` can reference them. This guard can.
 *
 * Rule:
 *   R-MktBoundary — a `--mkt-` reference outside the landing page, the Open
 *                   Graph card renderer, or the token file that declares them.
 *
 * The one live accent inside the product is `--core-live`, which takes a
 * training-zone hue, not a marketing one — it is not covered here because it
 * is not an `--mkt-` token.
 *
 * Exceptions live in ALLOWLIST (posix paths relative to the repo root); it
 * ships empty and must shrink only (R-AllowlistsEmpty).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const ALLOWLIST = new Set();

// Where the marketing palette is legitimate: the surface that renders it and
// the file that declares it.
export const MARKETING_PATHS = [
  "packages/landing/",
  "scripts/brand-og-card.mjs",
  "styles/brand-tokens.css",
];

// This guard and the scripts/ suites that pin the tokens' resolved values name
// them by necessity — naming the thing you forbid is how a guard is tested.
const SELF = "scripts/check-mkt-boundary.mjs";
const describesTheRule = (rel) =>
  rel === SELF || (rel.startsWith("scripts/") && rel.endsWith(".test.mjs"));

const ROOTS = ["packages", "scripts", "styles", "assets", "docs"];
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "cache",
  "coverage",
  "icons",
]);
// Dot-directories are skipped as build/tooling noise, except the ones that
// hold real source. `.vitepress/theme/custom.css` is the docs site's entire
// stylesheet — precisely a product surface that could reach for magenta.
const SCANNED_DOT_DIRS = new Set([".vitepress"]);
const EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
  ".vue",
  ".svg",
];

const MKT_RE = /--mkt-[\w-]*/g;

// A directory entry (trailing slash) covers everything beneath it; a file
// entry must match exactly, so a `brand-og-card.mjs.ts` cannot inherit the
// exemption by sharing a prefix with the approved file.
const isMarketing = (rel) =>
  MARKETING_PATHS.some((p) => (p.endsWith("/") ? rel.startsWith(p) : rel === p));

function walk(dir, visit) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const hidden = entry.name.startsWith(".") && !SCANNED_DOT_DIRS.has(entry.name);
    if (hidden || SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) visit(full);
  }
}

export function runCheck({ srcRoot } = {}) {
  const violations = [];
  const roots = srcRoot ? [srcRoot] : ROOTS.map((r) => join(REPO_ROOT, r));
  const base = srcRoot ? srcRoot : REPO_ROOT;

  for (const root of roots) {
    if (!srcRoot && !safeIsDir(root)) continue;
    walk(root, (file) => {
      const rel = relative(base, file).replaceAll("\\", "/");
      if (isMarketing(rel) || describesTheRule(rel) || ALLOWLIST.has(rel))
        return;
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(MKT_RE)) {
        violations.push({
          rule: "R-MktBoundary",
          file: rel,
          line: source.slice(0, match.index).split("\n").length,
          detail: match[0],
        });
      }
    });
  }
  return violations;
}

function safeIsDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const found = runCheck();
  if (found.length === 0) {
    console.log(
      "✅ Marketing boundary: no --mkt- reference outside the landing and the OG card."
    );
    process.exit(0);
  }
  console.error("❌ Marketing boundary violations:");
  for (const v of found) {
    console.error(`  [${v.rule}] ${v.file}:${v.line} — ${v.detail}`);
  }
  console.error(
    "  Remediation: inside the product the brand is ink. Use --control / --control-ink for an interactive fill, --brand for the mark, or --core-live for the header core."
  );
  process.exit(1);
}
