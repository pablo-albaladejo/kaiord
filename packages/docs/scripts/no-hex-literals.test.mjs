// Enforces two branding-spec invariants under `packages/docs/`:
//
// 1. No file hardcodes the `#0d0d0d` hex — the value SHALL come from the
//    shared `--bg-page` token in `styles/brand-tokens.css`. Checked across
//    every source extension, including generated API docs (regenerated on
//    each build, so a committed hex would be a regression).
//
// 2. No hex color literal at all in STYLE contexts: whole `.css`/`.scss`
//    files, and `<style>` blocks inside `.md`, `.vue` and `.html`. A token
//    cannot protect a component that does not read it — a surface that
//    hand-writes `color: #fff` over a role-driven background reopens the
//    same hole every time (contrast 1:1 in whichever theme resolves the
//    role to white). Style contexts only: hexes in prose or code samples
//    are content, not styling.

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

test("no file under packages/docs/ hardcodes #0d0d0d", () => {
  const offenders = [];
  for (const { full, rel } of walk(DOCS_ROOT)) {
    const ext = "." + rel.split(".").pop();
    if (!EXT_ALLOWLIST.has(ext)) continue;

    // Test files are allowed to pin the expected literal value — that's
    // the whole point of the parity check.
    if (rel.endsWith(".test.mjs")) continue;

    const content = readFileSync(full, "utf8");
    if (/#0d0d0d/i.test(content)) {
      offenders.push(rel);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Found hardcoded #0d0d0d literals in packages/docs/. ` +
      `Use readBrandTokenColor('--bg-page') instead. Files:\n` +
      offenders.map((f) => `  - ${f}`).join("\n")
  );
});

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const STYLE_BLOCK_RE = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const WHOLE_FILE_STYLE_EXTS = new Set([".css", ".scss"]);
const STYLE_BLOCK_EXTS = new Set([".md", ".vue", ".html"]);

function hexHits(text, rel, lineOffset = 0) {
  const hits = [];
  for (const match of text.matchAll(HEX_RE)) {
    const line = lineOffset + text.slice(0, match.index).split("\n").length;
    hits.push(`${rel}:${line} ${match[0]}`);
  }
  return hits;
}

test("no hex color literal in style contexts under packages/docs/", () => {
  const offenders = [];
  for (const { full, rel } of walk(DOCS_ROOT)) {
    const ext = "." + rel.split(".").pop();
    if (rel.endsWith(".test.mjs")) continue;

    const content = readFileSync(full, "utf8");
    if (WHOLE_FILE_STYLE_EXTS.has(ext)) {
      offenders.push(...hexHits(content, rel));
    } else if (STYLE_BLOCK_EXTS.has(ext)) {
      for (const block of content.matchAll(STYLE_BLOCK_RE)) {
        const before = content.slice(0, block.index);
        // -1: the block's first line is the same line the <style> tag ends on.
        offenders.push(
          ...hexHits(block[1], rel, before.split("\n").length - 1)
        );
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Found hex color literals in style contexts under packages/docs/. ` +
      `Style with role tokens (var(--control), var(--control-ink), ...) so ` +
      `both themes resolve; a literal is invisible to exactly one of them.\n` +
      offenders.map((f) => `  - ${f}`).join("\n")
  );
});
