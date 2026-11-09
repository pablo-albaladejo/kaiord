#!/usr/bin/env node
/**
 * Mechanical guard: enforce the no-dual-mount invariant for the
 * Library content component.
 *
 * Per spec/spa-routing scenario "No SPA surface mounts as both a
 * routed page and a header-mounted modal" — the Library content
 * component MAY be imported only from the routed-page surface. Any
 * other importer is a regression (a second mount sneaking back in).
 *
 * Detection: every static import, dynamic `import()` and re-export in
 * the SPA source is resolved to a path under `src/` (relative
 * specifiers against the importing file, `@/` against `src/`). A
 * specifier that resolves to one of SUSPECT_PATHS (with or without a
 * `.ts`/`.tsx` extension or an `/index` barrel) is a violation unless
 * the importer is CANONICAL_MOUNT or in ALLOWLIST. Resolving, rather than
 * matching a specifier suffix, catches `./Library/LibraryContent`
 * from the page as well as `../pages/Library/LibraryContent` from
 * anywhere else.
 *
 * Inert-by-construction protection: if a SUSPECT_PATH or
 * CANONICAL_MOUNT no longer exists on disk the guard fails. A move or
 * rename must update this file, instead of silently turning the guard
 * into a check on a path nobody imports.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

// The page surface spa-routing:38 allows. The spec also allows an in-flow
// picker dialog; none exists today, so this page is the only mount.
export const CANONICAL_MOUNT =
  "packages/workout-spa-editor/src/components/pages/LibraryPage.tsx";
const MOUNT_IN_SRC = relative(
  SPA_SRC,
  join(REPO_ROOT, CANONICAL_MOUNT)
).replaceAll("\\", "/");

// Exceptions beyond CANONICAL_MOUNT, keyed by path relative to the repo root.
// Adding an entry requires an OpenSpec amendment, NOT just a PR that
// edits this file.
export const ALLOWLIST = new Set();

// Modules whose import is restricted, relative to `src/`, without
// extension.
export const SUSPECT_PATHS = ["components/pages/Library/LibraryContent"];

const TS_EXTENSIONS = [".ts", ".tsx"];
const SKIP_EXTENSIONS = [
  ".test.ts",
  ".test.tsx",
  ".stories.ts",
  ".stories.tsx",
];

const STATIC_IMPORT_RE =
  /import(?:\s+type)?\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const REEXPORT_FROM_RE = /export\s+(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/g;

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function shouldScan(name) {
  if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) return false;
  return TS_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function walk(dir, visit) {
  if (!safeStat(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, visit);
    } else if (entry.isFile() && shouldScan(entry.name)) {
      visit(p);
    }
  }
}

function toPosix(p) {
  return p.replaceAll("\\", "/");
}

function stripModuleSuffix(p) {
  return p.replace(/\.(?:tsx?|jsx?)$/, "").replace(/\/index$/, "");
}

// Resolve a specifier to a posix path relative to `root`, or null for
// bare package specifiers.
function resolveSpec(root, file, spec) {
  let abs;
  if (spec.startsWith(".")) abs = resolve(dirname(file), spec);
  else if (spec.startsWith("@/")) abs = join(root, spec.slice(2));
  else return null;
  return stripModuleSuffix(toPosix(relative(root, abs)));
}

function extractImportSpecs(source) {
  const out = [];
  for (const m of source.matchAll(STATIC_IMPORT_RE)) out.push(m[1]);
  for (const m of source.matchAll(DYNAMIC_IMPORT_RE)) out.push(m[1]);
  for (const m of source.matchAll(REEXPORT_FROM_RE)) out.push(m[1]);
  return out;
}

function suspectExists(root, suspect) {
  return TS_EXTENSIONS.some((ext) => safeStat(join(root, suspect + ext)));
}

/**
 * Returns `{ missing, violations }`: watched paths (SUSPECT_PATHS and
 * CANONICAL_MOUNT, relative to `src/`) absent from disk, and
 * unauthorised importers of the suspects that exist.
 */
export function runCheck({ srcRoot, suspectPaths = SUSPECT_PATHS } = {}) {
  const root = srcRoot ?? SPA_SRC;
  const missing = suspectPaths.filter((p) => !suspectExists(root, p));
  if (!safeStat(join(root, MOUNT_IN_SRC))) missing.push(MOUNT_IN_SRC);
  const suspects = new Set(suspectPaths);
  const violations = [];
  walk(root, (file) => {
    const fromSrc = toPosix(relative(root, file));
    const fromRepo = toPosix(relative(REPO_ROOT, file));
    if (fromSrc === MOUNT_IN_SRC || ALLOWLIST.has(fromRepo)) return;
    const source = readFileSync(file, "utf8");
    for (const spec of extractImportSpecs(source)) {
      if (suspects.has(resolveSpec(root, file, spec))) {
        violations.push({ file: fromRepo, spec });
      }
    }
  });
  return { missing, violations };
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const { missing, violations } = runCheck();
  if (missing.length === 0 && violations.length === 0) {
    console.log(
      "✅ The Library content component is mounted only by LibraryPage."
    );
    process.exit(0);
  }
  console.error("❌ Library no-dual-mount guard (R-LibraryNoDualMount):");
  for (const p of missing) {
    console.error(
      `  Watched path "${p}" does not exist under the SPA src. It moved or was renamed: update SUSPECT_PATHS / CANONICAL_MOUNT so the guard is not inert.`
    );
  }
  for (const v of violations) {
    console.error(`  ${v.file} — imports "${v.spec}"`);
  }
  if (violations.length > 0) {
    console.error(
      `  Remediation: only ${CANONICAL_MOUNT} may import the Library content component.`
    );
  }
  process.exit(1);
}
