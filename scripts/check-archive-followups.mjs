#!/usr/bin/env node
// Enforce the archive-followups invariant:
//
//   For each openspec/changes/archive/<dated-slug>/tasks.md,
//   the count of `> Deferred to: #<N>` markers MUST be below
//   ABSOLUTE_DEFERRAL_CAP. The cap encodes the contract:
//   "deferrals MUST NOT exceed shipped tasks" (overscope guard).
//
//   v1 uses an absolute cap; v2 will refine to a deferral-ratio
//   invariant once tasks.md gains a machine-readable shape.
//   See openspec/changes/archive-followups-guard/spec.md for the
//   sunset trigger.
//
// Architectural mirror of scripts/check-archive-dates.mjs:
// same entry-point check, same exported function shape, same
// violation-collection-then-exit pattern.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const ARCHIVE_DIR = join(REPO_ROOT, "openspec", "changes", "archive");

// v1 cap. Sunset trigger (per spec): replace with deferral-ratio
// invariant when (a) a 3rd archive trips the cap, OR (b) tasks.md
// gains a machine-readable shape. Lowered from 6 to 5 once the
// calibration data justifies it.
export const ABSOLUTE_DEFERRAL_CAP = 6;

// Markers live indented under the checkbox they annotate (per spec example
// in openspec/SPEC_TEMPLATE.md and openspec/AGENTS.md). Allow any leading
// whitespace; reject any non-canonical body after `> Deferred to:`.
const deferredRe = /^\s*> Deferred to: #(\d+)\s*$/gm;
const malformedRe = /^\s*> Deferred to:(?! #\d+\s*$).*$/gm;

export function checkArchiveFollowups(archiveDir = ARCHIVE_DIR) {
  const violations = [];
  const counts = [];

  if (!existsSync(archiveDir)) {
    return { violations, counts };
  }

  for (const entry of readdirSync(archiveDir)) {
    const folder = join(archiveDir, entry);
    if (!statSync(folder).isDirectory()) continue;

    const tasksPath = join(folder, "tasks.md");
    if (!existsSync(tasksPath)) continue;

    const src = readFileSync(tasksPath, "utf8");

    const malformed = [...src.matchAll(malformedRe)];
    for (const m of malformed) {
      violations.push(
        `${tasksPath}: malformed marker "${m[0].trim()}" — must be "> Deferred to: #<N>"`
      );
    }

    const matches = [...src.matchAll(deferredRe)];
    const count = matches.length;
    if (count > 0) counts.push({ folder: entry, count });

    if (count >= ABSOLUTE_DEFERRAL_CAP) {
      violations.push(
        `${folder}: ${count} deferrals (≥ cap ${ABSOLUTE_DEFERRAL_CAP}) — change is overscoped`
      );
    }
  }

  return { violations, counts };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { violations, counts } = checkArchiveFollowups();

  for (const { folder, count } of counts) {
    console.log(`  ${folder}: ${count} deferrals (cap ${ABSOLUTE_DEFERRAL_CAP})`);
  }

  if (violations.length > 0) {
    console.error(
      `\nopenspec/changes/archive followups invariant violations (${violations.length}):\n`
    );
    for (const v of violations) console.error(`  ${v}`);
    console.error(
      `\nA change with ${ABSOLUTE_DEFERRAL_CAP}+ "> Deferred to: #N" markers in tasks.md is overscoped.\nSplit it before archiving, or address the deferrals first.`
    );
    process.exit(1);
  }

  console.log(`openspec/changes/archive: deferrals ≤ ${ABSOLUTE_DEFERRAL_CAP - 1} per change.`);
}
