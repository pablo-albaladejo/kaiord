#!/usr/bin/env node
/**
 * Mechanical guard (R-WorkoutDateWriters, design §3.10 of
 * add-coach-session-reschedule): every `workouts.put(` / `workouts.bulkPut(`
 * and `table("workouts").put|bulkPut(` call site under
 * `packages/workout-spa-editor/src` (tests excluded) MUST be classified in
 * `WORKOUT_DATE_WRITERS`.
 *
 * A workout's `date` is the session's effective date and its match follows
 * it. A writer that puts a copy of the row read before an `await` reverts a
 * move made meanwhile, so every writer is one of:
 *
 *   - `date-writer` — changes the date and re-dates the match: the file (or
 *     the `via` module it imports) MUST call `sessionMatch.updateDate(`.
 *   - `date-preserving` — re-reads and writes in one transaction, keeping
 *     the fresh `date`.
 *   - `creator` — writes a new row or restores a deleted one, so no match
 *     can be stale.
 *
 * The registry is a permanent classification of legitimate writers, not a
 * drained allowlist. Fails on an unlisted call site, a `date-writer` that
 * never re-dates the match, and a registry entry that matches no call site.
 *
 * Co-located test: `scripts/check-workout-date-writers.test.mjs`.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPA_SRC = resolve(
  __dirname,
  "..",
  "packages",
  "workout-spa-editor",
  "src"
);

const creator = (file, note) => ({ file, reason: "creator", note });

export const WORKOUT_DATE_WRITERS = [
  {
    file: "application/move-session.ts",
    reason: "date-writer",
    note: "The athlete move: re-dates the workout and its match in one transaction.",
  },
  {
    file: "application/coaching/apply-coach-date-moves.ts",
    reason: "date-writer",
    via: "application/coaching/redate-followed-match.ts",
    note: "The coach follow: re-dates the workout, and an unlocked match through redateFollowedMatch.",
  },
  {
    file: "application/save-workout-edits.ts",
    reason: "date-preserving",
    note: "updateWorkoutRecord: re-reads and writes in one transaction; the stale-snapshot writers go through it.",
  },
  {
    file: "hooks/garmin-place-record.ts",
    reason: "date-preserving",
    note: "Stamps the push id onto the row re-read in its transaction.",
  },
  creator(
    "application/coaching/convert-coaching-activity.ts",
    "Creates the raw workout of a coaching activity."
  ),
  creator(
    "application/coaching/convert-coaching-activity-manual.ts",
    "Creates the template workout of a coaching activity."
  ),
  creator(
    "application/coaching/convert-coaching-activity-with-ai-helpers.ts",
    "Creates the AI workout of a coaching activity."
  ),
  creator(
    "application/coaching/persist-coaching-workout.ts",
    "Creates the edited draft workout of a coaching activity."
  ),
  creator(
    "application/library/schedule-template.ts",
    "Creates a workout from a library template."
  ),
  creator(
    "application/restore-deleted-workout.ts",
    "Restores a deleted row; no match can point at it meanwhile."
  ),
  creator(
    "components/organisms/ImportDropzoneOverlay/persist-imported-workout.ts",
    "Creates an imported workout."
  ),
  creator(
    "components/organisms/ScratchEditorSurface/persist-scratch-workout.ts",
    "Creates a workout from the scratch editor."
  ),
  creator(
    "components/pages/CreateWorkout/use-save-and-push.ts",
    "Creates a workout from the create page."
  ),
  creator(
    "components/pages/use-schedule-template.ts",
    "Creates a workout from a template on the calendar."
  ),
  creator(
    "hooks/chat/chat-create-workout.ts",
    "Creates a workout from an approved chat action."
  ),
];

const WRITE_RE =
  /\b(?:workouts|table\(\s*["']workouts["']\s*\))\s*\.\s*(?:put|bulkPut)\s*\(/g;
const UPDATE_DATE_RE = /\bsessionMatch\s*\.\s*updateDate\s*\(/;
const SKIPPED = /\.(test|stories)\.tsx?$|\.test-[\w-]+\.tsx?$|test-setup\.ts$/;

// Blank out comments, keeping newlines so line numbers still match.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (c) =>
    c.replace(/[^\n]/g, " ")
  );

const listSources = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "test-utils" ? [] : listSources(path);
    return /\.tsx?$/.test(name) && !SKIPPED.test(name) ? [path] : [];
  });

/** 1-based line numbers of every workout write in `source`. */
export const findWriteLines = (source) => {
  const code = stripComments(source);
  return [...code.matchAll(WRITE_RE)].map(
    (m) => code.slice(0, m.index).split("\n").length
  );
};

const callsUpdateDate = (root, file) =>
  existsSync(join(root, file)) &&
  UPDATE_DATE_RE.test(stripComments(readFileSync(join(root, file), "utf8")));

const checkDateWriter = (root, entry) => {
  if (callsUpdateDate(root, entry.file)) return [];
  if (entry.via && callsUpdateDate(root, entry.via)) return [];
  return [
    `${entry.file}: a date-writer must call sessionMatch.updateDate(${entry.via ? ` (directly or in ${entry.via})` : ""}`,
  ];
};

export const runCheck = ({
  root = SPA_SRC,
  registry = WORKOUT_DATE_WRITERS,
} = {}) => {
  const listed = new Map(registry.map((e) => [e.file, e]));
  const writers = new Set();
  const problems = [];
  for (const path of listSources(root)) {
    const file = relative(root, path).replaceAll("\\", "/");
    const lines = findWriteLines(readFileSync(path, "utf8"));
    if (lines.length === 0) continue;
    writers.add(file);
    if (!listed.has(file))
      for (const line of lines)
        problems.push(`${file}:${line}: unclassified workout write`);
  }
  for (const entry of registry) {
    if (!writers.has(entry.file))
      problems.push(`${entry.file}: stale entry, no workout write left`);
    else if (entry.reason === "date-writer")
      problems.push(...checkDateWriter(root, entry));
  }
  return problems;
};

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const problems = runCheck();
  if (problems.length === 0) {
    console.log(
      `✅ workout date writers OK: ${WORKOUT_DATE_WRITERS.length} classified.`
    );
    process.exit(0);
  }
  console.error("❌ R-WorkoutDateWriters violations:");
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "Classify the writer in WORKOUT_DATE_WRITERS (scripts/check-workout-date-writers.mjs), or write through updateWorkoutRecord."
  );
  process.exit(1);
}
