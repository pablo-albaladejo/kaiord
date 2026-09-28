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
// Usage: node scripts/check-spa-initial-js.mjs <spa-dist> [--report]
// Exit 1 when <spa-dist>/index.html is missing or the total is over budget.

export const SPA_INITIAL_JS_BUDGET_KB = 286;

const ATTR = /<(script|link)\b[^>]*>/gi;

/** Paths (as written in the HTML) of the entry script and modulepreloads. */
export function initialScripts(html) {
  const out = [];
  for (const [tag, name] of html.matchAll(ATTR)) {
    const src = /\bsrc="([^"]+)"/.exec(tag)?.[1];
    const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
    if (name.toLowerCase() === "script" && /type="module"/.test(tag) && src) {
      out.push(src);
    } else if (/rel="modulepreload"/.test(tag) && href) {
      out.push(href);
    }
  }
  return out.filter((p) => !/^https?:\/\//.test(p));
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
  const files = initialScripts(readFileSync(index, "utf8")).map((url) => {
    const bytes = readFileSync(resolveInDist(dist, url));
    return {
      url,
      raw: bytes.length,
      gzip: gzipSync(bytes, { level: 9 }).length,
    };
  });
  const gzip = files.reduce((sum, f) => sum + f.gzip, 0);
  return { files, gzip };
}

export function checkBudget(dist, budgetKb = SPA_INITIAL_JS_BUDGET_KB) {
  const { files, gzip } = measureInitialJs(dist);
  return { files, gzip, budget: budgetKb * 1024, ok: gzip <= budgetKb * 1024 };
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
