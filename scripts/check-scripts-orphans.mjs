#!/usr/bin/env node
// R-ScriptsNoOrphans — every regular file under scripts/ and .github/scripts/
// MUST be reachable from at least one of:
//   1. root or sub-package package.json scripts.* values
//   2. .github/workflows/*.yml or .github/actions/**/action.yml
//   3. .husky/* hook files
//   4. .claude/settings.json (any string value), or the root
//      eslint.config.js (which loads the custom rules in scripts/eslint-rules/)
//   5. another non-test file under scripts/ or .github/scripts/ (transitive
//      imports / source / invocation). A `*.test.mjs` importing a script is
//      not wiring: a script reached only by its own test runs nowhere.
//   6. an entry in scripts/README.md between the markers
//      <!-- manual-tools:start --> and <!-- manual-tools:end -->,
//      formatted as `- \`<filename>\` — When to run: <reason>`.
//
// Exits non-zero on any orphan. Spec lives in
// openspec/specs/scripts-folder-hygiene/spec.md.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SCRIPTS_DIR = join(REPO_ROOT, "scripts");

const EXCLUDED_SUBDIRS = new Set(["lib", "cws-api", "fixtures"]);
const README_NAME = "README.md";
const MARKER_START = "<!-- manual-tools:start -->";
const MARKER_END = "<!-- manual-tools:end -->";
const GITHUB_SCRIPTS = ".github/scripts";

function listScriptCandidates(rootDir) {
  const out = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (dir === rootDir && EXCLUDED_SUBDIRS.has(entry.name)) continue;
        walk(join(dir, entry.name));
        continue;
      }
      const full = join(dir, entry.name);
      const rel = relative(rootDir, full);
      if (entry.name === README_NAME && dir === rootDir) continue;
      if (entry.name.endsWith(".test.mjs")) continue;
      out.push(rel);
    }
  }
  walk(rootDir);
  return out;
}

function readSafe(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function listFiles(dir, predicate) {
  const out = [];
  if (!existsSync(dir)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      if (predicate(full, e.name)) out.push(full);
    }
  }
  walk(dir);
  return out;
}

function collectPackageJsonScripts(rootDir) {
  const out = [];
  const rootPkg = join(rootDir, "package.json");
  if (existsSync(rootPkg)) out.push(rootPkg);
  const pkgsDir = join(rootDir, "packages");
  if (existsSync(pkgsDir)) {
    for (const e of readdirSync(pkgsDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = join(pkgsDir, e.name, "package.json");
      if (existsSync(p)) out.push(p);
    }
  }
  let blob = "";
  for (const p of out) {
    try {
      const json = JSON.parse(readFileSync(p, "utf8"));
      if (json && typeof json.scripts === "object" && json.scripts !== null) {
        for (const v of Object.values(json.scripts)) {
          if (typeof v === "string") blob += v + "\n";
        }
      }
    } catch {
      // ignore malformed package.json — not our concern
    }
  }
  return blob;
}

function collectWorkflowSources(rootDir) {
  const wf = join(rootDir, ".github", "workflows");
  const ac = join(rootDir, ".github", "actions");
  let blob = "";
  for (const f of listFiles(
    wf,
    (_, name) => name.endsWith(".yml") || name.endsWith(".yaml")
  )) {
    blob += readSafe(f) + "\n";
  }
  for (const f of listFiles(ac, (_, name) => name === "action.yml")) {
    blob += readSafe(f) + "\n";
  }
  return blob;
}

function collectHuskySources(rootDir) {
  const dir = join(rootDir, ".husky");
  if (!existsSync(dir)) return "";
  let blob = "";
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (e.name.startsWith(".")) continue;
    blob += readSafe(join(dir, e.name)) + "\n";
  }
  return blob;
}

function collectRootConfigs(rootDir) {
  return (
    readSafe(join(rootDir, ".claude", "settings.json")) +
    "\n" +
    readSafe(join(rootDir, "eslint.config.js"))
  );
}

function collectScriptsTransitive(rootDir, scriptsDir) {
  // Read every non-test file under scripts/ and .github/scripts/, excluding
  // the lib/cws-api/fixtures subdirs (internal to a single parent script)
  // and scripts/README.md: a row in its inventory table documents wiring,
  // it is not wiring. Only its manual-tools block counts, as an allowlist.
  // Keys are repo-relative paths.
  const map = new Map();
  function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (dir === scriptsDir && EXCLUDED_SUBDIRS.has(e.name)) continue;
        walk(join(dir, e.name));
        continue;
      }
      if (e.name.endsWith(".test.mjs")) continue;
      if (dir === scriptsDir && e.name === README_NAME) continue;
      const full = join(dir, e.name);
      map.set(relative(rootDir, full), readSafe(full));
    }
  }
  for (const dir of [scriptsDir, join(rootDir, GITHUB_SCRIPTS)]) {
    if (existsSync(dir)) walk(dir);
  }
  return map;
}

function parseAllowlist(readmeText) {
  const startIdx = readmeText.indexOf(MARKER_START);
  const endIdx = readmeText.indexOf(MARKER_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return {
      missingMarkers: true,
      entries: new Map(),
      malformed: [],
    };
  }
  const block = readmeText.slice(startIdx + MARKER_START.length, endIdx);
  const entries = new Map();
  const malformed = [];
  const lineRe = /^\s*-\s+`([^`]+)`\s+(.+?)\s*$/;
  for (const raw of block.split("\n")) {
    const line = raw.trimEnd();
    if (line.trim() === "") continue;
    const m = lineRe.exec(line);
    if (!m) continue;
    const name = m[1];
    const rest = m[2];
    if (!/when to run/i.test(rest)) {
      malformed.push({ name, line });
      continue;
    }
    entries.set(name, line);
  }
  return { missingMarkers: false, entries, malformed };
}

function isReachable(needleAbs, basename, sources, transitiveByRel) {
  // Top-level wiring: package.json scripts.*, workflows, husky,
  // .claude/settings.json. Match the canonical repo-relative path.
  if (sources.includes(needleAbs)) return true;

  // Transitive reachability: any OTHER file under scripts/ references
  // this one. Match the basename — script filenames like
  // `check-bridge-privacy-surface.mjs` are unique enough that the bare
  // basename match is precise. This catches relative imports
  // (`./check-X.mjs`), `join(HERE, "check-X.mjs")`, bash sources, etc.
  for (const [otherRel, text] of transitiveByRel.entries()) {
    if (otherRel === needleAbs) continue;
    if (text.includes(basename)) return true;
    if (text.includes(needleAbs)) return true;
  }
  return false;
}

export function findOrphans(rootDir = REPO_ROOT) {
  const scriptsDir = join(rootDir, "scripts");
  const githubScriptsDir = join(rootDir, GITHUB_SCRIPTS);
  const candidates = [
    ...listScriptCandidates(scriptsDir).map((rel) => `scripts/${rel}`),
    ...(existsSync(githubScriptsDir)
      ? listScriptCandidates(githubScriptsDir).map(
          (rel) => `${GITHUB_SCRIPTS}/${rel}`
        )
      : []),
  ];

  const sources =
    collectPackageJsonScripts(rootDir) +
    "\n" +
    collectWorkflowSources(rootDir) +
    "\n" +
    collectHuskySources(rootDir) +
    "\n" +
    collectRootConfigs(rootDir);

  const transitiveByRel = collectScriptsTransitive(rootDir, scriptsDir);

  const readmeText = readSafe(join(scriptsDir, README_NAME));
  const allow = parseAllowlist(readmeText);

  const errors = [];

  if (allow.missingMarkers) {
    errors.push(
      `scripts/README.md is missing the required \`${MARKER_START}\` / \`${MARKER_END}\` markers (R-ScriptsNoOrphans)`
    );
  }

  for (const m of allow.malformed) {
    errors.push(
      `scripts/README.md allowlist entry \`${m.name}\` is missing the "When to run" annotation (R-ScriptsNoOrphans). Line: ${m.line.trim()}`
    );
  }

  const orphans = [];
  for (const path of candidates) {
    const basename = path.slice(path.lastIndexOf("/") + 1);
    const rel = path.startsWith("scripts/")
      ? path.slice("scripts/".length)
      : path;
    if (isReachable(path, basename, sources, transitiveByRel)) continue;
    if (allow.entries.has(basename) || allow.entries.has(rel)) continue;
    orphans.push(path);
  }

  return { orphans, errors };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { orphans, errors } = findOrphans();

  if (errors.length > 0) {
    console.error(`\nscripts/README.md violations (${errors.length}):\n`);
    for (const e of errors) console.error(`  ${e}`);
  }

  if (orphans.length > 0) {
    console.error(
      `\norphan scripts (${orphans.length}) — R-ScriptsNoOrphans:\n`
    );
    for (const o of orphans) console.error(`  ${o}`);
    console.error(
      `\nEvery scripts/<file> MUST be reachable from one of:\n` +
        `  1. package.json scripts.* (root or any packages/*/package.json)\n` +
        `  2. .github/workflows/*.yml or .github/actions/**/action.yml\n` +
        `  3. .husky/* hooks\n` +
        `  4. .claude/settings.json or the root eslint.config.js\n` +
        `  5. another non-test scripts/* or .github/scripts/* file\n` +
        `  6. an allowlist entry in scripts/README.md between\n` +
        `     ${MARKER_START} and ${MARKER_END}\n` +
        `     formatted as: - \`<filename>\` — When to run: <reason>\n`
    );
  }

  if (orphans.length > 0 || errors.length > 0) {
    process.exit(1);
  }

  console.log("scripts/: no orphan scripts (R-ScriptsNoOrphans).");
}
