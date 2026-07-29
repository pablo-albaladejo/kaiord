#!/usr/bin/env node
/**
 * Mechanical guard: lock the Chrome Web Store-relevant surface of every
 * bridge against silent drift.
 *
 * Inputs (per bridge, discovered from packages/*-bridge):
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

import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GOLDEN_PATH = join(
  REPO_ROOT,
  "scripts/fixtures/bridge-privacy-surface.json"
);

// The bridge list is DERIVED FROM DISK, never hand-maintained: a hardcoded
// array means a new `packages/foo-bridge` ships with no golden entry, no
// allowlist extraction and no CI failure — its whole read surface simply is
// not locked. Sorted so the golden's key order is stable across
// filesystems. Same derivation as check-bridge-ci-coverage.
export const discoverBridges = (repoRoot = REPO_ROOT) =>
  readdirSync(join(repoRoot, "packages"))
    .filter(
      (name) =>
        name.endsWith("-bridge") &&
        statSync(join(repoRoot, "packages", name)).isDirectory()
    )
    .sort();

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

// ---------------------------------------------------------------------------
// Source scanning primitives.
//
// An allowlist declaration is a tiny JS grammar: an array of object literals
// whose values are string literals and regex literals, with line and block
// comments interleaved. Every scan below skips literals and comments WHOLE,
// so a `{`, `}`, `[`, `]` or `"` inside a regex (`\d{4}`, `[^\/]+`) or
// inside prose cannot be mistaken for structure. Within this grammar a `/`
// that does not open a comment always opens a regex.
// ---------------------------------------------------------------------------

const skipLineComment = (src, start) => {
  const nl = src.indexOf("\n", start);
  return nl === -1 ? src.length : nl + 1;
};

const skipBlockComment = (src, start) => {
  const end = src.indexOf("*/", start + 2);
  return end === -1 ? src.length : end + 2;
};

// Quoted string starting at `start` (the opening quote).
const scanQuoted = (src, start) => {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) return { value: src.slice(start + 1, i), end: i + 1 };
    i += 1;
  }
  return { value: src.slice(start + 1), end: src.length };
};

// Regex literal starting at `start` (the opening slash). `body` is the
// source text between the delimiters, kept verbatim so the golden pins the
// pattern exactly as written. Character classes are tracked because an
// unescaped `/` is legal inside `[...]`.
const scanRegex = (src, start) => {
  let i = start + 1;
  let inClass = false;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "\n") break;
    if (ch === "[") inClass = true;
    else if (ch === "]") inClass = false;
    else if (ch === "/" && !inClass)
      return { body: src.slice(start + 1, i), end: i + 1 };
    i += 1;
  }
  return { body: src.slice(start + 1, i), end: i };
};

// Index just past the `]` matching the `[` at `openIndex`.
const findArrayEnd = (src, openIndex) => {
  let depth = 0;
  let i = openIndex;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === "/" && next === "/") {
      i = skipLineComment(src, i);
      continue;
    }
    if (ch === "/" && next === "*") {
      i = skipBlockComment(src, i);
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      i = scanQuoted(src, i).end;
      continue;
    }
    if (ch === "/") {
      i = scanRegex(src, i).end;
      continue;
    }
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return -1;
};

// Source text of an array literal declaration, `const <name> = [` through
// the matching `]`. Returns null when the declaration is absent.
const sliceArrayLiteral = (src, declaration) => {
  const start = src.indexOf(declaration);
  if (start === -1) return null;
  const end = findArrayEnd(src, start + declaration.length - 1);
  if (end === -1) return null;
  return src.slice(start, end);
};

// Split an array-literal body into its top-level `{…}` object literals
// (comment-free) plus its top-level string literals.
//
// Splitting on OBJECT boundaries is what makes key order irrelevant. The
// previous extractor scanned for each `method:` and then searched FORWARD
// for the next `pattern: /`; written `{ pattern, method }` an entry's
// pattern sits before its method, so the search ran past the entry into the
// next one and the entry vanished from the extracted allowlist entirely —
// a widened read scope that still matched the golden and passed CI. Key
// order in JS is arbitrary and nothing in this repo normalises it.
export const tokenizeAllowlistBody = (body) => {
  const objects = [];
  const strings = [];
  let depth = 0;
  let buffer = "";
  let i = 0;
  const emit = (text) => {
    if (depth > 0) buffer += text;
  };
  while (i < body.length) {
    const ch = body[i];
    const next = body[i + 1];
    if (ch === "/" && next === "/") {
      i = skipLineComment(body, i);
      continue;
    }
    if (ch === "/" && next === "*") {
      i = skipBlockComment(body, i);
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const { value, end } = scanQuoted(body, i);
      if (depth === 0) strings.push(value);
      emit(body.slice(i, end));
      i = end;
      continue;
    }
    if (ch === "/") {
      const { end } = scanRegex(body, i);
      emit(body.slice(i, end));
      i = end;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      emit("{");
      i += 1;
      continue;
    }
    if (ch === "}") {
      emit("}");
      depth -= 1;
      if (depth === 0) {
        objects.push(buffer);
        buffer = "";
      }
      i += 1;
      continue;
    }
    emit(ch);
    i += 1;
  }
  return { objects, strings };
};

const METHOD_KEY = /method:\s*"([A-Z]+)"/;
const PATTERN_KEY = /pattern:\s*\//;

// Shape A — `const ALLOWED = [{ method: "GET", pattern: /…/ }]`, in either
// key order and across any number of lines.
export const extractPatternAllowlist = (body) => {
  const out = [];
  for (const object of tokenizeAllowlistBody(body).objects) {
    const method = METHOD_KEY.exec(object);
    const pattern = PATTERN_KEY.exec(object);
    if (!method || !pattern) {
      // Loudly, never silently. An entry this extractor cannot read must
      // not simply disappear from the golden: disappearing IS the silent
      // widening the guard exists to prevent.
      throw new Error(
        `unreadable allowlist entry (needs both \`method:\` and \`pattern:\`): ${object.trim()}`
      );
    }
    out.push({
      method: method[1],
      pattern: scanRegex(object, pattern.index + pattern[0].length - 1).body,
    });
  }
  return out;
};

// Shape B — `const ALLOWED_PREFIXES = ["/path", …]`, a plain string array
// whose entries are matched as path prefixes and gated to GET by the
// bridge's own isAllowed(). whoop-bridge uses this shape.
//
// Entries are recorded under `prefix` rather than `pattern` so the golden
// also pins WHICH matching semantics is in force: swapping one allowlist
// shape for the other is itself visible drift.
export const extractPrefixAllowlist = (body) =>
  tokenizeAllowlistBody(body).strings.map((prefix) => ({
    method: "GET",
    prefix,
  }));

export const extractAllowed = (bridge) => {
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

const declaresPopup = (bridge) => {
  const path = join(REPO_ROOT, "packages", bridge, "manifest.json");
  if (!existsSync(path)) return false;
  const m = JSON.parse(readFileSync(path, "utf8"));
  return Boolean(m.action?.default_popup ?? m.browser_action?.default_popup);
};

const checkPopupRelativeUrls = (bridge) => {
  const path = join(REPO_ROOT, "packages", bridge, "popup.js");
  if (!existsSync(path)) {
    // A bridge that declares a popup but ships no popup.js would otherwise
    // skip this check in silence. Deleting the file must not be a way to
    // delete the check.
    return declaresPopup(bridge)
      ? [{ bridge, call: "manifest declares a popup but popup.js is missing" }]
      : [];
  }
  const src = readFileSync(path, "utf8");
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
  for (const bridge of discoverBridges()) {
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
  let surface;
  try {
    surface = buildSurface();
  } catch (error) {
    console.error(`❌ Bridge allowlist could not be read: ${error.message}`);
    process.exit(1);
    return;
  }
  const allViolations = discoverBridges().flatMap(checkPopupRelativeUrls);

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
//
// Both sides are resolved through realpath first: comparing a raw
// `pathToFileURL(process.argv[1])` against `import.meta.url` is false
// whenever the invocation path contains a symlink (macOS `/tmp` →
// `/private/tmp`, a CI checkout under a linked workdir, a container
// bind-mount), because Node resolves module URLs to the real path but
// leaves argv[1] exactly as typed. main() then never ran and the guard
// exited 0 having checked nothing.
export const isDirectInvocation = (moduleUrl, entryPath) => {
  if (!entryPath) return false;
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(entryPath);
  } catch {
    return false;
  }
};

if (isDirectInvocation(import.meta.url, process.argv[1])) {
  main();
}
