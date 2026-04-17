#!/usr/bin/env node
// Enforce the archive-folder invariant:
//
//   openspec/changes/archive/YYYY-MM-DD-<slug>/proposal.md
//   MUST contain `> Completed: YYYY-MM-DD` matching the folder prefix.
//
// Exits non-zero on any violation. There is no warning path — every
// archived change MUST carry the marker; the 17 legacy archives were
// backfilled in PR #302 so the invariant holds across the full
// history.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const ARCHIVE_DIR = join(REPO_ROOT, "openspec", "changes", "archive");
const folderDateRe = /^(\d{4})-(\d{2})-(\d{2})-[a-z0-9][a-z0-9-]*$/;
const completedRe = /^> Completed: (\d{4})-(\d{2})-(\d{2})\s*$/m;

function isValidCalendarDate(y, m, d) {
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    dt.getUTCFullYear() === Number(y) &&
    dt.getUTCMonth() === Number(m) - 1 &&
    dt.getUTCDate() === Number(d)
  );
}

export function checkArchives() {
  const violations = [];

  if (!existsSync(ARCHIVE_DIR)) {
    console.warn(
      `[check-archive-dates] ${ARCHIVE_DIR} missing; nothing to check`
    );
    return { violations };
  }

  for (const entry of readdirSync(ARCHIVE_DIR)) {
    const folder = join(ARCHIVE_DIR, entry);
    if (!statSync(folder).isDirectory()) continue;

    const match = folderDateRe.exec(entry);
    if (!match) {
      violations.push(
        `${folder}: folder name "${entry}" does not match "YYYY-MM-DD-<slug>"`
      );
      continue;
    }
    const [, fy, fm, fd] = match;
    if (!isValidCalendarDate(fy, fm, fd)) {
      violations.push(
        `${folder}: folder prefix "${fy}-${fm}-${fd}" is not a valid calendar date`
      );
      continue;
    }
    const folderDate = `${fy}-${fm}-${fd}`;

    const proposalPath = join(folder, "proposal.md");
    if (!existsSync(proposalPath)) {
      violations.push(`${folder}: no proposal.md found`);
      continue;
    }

    const src = readFileSync(proposalPath, "utf8");
    const completed = completedRe.exec(src);
    if (!completed) {
      violations.push(
        `${folder}: proposal.md is missing the "> Completed: YYYY-MM-DD" marker`
      );
      continue;
    }
    const [, cy, cm, cd] = completed;
    if (!isValidCalendarDate(cy, cm, cd)) {
      violations.push(
        `${folder}: proposal.md Completed marker "${cy}-${cm}-${cd}" is not a valid calendar date`
      );
      continue;
    }
    const markerDate = `${cy}-${cm}-${cd}`;
    if (markerDate !== folderDate) {
      violations.push(
        `${folder}: folder date ${folderDate} does NOT match "> Completed: ${markerDate}" in proposal.md`
      );
    }
  }

  return { violations };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { violations } = checkArchives();

  if (violations.length > 0) {
    console.error(
      `\nopenspec/changes/archive invariant violations (${violations.length}):\n`
    );
    for (const v of violations) console.error(`  ${v}`);
    console.error(
      "\nFolder date prefix must equal the `> Completed:` marker inside proposal.md."
    );
    process.exit(1);
  }

  console.log("openspec/changes/archive: date-prefix invariant holds.");
}
