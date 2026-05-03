#!/usr/bin/env node
// Enforce the archive-followups invariant:
//
//   For each openspec/changes/archive/<dated-slug>/tasks.md,
//   the count of `> Deferred to: #<N>` markers MUST satisfy the
//   overscope contract: "deferrals MUST NOT exceed shipped tasks
//   per archive."
//
// v2 (this script) supports two modes per archive:
//
//   (a) Marker-present: the tasks.md carries
//       `> Tasks: <C> completed, <D> deferred` near the top. The
//       script enforces the ratio invariant: D ≤ C. The declared
//       D MUST also equal the count of `> Deferred to: #N` markers
//       in the same file (auditing consistency).
//
//   (b) Marker-absent (legacy): the script falls back to the v1
//       absolute cap of 6 deferral markers. Existing pre-v2 archives
//       continue to be policed under the cap until they're either
//       backfilled with the marker or stay grandfathered below the cap.
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

// Legacy cap. Applies only when the `> Tasks:` marker is absent on a
// given archive. Future PRs MAY remove this once every archive in the
// tree carries the marker; until then the cap grandfathers pre-v2
// archives against silent overscope.
export const ABSOLUTE_DEFERRAL_CAP = 6;

// Markers live indented under the checkbox they annotate (per spec example
// in openspec/SPEC_TEMPLATE.md and openspec/AGENTS.md). Allow any leading
// whitespace; reject any non-canonical body after `> Deferred to:`.
// Issue numbers MUST be POSITIVE integers (#0 rejected) — the spec contract
// names a positive-integer GitHub issue number.
const deferredRe = /^\s*> Deferred to: #([1-9]\d*)\s*$/gm;
const malformedDeferredRe = /^\s*> Deferred to:(?! #[1-9]\d*\s*$).*$/gm;

// `> Tasks: N completed, M deferred` lives at the top of tasks.md (after
// any opsx-ship chunking HTML comment). Both counts are non-negative
// integers; the marker is the SOURCE OF TRUTH for shipped/deferred
// counts. The script does NOT count `[x]` checkboxes (which conflate
// fully-shipped and partially-shipped tasks).
const tasksMarkerRe = /^\s*> Tasks: (\d+) completed, (\d+) deferred\s*$/m;
const malformedTasksRe =
  /^\s*> Tasks:(?! \d+ completed, \d+ deferred\s*$).*$/gm;

function parseTasksMarker(src) {
  const match = tasksMarkerRe.exec(src);
  if (!match) return null;
  return { completed: Number(match[1]), deferred: Number(match[2]) };
}

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

    // Reject malformed deferred-to markers (URL form, missing hash, #0, etc.).
    for (const m of src.matchAll(malformedDeferredRe)) {
      violations.push(
        `${tasksPath}: malformed marker "${m[0].trim()}" — must be "> Deferred to: #<N>"`
      );
    }

    // Reject malformed Tasks markers (non-numeric counts, wrong order, etc.).
    for (const m of src.matchAll(malformedTasksRe)) {
      violations.push(
        `${tasksPath}: malformed marker "${m[0].trim()}" — must be "> Tasks: <N> completed, <M> deferred"`
      );
    }

    const deferredMatches = [...src.matchAll(deferredRe)];
    const deferredCount = deferredMatches.length;
    const tasksMarker = parseTasksMarker(src);

    if (tasksMarker) {
      // v2 mode: ratio invariant + audit consistency.
      const { completed, deferred } = tasksMarker;
      counts.push({
        folder: entry,
        deferred,
        completed,
        mode: "ratio",
      });

      if (deferred !== deferredCount) {
        violations.push(
          `${folder}: marker declares ${deferred} deferred but tasks.md contains ${deferredCount} "> Deferred to:" line(s) — counts must agree`
        );
      }

      if (deferred > completed) {
        violations.push(
          `${folder}: ${deferred} deferred > ${completed} completed — change was overscoped (deferred more than shipped)`
        );
      }
    } else {
      // Legacy mode: absolute cap fallback.
      if (deferredCount > 0) {
        counts.push({
          folder: entry,
          deferred: deferredCount,
          completed: null,
          mode: "cap",
        });
      }

      if (deferredCount >= ABSOLUTE_DEFERRAL_CAP) {
        violations.push(
          `${folder}: ${deferredCount} deferrals (≥ cap ${ABSOLUTE_DEFERRAL_CAP}) — change is overscoped (no Tasks marker — add "> Tasks: <C> completed, <D> deferred" for ratio-based check)`
        );
      }
    }
  }

  return { violations, counts };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { violations, counts } = checkArchiveFollowups();

  for (const c of counts) {
    if (c.mode === "ratio") {
      console.log(
        `  ${c.folder}: ${c.deferred} deferred / ${c.completed} completed (ratio mode)`
      );
    } else {
      console.log(
        `  ${c.folder}: ${c.deferred} deferrals (legacy cap ${ABSOLUTE_DEFERRAL_CAP})`
      );
    }
  }

  if (violations.length > 0) {
    console.error(
      `\nopenspec/changes/archive followups invariant violations (${violations.length}):\n`
    );
    for (const v of violations) console.error(`  ${v}`);
    console.error(
      `\nWith a "> Tasks: <C> completed, <D> deferred" marker, deferrals MUST NOT exceed shipped tasks (D ≤ C).\nWithout the marker, legacy cap of ${ABSOLUTE_DEFERRAL_CAP} deferrals applies. Add the marker to opt into ratio-based checks.`
    );
    process.exit(1);
  }

  console.log("openspec/changes/archive: deferral invariants hold.");
}
