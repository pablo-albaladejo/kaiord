/**
 * Mechanical guard: nothing in the SPA makes scrolling glide by default.
 *
 * A smooth `scroll-behavior` on the document or on any scroll container
 * animates every scroll the app or the browser starts without naming a
 * behaviour: route and section resets, focus moves, `scrollIntoView`. The
 * glide moves the page under a press already started, the release lands on
 * another element, and the press is lost (#1437, #1456, #1457). spa-motion
 * keeps glides per call: `scrollIntoView({ behavior: "smooth" })` behind a
 * reduced-motion check, which this guard does not flag.
 *
 * Flags `scroll-behavior: smooth` in CSS, a `scrollBehavior: "smooth"` style
 * in TS/TSX, and Tailwind's `scroll-smooth` utility. Comment lines are skipped.
 *
 * Rule id: R-NoGlobalSmoothScroll.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ROOT = join(REPO, "packages", "workout-spa-editor", "src");

const PATTERNS = {
  ".css": [/scroll-behavior\s*:\s*smooth/g, /@apply[^;]*\bscroll-smooth\b/g],
  ".ts": [/scrollBehavior\s*:\s*["'`]smooth/g, /\bscroll-smooth\b/g],
  ".tsx": [/scrollBehavior\s*:\s*["'`]smooth/g, /\bscroll-smooth\b/g],
};

/** Ships empty and must stay that way (R-AllowlistsEmpty). */
export const ALLOWLIST = new Set();

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage"]);

const isCommentLine = (line) => /^\s*(?:\/\/|\/\*|\*)/.test(line);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (PATTERNS[extname(entry)]) yield full;
  }
}

export function runCheck({ srcRoot = DEFAULT_ROOT } = {}) {
  const violations = [];
  for (const file of walk(srcRoot)) {
    const rel = relative(REPO, file);
    if (ALLOWLIST.has(rel)) continue;
    const patterns = PATTERNS[extname(file)];
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        if (isCommentLine(line)) return;
        for (const re of patterns) {
          for (const match of line.matchAll(re)) {
            violations.push({
              rule: "R-NoGlobalSmoothScroll",
              file: rel,
              line: index + 1,
              detail: match[0],
            });
          }
        }
      });
  }
  return violations;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ No default smooth scrolling in the SPA.");
  } else {
    console.error("❌ Default smooth scrolling found:");
    for (const v of found) {
      console.error(`  [${v.rule}] ${v.file}:${v.line} — ${v.detail}`);
    }
    console.error(
      '  Remediation: leave scroll-behavior at its default. A caller that wants a glide passes behavior: "smooth" on that call, and a jump under prefers-reduced-motion: reduce (see openspec/specs/spa-motion).'
    );
    process.exit(1);
  }
}
