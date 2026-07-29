#!/usr/bin/env node
/**
 * Mechanical guard (R-DiscoveryClockReset): a test that can reach
 * `useDiscoverySettled` must place the discovery clock.
 *
 * `hooks/discovery-clock.ts` stamps `loadedAt` at MODULE LOAD and
 * `useDiscoverySettled` compares `Date.now()` against it. That makes the gate
 * a measurement against an ABSOLUTE origin fixed when the suite booted, so a
 * test that renders a gated surface without calling `resetDiscoveryClock`
 * passes or fails on how long the file took to get there. That is the shape
 * that shipped green twice under `pnpm test` and red under `test:coverage`.
 *
 * The distinction worth keeping: tests that depend on CORRELATED timers (a
 * debounce and the test's own `sleep` share an event loop, so load delays both
 * equally) are robust and are not this guard's business. Only measurements
 * against a module-load origin are.
 *
 * ROOT IS THE READER, NOT THE CLOCK. `use-bridge-discovery-bootstrap.ts`
 * imports `markDiscoveryStarted` — a WRITER — and `App.tsx` imports it through
 * `use-store-hydration.ts`. Rooting at `discovery-clock.ts` therefore drags in
 * App.test, App.analytics.test, routes.test and use-store-hydration.test, none
 * of which ever measure the gate; they would be forced to add a reset that
 * protects nothing, which is how a guard earns its way around. Rooting at
 * `use-discovery-settled.ts` selects exactly the suites that can observe it.
 *
 * KNOWN LIMIT: only STATIC import edges are followed. A suite that reaches a
 * gated surface solely through `React.lazy(() => import(...))` is not flagged.
 * Following dynamic edges today would flag four route-level suites whose risk
 * is unproven, so the narrower rule ships and this comment is the record that
 * the hole is deliberate rather than overlooked.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

/** The reader whose result depends on the module-load origin. */
const READER = "hooks/connections/use-discovery-settled";

/** The seam a reaching test must call. */
const RESET_FN = "resetDiscoveryClock";

const STATIC_IMPORT_RE =
  /(?:^|[\s;])(?:import|export)\s(?:type\s)?[\s\S]*?from\s*["']([^"']+)["']/gm;

const IS_TEST = /\.test\.tsx?$/;
const IS_SOURCE = /\.tsx?$/;

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  if (!safeStat(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && IS_SOURCE.test(entry.name)) out.push(p);
  }
  return out;
}

/** Relative specifiers only: a bare package name cannot reach SPA source. */
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const c of candidates) {
    const s = safeStat(c);
    if (s?.isFile()) return c;
  }
  return null;
}

function importsOf(file, source) {
  const out = [];
  for (const m of source.matchAll(STATIC_IMPORT_RE)) {
    const r = resolveSpec(file, m[1]);
    if (r) out.push(r);
  }
  return out;
}

/** A suite that replaces the reader outright cannot observe the clock. */
function mocksReader(source) {
  return new RegExp(
    `vi\\.mock\\(\\s*["'][^"']*${READER.split("/").pop()}["']`
  ).test(source);
}

export function runCheck({ srcRoot } = {}) {
  const root = srcRoot ?? SPA_SRC;
  const files = walk(root);
  const sources = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
  const graph = new Map(
    files.map((f) => [f, importsOf(f, sources.get(f) ?? "")])
  );

  // Exact, and never a test file: `use-discovery-settled.test.ts` sorts before
  // `use-discovery-settled.ts`, so a prefix match would elect the SUITE as the
  // reader and then find nothing reaching it — the guard would report a clean
  // tree while covering nothing.
  const readerFile = files.find((f) => {
    if (IS_TEST.test(f)) return false;
    const rel = relative(root, f).replaceAll("\\", "/");
    return rel === `${READER}.ts` || rel === `${READER}.tsx`;
  });
  if (readerFile === undefined) return [];

  // Reverse reachability: every production module that can reach the reader.
  const reaching = new Set([readerFile]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [file, deps] of graph) {
      if (reaching.has(file) || IS_TEST.test(file)) continue;
      if (deps.some((d) => reaching.has(d))) {
        reaching.add(file);
        grew = true;
      }
    }
  }

  const violations = [];
  for (const file of files) {
    if (!IS_TEST.test(file)) continue;
    const source = sources.get(file) ?? "";
    if (!(graph.get(file) ?? []).some((d) => reaching.has(d))) continue;
    if (source.includes(RESET_FN) || mocksReader(source)) continue;
    violations.push({ file: relative(REPO_ROOT, file).replaceAll("\\", "/") });
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ Every discovery-gated test places the discovery clock.");
    process.exit(0);
  }
  console.error("❌ Discovery-clock guard violations (R-DiscoveryClockReset):");
  for (const v of found) console.error(`  ${v.file}`);
  console.error(
    `  Remediation: call ${RESET_FN}(...) in the suite (a bare ${RESET_FN}() in afterEach, and an explicit instant per case), or vi.mock the ${READER.split("/").pop()} hook if the gate is not what the file is testing.`
  );
  process.exit(1);
}
