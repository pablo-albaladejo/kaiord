#!/usr/bin/env node
// Enforce the archive-folder invariant:
//
//   openspec/changes/archive/YYYY-MM-DD-<slug>/proposal.md
//   MUST contain `> Completed: YYYY-MM-DD` matching the folder prefix.
//
// Also warns on (but does not fail for) archive folders missing a
// `> Completed:` marker — legacy archives may predate the convention.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const ARCHIVE_DIR = join(REPO_ROOT, "openspec", "changes", "archive");
const folderDateRe = /^(\d{4}-\d{2}-\d{2})-[a-z0-9][a-z0-9-]*$/;
const completedRe = /^> Completed: (\d{4}-\d{2}-\d{2})\s*$/m;

function checkArchives() {
  const violations = [];
  const warnings = [];

  if (!existsSync(ARCHIVE_DIR)) {
    console.warn(`[check-archive-dates] ${ARCHIVE_DIR} missing; nothing to check`);
    return { violations, warnings };
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
    const folderDate = match[1];

    const proposalPath = join(folder, "proposal.md");
    if (!existsSync(proposalPath)) {
      warnings.push(`${folder}: no proposal.md found`);
      continue;
    }

    const src = readFileSync(proposalPath, "utf8");
    const completed = completedRe.exec(src);
    if (!completed) {
      warnings.push(
        `${folder}: proposal.md has no "> Completed: YYYY-MM-DD" marker`
      );
      continue;
    }

    if (completed[1] !== folderDate) {
      violations.push(
        `${folder}: folder date ${folderDate} does NOT match "> Completed: ${completed[1]}" in proposal.md`
      );
    }
  }

  return { violations, warnings };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { violations, warnings } = checkArchives();

  for (const w of warnings) console.warn(`⚠  ${w}`);

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

  console.log(
    `openspec/changes/archive: date-prefix invariant holds${warnings.length ? ` (${warnings.length} warnings)` : ""}.`
  );
}

export { checkArchives };
