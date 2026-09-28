// An unresolved editorial placeholder (`[CONFIRMAR: ...]`, used while a fact
// still needs a source) must never ship: not in a built page, not in its .md
// mirror, and not in llms.txt / llms-full.txt, which AI assistants read.
//
// Reads the build, so the dist case skips unless REQUIRE_DOCS_DIST=1 (set in
// the CI `build` job and in deploy, after the docs build).

import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", ".vitepress", "dist");
const skip =
  process.env.REQUIRE_DOCS_DIST !== "1" &&
  "reads the docs build (set REQUIRE_DOCS_DIST=1 after building it)";

const PLACEHOLDER = /CONFIRMAR/;
const SCANNED = /\.(html|md|txt)$/;

function textFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return textFiles(full);
    return SCANNED.test(entry.name) ? [full] : [];
  });
}

/** `"<path>:<line>"` for every line holding a placeholder. */
export function placeholderHits(files) {
  return files.flatMap(({ path, text }) =>
    text
      .split("\n")
      .flatMap((line, i) =>
        PLACEHOLDER.test(line) ? [`${path}:${i + 1}`] : []
      )
  );
}

test("docs dist ships no editorial placeholder", { skip }, () => {
  const files = textFiles(DIST).map((file) => ({
    path: relative(DIST, file),
    text: readFileSync(file, "utf8"),
  }));
  const scanned = files.map((f) => f.path);

  const hits = placeholderHits(files);

  assert.ok(existsSync(join(DIST, "llms-full.txt")), "llms-full.txt missing");
  assert.ok(
    scanned.some((p) => p.endsWith(".md")),
    "no .md mirror scanned"
  );
  assert.deepEqual(hits, []);
});

test("guard reports a placeholder in a page, a mirror and llms-full.txt", () => {
  const files = [
    { path: "guide/a.html", text: "<td>[CONFIRMAR: source]</td>" },
    { path: "guide/a.md", text: "ok\n| x | [CONFIRMAR] |" },
    { path: "llms-full.txt", text: "CONFIRMAR" },
    { path: "guide/b.html", text: "<p>Confirmed with a source.</p>" },
  ];

  const hits = placeholderHits(files);

  assert.deepEqual(hits, ["guide/a.html:1", "guide/a.md:2", "llms-full.txt:1"]);
});
