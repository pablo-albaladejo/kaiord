#!/usr/bin/env node
// Rule R-CssAssetUrls: every absolute `url()` in a built stylesheet MUST
// resolve to a file inside the build it ships with.
//
// A stylesheet that names `/editor/fonts/x.woff2` from an app served under
// `/app/` 404s on every page load, and nothing else notices: the browser
// falls back to a system font silently. The check strips the deploy base
// from each absolute URL and requires the remainder to exist in the dist
// folder. `data:` URIs, remote URLs and relative URLs are not paths into the
// build and are skipped.
//
// Usage: node scripts/check-css-asset-urls.mjs --dist <dir> --base </app/>

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

/** Absolute, same-origin URLs in a stylesheet, without query or hash. */
export function absoluteUrls(css) {
  const urls = new Set();
  for (const [, , raw] of css.matchAll(URL_RE)) {
    const url = raw.trim();
    if (!url.startsWith("/") || url.startsWith("//")) continue;
    urls.add(url.split(/[?#]/)[0]);
  }
  return [...urls];
}

/** URLs from `css` that are outside `base` or missing from `dist`. */
export function brokenUrls(css, { dist, base }) {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return absoluteUrls(css).filter((url) => {
    if (!url.startsWith(prefix)) return true;
    return !existsSync(join(dist, url.slice(prefix.length)));
  });
}

export function checkDist({ dist, base }) {
  const assets = join(dist, "assets");
  const sheets = existsSync(assets)
    ? readdirSync(assets).filter((f) => f.endsWith(".css"))
    : [];
  if (sheets.length === 0)
    return { sheets: 0, broken: [`no stylesheet in ${assets}`] };
  const broken = sheets.flatMap((sheet) =>
    brokenUrls(readFileSync(join(assets, sheet), "utf8"), { dist, base }).map(
      (url) => `${sheet}: ${url}`
    )
  );
  return { sheets: sheets.length, broken };
}

function parseArgs(argv) {
  const value = (flag) => {
    const at = argv.indexOf(flag);
    return at === -1 ? undefined : argv[at + 1];
  };
  const dist = value("--dist");
  const base = value("--base");
  if (!dist || !base)
    throw new Error("usage: check-css-asset-urls --dist <dir> --base <base>");
  return { dist, base };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const { sheets, broken } = checkDist(args);
  if (broken.length > 0) {
    console.error(`❌ R-CssAssetUrls: url() not served under ${args.base}`);
    for (const line of broken) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log(`✅ R-CssAssetUrls: ${sheets} stylesheet(s) resolve`);
}
