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
 * Zero files scanned is a FAULT, not a pass: a guard that reports green
 * because it could not look is the defect it exists to prevent.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SINKS } from "./model-facing-sinks.mjs";

const TOOLS_DIR = "packages/workout-spa-editor/src/application/chat/tools";
// Global: several tools share one file (action-tools.ts declares six).
const NAME_RE = /^\s*name:\s*"([a-z_]+)"/gm;

const isToolSource = (f) =>
  f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts");

export const runCheck = ({ toolsRoot }) => {
  const violations = [];
  let files;
  try {
    files = readdirSync(toolsRoot).filter(isToolSource);
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

  const declared = new Set(SINKS.map((s) => s.tool));
  const found = new Set();
  for (const file of files) {
    const src = readFileSync(join(toolsRoot, file), "utf8");
    if (!src.includes("execute:")) continue;
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
    if (!sink.provenance || sink.provenance.trim() === "") {
      violations.push({ kind: "no-provenance", tool: sink.tool });
    }
  }
  return violations;
};

const main = () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const violations = runCheck({ toolsRoot: join(root, TOOLS_DIR) });
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
      "with a status and a provenance note naming where its strings are produced."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
