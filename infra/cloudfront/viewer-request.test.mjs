/*
 * The cases are the URL shapes kaiord.com answers 200 to today, measured
 * against production before the origin moves. S3's REST endpoint resolves no
 * index and appends no extension, so each of them has to survive the move —
 * a rewrite that only fixes the editor would take the docs down with it.
 *
 * The function is loaded from its own file and evaluated as CloudFront does,
 * rather than imported: the deployed artifact is this exact source, and a
 * test that exercised an ESM copy would be testing something else.
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SOURCE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "viewer-request.js"),
  "utf8"
);
const handler = new Function(`${SOURCE}; return handler;`)();

const run = (uri) => handler({ request: { uri, headers: {} } });

test("serves the editor's own deep routes from its shell", () => {
  // The reported bug: these answered 404 first and redirected afterwards.
  for (const uri of [
    "/editor/calendar/2026-W32",
    "/editor/workout/9f0c0f2e-1b5a-4a6e-9c2e-0f1d2b3a4c5d",
    "/editor/workout/view/abc",
    "/editor/library",
    "/editor/settings/connections",
    "/editor/health/labs",
  ]) {
    assert.equal(run(uri).uri, "/editor/index.html", uri);
  }
});

test("resolves a directory index for every trailing slash", () => {
  assert.equal(run("/").uri, "/index.html");
  assert.equal(run("/es/").uri, "/es/index.html");
  assert.equal(run("/docs/").uri, "/docs/index.html");
  assert.equal(run("/editor/").uri, "/editor/index.html");
});

test("appends .html under docs, which is built with cleanUrls", () => {
  assert.equal(
    run("/docs/guide/getting-started").uri,
    "/docs/guide/getting-started.html"
  );
  assert.equal(run("/docs/api/core").uri, "/docs/api/core.html");
});

test("never rewrites a path that names a file", () => {
  for (const uri of [
    "/assets/index-CPbgvt1n.css",
    "/editor/assets/index-D0AgjQ6E.js",
    "/editor/assets/use-selected-activity-DjKuVWU9.js",
    "/docs/assets/style.css",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/favicon.svg",
    "/404.html",
  ]) {
    assert.equal(run(uri).uri, uri, uri);
  }
});

test("redirects a bare directory at the root, as the site does today", () => {
  // Measured against production: /es answers 301 to /es/.
  const response = run("/es");
  assert.equal(response.statusCode, 301);
  assert.equal(response.headers.location.value, "/es/");
});

test("leaves an unknown root path to the origin, so the landing 404 still shows", () => {
  // Not a rewrite and not the SPA: it redirects to the slashed form, and the
  // origin answers 404 there. The narrow editor rule is what keeps a genuine
  // 404 reachable instead of swallowing every unknown URL into the app.
  const response = run("/no-such-page");
  assert.equal(response.statusCode, 301);
  assert.equal(response.headers.location.value, "/no-such-page/");
});

test("keeps the query string untouched — the SPA reads it", () => {
  const request = {
    uri: "/editor/calendar/2026-W32",
    querystring: "from=chat",
  };
  const out = handler({ request });
  assert.equal(out.uri, "/editor/index.html");
  assert.equal(out.querystring, "from=chat");
});
