#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  checkSiteLinks,
  mountsFromArgs,
  requiredIndexes,
} from "./lib/site-links-scan.mjs";

export { checkSiteLinks, mountsFromArgs };

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
// With REQUIRE_DOCS_DIST=1 a dist without its index.html, or a run that
// scans no file or checks no link, fails; otherwise a missing dist is
// skipped with a reason (local runs without a prior build).

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SEGMENTS_JSON = join(
  REPO_ROOT,
  "packages/workout-spa-editor/src/routing/route-segments.json"
);

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
  const strict = process.env.REQUIRE_DOCS_DIST === "1";
  const noIndex = requiredIndexes(mounts).filter((f) => !existsSync(f));
  if (strict && noIndex.length > 0) {
    console.error(`❌ Site dist incomplete, missing: ${noIndex.join(", ")}`);
    process.exit(1);
  }
  const segments = JSON.parse(readFileSync(SEGMENTS_JSON, "utf8"));
  const { problems, filesScanned, linksChecked } = checkSiteLinks({
    mounts,
    segments,
  });
  for (const { file, link, reason } of problems) {
    console.error(`❌ ${relative(process.cwd(), file)}: ${link} ${reason}`);
  }
  if (problems.length > 0) process.exit(1);
  if (strict && (filesScanned === 0 || linksChecked === 0)) {
    console.error(
      `❌ Scanned ${filesScanned} files and ${linksChecked} links: nothing was checked`
    );
    process.exit(1);
  }
  console.log(
    `✅ Every kaiord.com link resolves (${linksChecked} links in ${filesScanned} files)`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
