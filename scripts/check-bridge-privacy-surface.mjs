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
// the matching `]`, plus the index just past that `]`. Returns null when
// the declaration is absent.
const sliceArrayLiteral = (src, declaration) => {
  const start = src.indexOf(declaration);
  if (start === -1) return null;
  const end = findArrayEnd(src, start + declaration.length - 1);
  if (end === -1) return null;
  return { source: src.slice(start, end), end };
};

// Next character that is neither whitespace nor comment.
const nextMeaningful = (src, from) => {
  let i = from;
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
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    return { char: ch, index: i };
  }
  return { char: "", index: i };
};

// The declaration must END at its `]` (plus a `)` for the `new Set([…])`
// form). `[…].concat(EXTRA)` appends entries after the literal that the
// tokenizer never sees, so the golden would record a partial surface and
// call it a match.
const assertDeclarationEndsAtBracket = (src, end, declaration, closers) => {
  let i = end;
  for (const expected of closers) {
    const found = nextMeaningful(src, i);
    if (found.char !== expected) {
      throw new Error(
        `\`${declaration}…\` does not end at its \`]\` (expected \`${expected}\`, found \`${src
          .slice(found.index, found.index + 24)
          .split("\n")[0]
          .trim()}\`) — entries appended after the literal are invisible to this guard`
      );
    }
    i = found.index + 1;
  }
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
// `residue` collects every top-level character that is NOT part of an
// object literal, string literal or comment — i.e. everything the two
// extractors below would otherwise ignore. `[...BASE, {…}]`,
// `[SHARED_ENTRY, {…}]` and any other non-literal element land there, and
// the callers refuse them. Silently returning just the inline literal is
// the same disappearance the object split exists to stop, one level up.
export const tokenizeAllowlistBody = (body) => {
  const objects = [];
  const strings = [];
  let residue = "";
  let depth = 0;
  let buffer = "";
  const emit = (text) => {
    if (depth > 0) buffer += text;
    else residue += text;
  };
  // Scan only between the `[` and its matching `]`, so the `const … = [`
  // prefix is not mistaken for a stray top-level element.
  const open = body.indexOf("[");
  const close = open === -1 ? -1 : findArrayEnd(body, open);
  const inner =
    open === -1
      ? body
      : body.slice(open + 1, close === -1 ? undefined : close - 1);
  let i = 0;
  while (i < inner.length) {
    const ch = inner[i];
    const next = inner[i + 1];
    if (ch === "/" && next === "/") {
      i = skipLineComment(inner, i);
      continue;
    }
    if (ch === "/" && next === "*") {
      i = skipBlockComment(inner, i);
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const { value, end } = scanQuoted(inner, i);
      // A top-level string IS an element of the prefix shape, so it is
      // recorded rather than treated as residue.
      if (depth === 0) strings.push(value);
      else emit(inner.slice(i, end));
      i = end;
      continue;
    }
    if (ch === "/") {
      const { end } = scanRegex(inner, i);
      emit(inner.slice(i, end));
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
  return { objects, strings, residue };
};

// Every top-level element must be an object literal. A spread, a shared
// constant, or a call leaves its text in `residue`; returning just the
// inline literals would record a partial allowlist and call it a match.
const assertOnlyLiteralElements = (residue, declaration) => {
  const stray = residue.replace(/[\s,]/g, "");
  if (stray) {
    throw new Error(
      `\`${declaration}…\` has a top-level element that is not an object literal (\`${stray.slice(0, 40)}\`) — spreads, shared constants and calls hide entries from this guard`
    );
  }
};

const FIELD_KEY = /^[A-Za-z_$][\w$]*/;

// Read one object literal's OWN fields. Scanning the flattened text for
// `method:` / `pattern:` took the first match at any depth, so
// `{ alt: { pattern: /^\/DECOY$/ }, method: "GET", pattern: /^\/real$/ }`
// recorded the decoy and hid the real scope. This never descends: a nested
// object is not a value it can read, so it is refused rather than entered.
const parseEntryFields = (raw) => {
  const fields = [];
  let i = raw.indexOf("{") + 1;
  while (i < raw.length) {
    const ch = raw[i];
    const next = raw[i + 1];
    if (ch === "/" && next === "/") {
      i = skipLineComment(raw, i);
      continue;
    }
    if (ch === "/" && next === "*") {
      i = skipBlockComment(raw, i);
      continue;
    }
    if (/[\s,]/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === "}") break;

    const key = FIELD_KEY.exec(raw.slice(i));
    if (!key) {
      throw new Error(`unreadable field near \`${raw.slice(i, i + 30)}\``);
    }
    i += key[0].length;
    while (i < raw.length && /\s/.test(raw[i])) i += 1;
    if (raw[i] !== ":") {
      throw new Error(`field \`${key[0]}\` is not a \`key: value\` pair`);
    }
    i += 1;
    while (i < raw.length && /\s/.test(raw[i])) i += 1;

    const value = raw[i];
    if (value === '"' || value === "'" || value === "`") {
      const quoted = scanQuoted(raw, i);
      fields.push({ key: key[0], kind: "string", value: quoted.value });
      i = quoted.end;
    } else if (value === "/") {
      const regex = scanRegex(raw, i);
      fields.push({ key: key[0], kind: "regex", value: regex.body });
      i = regex.end;
    } else {
      throw new Error(
        `field \`${key[0]}\` has a value this guard cannot read (\`${raw.slice(i, i + 24)}\`) — only string and regex literals describe a scope unambiguously`
      );
    }
  }
  return fields;
};

// Shape A — `const ALLOWED = [{ method: "GET", pattern: /…/ }]`, in either
// key order and across any number of lines.
export const extractPatternAllowlist = (
  body,
  declaration = "const ALLOWED = ["
) => {
  const { objects, residue } = tokenizeAllowlistBody(body);
  assertOnlyLiteralElements(residue, declaration);

  return objects.map((object) => {
    // Loudly, never silently. An entry this extractor cannot read must not
    // simply disappear from the golden: disappearing IS the silent
    // widening the guard exists to prevent.
    const fields = parseEntryFields(object);
    // An unrecognised field is refused rather than ignored, deliberately.
    // The golden pins `method` and `pattern` and nothing else, so a third
    // field would carry meaning the golden does not record — it could
    // narrow or widen what the entry actually permits, invisibly. That is
    // the exact shape of hole this guard exists to close, so adding one has
    // to be a decision: extend the golden, or drop the field.
    const unknown = fields.filter(
      (f) => f.key !== "method" && f.key !== "pattern"
    );
    if (unknown.length > 0) {
      throw new Error(
        `allowlist entry has unrecognised field(s) \`${unknown.map((f) => f.key).join(", ")}\`: ${object.trim()}`
      );
    }
    const method = fields.find(
      (f) => f.key === "method" && f.kind === "string"
    );
    const pattern = fields.find(
      (f) => f.key === "pattern" && f.kind === "regex"
    );
    if (!method || !pattern || !/^[A-Z]+$/.test(method.value)) {
      throw new Error(
        `unreadable allowlist entry (needs \`method: "<VERB>"\` and \`pattern: /…/\`): ${object.trim()}`
      );
    }
    return { method: method.value, pattern: pattern.value };
  });
};

// Shape B — `const ALLOWED_PREFIXES = ["/path", …]`, a plain string array
// whose entries are matched as path prefixes and gated to GET by the
// bridge's own isAllowed(). whoop-bridge uses this shape.
//
// Entries are recorded under `prefix` rather than `pattern` so the golden
// also pins WHICH matching semantics is in force: swapping one allowlist
// shape for the other is itself visible drift.
export const extractPrefixAllowlist = (
  body,
  declaration = "const ALLOWED_PREFIXES = ["
) => {
  const { objects, strings, residue } = tokenizeAllowlistBody(body);
  assertOnlyLiteralElements(residue, declaration);
  if (objects.length > 0) {
    throw new Error(
      `\`${declaration}…\` mixes object literals into a string-prefix array — the two shapes carry different matching semantics`
    );
  }
  return strings.map((prefix) => ({ method: "GET", prefix }));
};

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

  const patternDecl = "const ALLOWED = [";
  const patternBody = sliceArrayLiteral(src, patternDecl);
  if (patternBody) {
    assertDeclarationEndsAtBracket(src, patternBody.end, patternDecl, [";"]);
    return extractPatternAllowlist(patternBody.source, patternDecl);
  }

  const prefixDecl = "const ALLOWED_PREFIXES = [";
  const prefixBody = sliceArrayLiteral(src, prefixDecl);
  if (prefixBody) {
    assertDeclarationEndsAtBracket(src, prefixBody.end, prefixDecl, [";"]);
    return extractPrefixAllowlist(prefixBody.source, prefixDecl);
  }

  // Both declarations are located by literal text, so a wrapper
  // (`const ALLOWED = Object.freeze([…])`) or a rename
  // (`const ALLOWED_LIST = […]`) makes the whole list vanish — neither the
  // residue check nor the terminator check ever runs, because nothing
  // matched to run them on.
  //
  // Failing to FIND an allowlist must not be a way to DECLARE that there
  // isn't one, the same reasoning `declaresPopup` applies one level down.
  // On an existing bridge that shows up as entries leaving the golden; on a
  // new one — which the on-disk bridge list now adopts by itself — there is
  // no "before": the golden is written `allowed_paths: []` the first time,
  // reads as "this bridge reads nothing", and passes review as safe while
  // permitting every path in the list nobody parsed.
  //
  // No bridge ships an empty allowlist (today 4/1/5/3/5), so `[]` from a
  // bridge that HAS a service worker or content script is not a legitimate
  // state — it is an unreadable one.
  throw new Error(
    `${bridge}: ${path.slice(REPO_ROOT.length + 1)} declares no readable allowlist — expected \`${patternDecl}…]\` or \`${prefixDecl}…]\`. ` +
      `A wrapped or renamed declaration would otherwise be recorded as an empty read surface. ` +
      `If this bridge genuinely reads nothing, say so deliberately rather than by omission.`
  );
};

// `const EXTERNAL_ACTIONS = new Set(["ping", …])` — the actions the SPA can
// invoke across origins via `externally_connectable`. This is the bridge's
// externally reachable command surface, and it was absent from the golden
// entirely: adding an action widened what kaiord.com may ask an installed
// extension to do, with the guard reporting "matches golden".
//
// The per-bridge suites were the only thing holding the line, and only
// three of the five pinned the exact set — garmin (published) asserted one
// membership, whoop one non-membership. Neither excludes a new action.
export const extractExternalActions = (bridge) => {
  const path = join(REPO_ROOT, "packages", bridge, "background.js");
  if (!existsSync(path)) return [];
  const src = readFileSync(path, "utf8");

  const declaration = "const EXTERNAL_ACTIONS = new Set([";
  const body = sliceArrayLiteral(src, declaration);
  if (body) {
    assertDeclarationEndsAtBracket(src, body.end, declaration, [")", ";"]);
    const { objects, strings, residue } = tokenizeAllowlistBody(body.source);
    assertOnlyLiteralElements(residue, declaration);
    if (objects.length > 0) {
      throw new Error(
        `\`${declaration}…\` contains an object literal — an action name is a string`
      );
    }
    return strings;
  }

  // Absent is honest — a bridge may expose no external surface. Present but
  // unreadable is the vanishing failure this guard exists to prevent, so it
  // is loud.
  if (src.includes("EXTERNAL_ACTIONS")) {
    throw new Error(
      `${bridge}: background.js mentions EXTERNAL_ACTIONS but no \`const EXTERNAL_ACTIONS = new Set([…])\` declaration could be read`
    );
  }
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
      external_actions: extractExternalActions(bridge),
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
