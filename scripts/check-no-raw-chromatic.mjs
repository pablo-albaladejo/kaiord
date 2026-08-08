/**
 * Mechanical guard: no raw chromatic Tailwind utility inside the SPA.
 *
 * The palette is achromatic neutrals + five zone hues + one danger ramp, and
 * the layer rule is that a component may only ever name a role. A raw
 * `text-red-600` is neither role nor ramp — it is outside the system — and
 * no check the rebrand shipped could see it: the Definition of done greps
 * for literal hex and `--brand-*` names, and a Tailwind utility is neither.
 * That blind spot is how ~90 files kept their hues through four waves of
 * rebrand with CI green.
 *
 * Neutral families (gray/slate/zinc/neutral/stone) are NOT flagged: the
 * theme remaps gray onto slate wholesale and those are the achromatic steps
 * the system is built from. Zone and danger utilities are roles and pass by
 * construction, since they carry no family name.
 *
 * Rule id: R-NoRawChromatic.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ROOT = join(REPO, "packages", "workout-spa-editor", "src");

/** Every hue Tailwind ships. The neutral families are deliberately absent. */
const CHROMATIC_FAMILIES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

/* The utility prefixes that actually paint. `placeholder-` and `divide-` are
   included because both were found carrying a retired hue. */
const PAINTING_PREFIXES =
  "(?:bg|text|border|ring|divide|placeholder|from|via|to|shadow|outline|accent|caret|decoration|fill|stroke)";

const CHROMATIC_RE = new RegExp(
  `\\b(?:[a-zA-Z-]+:)*${PAINTING_PREFIXES}-(?:${CHROMATIC_FAMILIES.join("|")})-\\d{2,3}(?:/\\d+)?\\b`,
  "g"
);

/** Ships empty and must stay that way (R-AllowlistsEmpty). */
export const ALLOWLIST = new Set();

const EXTENSIONS = new Set([".ts", ".tsx"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage"]);

/* A comment may name a retired hue: several files explain WHY a colour left,
   and naming the thing you forbid is how the reasoning survives. Only the
   code is scanned. */
const isCommentLine = (line) => /^\s*(?:\/\/|\/\*|\*)/.test(line);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(extname(entry))) yield full;
  }
}

export function runCheck({ srcRoot = DEFAULT_ROOT } = {}) {
  const violations = [];
  for (const file of walk(srcRoot)) {
    const rel = relative(REPO, file);
    if (ALLOWLIST.has(rel)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (isCommentLine(line)) return;
      for (const match of line.matchAll(CHROMATIC_RE)) {
        violations.push({
          rule: "R-NoRawChromatic",
          file: rel,
          line: index + 1,
          detail: match[0],
        });
      }
    });
  }
  return violations;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ No raw chromatic utility in the SPA.");
  } else {
    console.error("❌ Raw chromatic utilities found:");
    for (const v of found) {
      console.error(`  [${v.rule}] ${v.file}:${v.line} — ${v.detail}`);
    }
    console.error(
      "  Remediation: name a role — zone-1..5 for training zones, danger/danger-bg/danger-text/danger-border for destructive states, action for a surface's primary action, or the neutral surface/ink/edge utilities. Warning and success left the palette: say it with an icon and a sentence."
    );
    process.exit(1);
  }
}
