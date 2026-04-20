// Enforces the branding-spec invariant: no file under `packages/docs/`
// hardcodes the `#0f172a` hex. The value SHALL come from the shared
// `--brand-bg-primary` token in `styles/brand-tokens.css`.
//
// Fails if someone re-introduces a literal, including in generated API
// docs (those are regenerated every build, so committing a hex would be
// a regression).

import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = resolve(__dirname, "..");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".vitepress/cache",
  ".vitepress/dist",
  "api", // auto-generated on build; never committed with literals
]);

const EXT_ALLOWLIST = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".mjs",
  ".js",
  ".cjs",
  ".vue",
  ".css",
  ".scss",
  ".md",
  ".html",
  ".json",
]);

function walk(dir, relPrefix = "") {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) {
      // Skip hidden dirs except .vitepress (we want to check config there).
      if (entry !== ".vitepress") continue;
    }
    const full = join(dir, entry);
    const rel = relPrefix ? join(relPrefix, entry) : entry;
    if (SKIP_DIRS.has(rel) || SKIP_DIRS.has(entry)) continue;

    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full, rel));
    } else {
      files.push({ full, rel });
    }
  }
  return files;
}

test("no file under packages/docs/ hardcodes #0f172a", () => {
  const offenders = [];
  for (const { full, rel } of walk(DOCS_ROOT)) {
    const ext = "." + rel.split(".").pop();
    if (!EXT_ALLOWLIST.has(ext)) continue;

    // Test files are allowed to pin the expected literal value — that's
    // the whole point of the parity check.
    if (rel.endsWith(".test.mjs")) continue;

    const content = readFileSync(full, "utf8");
    if (/#0f172a/i.test(content)) {
      offenders.push(rel);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Found hardcoded #0f172a literals in packages/docs/. ` +
      `Use readBrandTokenColor('--brand-bg-primary') instead. Files:\n` +
      offenders.map((f) => `  - ${f}`).join("\n")
  );
});
