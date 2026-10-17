#!/usr/bin/env node
/**
 * Mechanical guard: the model-facing sink inventory is complete
 * (R-ModelFacingSinksDeclared).
 *
 * Every chat tool whose `execute` returns a value the model reads must appear
 * in `scripts/model-facing-sinks.mjs` with a status and a provenance note. A
 * new tool fails on day one, whether or not anyone guessed which of its fields
 * carry external text — which is the half a field-name allowlist cannot cover.
 *
 * Not looking is never a pass — that is the defect this guard exists to
 * prevent, so each way of not looking has to be loud: zero files scanned, an
 * unreadable directory, and an unreadable source are all faults. The scan
 * descends into subdirectories and accepts `execute` in property and method
 * form, because a tool the walk never reaches reports the same green as a tool
 * that is genuinely declared.
 *
 * It also scans `hooks/chat/`, where an approved action's `execute` actually
 * runs: a `catch` there whose body reads the caught value's text
 * (`e.message`, `e.stack`, `String(e)`, `${e}`, `e.toString()`, or a
 * destructured binding) fails, because that is how an exception's text from a
 * bridge or provider reached the model once already (R-CaughtErrorTextHidden).
 * Passing the whole value to a logging helper is not flagged. Known limit: a
 * helper that receives the error and returns its text is not followed.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SINKS } from "./model-facing-sinks.mjs";

const TOOLS_DIR = "packages/workout-spa-editor/src/application/chat/tools";
// Global: several tools share one file (action-tools.ts declares six).
const NAME_RE = /^\s*name:\s*"([a-z_]+)"/gm;
// Property (`execute: async () => …`) and method (`async execute() {}`) form.
// Recognizing only the colon lets a method-form tool skip name collection.
const EXECUTE_RE = /\bexecute\s*[:(]/;
const HOOKS_DIR = "packages/workout-spa-editor/src/hooks/chat";
const CATCH_RE = /\bcatch\s*\(\s*([^)]*?)\s*\)\s*\{/g;
const STATUSES = new Set(["clean", "fenced", "unbounded"]);

const isToolSource = (f) =>
  f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts");

/** Descendants included: a tool parked one directory down is still a sink. */
const collectSources = (root, dir = root, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSources(root, full, out);
    else if (isToolSource(entry.name)) out.push(relative(root, full));
  }
  return out;
};

const isHookSource = (f) =>
  /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith(".d.ts");

const collectHookSources = (root, dir = root, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectHookSources(root, full, out);
    else if (isHookSource(entry.name)) out.push(relative(root, full));
  }
  return out;
};

/** The brace-matched body of the block whose `{` is at `open`. */
const blockAt = (src, open) => {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open + 1, i);
  }
  return src.slice(open + 1);
};

const readsText = (body, binding) => {
  const id = binding.replace(/\$/g, "\\$");
  return new RegExp(
    `\\b${id}\\s*\\??\\.\\s*(message|stack|toString)\\b` +
      `|\\bString\\(\\s*${id}\\s*\\)|\\$\\{\\s*${id}\\s*\\}`
  ).test(body);
};

const catchLeaks = (src) => {
  const leaks = [];
  for (const match of src.matchAll(CATCH_RE)) {
    const binding = match[1];
    const line = src.slice(0, match.index).split("\n").length;
    if (!/^[A-Za-z_$][\w$]*$/.test(binding)) {
      leaks.push({ line, detail: `destructured catch binding (${binding})` });
      continue;
    }
    const body = blockAt(src, match.index + match[0].length - 1);
    if (readsText(body, binding)) {
      leaks.push({ line, detail: `reads the text of caught \`${binding}\`` });
    }
  }
  return leaks;
};

/** Every `catch` under `hooksRoot` keeps the caught value's text to itself. */
export const runCaughtErrorCheck = ({ hooksRoot }) => {
  let files;
  try {
    files = collectHookSources(hooksRoot);
  } catch (error) {
    return [
      {
        kind: "scan-failed",
        detail: `could not read ${hooksRoot}: ${error.message}`,
      },
    ];
  }
  if (files.length === 0) {
    return [{ kind: "scan-empty", detail: `no sources under ${hooksRoot}` }];
  }
  const violations = [];
  for (const file of files) {
    let src;
    try {
      src = readFileSync(join(hooksRoot, file), "utf8");
    } catch (error) {
      violations.push({ kind: "scan-failed", file, detail: error.message });
      continue;
    }
    for (const leak of catchLeaks(src)) {
      violations.push({
        kind: "caught-error-text",
        file,
        detail: `${file}:${leak.line} ${leak.detail}`,
      });
    }
  }
  return violations;
};

const inventoryViolations = () => {
  const violations = [];
  const seen = new Set();
  for (const sink of SINKS) {
    if (seen.has(sink.tool)) {
      violations.push({ kind: "duplicate", tool: sink.tool });
    }
    seen.add(sink.tool);
    if (!STATUSES.has(sink.status)) {
      violations.push({
        kind: "bad-status",
        tool: sink.tool,
        detail: `status "${sink.status}" is not one of ${[...STATUSES].join(", ")}`,
      });
    }
    if (!sink.provenance || sink.provenance.trim() === "") {
      violations.push({ kind: "no-provenance", tool: sink.tool });
    }
  }
  return violations;
};

export const runCheck = ({ toolsRoot }) => {
  let files;
  try {
    files = collectSources(toolsRoot);
  } catch (error) {
    return [
      {
        kind: "scan-failed",
        detail: `could not read ${toolsRoot}: ${error.message}`,
      },
    ];
  }
  if (files.length === 0) {
    return [{ kind: "scan-empty", detail: `no sources under ${toolsRoot}` }];
  }

  const violations = [];
  const declared = new Set(SINKS.map((s) => s.tool));
  const found = new Set();
  for (const file of files) {
    let src;
    try {
      src = readFileSync(join(toolsRoot, file), "utf8");
    } catch (error) {
      // A source we could not read is a source we did not check. Reporting it
      // and moving on keeps the remaining files checked; skipping it silently
      // would hide exactly the tool this guard exists to find.
      violations.push({ kind: "scan-failed", file, detail: error.message });
      continue;
    }
    if (!EXECUTE_RE.test(src)) continue;
    for (const [, tool] of src.matchAll(NAME_RE)) {
      found.add(tool);
      if (!declared.has(tool)) {
        violations.push({ kind: "undeclared", tool, file });
      }
    }
  }
  for (const sink of SINKS) {
    if (!found.has(sink.tool)) {
      violations.push({ kind: "stale", tool: sink.tool });
    }
  }
  return [...violations, ...inventoryViolations()];
};

const main = () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const violations = [
    ...runCheck({ toolsRoot: join(root, TOOLS_DIR) }),
    ...runCaughtErrorCheck({ hooksRoot: join(root, HOOKS_DIR) }),
  ];
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(violations, null, 2));
    return;
  }
  if (violations.length === 0) {
    console.log(`model-facing sinks: ${SINKS.length} declared, all present.`);
    return;
  }
  for (const v of violations) {
    console.error(`  [${v.kind}] ${v.tool ?? ""} ${v.detail ?? ""}`.trimEnd());
  }
  console.error(
    "\nEvery model-facing tool must appear in scripts/model-facing-sinks.mjs\n" +
      "with a status and a provenance note naming where its strings are produced,\n" +
      "and a catch under hooks/chat/ must return an app error code, never the\n" +
      "caught value's text."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
