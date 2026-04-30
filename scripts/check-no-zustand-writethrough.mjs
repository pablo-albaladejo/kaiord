#!/usr/bin/env node
/**
 * Mechanical guard: no Zustand store may write through to the Dexie
 * database directly. Persisted state belongs behind PersistencePort.
 *
 * Three rules, all import-based:
 *
 *   R-DexieImport       — Files under packages/workout-spa-editor/src/store/**
 *                         must NOT import (statically or dynamically) from a
 *                         path resolving to adapters/dexie/dexie-database.
 *                         The barrel `adapters/dexie/index.ts` is followed
 *                         through. Allowlist exempts a small set of
 *                         explicit-user-action writers.
 *
 *   R-PersistStateImport — Files under packages/workout-spa-editor/src/store/**
 *                         must NOT import an identifier named `persistState`
 *                         from any path. Same allowlist applies.
 *
 *   R-AppDexieImport    — Files under packages/workout-spa-editor/src/application/**
 *                         must NEVER import a path resolving to dexie-database.
 *                         Application code goes through PersistencePort; no
 *                         allowlist.
 *
 * Why import-based rather than action-body matching: lower false-positive
 * rate. A file that imports neither dexie-database nor persistState cannot
 * write through. New write-throughs would have to add an import; that is
 * the signal we catch.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_SRC = join(
  REPO_ROOT,
  "packages",
  "workout-spa-editor",
  "src"
);

// Allowlisted files (relative to repo root, posix-style) that are
// permitted to bypass R-DexieImport and R-PersistStateImport. Keep this
// list tiny; every entry must document why.
export const ALLOWLIST = new Set([
  // workout-store actions trigger an explicit user-driven save-to-library
  // write. The action runs through PersistencePort but the legacy entry
  // point still lives in the store module; tracked for future migration.
  "packages/workout-spa-editor/src/store/workout-store-actions.ts",
]);

const TS_EXTENSIONS = [".ts", ".tsx"];
const SKIP_EXTENSIONS = [".test.ts", ".test.tsx", ".stories.ts", ".stories.tsx"];

const STATIC_IMPORT_RE =
  /import(?:\s+type)?\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const PERSIST_STATE_NAMED_RE =
  /import(?:\s+type)?\s*\{([^}]*?)\}\s*from\s+["'][^"']+["']/g;

const findRoots = (dir) => {
  const out = [];
  if (!safeStat(dir)) return out;
  walk(dir, (file) => out.push(file));
  return out;
};

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, visit);
    } else if (entry.isFile() && shouldScan(entry.name)) {
      visit(p);
    }
  }
}

function shouldScan(name) {
  if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) return false;
  return TS_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function extractImports(source) {
  const specs = [];
  for (const m of source.matchAll(STATIC_IMPORT_RE)) specs.push(m[1]);
  for (const m of source.matchAll(DYNAMIC_IMPORT_RE)) specs.push(m[1]);
  return specs;
}

function importsPersistState(source) {
  for (const m of source.matchAll(PERSIST_STATE_NAMED_RE)) {
    const names = m[1]
      .split(",")
      .map((s) => s.trim().replace(/\s+as\s+\w+$/, ""));
    if (names.includes("persistState")) return true;
  }
  return false;
}

function resolveSpecifier(fromFile, spec) {
  if (spec.startsWith("@/")) {
    return resolveTsModule(join(SPA_SRC, spec.slice(2)));
  }
  if (spec.startsWith(".")) {
    return resolveTsModule(resolve(dirname(fromFile), spec));
  }
  return null; // external package, irrelevant for these rules
}

function resolveTsModule(absPath) {
  for (const ext of TS_EXTENSIONS) {
    const candidate = `${absPath}${ext}`;
    if (safeStat(candidate)?.isFile()) return candidate;
  }
  for (const ext of TS_EXTENSIONS) {
    const candidate = join(absPath, `index${ext}`);
    if (safeStat(candidate)?.isFile()) return candidate;
  }
  if (safeStat(absPath)?.isFile()) return absPath;
  return null;
}

const DEXIE_DB_LEAF = join("adapters", "dexie", "dexie-database");

function resolvesToDexieDatabase(absResolved) {
  if (!absResolved) return false;
  const noExt = absResolved.replace(/\.tsx?$/, "");
  return noExt.endsWith(DEXIE_DB_LEAF);
}

const barrelCache = new Map();

function isDexieBarrel(absResolved) {
  if (!absResolved) return false;
  if (barrelCache.has(absResolved)) return barrelCache.get(absResolved);
  const value = computeIsDexieBarrel(absResolved);
  barrelCache.set(absResolved, value);
  return value;
}

function computeIsDexieBarrel(absResolved) {
  // A barrel module re-exports `db` from dexie-database and lives under
  // adapters/dexie/index.ts. Detect by reading its imports/re-exports
  // and checking whether any of them resolves to dexie-database.
  if (!absResolved.endsWith(`${join("adapters", "dexie")}.ts`)) {
    if (
      !absResolved.endsWith(`${join("adapters", "dexie", "index.ts")}`) &&
      !absResolved.endsWith(`${join("adapters", "dexie", "index.tsx")}`)
    ) {
      return false;
    }
  }
  let source;
  try {
    source = readFileSync(absResolved, "utf8");
  } catch {
    return false;
  }
  const reExportFromRe =
    /export\s+(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/g;
  for (const m of [
    ...source.matchAll(STATIC_IMPORT_RE),
    ...source.matchAll(reExportFromRe),
  ]) {
    const target = resolveSpecifier(absResolved, m[1]);
    if (resolvesToDexieDatabase(target)) return true;
  }
  return false;
}

function dexieImportSpec(file, source) {
  const specs = extractImports(source);
  for (const spec of specs) {
    const resolved = resolveSpecifier(file, spec);
    if (!resolved) continue;
    if (resolvesToDexieDatabase(resolved)) return spec;
    if (isDexieBarrel(resolved)) return spec;
  }
  return null;
}

const violations = [];

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function isAllowlisted(file) {
  return ALLOWLIST.has(relForRule(file));
}

function checkStoreFile(file) {
  const source = readFileSync(file, "utf8");
  const allowlisted = isAllowlisted(file);

  const dexieSpec = dexieImportSpec(file, source);
  if (dexieSpec && !allowlisted) {
    violations.push({
      rule: "R-DexieImport",
      file: relForRule(file),
      detail: `imports dexie-database via "${dexieSpec}"`,
    });
  }

  if (importsPersistState(source) && !allowlisted) {
    violations.push({
      rule: "R-PersistStateImport",
      file: relForRule(file),
      detail: "imports a `persistState` identifier",
    });
  }
}

function checkApplicationFile(file) {
  const source = readFileSync(file, "utf8");
  const dexieSpec = dexieImportSpec(file, source);
  if (dexieSpec) {
    violations.push({
      rule: "R-AppDexieImport",
      file: relForRule(file),
      detail: `imports dexie-database via "${dexieSpec}"`,
    });
  }
}

export function runCheck({ storeRoot, applicationRoot } = {}) {
  violations.length = 0;
  barrelCache.clear();
  const sRoot = storeRoot ?? join(SPA_SRC, "store");
  const aRoot = applicationRoot ?? join(SPA_SRC, "application");
  for (const file of findRoots(sRoot)) checkStoreFile(file);
  for (const file of findRoots(aRoot)) checkApplicationFile(file);
  return [...violations];
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ No Zustand→Dexie write-through detected.");
    process.exit(0);
  }
  console.error("❌ Zustand→Dexie write-through guard violations:");
  for (const v of found) {
    console.error(`  [${v.rule}] ${v.file} — ${v.detail}`);
  }
  process.exit(1);
}
