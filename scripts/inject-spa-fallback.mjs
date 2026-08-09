#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Bridge for SPA URLs that carry the route in the path.
//
// The app itself no longer produces them: wouter is mounted on the hash
// location, so the browser always requests `/app/`, a file that exists, and
// every route resolves in one 200 response. What remains are URLs already in
// the wild — shared links, bookmarks, and the "Open editor" link inside five
// published extensions whose store updates are gated on a review outside this
// project's control. Those still land on the host's 404, so this script gives
// them a way home.
//
// The script goes in `<head>`. Appended after `</body>` — where it lived —
// the browser parses and paints the entire error page before reaching it,
// which is exactly the flash this bridge exists to avoid.

const LEGACY_PATH_PREFIX = "/editor/";
const APP_BASE = "/app/";

const REDIRECT_SNIPPET =
  "<script>" +
  "(function(){" +
  "var l=window.location;var p=l.pathname;" +
  `if(p.indexOf('${LEGACY_PATH_PREFIX}')===0){` +
  `l.replace('${APP_BASE}#'+p.slice(${LEGACY_PATH_PREFIX.length - 1})+l.search);` +
  "return;}" +
  // Legacy bookmarks from before the SPA lived under a prefix at all. The
  // allowlist stays narrow so an unrelated 404 still shows the landing's own
  // error page instead of being swallowed into the app.
  "if(/^\\/(calendar(\\/|$)|library$|workout(\\/|$))/.test(p)){" +
  `l.replace('${APP_BASE}#'+p+l.search);}` +
  "})();" +
  "</script>";

// `?p=` was the previous bridge's carrier. Links minted while it was live are
// still out there, so the shell keeps translating them — into the hash form
// the router now reads.
const DECODER_SNIPPET =
  "<script>" +
  "(function(){" +
  'var p=new URLSearchParams(window.location.search).get("p");' +
  "if(!p)return;" +
  "var d=decodeURIComponent(p);" +
  `if(d.indexOf('${LEGACY_PATH_PREFIX}')===0)d=d.slice(${LEGACY_PATH_PREFIX.length - 1});` +
  `window.history.replaceState(null,"",'${APP_BASE}#'+d);` +
  "})();" +
  "</script>";

const injectIntoHead = (html, snippet, file) => {
  const injected = html.replace(/<head>/, `<head>\n    ${snippet}`);
  if (injected === html) {
    throw new Error(`Could not find <head> in ${file}`);
  }
  return injected;
};

/**
 * Index of the first byte a browser would paint. A snippet placed after this
 * runs too late by construction, however present it is.
 */
const firstVisibleMarkupIndex = (html) => {
  const body = html.indexOf("<body");
  if (body === -1) return html.length;
  const afterOpenTag = html.indexOf(">", body);
  return afterOpenTag === -1 ? body : afterOpenTag + 1;
};

export const assertPrecedesVisibleMarkup = (html, needle, file) => {
  const at = html.indexOf(needle);
  if (at === -1) {
    throw new Error(`${file}: redirect script missing after injection`);
  }
  const visible = firstVisibleMarkupIndex(html);
  if (at > visible) {
    throw new Error(
      `${file}: redirect script sits at ${at}, after the first visible markup at ${visible}. ` +
        "The browser paints the error page before running it — inject into <head>."
    );
  }
};

export function injectSpaFallback(mergedDistDir) {
  const dir = resolve(mergedDistDir);
  const fourOhFour = resolve(dir, "404.html");
  const appIndex = resolve(dir, "app/index.html");

  writeFileSync(
    fourOhFour,
    injectIntoHead(
      readFileSync(fourOhFour, "utf8"),
      REDIRECT_SNIPPET,
      fourOhFour
    )
  );
  writeFileSync(
    appIndex,
    injectIntoHead(readFileSync(appIndex, "utf8"), DECODER_SNIPPET, appIndex)
  );

  assertPrecedesVisibleMarkup(
    readFileSync(fourOhFour, "utf8"),
    `indexOf('${LEGACY_PATH_PREFIX}')`,
    fourOhFour
  );
  if (!readFileSync(appIndex, "utf8").includes("URLSearchParams")) {
    throw new Error(`${appIndex}: decoder missing after injection`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = process.argv[2];
  if (!target) {
    console.error(
      "Usage: node scripts/inject-spa-fallback.mjs <merged-dist-dir>"
    );
    process.exit(1);
  }
  injectSpaFallback(target);
  console.log("✅ Legacy SPA path bridge injected");
}
