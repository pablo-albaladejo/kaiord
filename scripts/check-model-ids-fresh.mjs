#!/usr/bin/env node
/**
 * Mechanical guard: a model id written in prose exists in the catalog
 * (R-ModelIdsFresh).
 *
 * The generated catalog is regenerated from the installed `@ai-sdk/*` type
 * unions, so it cannot drift silently. A model id typed by hand into a README,
 * an AGENTS.md or a workflow has no such backstop — and one of them was
 * `claude-sonnet-4-5-20241022`, an id that never existed, sitting in four
 * places until someone read them side by side.
 *
 * An id that is deliberately historical goes in HISTORICAL with a reason, so
 * "not in the catalog" stays a decision rather than a thing nobody noticed.
 *
 * Not looking is not a pass: an unreadable file, a scanned set of zero files,
 * and a catalog that parses to zero ids are all faults.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CATALOG = "packages/ai/src/providers/generated/model-catalog.ts";
const SCANNED = [
  "packages/ai/README.md",
  "packages/ai/AGENTS.md",
  ".github/workflows/eval.yml",
];

/** Ids kept on purpose although the catalog no longer carries them. */
export const HISTORICAL = Object.freeze({});

const ID_SHAPE = /\b(?:claude|gpt|gemini|o\d)-[a-z0-9][a-z0-9.-]{3,}\b/g;
const CATALOG_ID = /\bid:\s*"([^"]+)"/g;

export const catalogIds = (source) =>
  new Set([...source.matchAll(CATALOG_ID)].map(([, id]) => id));

export const idsIn = (text) => new Set(text.match(ID_SHAPE) ?? []);

export const runCheck = ({ root, files = SCANNED, catalog = CATALOG }) => {
  const violations = [];
  let known;
  try {
    known = catalogIds(readFileSync(join(root, catalog), "utf8"));
  } catch (error) {
    return [{ kind: "scan-failed", detail: `catalog: ${error.message}` }];
  }
  if (known.size === 0) {
    return [{ kind: "catalog-empty", detail: `no ids parsed from ${catalog}` }];
  }
  if (files.length === 0) {
    return [{ kind: "scan-empty", detail: "no files to scan" }];
  }

  for (const file of files) {
    let text;
    try {
      text = readFileSync(join(root, file), "utf8");
    } catch (error) {
      violations.push({ kind: "scan-failed", file, detail: error.message });
      continue;
    }
    for (const id of idsIn(text)) {
      if (known.has(id) || id in HISTORICAL) continue;
      violations.push({ kind: "unknown-model-id", file, id });
    }
  }
  return violations;
};

const main = () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const violations = runCheck({ root });
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(violations, null, 2));
    return;
  }
  if (violations.length === 0) {
    console.log(
      `model ids: every id in ${SCANNED.length} files is in catalog.`
    );
    return;
  }
  for (const v of violations) {
    console.error(`  [${v.kind}] ${v.file ?? ""} ${v.id ?? v.detail ?? ""}`);
  }
  console.error(
    `\nA model id in prose must exist in ${CATALOG}, or be listed in\n` +
      "HISTORICAL in scripts/check-model-ids-fresh.mjs with a reason."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
