#!/usr/bin/env node
//
// Codemod for PR-2 of test-conventions-should-aaa.
// Drains scripts/check-test-title-should.mjs:ALLOWLIST to empty by
// rewriting every it()-rooted call's title to the canonical
// "should …" form, using a hand-curated verb-mapping table.
//
// Three transformation rules per design D3:
//   1. drop-s rule — `renders X` → `should render X`,
//                     `returns Y` → `should return Y`,
//                     `does Z`    → `should do Z`,
//                     etc. (any verb whose 3rd-person form ends in `s`).
//   2. be-substitution — `is X` → `should be X`.
//   3. negation-elision — `does not X` → `should not X`
//                          (avoids the redundant `should do not X`).
//
// Unmapped first-words are written to REVIEW_QUEUE.md at repo root,
// truncated at start of run (re-runs are idempotent on the queue file).
// Manual rewrite required for those entries.
//
// CLI:
//   node scripts/codemod-should-prefix.mjs            # full-tree rewrite
//   node scripts/codemod-should-prefix.mjs <file>...  # specific files
//
// Removed by PR-6 §6.10 — no steady-state purpose after the migration
// completes (the title-guard's empty allowlist + ESLint vitest/valid-title
// at 'error' enforce the contract going forward).

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");
const REVIEW_QUEUE_PATH = join(REPO_ROOT, "REVIEW_QUEUE.md");

export const REVIEW_QUEUE_HEADER =
  "# REVIEW_QUEUE — codemod-should-prefix unmapped titles\n\n" +
  "Each entry below could not be rewritten mechanically because the\n" +
  "first word is not in the verb-mapping table. Rewrite each title\n" +
  "by hand to a grammatical `should …` form, then delete the entry.\n\n";

// Verb-mapping table — drop-s rule maps `<verb-3rd-person>` → `<verb-bare>`.
// 25 entries cover ~93% of the 1,326 violators per the PR-2 histogram.
const DROP_S_MAP = {
  renders: "render",
  returns: "return",
  rejects: "reject",
  accepts: "accept",
  shows: "show",
  hides: "hide",
  fires: "fire",
  emits: "emit",
  calls: "call",
  uses: "use",
  maps: "map",
  replaces: "replace",
  preserves: "preserve",
  removes: "remove",
  passes: "pass",
  updates: "update",
  focuses: "focus",
  falls: "fall",
  resolves: "resolve",
  includes: "include",
  throws: "throw",
  handles: "handle",
  propagates: "propagate",
  detects: "detect",
  ignores: "ignore",
  matches: "match",
  yields: "yield",
  splits: "split",
  joins: "join",
  produces: "produce",
  generates: "generate",
  delegates: "delegate",
  honors: "honor",
  applies: "apply",
  reports: "report",
  checks: "check",
  exposes: "expose",
  notifies: "notify",
  triggers: "trigger",
  clears: "clear",
  hydrates: "hydrate",
  serializes: "serialize",
  deserializes: "deserialize",
  parses: "parse",
  formats: "format",
  records: "record",
  caches: "cache",
  invalidates: "invalidate",
  appends: "append",
  inserts: "insert",
  deletes: "delete",
  picks: "pick",
  sorts: "sort",
  groups: "group",
  filters: "filter",
  marks: "mark",
  flags: "flag",
  routes: "route",
  redirects: "redirect",
  resets: "reset",
  imports: "import",
  exports: "export",
  binds: "bind",
  unbinds: "unbind",
  attaches: "attach",
  detaches: "detach",
  loads: "load",
  unloads: "unload",
  saves: "save",
  fetches: "fetch",
  sends: "send",
  receives: "receive",
  registers: "register",
  unregisters: "unregister",
  subscribes: "subscribe",
  unsubscribes: "unsubscribe",
  publishes: "publish",
  consumes: "consume",
  encodes: "encode",
  decodes: "decode",
  serializesAs: "serializeAs", // fallback edge case (rare)
  validates: "validate",
  rounds: "round",
  truncates: "truncate",
  retries: "retry",
  expires: "expire",
  cancels: "cancel",
  aborts: "abort",
  resumes: "resume",
  pauses: "pause",
  starts: "start",
  stops: "stop",
  finishes: "finish",
  completes: "complete",
  // Extended after measuring the PR-2 review queue's long tail.
  sets: "set",
  requires: "require",
  surfaces: "surface",
  skips: "skip",
  invokes: "invoke",
  creates: "create",
  persists: "persist",
  rolls: "roll",
  disables: "disable",
  enables: "enable",
  collapses: "collapse",
  scrubs: "scrub",
  omits: "omit",
  pings: "ping",
  warns: "warn",
  logs: "log",
  prefers: "prefer",
  prevents: "prevent",
  rounds: "round",
  rejects: "reject",
  copies: "copy",
  moves: "move",
  swaps: "swap",
  expands: "expand",
  shrinks: "shrink",
  grows: "grow",
  shows: "show",
  scopes: "scope",
  blocks: "block",
  allows: "allow",
  permits: "permit",
  forbids: "forbid",
  enforces: "enforce",
  protects: "protect",
  guards: "guard",
  drops: "drop",
  loses: "lose",
  gains: "gain",
  decrements: "decrement",
  increments: "increment",
  bubbles: "bubble",
  surfaces2: "surface", // alias guard (rare)
  acks: "ack",
  acknowledges: "acknowledge",
  rebuilds: "rebuild",
  rebases: "rebase",
  recovers: "recover",
  catches: "catch",
  swallows: "swallow",
  defaults: "default",
  initializes: "initialize",
  configures: "configure",
  switches: "switch",
  toggles: "toggle",
  forwards: "forward",
  passes: "pass",
  proxies: "proxy",
  masks: "mask",
  exposes2: "expose", // alias guard
  closes: "close",
  opens: "open",
  selects: "select",
  deselects: "deselect",
  reveals: "reveal",
  conceals: "conceal",
  syncs: "sync",
  schedules: "schedule",
  enqueues: "enqueue",
  dequeues: "dequeue",
  adds: "add",
  removes2: "remove", // alias guard
  updates2: "update", // alias guard
  bumps: "bump",
  decrements2: "decrement", // alias guard
  pushes: "push",
  pops: "pop",
  flushes: "flush",
  drains: "drain",
  measures: "measure",
  // Round-2 additions from re-running against PR-2 queue:
  navigates: "navigate",
  dispatches: "dispatch",
  trims: "trim",
  backfills: "backfill",
  upserts: "upsert",
  restores: "restore",
  reindexes: "reindex",
  reads: "read",
  writes: "write",
  puts: "put",
  gets: "get",
  prepends: "prepend",
  asserts: "assert",
  assigns: "assign",
  authorizes: "authorize",
  injects: "inject",
  exits: "exit",
  enters: "enter",
  finds: "find",
  fails: "fail",
  succeeds: "succeed",
  observes: "observe",
  posts: "post",
  patches: "patch",
  uploads: "upload",
  downloads: "download",
  shares: "share",
  duplicates: "duplicate",
  unsets: "unset",
  errors: "error",
  alerts: "alert",
  toasts: "toast",
  dismisses: "dismiss",
  highlights: "highlight",
  styles: "style",
  themes: "theme",
  signals: "signal",
  prompts: "prompt",
  pings: "ping",
  reuses: "reuse",
  rebuilds: "rebuild",
  rebases: "rebase",
  recovers: "recover",
  catches: "catch",
  swallows: "swallow",
  defaults: "default",
  initializes: "initialize",
  configures: "configure",
  switches: "switch",
  toggles: "toggle",
  forwards: "forward",
  proxies: "proxy",
  masks: "mask",
  closes: "close",
  opens: "open",
  selects: "select",
  deselects: "deselect",
  reveals: "reveal",
  conceals: "conceal",
  syncs: "sync",
  schedules: "schedule",
  enqueues: "enqueue",
  dequeues: "dequeue",
  adds: "add",
  bumps: "bump",
  pushes: "push",
  pops: "pop",
  flushes: "flush",
  drains: "drain",
  // Round-3 additions:
  leaves: "leave",
  keeps: "keep",
  displays: "display",
  clamps: "clamp",
  cascades: "cascade",
  advances: "advance",
  wraps: "wrap",
  splits: "split",
  joins: "join",
  inserts: "insert",
  appends2: "append",
  rolls: "roll",
  cancels2: "cancel",
  aborts2: "abort",
  resumes2: "resume",
  pauses2: "pause",
  starts2: "start",
  stops2: "stop",
  finishes2: "finish",
  completes2: "complete",
  expires2: "expire",
  sees: "see",
  uses2: "use",
  throws2: "throw",
  fails2: "fail",
  errors2: "error",
  loses2: "lose",
  gains2: "gain",
  measures2: "measure",
  tracks: "track",
  computes: "compute",
  reflects: "reflect",
  matches2: "match",
  binds2: "bind",
  unbinds2: "unbind",
  attaches2: "attach",
  detaches2: "detach",
  hydrates2: "hydrate",
  serializes2: "serialize",
  deserializes2: "deserialize",
  parses2: "parse",
  formats2: "format",
  decodes2: "decode",
  encodes2: "encode",
  validates3: "validate",
  rounds2: "round",
  truncates2: "truncate",
  retries3: "retry",
  pivots: "pivot",
  flips: "flip",
  rotates: "rotate",
  refreshes: "refresh",
  invalidates3: "invalidate",
  caches3: "cache",
  fences: "fence",
  guards2: "guard",
  bumps2: "bump",
};

const EXCLUDED_FRAGMENTS = [
  "/node_modules/",
  "/dist/",
  "/coverage/",
  "/test-utils/",
  "/e2e/",
  "/.storybook/",
];
const EXCLUDED_BASENAMES = new Set(["test-setup.ts"]);

function isInScope(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (EXCLUDED_FRAGMENTS.some((frag) => p.includes(frag))) return false;
  if (p.endsWith(".stories.ts") || p.endsWith(".stories.tsx")) return false;
  const base = p.split("/").pop();
  if (EXCLUDED_BASENAMES.has(base)) return false;
  if (!p.endsWith(".test.ts") && !p.endsWith(".test.tsx")) return false;
  return true;
}

// Vitest substitution placeholders — preserved as-is in rewrites.
const PLACEHOLDER_RE = /%[sdijo#]|\$\d+|\$[a-zA-Z_][a-zA-Z0-9_]*/g;

export function rewriteTitle(title) {
  if (title.startsWith("should ")) return null;
  const stripped = title.replace(PLACEHOLDER_RE, "");
  if (stripped.startsWith("should ")) return null;

  const firstWord = title.split(/\s+/)[0];
  if (!firstWord) return null;

  // Negation-elision: "does not <X>" → "should not <X>".
  if (firstWord === "does" && /^does\s+not\b/.test(title)) {
    return "should not " + title.slice("does not ".length);
  }

  // Special: `does <X>` → `should do <X>`.
  if (firstWord === "does") {
    return "should do " + title.slice("does ".length);
  }

  // Be-substitution: `is <X>` → `should be <X>`.
  if (firstWord === "is") {
    return "should be " + title.slice("is ".length);
  }

  // Drop-s rule via verb-mapping table.
  const bareVerb = DROP_S_MAP[firstWord];
  if (bareVerb) {
    return `should ${bareVerb}` + title.slice(firstWord.length);
  }

  // Hyphenated `re-<verb>s` (e.g., `re-fires`, `re-evaluates`,
  // `re-throws`). Drop the `s` from the verb half.
  const hyphenMatch = firstWord.match(/^(re)-([a-z]+s)$/);
  if (hyphenMatch) {
    const innerVerb = hyphenMatch[2];
    if (innerVerb.endsWith("s")) {
      const bare = DROP_S_MAP[innerVerb] ?? innerVerb.slice(0, -1);
      return `should re-${bare}` + title.slice(firstWord.length);
    }
  }

  // `has X` → `should have X` (3rd-person → infinitive).
  if (firstWord === "has") {
    return "should have" + title.slice("has".length);
  }

  return null;
}

// Title extraction via shared helper; handles `it.each([...])(title)`
// correctly (a naive single-regex captures inner array strings).
import { findItTitles } from "./it-title-extractor.mjs";

export function transformSource(source, repoRelPath) {
  const queue = [];
  let result = "";
  let lastIndex = 0;

  // Materialize and sort by titleStart so the in-place stitching below
  // walks left-to-right (helper yields each-matches before plain ones,
  // not in source order).
  const matches = [...findItTitles(source)].sort(
    (a, b) => a.titleStart - b.titleStart
  );

  for (const { title, titleStart } of matches) {
    const titleEnd = titleStart + title.length;

    const rewritten = rewriteTitle(title);
    if (rewritten === null) {
      // Already-conformant or unmapped → leave alone, possibly queue.
      if (!title.startsWith("should ")) {
        queue.push({
          path: repoRelPath,
          line: lineOf(source, titleStart),
          title,
        });
      }
      continue;
    }

    // Append slice up to the title and the rewritten title.
    result += source.slice(lastIndex, titleStart) + rewritten;
    lastIndex = titleEnd;
  }

  result += source.slice(lastIndex);
  return { source: result, queue };
}

function lineOf(source, charIndex) {
  let line = 1;
  for (let i = 0; i < charIndex; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

function listTestFiles(rootDir = PACKAGES_DIR) {
  const out = [];
  walk(rootDir, out);
  return out;
}

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = relative(REPO_ROOT, full).replaceAll("\\", "/");
    if (EXCLUDED_FRAGMENTS.some((frag) => rel.includes(frag))) continue;
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isInScope(rel)) continue;
    out.push(full);
  }
}

function formatQueue(queue) {
  if (queue.length === 0) return "";
  return (
    REVIEW_QUEUE_HEADER +
    queue.map((q) => `- [ ] ${q.path}:${q.line} — ${q.title}`).join("\n") +
    "\n"
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const targetFiles =
    argv.length > 0
      ? argv.map((p) => resolve(REPO_ROOT, p))
      : listTestFiles();

  const queue = [];
  let modifiedCount = 0;
  for (const file of targetFiles) {
    const rel = relative(REPO_ROOT, file).replaceAll("\\", "/");
    if (!isInScope(rel)) continue;
    const before = readFileSync(file, "utf8");
    const { source: after, queue: fileQueue } = transformSource(before, rel);
    queue.push(...fileQueue);
    if (after !== before) {
      writeFileSync(file, after);
      modifiedCount++;
    }
  }

  // Truncate REVIEW_QUEUE.md at start of run (queue accumulator has the
  // current state — we replace, not append).
  if (queue.length > 0) {
    writeFileSync(REVIEW_QUEUE_PATH, formatQueue(queue));
  }

  console.log(
    `[codemod-should-prefix] modified ${modifiedCount} file(s); ` +
      `${queue.length} title(s) queued for manual review` +
      (queue.length > 0 ? ` in ${relative(REPO_ROOT, REVIEW_QUEUE_PATH)}.` : ".")
  );
}
