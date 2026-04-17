#!/usr/bin/env node
// Lint domain specs under openspec/specs/ against the canonical shape
// documented in openspec/SPEC_TEMPLATE.md. Exits non-zero on violations.
//
// Checks per spec:
//   1. First non-empty line is `> Synced: YYYY-MM-DD` (optional `(<slug>)`).
//   2. Any `(<slug>)` annotation resolves to an existing change folder.
//   3. Exactly one H1 title.
//   4. Exactly one `## Purpose` section, and it appears before `## Requirements`.
//   5. Exactly one `## Requirements` section.
//   6. No `## ADDED|MODIFIED|REMOVED|RENAMED Requirements` headers
//      (those are reserved for change-delta specs under openspec/changes/).
//   7. No `<Placeholder>` literals left in any heading.
//   8. Every `#### Scenario:` is nested under a `### Requirement:`.
//
// Also validates `openspec/SPEC_TEMPLATE.md` after substituting its
// placeholders, so template drift cannot silently bypass the lint.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPECS_DIR = join(REPO_ROOT, "openspec", "specs");
const TEMPLATE_FILE = join(REPO_ROOT, "openspec", "SPEC_TEMPLATE.md");
const CHANGES_DIR = join(REPO_ROOT, "openspec", "changes");
const ARCHIVE_DIR = join(CHANGES_DIR, "archive");

const syncedRe =
  /^> Synced: \d{4}-\d{2}-\d{2}(?: \(([a-z0-9][a-z0-9-]*)\))?\s*$/;
const deltaHeaderRe = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements\b/m;
const placeholderInHeadingRe = /^#{1,6} .*<[A-Z][^>]*>/m;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function changeSlugExists(slug) {
  if (!existsSync(CHANGES_DIR)) {
    console.warn(
      `[check-spec-format] ${CHANGES_DIR} does not exist; cannot verify slug "${slug}"`
    );
    return true;
  }
  const activeDir = join(CHANGES_DIR, slug);
  if (existsSync(activeDir) && statSync(activeDir).isDirectory()) return true;
  if (!existsSync(ARCHIVE_DIR)) return false;
  // Anchor the match strictly to "YYYY-MM-DD-<slug>" so a shorter slug
  // (e.g. "bridge") does not accidentally resolve to a longer archived
  // folder ("2026-04-10-garmin-bridge").
  const exactRe = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${escapeRe(slug)}$`);
  const archived = readdirSync(ARCHIVE_DIR).filter(
    (name) => name === slug || exactRe.test(name)
  );
  return archived.length > 0;
}

export function checkSpec(file, src) {
  const violations = [];
  const lines = src.split("\n");
  const firstNonEmpty = lines.find((l) => l.trim().length > 0) ?? "";
  const syncedMatch = syncedRe.exec(firstNonEmpty);

  if (!syncedMatch) {
    violations.push(
      `${file}: first non-empty line must match "> Synced: YYYY-MM-DD" or "> Synced: YYYY-MM-DD (<change-slug>)"`
    );
  } else if (syncedMatch[1] && !changeSlugExists(syncedMatch[1])) {
    violations.push(
      `${file}: Synced annotation references unknown change slug "${syncedMatch[1]}" — no matching folder under openspec/changes/ or openspec/changes/archive/`
    );
  }

  const h1Lines = lines.filter((l) => /^# [^#]/.test(l));
  if (h1Lines.length !== 1) {
    violations.push(
      `${file}: expected exactly one H1 title, found ${h1Lines.length}`
    );
  }

  const purposeIdx = lines.findIndex((l) => /^## Purpose\b/.test(l));
  const reqIdx = lines.findIndex((l) => /^## Requirements\b/.test(l));
  if (purposeIdx === -1) {
    violations.push(`${file}: missing "## Purpose" section`);
  }
  if (reqIdx === -1) {
    violations.push(`${file}: missing "## Requirements" section`);
  } else if (lines.filter((l) => /^## Requirements\b/.test(l)).length !== 1) {
    violations.push(`${file}: expected exactly one "## Requirements" section`);
  }
  if (purposeIdx !== -1 && reqIdx !== -1 && purposeIdx > reqIdx) {
    violations.push(
      `${file}: "## Purpose" must appear before "## Requirements"`
    );
  }

  if (deltaHeaderRe.test(src)) {
    violations.push(
      `${file}: uses change-delta header (## ADDED|MODIFIED|REMOVED|RENAMED Requirements) — those belong in openspec/changes/<slug>/specs/`
    );
  }

  if (placeholderInHeadingRe.test(src)) {
    violations.push(
      `${file}: leaves a "<Placeholder>" inside a heading — looks like an unfilled template`
    );
  }

  // Scenario orphan check: walk lines tracking the nearest preceding H3/H2.
  let lastH2 = "";
  let lastH3 = "";
  for (const line of lines) {
    if (/^## /.test(line)) {
      lastH2 = line;
      lastH3 = "";
      continue;
    }
    if (/^### /.test(line)) {
      lastH3 = line;
      continue;
    }
    if (/^#### Scenario:/.test(line)) {
      if (
        !/^## Requirements\b/.test(lastH2) ||
        !/^### Requirement:/.test(lastH3)
      ) {
        violations.push(
          `${file}: orphan scenario "${line.trim()}" — must nest under a "### Requirement:" inside "## Requirements"`
        );
      }
    }
  }

  return violations;
}

function walk() {
  const all = [];

  if (!existsSync(SPECS_DIR)) {
    console.error(`ERROR: ${SPECS_DIR} does not exist`);
    process.exit(2);
  }

  for (const entry of readdirSync(SPECS_DIR)) {
    const dir = join(SPECS_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    const spec = join(dir, "spec.md");
    try {
      const src = readFileSync(spec, "utf8");
      all.push(...checkSpec(spec, src));
    } catch (err) {
      all.push(`${spec}: ${err.message}`);
    }
  }

  // Meta-check: the template itself, with placeholders substituted.
  if (existsSync(TEMPLATE_FILE)) {
    const raw = readFileSync(TEMPLATE_FILE, "utf8");
    const filled = raw
      .replace(/YYYY-MM-DD/g, "2026-04-17")
      .replace(/<Capability Title>/g, "Sample Capability")
      .replace(/<Short requirement name>/g, "Sample requirement")
      .replace(/<Short scenario name>/g, "Sample scenario")
      .replace(/<trigger>/g, "a trigger happens")
      .replace(/<observable outcome>/g, "the observable outcome occurs");
    const templateViolations = checkSpec(TEMPLATE_FILE, filled);
    all.push(...templateViolations);
  }

  return all;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = walk();
  if (violations.length > 0) {
    console.error(
      `\nopenspec/specs format violations (${violations.length}):\n`
    );
    for (const v of violations) console.error(`  ${v}`);
    console.error("\nSee openspec/SPEC_TEMPLATE.md for the canonical shape.");
    process.exit(1);
  }
  console.log("openspec/specs: all specs conform to the canonical shape.");
}
