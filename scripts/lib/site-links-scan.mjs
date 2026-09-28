import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  brokenReason,
  editorHrefsIn,
  LEGACY_EDITOR_REASON,
  linksIn,
  switcherHrefsIn,
} from "./site-links-resolve.mjs";

// Walks the built site for `check-site-links.mjs`: which files are read, and
// which mounts (landing `/`, SPA `/app/`, docs `/docs/`) make up the tree.

const SCANNED =
  /(\.html|\.md|^llms[^/]*\.txt|^sitemap[^/]*\.xml|^robots\.txt)$/;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCANNED.test(entry.name)) yield full;
  }
}

/**
 * `problems` holds `{ file, link, reason }` for every broken kaiord.com link;
 * the counts let the caller refuse a run that checked nothing.
 */
export function checkSiteLinks({ mounts, segments }) {
  const ordered = [...mounts].sort((a, b) => b.prefix.length - a.prefix.length);
  const problems = [];
  const seenFiles = new Set();
  let linksChecked = 0;
  for (const { dir } of ordered) {
    for (const file of walk(dir)) {
      if (seenFiles.has(file)) continue;
      seenFiles.add(file);
      const text = readFileSync(file, "utf8");
      const hrefs = file.endsWith(".html") ? editorHrefsIn(text) : [];
      for (const link of hrefs) {
        problems.push({ file, link, reason: LEGACY_EDITOR_REASON });
      }
      const switcher = file.endsWith(".html") ? switcherHrefsIn(text) : [];
      for (const href of switcher) {
        const reason = brokenReason(
          ordered,
          segments,
          `https://kaiord.com${href}`
        );
        if (reason) {
          problems.push({
            file,
            link: href,
            reason: `language switcher: ${reason}`,
          });
        }
      }
      const links = new Set(linksIn(text));
      linksChecked += links.size + hrefs.length + switcher.length;
      for (const link of links) {
        const reason = brokenReason(ordered, segments, link);
        if (reason) problems.push({ file, link, reason });
      }
    }
  }
  return { problems, filesScanned: seenFiles.size, linksChecked };
}

/** The entry page each dist must contain for the check to mean anything. */
export function requiredIndexes(mounts) {
  if (mounts.length === 1) {
    const root = mounts[0].dir;
    return ["", "app", "docs"].map((sub) => join(root, sub, "index.html"));
  }
  return mounts.map((m) => join(m.dir, "index.html"));
}

export function mountsFromArgs(values) {
  if (values.merged) return [{ prefix: "/", dir: resolve(values.merged) }];
  return [
    { prefix: "/", dir: values.landing },
    { prefix: "/app/", dir: values.app },
    { prefix: "/docs/", dir: values.docs },
  ].map((m) => ({ ...m, dir: m.dir && resolve(m.dir) }));
}
