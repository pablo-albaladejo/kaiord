#!/usr/bin/env node
/**
 * Mechanical guard: hexagonal-architecture layer rules.
 *
 * Inspects every TS/TSX source file under packages/<X>/src/ (excluding
 * test/spec/stories/dist/node_modules) and rejects imports that violate
 * the rules in `openspec/specs/hexagonal-arch/spec.md`.
 *
 * Rules:
 *
 *   R-ArchLeftward
 *     - packages/core/src/domain/**     ↛ adapters/, application/, ports/
 *     - packages/core/src/ports/**      ↛ application/, adapters/
 *     - packages/core/src/application/** ↛ adapters/
 *
 *   R-ArchDomainExt
 *     - packages/core/src/domain/** and packages/core/src/protocol/**
 *       must NOT import any external library outside
 *       DOMAIN_EXTERNAL_ALLOWLIST (architecture.vocab.mjs). Test files
 *       MAY import vitest / @kaiord/core/test-utils (excluded from
 *       evaluation upstream).
 *
 *   R-ArchAppPure
 *     - packages/core/src/application/** must NOT import any external
 *       library. Allowed: relative ../domain, ../ports.
 *
 *   R-ArchPortPure
 *     - packages/core/src/ports/** files must contain only type
 *       declarations / re-exports / imports — no runtime code. The
 *       check is approximate (regex-based): it flags top-level
 *       `function`, `const`, `let`, `var`, or `class` declarations that
 *       are not preceded by `type ` and where the right-hand side is
 *       not a type expression. False positives are tolerated; tighten
 *       to AST if needed.
 *
 *   R-ArchAdapterCross
 *     - Format-adapter packages (read FORMAT_ADAPTERS from
 *       architecture.vocab.mjs) must not import each other. Only
 *       documented allowance: @kaiord/garmin-connect MAY import
 *       @kaiord/garmin (codified in scripts/architecture.vocab.mjs
 *       PACKAGE_DEPS table).
 *
 *   R-ArchCoreAdapterAllowlist
 *     - packages/core/src/adapters/ must contain only the subfolders
 *       in CORE_ADAPTER_ALLOWLIST (architecture.vocab.mjs).
 *
 *   R-ArchCoreSrcDirs
 *     - packages/core/src/ must contain only the top-level directories
 *       in CORE_SRC_ALLOWLIST (architecture.vocab.mjs). Undeclared
 *       directories escape every per-layer rule, so they are rejected.
 *
 *   R-ArchCoreAmbientTypes
 *     - Any *.d.ts under packages/core/src/ containing
 *       `declare module "@<vendor>/<sdk>"` is rejected (vendor SDK
 *       ambient types belong in their consuming adapter package, not
 *       in core).
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print human-readable report; exit non-zero on any
 *                violation outside the allowlist.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  CORE_ADAPTER_ALLOWLIST,
  CORE_SRC_ALLOWLIST,
  DOMAIN_EXTERNAL_ALLOWLIST,
  FORMAT_ADAPTERS,
} from "./architecture.vocab.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_ROOT = resolve(REPO_ROOT, "packages");

const TS_EXTENSIONS = [".ts", ".tsx"];
const SKIP_FILE_SUFFIXES = [
  ".test.ts",
  ".test.tsx",
  ".spec.ts",
  ".spec.tsx",
  ".stories.ts",
  ".stories.tsx",
];
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".turbo"]);

// Strip /* ... */ block comments and // line comments before regex matching
// imports — JSDoc references like `@see @kaiord/fit` must not trigger.
const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_RE = /(^|[^:])\/\/[^\n]*/g;

const STATIC_IMPORT_RE =
  /import(?:\s+type)?\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const EXPORT_FROM_RE =
  /export\s+(?:type\s+)?(?:\{[^}]*\}|\*)\s+from\s+["']([^"']+)["']/g;

const AMBIENT_MODULE_RE = /declare\s+module\s+["']([^"']+)["']/g;

// R-ArchPortPure: top-level runtime declarations to flag. Approximate.
// Matches lines starting with `export ` or bare `function|class|const|let|var`
// at zero indent. Excludes `export type`, `export interface`, `export {`.
const PORT_RUNTIME_RE =
  /^(?:export\s+)?(?:async\s+)?(?:function\s+\w|class\s+\w|let\s+\w|var\s+\w|const\s+\w+\s*=\s*(?!\(|<))/m;

// R-ArchCoreAmbientTypes: drained in PR2 of guidelines-compliance-harden
// (the garmin-fitsdk.d.ts ambient declaration was duplicated under
// packages/fit/src/types/ and the redundant copy under packages/core/src/types/
// was deleted). To re-seed this allowlist, propose an OpenSpec amendment
// per R-AllowlistsEmpty.
export const ALLOWLIST = new Set([]);

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function relPosix(file, root) {
  return relative(root, file).replaceAll("\\", "/");
}

function relForRule(file) {
  return relPosix(file, REPO_ROOT);
}

function isTsSourceFile(name) {
  if (SKIP_FILE_SUFFIXES.some((s) => name.endsWith(s))) return false;
  if (name.endsWith(".d.ts")) return false; // d.ts handled separately
  return TS_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function isDtsFile(name) {
  return name.endsWith(".d.ts");
}

function walk(dir, visit) {
  const stat = safeStat(dir);
  if (!stat || !stat.isDirectory()) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), visit);
    } else if (entry.isFile()) {
      visit(join(dir, entry.name));
    }
  }
}

function stripComments(source) {
  return source.replace(BLOCK_COMMENT_RE, "").replace(LINE_COMMENT_RE, "$1");
}

function extractImports(source) {
  const cleaned = stripComments(source);
  const out = [];
  for (const m of cleaned.matchAll(STATIC_IMPORT_RE)) out.push(m[1]);
  for (const m of cleaned.matchAll(DYNAMIC_IMPORT_RE)) out.push(m[1]);
  for (const m of cleaned.matchAll(EXPORT_FROM_RE)) out.push(m[1]);
  return out;
}

function isExternalSpec(spec) {
  // Relative imports start with `.` — internal to the package.
  if (spec.startsWith(".")) return false;
  // node: builtins are external.
  return true;
}

function isWorkspaceSpec(spec) {
  return spec.startsWith("@kaiord/");
}

function workspacePackageName(spec) {
  // "@kaiord/fit" → "fit"; "@kaiord/fit/foo" → "fit"
  if (!isWorkspaceSpec(spec)) return null;
  const rest = spec.slice("@kaiord/".length);
  return rest.split("/")[0];
}

function classifyCoreFile(file, packagesRoot) {
  // packages/core/src/<dir>/...
  const rel = relPosix(file, packagesRoot);
  const segs = rel.split("/");
  if (segs[0] !== "core" || segs[1] !== "src") return null;
  return segs[2] ?? null; // domain | ports | application | adapters | ...
}

// Determines whether a relative import escapes a layer.
// `from` is the layer of the importing file (domain | ports | application | adapters);
// `spec` is the literal import string. Returns the target layer string if
// it crosses the boundary, otherwise null.
function relativeEscapesTo(spec, fromLayer) {
  if (!spec.startsWith(".")) return null;
  // Normalize via path segments — drop `.`/`..`, count `..` jumps
  const parts = spec.split("/");
  let upJumps = 0;
  for (const p of parts) {
    if (p === "..") upJumps++;
    else if (p === "." || p === "") continue;
    else break;
  }
  // If no upward jumps, can't escape the current layer dir (since the
  // walker classifies by directory, sibling files within domain/ are OK).
  if (upJumps === 0) return null;
  // Each `..` ascends one folder. To leave the layer (e.g., from
  // domain/sub/X to ports/Y), the path must `../../ports/Y` or similar.
  // We look at the first non-`.`/non-`..` segment after the upward jumps.
  let i = 0;
  while (
    i < parts.length &&
    (parts[i] === "." || parts[i] === ".." || parts[i] === "")
  )
    i++;
  const targetDir = parts[i];
  // Layers that signal an architectural escape:
  if (
    targetDir === "adapters" ||
    targetDir === "application" ||
    targetDir === "ports" ||
    targetDir === "protocol"
  ) {
    return targetDir;
  }
  return null;
}

// DOMAIN_EXTERNAL_ALLOWLIST entries match both the bare specifier and
// subpath imports (e.g. "@noble/hashes" allows "@noble/hashes/sha2").
function isAllowedDomainExternal(spec) {
  return DOMAIN_EXTERNAL_ALLOWLIST.some(
    (lib) => spec === lib || spec.startsWith(`${lib}/`)
  );
}

function checkCoreSourceFile(file, source, packagesRoot) {
  const violations = [];
  const layer = classifyCoreFile(file, packagesRoot);
  if (!layer) return violations;
  const imports = extractImports(source);
  const rel = relPosix(file, dirname(packagesRoot));

  for (const spec of imports) {
    // Layer-rule checks for the core layers. `protocol/` (cross-package
    // protocol contracts) is governed exactly like `domain/`: no layer
    // escapes other than domain/, externals limited to the allowlist.
    if (layer === "domain" || layer === "protocol") {
      const escape = relativeEscapesTo(spec, layer);
      if (escape && escape !== layer) {
        violations.push({
          rule: "R-ArchLeftward",
          file: rel,
          detail: `${layer}/ may not import ${escape}/ (specifier: ${spec})`,
        });
      } else if (
        isExternalSpec(spec) &&
        !isAllowedDomainExternal(spec) &&
        !spec.startsWith("node:")
      ) {
        // node: builtins also forbidden in domain (no I/O).
        violations.push({
          rule: "R-ArchDomainExt",
          file: rel,
          detail: `${layer}/ may not import external library "${spec}" (only [${DOMAIN_EXTERNAL_ALLOWLIST.join(", ")}] allowed)`,
        });
      } else if (spec.startsWith("node:")) {
        violations.push({
          rule: "R-ArchDomainExt",
          file: rel,
          detail: `${layer}/ may not import node: builtin "${spec}"`,
        });
      }
    } else if (layer === "ports") {
      const escape = relativeEscapesTo(spec, "ports");
      if (
        escape &&
        (escape === "application" ||
          escape === "adapters" ||
          escape === "protocol")
      ) {
        violations.push({
          rule: "R-ArchLeftward",
          file: rel,
          detail: `ports/ may not import ${escape}/ (specifier: ${spec})`,
        });
      }
    } else if (layer === "application") {
      const escape = relativeEscapesTo(spec, "application");
      if (escape === "adapters" || escape === "protocol") {
        violations.push({
          rule: "R-ArchLeftward",
          file: rel,
          detail: `application/ may not import ${escape}/ (specifier: ${spec})`,
        });
      } else if (
        isExternalSpec(spec) &&
        !spec.startsWith("node:") &&
        // Allow import from sibling layers via relative paths only.
        // Any external lib (including zod) is rejected in application —
        // application orchestrates pure use cases.
        !isWorkspaceSpec(spec)
      ) {
        violations.push({
          rule: "R-ArchAppPure",
          file: rel,
          detail: `application/ may not import external library "${spec}"`,
        });
      } else if (spec.startsWith("node:")) {
        violations.push({
          rule: "R-ArchAppPure",
          file: rel,
          detail: `application/ may not import node: builtin "${spec}"`,
        });
      }
    }
  }

  // R-ArchPortPure: ports/ files must contain only type declarations.
  if (layer === "ports") {
    if (PORT_RUNTIME_RE.test(stripComments(source))) {
      violations.push({
        rule: "R-ArchPortPure",
        file: rel,
        detail:
          "ports/ files must contain only type aliases, interfaces, or re-exports — no runtime code (function/class/const/let/var)",
      });
    }
  }

  return violations;
}

function checkAdapterCrossImports(file, source, packagesRoot) {
  // Format adapters: packages/<fit|tcx|zwo|garmin>/src/...
  const rel = relPosix(file, packagesRoot);
  const segs = rel.split("/");
  if (segs.length < 2 || segs[1] !== "src") return [];
  const ownPackage = segs[0];
  if (!FORMAT_ADAPTERS.includes(ownPackage)) return [];

  const violations = [];
  const imports = extractImports(source);
  const fileRel = relPosix(file, dirname(packagesRoot));
  for (const spec of imports) {
    const targetPkg = workspacePackageName(spec);
    if (!targetPkg) continue;
    if (targetPkg === ownPackage) continue;
    if (FORMAT_ADAPTERS.includes(targetPkg)) {
      violations.push({
        rule: "R-ArchAdapterCross",
        file: fileRel,
        detail: `format adapter "${ownPackage}" may not import sibling format adapter "@kaiord/${targetPkg}"`,
      });
    }
  }
  return violations;
}

function checkCoreAdapterAllowlist(packagesRoot) {
  const adaptersRoot = join(packagesRoot, "core", "src", "adapters");
  const stat = safeStat(adaptersRoot);
  if (!stat || !stat.isDirectory()) return [];
  const seen = new Set();
  for (const entry of readdirSync(adaptersRoot, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) seen.add(entry.name);
  }
  const allowed = new Set(CORE_ADAPTER_ALLOWLIST);
  const violations = [];
  for (const name of seen) {
    if (allowed.has(name)) continue;
    violations.push({
      rule: "R-ArchCoreAdapterAllowlist",
      file: `packages/core/src/adapters/${name}/`,
      detail: `core/adapters/${name}/ is not on the allowlist [${CORE_ADAPTER_ALLOWLIST.join(", ")}]. Create packages/${name}/ instead.`,
    });
  }
  return violations;
}

function checkCoreSrcDirs(packagesRoot) {
  const srcRoot = join(packagesRoot, "core", "src");
  const stat = safeStat(srcRoot);
  if (!stat || !stat.isDirectory()) return [];
  const allowed = new Set(CORE_SRC_ALLOWLIST);
  const violations = [];
  for (const entry of readdirSync(srcRoot, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (!entry.isDirectory()) continue;
    if (allowed.has(entry.name)) continue;
    violations.push({
      rule: "R-ArchCoreSrcDirs",
      file: `packages/core/src/${entry.name}/`,
      detail: `core/src/${entry.name}/ is not a declared layer [${CORE_SRC_ALLOWLIST.join(", ")}]. Undeclared directories escape every per-layer rule. Move the code into a governed layer, or declare the new layer in scripts/architecture.vocab.mjs + openspec/specs/hexagonal-arch/spec.md.`,
    });
  }
  return violations;
}

function checkCoreAmbientTypes(file, source, packagesRoot) {
  // Only flag *.d.ts under packages/core/src/.
  const rel = relPosix(file, packagesRoot);
  if (!rel.startsWith("core/src/")) return [];
  const violations = [];
  const fileRel = relPosix(file, dirname(packagesRoot));
  for (const m of source.matchAll(AMBIENT_MODULE_RE)) {
    const moduleName = m[1];
    // External vendor SDK pattern: starts with @ and contains /.
    // Internal aliases (e.g., declare module "*.svg") don't match.
    if (!moduleName.startsWith("@")) continue;
    if (!moduleName.includes("/")) continue;
    violations.push({
      rule: "R-ArchCoreAmbientTypes",
      file: fileRel,
      detail: `vendor SDK ambient declaration "declare module \\"${moduleName}\\"" must live in the consumer adapter package, not in core. Move to packages/<consumer>/src/types/.`,
    });
  }
  return violations;
}

export function runCheck({ packagesRoot } = {}) {
  const root = packagesRoot ?? PACKAGES_ROOT;
  const violations = [];

  walk(root, (file) => {
    const name = file.split("/").pop();
    if (isTsSourceFile(name)) {
      const source = readFileSync(file, "utf8");
      violations.push(...checkCoreSourceFile(file, source, root));
      violations.push(...checkAdapterCrossImports(file, source, root));
    } else if (isDtsFile(name)) {
      const source = readFileSync(file, "utf8");
      violations.push(...checkCoreAmbientTypes(file, source, root));
    }
  });

  // Directory-listing rules run once per check.
  violations.push(...checkCoreAdapterAllowlist(root));
  violations.push(...checkCoreSrcDirs(root));

  // Apply allowlist (only for the real packages root).
  if (root !== PACKAGES_ROOT) return violations;
  return violations.filter((v) => !ALLOWLIST.has(v.file));
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const dryRun = process.argv.includes("--dry-run");
  const violations = runCheck();
  if (dryRun) {
    process.stdout.write(JSON.stringify(violations, null, 2) + "\n");
    process.exit(0);
  }
  if (violations.length === 0) {
    console.log("✅ No architecture violations detected.");
    process.exit(0);
  }
  console.error("❌ Architecture guard violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
