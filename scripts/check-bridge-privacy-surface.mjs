#!/usr/bin/env node
/**
 * Mechanical guard: lock the Chrome Web Store-relevant surface of both
 * bridges against silent drift.
 *
 * Inputs (per bridge):
 *   - manifest.json + manifest.prod.json: `permissions`, `host_permissions`,
 *     `content_scripts.matches`, `externally_connectable.matches`.
 *   - content.js: the `ALLOWED` array (regex patterns + methods).
 *   - popup.js: every `fetch(...)` / `XMLHttpRequest` URL argument MUST
 *     be a relative path (no `http(s)://` literal).
 *
 * The aggregated structure is compared byte-for-byte against the
 * checked-in golden at scripts/fixtures/bridge-privacy-surface.json.
 *
 * Any drift fails the lint job. Updates require explicit golden refresh.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GOLDEN_PATH = join(
  REPO_ROOT,
  "scripts/fixtures/bridge-privacy-surface.json"
);
const BRIDGES = [
  "garmin-bridge",
  "train2go-bridge",
  "whoop-bridge",
  "tanita-bridge",
];

// manifest.prod.json and content.js exist only for bridges that are
// published / ship a site content script (whoop has neither yet); their
// sections are omitted from the surface rather than failing the read.
const readManifest = (bridge, file) => {
  const path = join(REPO_ROOT, "packages", bridge, file);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const m = JSON.parse(raw);
  return {
    permissions: m.permissions ?? [],
    host_permissions: m.host_permissions ?? [],
    content_scripts_matches: (m.content_scripts ?? []).map(
      (s) => s.matches ?? []
    ),
    externally_connectable_matches: m.externally_connectable?.matches ?? [],
  };
};

const extractAllowed = (bridge) => {
  // The ALLOWED path-allowlist lives in content.js for relay-based bridges,
  // or background.js for token-based bridges (garmin) that call the API
  // directly from the service worker. content.js wins when both exist.
  const dir = join(REPO_ROOT, "packages", bridge);
  const path = [join(dir, "content.js"), join(dir, "background.js")].find(
    (p) => existsSync(p)
  );
  if (!path) return [];
  const src = readFileSync(path, "utf8");
  const start = src.indexOf("const ALLOWED");
  if (start === -1) return [];
  const end = src.indexOf("];", start);
  const body = src.slice(start, end + 2);
  // Walk character by character: when we see `pattern: /`, scan forward
  // honoring escaped slashes until the closing `/`. Avoids regex
  // ambiguity with patterns that contain literal `\/`.
  const out = [];
  const lines = body.split("\n");
  for (const line of lines) {
    const methodMatch = line.match(/method:\s*"([A-Z]+)"/);
    if (!methodMatch) continue;
    const patternStart = line.indexOf("pattern: /");
    if (patternStart === -1) continue;
    let i = patternStart + "pattern: /".length;
    let pattern = "";
    while (i < line.length) {
      const ch = line[i];
      if (ch === "\\") {
        pattern += ch + (line[i + 1] ?? "");
        i += 2;
        continue;
      }
      if (ch === "/") break;
      pattern += ch;
      i += 1;
    }
    out.push({ method: methodMatch[1], pattern });
  }
  return out;
};

const FETCH_OR_XHR = /\b(fetch|XMLHttpRequest)\s*\(\s*([^)]*)\)/g;

const checkPopupRelativeUrls = (bridge) => {
  const src = readFileSync(
    join(REPO_ROOT, "packages", bridge, "popup.js"),
    "utf8"
  );
  const violations = [];
  let match;
  while ((match = FETCH_OR_XHR.exec(src)) !== null) {
    const arg = match[2].trim();
    if (/^["'`]https?:\/\//i.test(arg)) {
      violations.push({ bridge, call: match[0] });
    }
  }
  return violations;
};

const buildSurface = () => {
  const out = {};
  for (const bridge of BRIDGES) {
    const manifestProd = readManifest(bridge, "manifest.prod.json");
    out[bridge] = {
      manifest: readManifest(bridge, "manifest.json"),
      ...(manifestProd ? { manifest_prod: manifestProd } : {}),
      allowed_paths: extractAllowed(bridge),
    };
  }
  return out;
};

const main = () => {
  const surface = buildSurface();
  const allViolations = BRIDGES.flatMap(checkPopupRelativeUrls);

  const golden = JSON.parse(readFileSync(GOLDEN_PATH, "utf8"));
  const actual = JSON.stringify(surface, null, 2);
  const expected = JSON.stringify(golden, null, 2);

  let ok = true;
  if (actual !== expected) {
    ok = false;
    console.error("❌ Bridge privacy surface drifted from golden snapshot.");
    console.error(
      "   Update scripts/fixtures/bridge-privacy-surface.json deliberately,"
    );
    console.error("   then re-run this guard.");
    console.error("\n--- expected (golden) vs --- actual:\n");
    const exp = expected.split("\n");
    const act = actual.split("\n");
    const max = Math.max(exp.length, act.length);
    for (let i = 0; i < max; i += 1) {
      if (exp[i] !== act[i]) {
        console.error(`  line ${i + 1}:`);
        console.error(`    -${exp[i] ?? ""}`);
        console.error(`    +${act[i] ?? ""}`);
      }
    }
  }

  if (allViolations.length > 0) {
    ok = false;
    console.error(
      `❌ popup.js contains absolute-URL fetch/XHR calls (must be relative):`
    );
    for (const v of allViolations) {
      console.error(`   ${v.bridge}: ${v.call}`);
    }
  }

  if (!ok) {
    process.exit(1);
  }
  console.log("✅ Bridge privacy surface matches golden; no exfil URLs.");
};

main();
