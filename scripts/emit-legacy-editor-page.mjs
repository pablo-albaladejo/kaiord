#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Serves the exact `/editor/` URL with a real 200 page.
//
// Every legacy `/editor/*` URL reaches the SPA through the redirect script
// that `inject-spa-fallback.mjs` puts in `404.html`. Browsers never notice,
// but crawlers and link checkers see the 404 status and stop there, so
// `kaiord.com/editor/` (the URL five published extensions and years of links
// point at) reads as a dead page. This script adds `editor/index.html` next
// to the bridge without touching it: the bridge keeps answering every deeper
// `/editor/<route>` path, and this page answers the bare prefix.
//
// The page carries:
//   - the same redirect expression as the bridge, so JS clients land on the
//     same `/app/#…` target (search included). `emit-legacy-editor-page.test.mjs`
//     runs both scripts over one URL table and asserts identical targets.
//   - `rel="canonical"` to `https://kaiord.com/app/`, so engines consolidate
//     the old URL into the new one. No `noindex`: the canonical is the signal.
//   - a zero-delay meta refresh and a visible link for clients without JS.
//     Static HTML cannot append the query string, so non-JS clients land on
//     `/app/` without it. Only crawlers and no-JS agents take that path, and
//     the canonical already points there.
//
// It must run after `inject-spa-fallback.mjs` and refuses to run otherwise:
// a page for the prefix without the bridge for the deeper paths would be a
// half-migrated site.

const LEGACY_PATH_PREFIX = "/editor/";
const APP_BASE = "/app/";
const CANONICAL_URL = "https://kaiord.com/app/";

export const BRIDGE_MARKER = `indexOf('${LEGACY_PATH_PREFIX}')`;

const REDIRECT_SCRIPT =
  "<script>" +
  "(function(){" +
  "var l=window.location;var p=l.pathname;" +
  `if(p.${BRIDGE_MARKER}===0){` +
  `l.replace('${APP_BASE}#'+p.slice(${LEGACY_PATH_PREFIX.length - 1})+l.search);` +
  "}" +
  "})();" +
  "</script>";

export const LEGACY_EDITOR_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${REDIRECT_SCRIPT}
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kaiord editor moved to /app/</title>
    <link rel="canonical" href="${CANONICAL_URL}" />
    <meta http-equiv="refresh" content="0; url=${APP_BASE}" />
  </head>
  <body>
    <p>The Kaiord editor now lives at <a href="${APP_BASE}">kaiord.com/app/</a>.</p>
  </body>
</html>
`;

export function emitLegacyEditorPage(mergedDistDir) {
  const dir = resolve(mergedDistDir);
  const fourOhFour = resolve(dir, "404.html");
  const target = resolve(dir, "editor/index.html");

  if (
    !existsSync(fourOhFour) ||
    !readFileSync(fourOhFour, "utf8").includes(BRIDGE_MARKER)
  ) {
    throw new Error(
      `${fourOhFour}: legacy /editor/ bridge not found. Run scripts/inject-spa-fallback.mjs first.`
    );
  }
  if (existsSync(target)) {
    throw new Error(
      `${target} already exists; refusing to overwrite it with the legacy /editor/ page.`
    );
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, LEGACY_EDITOR_PAGE);
  return target;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv[2];
  if (!dist) {
    console.error(
      "Usage: node scripts/emit-legacy-editor-page.mjs <merged-dist-dir>"
    );
    process.exit(1);
  }
  const written = emitLegacyEditorPage(dist);
  console.log(`✅ Legacy /editor/ page written to ${written}`);
}
