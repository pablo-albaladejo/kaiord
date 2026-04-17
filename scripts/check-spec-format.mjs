#!/usr/bin/env node
// Lint domain specs under openspec/specs/ against the canonical shape
// documented in openspec/SPEC_TEMPLATE.md. Exits non-zero on violations.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SPECS_DIR = "openspec/specs";

const violations = [];

function check(file, lines) {
  const joined = lines.join("\n");
  const firstNonEmpty = lines.find((l) => l.trim().length > 0) ?? "";

  if (!/^> Synced: \d{4}-\d{2}-\d{2}/.test(firstNonEmpty)) {
    violations.push(`${file}: first non-empty line must start with "> Synced: YYYY-MM-DD"`);
  }

  const h1Count = lines.filter((l) => /^# [^#]/.test(l)).length;
  if (h1Count !== 1) {
    violations.push(`${file}: expected exactly one H1 title, found ${h1Count}`);
  }

  if (!/^## Purpose\b/m.test(joined)) {
    violations.push(`${file}: missing "## Purpose" section`);
  }

  const requirementsCount = (joined.match(/^## Requirements\b/gm) ?? []).length;
  if (requirementsCount !== 1) {
    violations.push(
      `${file}: expected exactly one "## Requirements" section, found ${requirementsCount}`,
    );
  }

  if (/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements\b/m.test(joined)) {
    violations.push(
      `${file}: uses change-delta header (## ADDED|MODIFIED|REMOVED|RENAMED Requirements) — those belong in openspec/changes/<slug>/specs/, not canonical specs`,
    );
  }
}

function walk() {
  const entries = readdirSync(SPECS_DIR);
  for (const entry of entries) {
    const dir = join(SPECS_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    const spec = join(dir, "spec.md");
    try {
      const src = readFileSync(spec, "utf8");
      check(spec, src.split("\n"));
    } catch (err) {
      violations.push(`${spec}: ${err.message}`);
    }
  }
}

walk();

if (violations.length > 0) {
  console.error(`\nopenspec/specs format violations (${violations.length}):\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error("\nSee openspec/SPEC_TEMPLATE.md for the canonical shape.");
  process.exit(1);
}

console.log("openspec/specs: all specs conform to the canonical shape.");
