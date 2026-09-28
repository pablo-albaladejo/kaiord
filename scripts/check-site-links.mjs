#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { brokenReason, linksIn } from "./lib/site-links-resolve.mjs";

// Every absolute `kaiord.com` link shipped in the built site must resolve.
//
// lychee runs offline and excludes `https?://` (lychee.toml), so it never
// sees these links: a docs page pointing at `kaiord.com/editor/` (a 404 for
// crawlers) shipped in 13 pages unnoticed. This checker walks the three
// dists as the one tree GitHub Pages serves, resolves each link the way
// Pages does, checks `/app/#/<segment>` against the SPA route registry, and
// rejects `/editor` as a link target outright: that path only exists for
// URLs already in the wild.
//
// Usage:
//   node scripts/check-site-links.mjs --landing <dir> --app <dir> --docs <dir>
//   node scripts/check-site-links.mjs --merged <dir>
// With REQUIRE_DOCS_DIST=1 a missing dist fails the check; otherwise it is
// skipped with a reason (local runs without a prior build).

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SEGMENTS_JSON = join(
  REPO_ROOT,
  "packages/workout-spa-editor/src/routing/route-segments.json"
);
const SCANNED = /(\.html|\.md|^llms[^/]*\.txt)$/;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCANNED.test(entry.name)) yield full;
  }
}

/** Returns `{ file, link, reason }` for every broken kaiord.com link. */
export function checkSiteLinks({ mounts, segments }) {
  const ordered = [...mounts].sort((a, b) => b.prefix.length - a.prefix.length);
  const problems = [];
  const seenFiles = new Set();
  for (const { dir } of ordered) {
    for (const file of walk(dir)) {
      if (seenFiles.has(file)) continue;
      seenFiles.add(file);
      for (const link of new Set(linksIn(readFileSync(file, "utf8")))) {
        const reason = brokenReason(ordered, segments, link);
        if (reason) problems.push({ file, link, reason });
      }
    }
  }
  return problems;
}

export function mountsFromArgs(values) {
  if (values.merged) return [{ prefix: "/", dir: resolve(values.merged) }];
  return [
    { prefix: "/", dir: values.landing },
    { prefix: "/app/", dir: values.app },
    { prefix: "/docs/", dir: values.docs },
  ].map((m) => ({ ...m, dir: m.dir && resolve(m.dir) }));
}

function main() {
  const { values } = parseArgs({
    options: {
      merged: { type: "string" },
      landing: { type: "string" },
      app: { type: "string" },
      docs: { type: "string" },
    },
  });
  const mounts = mountsFromArgs(values);
  const missing = mounts.filter((m) => !m.dir || !existsSync(m.dir));
  if (missing.length > 0) {
    const list = missing.map((m) => m.dir ?? `(no dir for ${m.prefix})`);
    if (process.env.REQUIRE_DOCS_DIST === "1") {
      console.error(`❌ Site dist missing: ${list.join(", ")}`);
      process.exit(1);
    }
    console.log(`⏭️  Site links skipped, dist not built: ${list.join(", ")}`);
    return;
  }
  const segments = JSON.parse(readFileSync(SEGMENTS_JSON, "utf8"));
  const problems = checkSiteLinks({ mounts, segments });
  for (const { file, link, reason } of problems) {
    console.error(`❌ ${relative(process.cwd(), file)}: ${link} ${reason}`);
  }
  if (problems.length > 0) process.exit(1);
  console.log("✅ Every absolute kaiord.com link resolves");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
