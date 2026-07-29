#!/usr/bin/env node
/**
 * Mechanical guard: lock the Chrome Web Store-relevant surface of every
 * bridge against silent drift.
 *
 * Inputs (per bridge):
 *   - manifest.json + manifest.prod.json: `permissions`, `host_permissions`,
 *     `content_scripts.matches`, `externally_connectable.matches`.
 *   - content.js (or background.js): the read allowlist, in either of the
 *     two shapes in use — `ALLOWED` (method + regex pattern) or
 *     `ALLOWED_PREFIXES` (GET-only string path prefixes).
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
import { fileURLToPath, pathToFileURL } from "node:url";

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
  "trainingpeaks-bridge",
];

// manifest.prod.json exists only for bridges prepared for publishing; its
// section is omitted from the surface rather than failing the read.
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

// Source text of an array literal declaration, `const <name> = [` through
// the matching `];`. Returns null when the declaration is absent.
const sliceArrayLiteral = (src, declaration) => {
  const start = src.indexOf(declaration);
  if (start === -1) return null;
  const end = src.indexOf("];", start);
  if (end === -1) return null;
  return src.slice(start, end + 2);
};

// Shape A — `const ALLOWED = [{ method: "GET", pattern: /…/ }]`.
// Walk character by character: when we see `pattern: /`, scan forward
// honoring escaped slashes until the closing `/`. Avoids regex ambiguity
// with patterns that contain literal `\/`.
const extractPatternAllowlist = (body) => {
  const out = [];
  for (const line of body.split("\n")) {
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

// Shape B — `const ALLOWED_PREFIXES = ["/path", …]`, a plain string array
// whose entries are matched as path prefixes and gated to GET by the
// bridge's own isAllowed(). whoop-bridge uses this shape; until the
// extractor understood it, whoop's read allowlist was absent from the
// golden entirely and could be widened with zero CI failure, while the
// privacy policy asserted the allowlist as a durable property.
//
// Entries are recorded under `prefix` rather than `pattern` so the golden
// also pins WHICH matching semantics is in force: swapping one allowlist
// shape for the other is itself visible drift.
const extractPrefixAllowlist = (body) =>
  [...body.matchAll(/"([^"\\\n]+)"/g)].map((m) => ({
    method: "GET",
    prefix: m[1],
  }));

const extractAllowed = (bridge) => {
  // The path allowlist lives in content.js for relay-based bridges, or
  // background.js for token-based bridges that call the API directly from
  // the service worker. content.js wins when both exist.
  const dir = join(REPO_ROOT, "packages", bridge);
  const path = [join(dir, "content.js"), join(dir, "background.js")].find((p) =>
    existsSync(p)
  );
  if (!path) return [];
  const src = readFileSync(path, "utf8");

  const patternBody = sliceArrayLiteral(src, "const ALLOWED = [");
  if (patternBody) return extractPatternAllowlist(patternBody);

  const prefixBody = sliceArrayLiteral(src, "const ALLOWED_PREFIXES = [");
  if (prefixBody) return extractPrefixAllowlist(prefixBody);

  return [];
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

export const buildSurface = () => {
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

// Run only when invoked directly. Importing the module (to regenerate the
// golden, or from the test suite) must not exit the process.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
