#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Server-driven SPA fallback for GitHub Pages-equivalent hosts:
// - Append a redirect script to `<dir>/404.html` that captures any /editor/*
//   deep link into a ?p= query and bounces to /editor/?p=...
// - Also bounce a closed allowlist of legacy SPA routes (`/calendar`,
//   `/library`, `/workout/...`) to their `/editor/<path>` equivalent so
//   bookmarks made before the wouter base alignment fix keep working.
// - Inject a decoder snippet at the top of `<dir>/editor/index.html` <head>
//   that runs synchronously before React boots, restoring the original URL
//   via history.replaceState. Other 404s fall through unchanged.
//
// This helper is the single source of truth shared by the deploy workflow
// (.github/workflows/deploy-site.yml) and the production-base e2e fixture
// (packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts).

const REDIRECT_SCRIPT = `
<script>
  (function () {
    var l = window.location;
    var p = l.pathname;
    if (p.indexOf('/editor/') === 0) {
      l.replace(
        l.protocol + '//' + l.host +
          '/editor/?p=' +
          encodeURIComponent(p + l.search) +
          l.hash
      );
      return;
    }
    // Legacy bookmarks: match the SPA's top-level wouter routes at root.
    // Allowlist is intentionally narrow so unrelated 404s still surface
    // the landing's blue 404 page.
    if (/^\\/(calendar(\\/|$)|library$|workout(\\/|$))/.test(p)) {
      l.replace(
        l.protocol + '//' + l.host +
          '/editor/?p=' +
          encodeURIComponent('/editor' + p + l.search) +
          l.hash
      );
    }
  })();
</script>
`;

const DECODER_SNIPPET =
  "<script>" +
  "(function(){" +
  'var p=new URLSearchParams(window.location.search).get("p");' +
  "if(p){var d=decodeURIComponent(p);" +
  'window.history.replaceState(null,"",d+window.location.hash);}' +
  "})();" +
  "</script>";

export function injectSpaFallback(mergedDistDir) {
  const dir = resolve(mergedDistDir);
  const fourOhFour = resolve(dir, "404.html");
  const editorIndex = resolve(dir, "editor/index.html");

  appendFileSync(fourOhFour, REDIRECT_SCRIPT);

  const html = readFileSync(editorIndex, "utf8");
  const injected = html.replace(/<head>/, `<head>\n    ${DECODER_SNIPPET}`);
  if (injected === html) {
    throw new Error(`Could not find <head> in ${editorIndex}`);
  }
  writeFileSync(editorIndex, injected);

  const verify404 = readFileSync(fourOhFour, "utf8");
  if (!verify404.includes("indexOf('/editor/')")) {
    throw new Error("404.html redirect script missing after injection");
  }
  const verifyEditor = readFileSync(editorIndex, "utf8");
  if (!verifyEditor.includes("URLSearchParams")) {
    throw new Error("editor/index.html decoder missing after injection");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2];
  if (!target) {
    console.error(
      "Usage: node scripts/inject-spa-fallback.mjs <merged-dist-dir>"
    );
    process.exit(1);
  }
  injectSpaFallback(target);
  console.log("✅ SPA route fallback injected");
}
