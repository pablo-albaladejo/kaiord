#!/usr/bin/env node
/**
 * Mechanical guard: enforce the theme-adaptive styling dialect in the
 * SPA component tree.
 *
 * Light and dark mode share one component tree; the only theme-correct
 * dialects are (a) semantic utilities that resolve through the
 * :root/.dark tokens in packages/workout-spa-editor/src/index.css
 * (bg-surface*, text-ink-*, border-edge*, text-accent, …) and (b) the
 * classic paired dialect (`bg-white … dark:bg-slate-800`). Unconditional
 * dark-slate utilities render dark surfaces / near-white text in BOTH
 * themes, which is exactly the light-mode regression this guard pins.
 *
 * Rules:
 *   R-ThemeDarkOnly  — a dark-palette utility appears without a `dark:`
 *                      variant in its prefix chain. Tokens:
 *                      bg-slate-700..950, bg-primary-900,
 *                      text-slate-50/100/200, border-slate-700/800,
 *                      divide-slate-700/800, text-sky-400.
 *   R-ThemeBareBorder — a `border`/`border-{t,b,l,r,x,y}` utility inside
 *                      a plain string className with no border color
 *                      token in the same string. Tailwind v4 defaults
 *                      border-color to currentColor, which reads as
 *                      near-black on the light theme.
 *
 * Detection is regex-based over string content (same lightweight
 * approach as check-no-library-dual-mount.mjs). R-ThemeBareBorder only
 * inspects `className="…"` / className={`…`} literals — class lists
 * assembled from arrays or variables are out of reach and rely on
 * review. Exceptions live in ALLOWLIST (posix paths relative to the
 * repo root); it ships empty and must shrink-only (R-AllowlistsEmpty).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_COMPONENTS = join(
  REPO_ROOT,
  "packages",
  "workout-spa-editor",
  "src",
  "components"
);

export const ALLOWLIST = new Set();

const TS_EXTENSIONS = [".ts", ".tsx"];
const SKIP_EXTENSIONS = [
  ".test.ts",
  ".test.tsx",
  ".spec.ts",
  ".spec.tsx",
  ".stories.ts",
  ".stories.tsx",
];

// A candidate utility optionally preceded by a variant chain — named
// (`hover:`, `md:`, `dark:hover:`, …) or arbitrary (`[&>*+*]:`). The
// chain decides legality.
const DARK_ONLY_RE =
  /((?:(?:[a-zA-Z-]+|\[[^\]]*\]):)*)(bg-slate-(?:700|800|900|950)|bg-primary-900|text-slate-(?:50|100|200)|(?:border|divide)-slate-(?:700|800)|text-sky-400)(?:\/\d+)?(?![\w-])/g;

const CLASSNAME_LITERAL_RE =
  /className\s*=\s*(?:"([^"]*)"|\{\s*`([^`]*)`\s*\})/g;
const BARE_BORDER_RE =
  /(?:^|\s)(?:[a-zA-Z-]+:)*border(?:-[tblrxy])?(?:-[248])?(?=\s|$)/;
const BORDER_COLOR_RE =
  /border-(?:[a-z]+-\d{1,3}(?:\/\d+)?|edge(?:-soft)?|accent|primary|white|black|transparent|current|inherit|\[)/;

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function shouldScan(name) {
  if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) return false;
  return TS_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function walk(dir, visit) {
  if (!safeStat(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, visit);
    } else if (entry.isFile() && shouldScan(entry.name)) {
      visit(p);
    }
  }
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

function findDarkOnly(source, rel, violations) {
  for (const m of source.matchAll(DARK_ONLY_RE)) {
    const [, variants, token] = m;
    if (variants.includes("dark:")) continue;
    violations.push({
      rule: "R-ThemeDarkOnly",
      file: rel,
      line: lineOf(source, m.index),
      detail: token,
    });
  }
}

function findBareBorder(source, rel, violations) {
  for (const m of source.matchAll(CLASSNAME_LITERAL_RE)) {
    const value = m[1] ?? m[2] ?? "";
    // Interpolated templates may receive their border color through the
    // expression — undecidable statically, so leave them to review.
    if (value.includes("${")) continue;
    if (!BARE_BORDER_RE.test(value)) continue;
    if (BORDER_COLOR_RE.test(value)) continue;
    violations.push({
      rule: "R-ThemeBareBorder",
      file: rel,
      line: lineOf(source, m.index),
      detail: value.trim().slice(0, 60),
    });
  }
}

export function runCheck({ srcRoot } = {}) {
  const root = srcRoot ?? SPA_COMPONENTS;
  const violations = [];
  walk(root, (file) => {
    const rel = relative(REPO_ROOT, file).replaceAll("\\", "/");
    if (ALLOWLIST.has(rel)) return;
    const source = readFileSync(file, "utf8");
    findDarkOnly(source, rel, violations);
    findBareBorder(source, rel, violations);
  });
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ Theme dialect guard: no dark-only styling found.");
    process.exit(0);
  }
  console.error("❌ Theme dialect violations:");
  for (const v of found) {
    console.error(`  [${v.rule}] ${v.file}:${v.line} — ${v.detail}`);
  }
  console.error(
    "  Remediation: use the adaptive utilities from src/index.css (bg-surface*, text-ink-*, border-edge*, text-accent) or pair the class with a dark: variant."
  );
  process.exit(1);
}
