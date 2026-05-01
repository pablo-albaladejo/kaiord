// Shared file walker for scripts/check-*.mjs guards that need to
// enumerate files under packages/. Skips node_modules, dist, and any
// directory whose basename starts with `.`.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".turbo"]);

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function walk(dir, visit) {
  const stat = safeStat(dir);
  if (!stat || !stat.isDirectory()) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), visit);
    } else if (entry.isFile()) {
      visit(join(dir, entry.name));
    }
  }
}

export function findPackageFiles(packagesRoot, predicate) {
  const out = [];
  walk(packagesRoot, (file) => {
    if (predicate(file)) out.push(file);
  });
  return out;
}
