#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

// Initial-JS budget for the SPA (`/app/`).
//
// What the browser must download before the first route renders is the
// entry `<script type="module">` plus every `<link rel="modulepreload">`
// Vite writes into `dist/index.html`. This script sums the gzip size of
// exactly those files, so a static import that drags a heavy module back
// into the entry graph fails CI instead of silently costing Lighthouse
// points. Lazy route chunks are not counted: they load on navigation.
//
// Budget: 272.1 kB measured after the perf-app-initial-js change, x 1.05.
// Raise it only with evidence (docs/seo-observatory.md, "SPA initial-JS
// budget").
//
// The byte budget alone can't catch a regression that reverts one of the
// lazy seams from that change: each seam only saves ~1.4 kB against ~14 kB
// of budget headroom, so pulling one back into the entry graph slips under
// the budget while defeating the point of the seam. Worse, a static import
// of a lazy seam's module doesn't necessarily produce a new, separately
// named chunk to catch by filename: rolldown inlines it into whichever
// already-initial chunk imported it (confirmed empirically — see the PR
// description). So this script instead reads each initial file's
// sourcemap `sources` list (build.sourcemap is on) and fails if any of
// them is one of the lazy seams' own source files. Keep
// FORBIDDEN_LAZY_SOURCES in sync with the seams, all wired through
// `src/lazy-pages.ts`:
// - `src/adapters/cloud-sync/create-app-cloud-sync.ts` (behind `createLazyCloudSync`, loaded from `main.tsx`)
// - `src/components/pages/health/health-routes.tsx` (`HealthSubRouter`)
// - `src/new-workout-route.tsx` (`NewWorkoutRoute`)
// - `src/components/pages/ConvertPage/ConvertPage.tsx` (`ConvertPage`, the
//   docs' converter deep link; every other route must not pay for it)
//
// Usage: node scripts/check-spa-initial-js.mjs <spa-dist> [--report]
// Exit 1 when <spa-dist>/index.html is missing, has no recognisable entry
// script, a forbidden lazy-seam source shows up in an initial file, or the
// total is over budget.

export const SPA_INITIAL_JS_BUDGET_KB = 286;

export const FORBIDDEN_LAZY_SOURCES = [
  "src/adapters/cloud-sync/create-app-cloud-sync.ts",
  "src/components/pages/health/health-routes.tsx",
  "src/new-workout-route.tsx",
  "src/components/pages/ConvertPage/ConvertPage.tsx",
];

// The entry chunk MUST have a sourcemap: a static import of a seam gets
// inlined there, and treating a missing map as "no sources" would switch
// the forbidden-source check off silently (for example if build.sourcemap
// were turned off) while the byte budget kept passing. Other initial files
// may lack one: rolldown emits map-less chunks that hold no app source
// (the preload helper, one-line re-export facades).
/** The `sources` list of a chunk's sourcemap ([] if optional and absent). */
function mapSources(jsFile, required) {
  const mapFile = `${jsFile}.map`;
  if (!existsSync(mapFile)) {
    if (!required) return [];
    throw new Error(`sourcemap ${mapFile} not found: is build.sourcemap on?`);
  }
  const sources = JSON.parse(readFileSync(mapFile, "utf8")).sources;
  if (!Array.isArray(sources)) {
    throw new Error(`sourcemap ${mapFile} has no sources list`);
  }
  return sources;
}

/** Forbidden lazy-seam sources bundled into this chunk, if any. */
function forbiddenSources(jsFile, isEntry) {
  const sources = mapSources(jsFile, isEntry).map((s) => s.replace(/\\/g, "/"));
  return FORBIDDEN_LAZY_SOURCES.filter((forbidden) =>
    sources.some((source) => source.endsWith(forbidden))
  );
}

const ATTR = /<(script|link)\b[^>]*>/gi;

/** A quoted/single-quoted/unquoted HTML attribute value, or undefined. */
function attrValue(tag, name) {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  ).exec(tag);
  if (!match) return undefined;
  return match[1] ?? match[2] ?? match[3];
}

/** Paths (as written in the HTML) of the entry script and modulepreloads. */
export function initialScripts(html) {
  return initialTags(html).map((t) => t.url);
}

function initialTags(html) {
  const out = [];
  for (const [tag, name] of html.matchAll(ATTR)) {
    const src = attrValue(tag, "src");
    const href = attrValue(tag, "href");
    if (
      name.toLowerCase() === "script" &&
      attrValue(tag, "type")?.toLowerCase() === "module" &&
      src
    ) {
      out.push({ url: src, entry: true });
    } else if (
      attrValue(tag, "rel")?.toLowerCase() === "modulepreload" &&
      href
    ) {
      out.push({ url: href, entry: false });
    }
  }
  return out.filter((t) => !/^https?:\/\//.test(t.url));
}

/** Resolve `/app/assets/x.js` or `/assets/x.js` to a file inside dist. */
function resolveInDist(dist, url) {
  const parts = url.split(/[?#]/)[0].split("/").filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const candidate = join(dist, ...parts.slice(i));
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`initial script ${url} not found under ${dist}`);
}

export function measureInitialJs(dist) {
  const index = join(dist, "index.html");
  if (!existsSync(index)) {
    throw new Error(
      `${index} is missing: build the SPA first (pnpm --filter @kaiord/workout-spa-editor build)`
    );
  }
  const tags = initialTags(readFileSync(index, "utf8"));
  if (!tags.some((t) => t.entry)) {
    throw new Error(
      `no <script type="module" src> entry found in ${index}: the build is broken`
    );
  }
  const files = tags.map(({ url, entry }) => {
    const path = resolveInDist(dist, url);
    const bytes = readFileSync(path);
    return {
      url,
      raw: bytes.length,
      gzip: gzipSync(bytes, { level: 9 }).length,
      forbidden: forbiddenSources(path, entry),
    };
  });
  const gzip = files.reduce((sum, f) => sum + f.gzip, 0);
  return { files, gzip };
}

export function checkBudget(dist, budgetKb = SPA_INITIAL_JS_BUDGET_KB) {
  const { files, gzip } = measureInitialJs(dist);
  const forbidden = files
    .filter((f) => f.forbidden.length > 0)
    .map((f) => `${f.url} (${f.forbidden.join(", ")})`);
  return {
    files,
    gzip,
    budget: budgetKb * 1024,
    forbidden,
    ok: gzip <= budgetKb * 1024 && forbidden.length === 0,
  };
}

function fail(message) {
  console.error(`check-spa-initial-js: ${message}`);
  process.exit(1);
}

function main() {
  const [dist, flag] = process.argv.slice(2);
  if (!dist) fail("usage: check-spa-initial-js.mjs <spa-dist> [--report]");
  let result;
  try {
    result = checkBudget(resolve(dist));
  } catch (error) {
    fail(error.message);
  }
  const kb = (n) => (n / 1024).toFixed(1);
  if (flag === "--report") {
    for (const f of [...result.files].sort((a, b) => b.gzip - a.gzip)) {
      console.log(
        `${kb(f.gzip).padStart(8)} kB gz  ${kb(f.raw).padStart(8)} kB  ${f.url}`
      );
    }
  }
  if (result.forbidden.length > 0) {
    fail(
      `forbidden lazy-seam source in the initial JS: ${result.forbidden.join(", ")}. ` +
        "One of the perf-app-initial-js lazy seams (cloud sync, health routes, " +
        "new-workout route) was pulled back into the entry graph by a static " +
        "import — see FORBIDDEN_LAZY_SOURCES in this script."
    );
  }
  const line = `SPA initial JS: ${kb(result.gzip)} kB gzip across ${result.files.length} files (budget ${kb(result.budget)} kB)`;
  if (!result.ok) fail(`over budget. ${line}`);
  console.log(line);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
