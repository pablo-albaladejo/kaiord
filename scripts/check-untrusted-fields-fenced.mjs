#!/usr/bin/env node
/**
 * Mechanical guard: a recognized externally-authored field returned to the
 * model must be assigned from a fencing call (R-UntrustedFieldsFenced).
 *
 * This is the field half of the containment guards. Its sibling,
 * `check-model-facing-sinks.mjs`, answers "is this tool declared at all"; this
 * one answers "does this field go through the fence", and names the file and
 * the field when it does not. The recognized set lives in
 * `model-facing-sinks.mjs` so both halves read one declaration.
 *
 * Declared limits, so a green run is not read as more than it is:
 *  - it is syntactic: a field under a name outside FENCED_FIELD_NAMES is a
 *    known gap, not a silent one;
 *  - a value built only from string literals, or a zod schema builder, is
 *    app-authored by construction (a tool's own id, its prompt `description`,
 *    an input field's shape) and is not a data path;
 *  - type members are not values and are skipped (a type literal whose `{`
 *    ends its line, brace-matched); a one-line type is scanned like code;
 *  - a shorthand field (`{ title }`) is a returned value like `title: title`,
 *    unless it is a destructuring, for-of, or import/export binding;
 *  - a quoted key (`"title": x`) is checked like a bare one; a computed key
 *    (`[key]: x`) and a spread (`...record`) are NOT — whatever they carry
 *    under a recognized name reaches the model unseen;
 *  - an opaque nested payload forwarded whole (`krd: unknown`) is invisible to
 *    it, which is why a tool that forwards one must be recorded as unbounded
 *    rather than clean (`query_health` projects numbers instead).
 *
 * Not looking is not a pass: zero files scanned, an unreadable directory and
 * an unreadable source are all faults.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FENCED_FIELD_NAMES } from "./model-facing-sinks.mjs";

const TOOLS_DIR = "packages/workout-spa-editor/src/application/chat/tools";
const FENCE_CALL = "fenceUntrusted(";
const STRING_LITERAL = /(["'`])(?:\\.|(?!\1)[^\\])*\1/g;
const ZOD_SCHEMA = /^z\s*\./;

/**
 * App-authored by construction, so not a data path the fence applies to:
 *  - an expression built only from string literals and `+` — a tool's own
 *    `description` prompt text, or a tool's `name`;
 *  - a zod schema builder — `description: z.string().describe(...)` declares
 *    an input field's shape, it does not return a value to the model.
 */
const isAppAuthored = (value) =>
  ZOD_SCHEMA.test(value) ||
  value.replace(STRING_LITERAL, "").replace(/[\s+()]/g, "") === "";

const isSource = (f) =>
  f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts");

const collectSources = (root, dir = root, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSources(root, full, out);
    else if (isSource(entry.name)) out.push(relative(root, full));
  }
  return out;
};

// A multi-line type literal: its `{` must end the line. A one-line type
// (`type Row<T> = { a: T } & X;`) is left in place and scanned — a lazy match
// from it to some later `};` once blanked real code and hid a field.
const TYPE_BODY_HEAD =
  /(^|\n)[ \t]*(?:export\s+)?type\s+\w+(?:<[^=;{}]*>)?\s*=\s*\{[ \t]*\n/g;

/** Index of the `}` closing the `{` at `open`, or -1 when it never closes. */
const closingBrace = (src, open) => {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return i;
  }
  return -1;
};

const blank = (text) => text.replace(/[^\n]/g, " ");

/** Blank out comments and type-declaration bodies, preserving line numbers. */
export const stripNonValueRegions = (src) => {
  let out = src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank);
  for (const match of out.matchAll(TYPE_BODY_HEAD)) {
    const open = match.index + match[0].lastIndexOf("{");
    const close = closingBrace(out, open);
    if (close === -1) continue;
    out =
      out.slice(0, open + 1) +
      blank(out.slice(open + 1, close)) +
      out.slice(close);
  }
  return out;
};

/** The value expression following a colon, up to its own `,` or `}`. */
export const valueAfterColon = (src, start) => {
  const closers = { "(": ")", "[": "]", "{": "}" };
  const stack = [];
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (closers[ch]) stack.push(closers[ch]);
    else if (stack.length > 0 && ch === stack[stack.length - 1]) stack.pop();
    else if (stack.length === 0 && (ch === "," || ch === "}" || ch === ";")) {
      return src.slice(start, i);
    }
  }
  return src.slice(start);
};

const fieldPattern = () =>
  new RegExp(
    `(^|[\\s{,(])(["']?)(${FENCED_FIELD_NAMES.join("|")})\\2\\s*:`,
    "g"
  );

const shorthandPattern = () =>
  new RegExp(`([{,])\\s*(${FENCED_FIELD_NAMES.join("|")})\\s*(?=[,}])`, "g");

/** The `{` enclosing `at`: the nearest one not closed before it. */
const enclosingBrace = (src, at) => {
  let depth = 0;
  for (let i = at; i >= 0; i--) {
    if (src[i] === "}") depth++;
    else if (src[i] === "{" && depth-- === 0) return i;
  }
  return -1;
};

/**
 * A `{ name }` that binds rather than builds: a destructuring assignment or
 * parameter (typed or not), a for-of/in binding, or an import/export list.
 */
const isBindingPattern = (src, open) => {
  if (/\b(?:import|export)\s+(?:type\s+)?$/.test(src.slice(0, open))) {
    return true;
  }
  const close = closingBrace(src, open);
  if (close === -1) return false;
  const after = src.slice(close + 1).trimStart();
  return (
    /^=(?![=>])/.test(after) ||
    /^(?:of|in|from)\b/.test(after) ||
    /^(?::[^=;{}()]*)?\)\s*(?::[^{=;]*)?(?:=>|\{)/.test(after) ||
    /^:[^=;{}()]*=(?![=>])/.test(after)
  );
};

/** `{ title }` returns the same value as `{ title: title }`. */
const shorthandViolations = (scannable, file) => {
  // Prose inside a string ("…, name, …") is not a field.
  const code = scannable.replace(
    STRING_LITERAL,
    (s) => s[0] + blank(s.slice(1, -1)) + s[s.length - 1]
  );
  const violations = [];
  for (const match of code.matchAll(shorthandPattern())) {
    const at = match.index + match[0].indexOf(match[2]);
    const open = match[1] === "{" ? match.index : enclosingBrace(code, at);
    if (open !== -1 && isBindingPattern(code, open)) continue;
    violations.push({
      kind: "unfenced",
      file,
      field: match[2],
      line: code.slice(0, at).split("\n").length,
      value: `${match[2]} (shorthand)`,
    });
  }
  return violations;
};

export const fileViolations = (src, file) => {
  const scannable = stripNonValueRegions(src);
  const violations = shorthandViolations(scannable, file);
  for (const match of scannable.matchAll(fieldPattern())) {
    const field = match[3];
    const colon = match.index + match[0].length;
    const value = valueAfterColon(scannable, colon).trim();
    if (value === "" || isAppAuthored(value)) continue;
    if (value.includes(FENCE_CALL)) continue;
    violations.push({
      kind: "unfenced",
      file,
      field,
      line: scannable.slice(0, match.index).split("\n").length,
      value: value.replace(/\s+/g, " ").slice(0, 80),
    });
  }
  return violations;
};

export const runCheck = ({ toolsRoot }) => {
  let files;
  try {
    files = collectSources(toolsRoot);
  } catch (error) {
    return [
      {
        kind: "scan-failed",
        detail: `could not read ${toolsRoot}: ${error.message}`,
      },
    ];
  }
  if (files.length === 0) {
    return [{ kind: "scan-empty", detail: `no sources under ${toolsRoot}` }];
  }

  const violations = [];
  for (const file of files) {
    let src;
    try {
      src = readFileSync(join(toolsRoot, file), "utf8");
    } catch (error) {
      violations.push({ kind: "scan-failed", file, detail: error.message });
      continue;
    }
    violations.push(...fileViolations(src, file));
  }
  return violations;
};

const main = () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const violations = runCheck({ toolsRoot: join(root, TOOLS_DIR) });
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(violations, null, 2));
    return;
  }
  if (violations.length === 0) {
    console.log(
      `untrusted fields: recognized ${FENCED_FIELD_NAMES.length} field names, all fenced.`
    );
    return;
  }
  for (const v of violations) {
    console.error(
      `  [${v.kind}] ${v.file ?? ""}${v.line ? `:${v.line}` : ""} ` +
        `${v.field ?? ""} ${v.value ? `= ${v.value}` : (v.detail ?? "")}`.trim()
    );
  }
  console.error(
    "\nAn externally-authored field returned to the model must be assigned\n" +
      "from fenceUntrusted(...). Recognized names: scripts/model-facing-sinks.mjs"
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
