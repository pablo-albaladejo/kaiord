#!/usr/bin/env node
/**
 * Mechanical guard: enforce the no-dual-mount invariant for the
 * Library content component.
 *
 * Per spec/spa-routing scenario "No SPA surface mounts as both a
 * routed page and a header-mounted modal" — the Library content
 * component MAY be imported only from the routed-page surface and
 * from the in-flow picker dialog. Any other importer is a regression
 * (the deleted header modal sneaking back in).
 *
 * Detection: import statements whose specifier ends with one of the
 * SUSPECT paths (case-sensitive, posix-style) below. The check uses
 * the same lightweight regex/import scanner as
 * `check-no-zustand-writethrough.mjs` so it runs without requiring
 * `tsconfig.app.json` paths resolution at full fidelity.
 *
 *   - `organisms/WorkoutLibrary`              (barrel)
 *   - `organisms/WorkoutLibrary/WorkoutLibrary` (modal wrapper)
 *   - `organisms/WorkoutLibrary/components/LibraryDialogContent`
 *
 * If a future PR reintroduces any of those modules, only the files
 * in ALLOWLIST may import them. The allowlist is keyed by the source
 * file's path under `packages/workout-spa-editor/src/` (posix-style).
 *
 * Today the modal organism is deleted and no source file imports any
 * SUSPECT path; the guard is a forward-only invariant.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

// Allowlist (posix-style, relative to repo root). Files allowed to
// import the Library content component.
//
// PERMITTED FUTURE ENTRIES: per spec/spa-routing scenario "No SPA
// surface mounts as both a routed page and a header-mounted modal",
// the only files that may be added to this set are the routed-page
// surface (`packages/workout-spa-editor/src/components/pages/LibraryPage.tsx`)
// and the in-flow picker dialog
// (`packages/workout-spa-editor/src/components/molecules/TemplatePickerDialog/TemplatePickerDialog.tsx`).
// Adding anything else requires an OpenSpec amendment, NOT just a PR
// that edits this file.
//
// The set ships empty because today neither file imports the SUSPECT
// paths — the modal organism is deleted. R-AllowlistsEmpty therefore
// passes without a special-case OUT_OF_SCOPE entry.
export const ALLOWLIST = new Set();

// Paths whose import is restricted. The check is suffix-match: if an
// import specifier ends with one of these strings (after stripping a
// trailing `.ts`/`.tsx`/`.js`/`.jsx` extension if present), the
// importer must be in ALLOWLIST.
const SUSPECT_PATHS = [
  "organisms/WorkoutLibrary",
  "organisms/WorkoutLibrary/WorkoutLibrary",
  "organisms/WorkoutLibrary/components/LibraryDialogContent",
];

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

function stripExt(spec) {
  return spec.replace(/\.(?:tsx?|jsx?)$/, "");
}

function specifierMatchesSuspect(spec) {
  const noExt = stripExt(spec);
  return SUSPECT_PATHS.some(
    (p) => noExt === p || noExt.endsWith(`/${p}`)
  );
}

function extractImportSpecs(source) {
  const out = [];
  for (const m of source.matchAll(STATIC_IMPORT_RE)) out.push(m[1]);
  for (const m of source.matchAll(DYNAMIC_IMPORT_RE)) out.push(m[1]);
  for (const m of source.matchAll(REEXPORT_FROM_RE)) out.push(m[1]);
  return out;
}

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

export function runCheck({ srcRoot } = {}) {
  const root = srcRoot ?? SPA_SRC;
  const violations = [];
  walk(root, (file) => {
    const source = readFileSync(file, "utf8");
    const specs = extractImportSpecs(source);
    for (const spec of specs) {
      if (!specifierMatchesSuspect(spec)) continue;
      const rel = relForRule(file);
      if (ALLOWLIST.has(rel)) continue;
      violations.push({ file: rel, spec });
    }
  });
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const found = runCheck();
  if (found.length === 0) {
    console.log(
      "✅ No unauthorised imports of the WorkoutLibrary content component."
    );
    process.exit(0);
  }
  console.error(
    "❌ Library no-dual-mount guard violations (R-LibraryNoDualMount):"
  );
  for (const v of found) {
    console.error(`  ${v.file} — imports "${v.spec}"`);
  }
  console.error(
    "  Remediation: only LibraryPage.tsx and TemplatePickerDialog.tsx may import the Library content component."
  );
  process.exit(1);
}
