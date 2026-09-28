import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  checkBudget,
  FORBIDDEN_LAZY_SOURCES,
  initialScripts,
  SPA_INITIAL_JS_BUDGET_KB,
} from "./check-spa-initial-js.mjs";

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "check-spa-initial-js.mjs"
);

const INDEX = `<!doctype html><html><head>
<script type="module" crossorigin src="/app/assets/index-a.js"></script>
<link rel="modulepreload" crossorigin href="/app/assets/vendor-b.js">
<link rel="stylesheet" crossorigin href="/app/assets/index-c.css">
<script src="https://cloud.umami.is/script.js"></script>
</head><body></body></html>`;

const run = (dist) =>
  spawnSync(process.execPath, [SCRIPT, dist], { encoding: "utf8" });

describe("check-spa-initial-js", () => {
  let dist;

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), "spa-initial-js-"));
    mkdirSync(join(dist, "assets"));
    writeFileSync(join(dist, "index.html"), INDEX);
    writeFileSync(
      join(dist, "assets", "index-a.js"),
      "console.log('entry');\n".repeat(50)
    );
    writeFileSync(join(dist, "assets", "vendor-b.js"), "export const b = 1;\n");
    writeFileSync(
      join(dist, "assets", "lazy-route.js"),
      randomBytes(400 * 1024)
    );
  });

  afterEach(() => rmSync(dist, { recursive: true, force: true }));

  it("counts only the entry module and the modulepreloads", () => {
    assert.deepEqual(initialScripts(INDEX), [
      "/app/assets/index-a.js",
      "/app/assets/vendor-b.js",
    ]);
  });

  it("passes a build under budget, whatever the base path", () => {
    const result = run(dist);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /across 2 files/);
  });

  it("fails when the initial JS is over budget", () => {
    writeFileSync(
      join(dist, "assets", "vendor-b.js"),
      randomBytes((SPA_INITIAL_JS_BUDGET_KB + 10) * 1024)
    );

    const result = run(dist);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /over budget/);
  });

  it("fails loudly when index.html is missing", () => {
    rmSync(join(dist, "index.html"));

    const result = run(dist);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /index\.html is missing/);
  });

  it("fails when an initial script is referenced but not built", () => {
    rmSync(join(dist, "assets", "vendor-b.js"));

    assert.throws(() => checkBudget(dist), /vendor-b\.js not found/);
  });

  it("resolves the entry and modulepreloads under the root base path", () => {
    // CI builds the SPA without VITE_BASE_PATH, so dist/index.html links
    // assets at the root ("/assets/...") rather than "/app/assets/...".
    writeFileSync(
      join(dist, "index.html"),
      `<!doctype html><html><head>
<script type="module" crossorigin src="/assets/index-a.js"></script>
<link rel="modulepreload" crossorigin href="/assets/vendor-b.js">
</head><body></body></html>`
    );

    const result = run(dist);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /across 2 files/);
  });

  it("accepts unquoted and single-quoted attribute values", () => {
    const html = `<script type=module src=/assets/index-a.js></script>
<link rel='modulepreload' href='/assets/vendor-b.js'>`;

    assert.deepEqual(initialScripts(html), [
      "/assets/index-a.js",
      "/assets/vendor-b.js",
    ]);
  });

  it("throws when index.html has no recognisable module-script entry", () => {
    writeFileSync(
      join(dist, "index.html"),
      `<!doctype html><html><head>
<link rel="stylesheet" href="/assets/index-c.css">
</head><body></body></html>`
    );

    const result = run(dist);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /no <script type="module" src> entry found/);
  });

  for (const source of FORBIDDEN_LAZY_SOURCES) {
    it(`fails when a lazy-seam source (${source}) is bundled into an initial file`, () => {
      // A static import doesn't necessarily create a new, separately named
      // chunk (rolldown may inline it into an already-initial chunk), so
      // the check reads the initial files' sourcemaps instead of matching
      // chunk filenames.
      writeFileSync(
        join(dist, "assets", "index-a.js.map"),
        JSON.stringify({
          version: 3,
          sources: ["../../src/main.tsx", `../../${source}`],
          names: [],
          mappings: "",
        })
      );

      const result = run(dist);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /forbidden lazy-seam source/);
      assert.match(result.stderr, new RegExp(source.replace(/[./]/g, "\\$&")));
    });
  }

  it("passes when the entry sourcemap has no forbidden sources", () => {
    writeFileSync(
      join(dist, "assets", "index-a.js.map"),
      JSON.stringify({
        version: 3,
        sources: ["../../src/main.tsx", "../../src/App.tsx"],
        names: [],
        mappings: "",
      })
    );

    const result = run(dist);

    assert.equal(result.status, 0, result.stderr);
  });
});
