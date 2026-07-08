#!/usr/bin/env node
/**
 * Mechanical guard: user-facing strings rendered by the SPA editor
 * (toast invocations, console.* calls, and analytics.event names)
 * MUST be statically known so no runtime field — apiKey,
 * externalUserId, error.message, etc. — can be interpolated into a
 * user-visible message, persistent log, or third-party telemetry sink.
 *
 * Each call's first argument MUST resolve to one of exactly two shapes:
 *
 *   1. A bare string literal: toast.error("Failed to save profile").
 *   2. A bare SCREAMING_SNAKE_CASE identifier referring to a top-level
 *      `const X = "literal"` whose right-hand side is itself a bare
 *      string literal (depth-1; chains are rejected).
 *
 * Forbidden shapes (rule R-PIIInterpolation):
 *
 *   - Template literals with substitutions.
 *   - String concatenation expressions.
 *   - Function calls (formatError(err), even via a top-level const).
 *   - Identifiers resolving to a catch-binding, function parameter,
 *     or any closure-captured / non-top-level variable.
 *   - Bare lowercase / camelCase identifiers.
 *   - Identifier chains (A → B → "x").
 *   - TypeScript type assertions (as / <> / satisfies).
 *   - TypeScript post-fix operators (! / as const).
 *   - Unary operators (void / +).
 *   - Parenthesized expressions wrapping the argument.
 *
 * Four call-site dispatch shapes are recognized:
 *
 *   1. Member dispatch (including console.*):
 *      (toast|useToastContext()).method(...) and console.method(...).
 *   2. Computed-member dispatch: toast["error"](...).
 *   3. Destructured dispatch: const { error } = useToastContext();
 *      error(...) — bound names tracked file-locally.
 *   4. Re-bound dispatch: const ctx = useToastContext();
 *      ctx.error(...) — re-bind tracked file-locally.
 *
 * If a file contains conflicting bindings (multiple destructures or a
 * destructure plus a re-bind), every potentially-toast call is treated
 * as in-scope (false-positive bias is the safe default).
 *
 * The script maintains an exported ALLOWLIST Set; production initial
 * value is empty. Allowlist additions require the two reviewer-gated
 * criteria documented in design.md D9.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

// Allowlisted files (relative to repo root, posix-style) that bypass
// the rule. Each entry MUST carry a comment satisfying design.md D9
// criteria: (a) interpolated value originates from the same user's
// same-render-frame input and never traverses a network boundary or
// persistent log, (b) interpolated value is not read from a sensitive
// field. Initial allowlist is empty; the SHALL is on the mechanism,
// not on the contents.
export const ALLOWLIST = new Set([]);

const TS_EXTENSIONS = [".ts", ".tsx"];
const SKIP_EXTENSIONS = [
  ".test.ts",
  ".test.tsx",
  ".stories.ts",
  ".stories.tsx",
];

const TOAST_METHODS = "(error|success|info|warning)";
const CONSOLE_METHODS = "(log|warn|error|info|debug)";
const ANALYTICS_METHODS = "(event)";

const MEMBER_DISPATCH_RE = new RegExp(
  `(?:toast|useToastContext\\(\\))\\s*\\.\\s*${TOAST_METHODS}\\s*\\(`,
  "g"
);
const CONSOLE_DISPATCH_RE = new RegExp(
  `\\bconsole\\s*\\.\\s*${CONSOLE_METHODS}\\s*\\(`,
  "g"
);
const COMPUTED_DISPATCH_RE = new RegExp(
  `(?:toast|useToastContext\\(\\))\\s*\\[\\s*["']${TOAST_METHODS}["']\\s*\\]\\s*\\(`,
  "g"
);
const ANALYTICS_MEMBER_DISPATCH_RE = new RegExp(
  `(?:analytics|useAnalytics\\(\\))\\s*\\.\\s*${ANALYTICS_METHODS}\\s*\\(`,
  "g"
);
const ANALYTICS_COMPUTED_DISPATCH_RE = new RegExp(
  `(?:analytics|useAnalytics\\(\\))\\s*\\[\\s*["']${ANALYTICS_METHODS}["']\\s*\\]\\s*\\(`,
  "g"
);

// Destructure / rebind sources tracked file-locally. Each entry:
// { sourceName, methodKeys } — the source-function name to match in
// `const { ... } = <sourceName>()` and the set of relevant keys whose
// destructured local bindings should be treated as in-scope.
const TRACKED_SOURCES = [
  { sourceName: "useToastContext", methodKeys: TOAST_METHODS },
  { sourceName: "useAnalytics", methodKeys: ANALYTICS_METHODS },
];

function makeDestructureRe(sourceName) {
  return new RegExp(
    `const\\s*\\{\\s*([^}]+?)\\s*\\}\\s*=\\s*${sourceName}\\(\\)`,
    "g"
  );
}

function makeRebindRe(sourceName) {
  return new RegExp(
    `const\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${sourceName}\\(\\)`,
    "g"
  );
}

// Top-level `const ID = "literal"` declaration (depth-1 only).
// Optional leading `export ` is allowed so `export const FOO = "..."`
// also resolves. The first capture is the identifier name; the third
// is the literal content (without surrounding quotes). The match
// anchors at the beginning of a line so nested const declarations
// inside functions are ignored.
const TOP_LEVEL_CONST_RE =
  /^(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*(?::\s*\w+)?\s*=\s*(["'])((?:\\.|(?!\2).)*)\2\s*;?\s*$/gm;

const BARE_DOUBLE_LITERAL_RE = /^"(?:\\.|[^"\\])*"$/;
const BARE_SINGLE_LITERAL_RE = /^'(?:\\.|[^'\\])*'$/;
const SCREAMING_SNAKE_RE = /^[A-Z][A-Z0-9_]*$/;

// A translation call whose FIRST argument is a bare string literal:
//   t("errors.saveFailed")       i18n.t("errors.saveFailed")
//   t("errors.saveFailed", { count })   (interpolation params allowed after)
// The visible text is selected by a compile-time key, never interpolated
// from a runtime field, so this is an accepted first-argument shape. Dynamic
// keys — t(someVar), t(`a.${x}`) — do NOT match and remain violations.
const TRANSLATE_CALL_RE =
  /^(?:i18n\s*\.\s*)?t\s*\(\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*(?:,[\s\S]*)?\)$/;

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function walk(dir, visit) {
  if (!safeStat(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, visit);
    } else if (entry.isFile() && shouldScan(entry.name)) {
      visit(p);
    }
  }
}

function shouldScan(name) {
  if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) return false;
  return TS_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function findFiles() {
  const out = [];
  // `lib` includes the new profile-snapshot push pipeline; `adapters/bridge`
  // handles snapshot serialization and transport — both surface athlete PII
  // (name, body weight, FTP, HR data) and MUST be subject to R-PIIInterpolation.
  for (const sub of ["components", "hooks", "lib", "adapters/bridge"]) {
    walk(join(SPA_SRC, sub), (file) => out.push(file));
  }
  return out;
}

// Walk the call's argument list starting just after the open-paren.
// Returns the source text of the FIRST top-level argument (delimited by
// either a top-level comma or the matching close-paren). Respects string
// literals, template literals, and nested parens / brackets / braces so
// commas inside those don't terminate the arg.
//
// We check only the first argument because:
//   - For toast.<method>(title, description?, options?), the first arg
//     is the user-visible title; description/options are reviewer-gated
//     by D9 if they ever interpolate.
//   - For console.<method>(prefix, ...rest), the first arg is the
//     human-readable static prefix; subsequent args are the structured
//     payload that DevTools renders separately and never bubbles to
//     end users.
function extractFirstArg(source, start) {
  let i = start;
  let inString = false;
  let stringChar = "";
  let inTemplate = false;
  let templateBraceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  const begin = i;
  while (i < source.length) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === stringChar) inString = false;
      i += 1;
      continue;
    }
    if (inTemplate) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === "`" && templateBraceDepth === 0) {
        inTemplate = false;
        i += 1;
        continue;
      }
      if (ch === "$" && source[i + 1] === "{") {
        templateBraceDepth += 1;
        i += 2;
        continue;
      }
      if (ch === "}" && templateBraceDepth > 0) {
        templateBraceDepth -= 1;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      i += 1;
      continue;
    }
    if (ch === "`") {
      inTemplate = true;
      templateBraceDepth = 0;
      i += 1;
      continue;
    }
    if (ch === "(") parenDepth += 1;
    else if (ch === ")") {
      if (parenDepth === 0) {
        // matching close of the call expression itself
        return { text: source.slice(begin, i), end: i };
      }
      parenDepth -= 1;
    } else if (ch === "[") bracketDepth += 1;
    else if (ch === "]") bracketDepth -= 1;
    else if (ch === "{") braceDepth += 1;
    else if (ch === "}") braceDepth -= 1;
    else if (
      ch === "," &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      return { text: source.slice(begin, i), end: i };
    }
    i += 1;
  }
  return null;
}

function lineNumberFor(source, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i += 1) {
    if (source[i] === "\n") line += 1;
  }
  return line;
}

function getTopLevelStringConsts(source) {
  // Map<identifier, "string-literal-content">. Only top-level (line-anchored)
  // `const X = "literal"` declarations qualify; assignments to function calls,
  // template literals, or other identifiers do not appear in this map.
  const map = new Map();
  for (const m of source.matchAll(TOP_LEVEL_CONST_RE)) {
    map.set(m[1], m[3]);
  }
  return map;
}

function checkArgument(argText) {
  const trimmed = argText.trim();
  // Bare-literal accept first — the inner content (`:`, `+`, `>`, etc.)
  // is part of the literal and must not trigger rejection.
  if (BARE_DOUBLE_LITERAL_RE.test(trimmed)) return null;
  if (BARE_SINGLE_LITERAL_RE.test(trimmed)) return null;
  // Translation call with a static string-literal key (R-PIIInterpolation).
  if (TRANSLATE_CALL_RE.test(trimmed)) return null;
  // SCREAMING_SNAKE_CASE identifier must resolve to a top-level
  // string-literal const declaration (depth-1).
  if (SCREAMING_SNAKE_RE.test(trimmed)) {
    return { kind: "screaming-snake", identifier: trimmed };
  }
  return { kind: "rejected", text: trimmed };
}

function checkFile(file, violations) {
  const source = readFileSync(file, "utf8");
  const stringConsts = getTopLevelStringConsts(source);

  // Collect all bound source-method names from destructures + the re-bound
  // receiver names, across each tracked source (toast + analytics).
  const TOAST_KEYS = new Set(["error", "success", "info", "warning"]);
  const ANALYTICS_KEYS = new Set(["event"]);
  const KEYSET_BY_SOURCE = {
    useToastContext: TOAST_KEYS,
    useAnalytics: ANALYTICS_KEYS,
  };
  // Map<localBoundName, methodGroupRegexFragment> for re-bound receivers
  // so we can build the correct dispatch regex per receiver.
  const destructuredMethods = new Set();
  const reboundReceivers = new Map();
  for (const { sourceName } of TRACKED_SOURCES) {
    const keys = KEYSET_BY_SOURCE[sourceName];
    for (const m of source.matchAll(makeDestructureRe(sourceName))) {
      for (const piece of m[1].split(",")) {
        const trimmed = piece.trim();
        if (!trimmed) continue;
        const noDefault = trimmed.split("=")[0].trim();
        const colonParts = noDefault.split(":");
        const key = colonParts[0].trim();
        const local = (colonParts[1] ?? colonParts[0]).trim();
        if (keys.has(key)) {
          destructuredMethods.add(local);
        }
      }
    }
    const methodGroup =
      sourceName === "useToastContext" ? TOAST_METHODS : ANALYTICS_METHODS;
    for (const m of source.matchAll(makeRebindRe(sourceName))) {
      reboundReceivers.set(m[1], methodGroup);
    }
  }

  const callSites = [];

  // Member + computed-member + console + analytics-event dispatches.
  for (const re of [
    MEMBER_DISPATCH_RE,
    CONSOLE_DISPATCH_RE,
    COMPUTED_DISPATCH_RE,
    ANALYTICS_MEMBER_DISPATCH_RE,
    ANALYTICS_COMPUTED_DISPATCH_RE,
  ]) {
    for (const m of source.matchAll(re)) {
      const openParen = m.index + m[0].length - 1;
      const arg = extractFirstArg(source, openParen + 1);
      if (!arg) continue;
      callSites.push({
        offset: m.index,
        argText: arg.text,
        callExcerpt: source.slice(m.index, arg.end + 1).slice(0, 100),
      });
    }
  }

  // Destructured dispatch: scan for `<bound-name>(` calls.
  for (const name of destructuredMethods) {
    const re = new RegExp(`(?<![\\w$.])${name}\\s*\\(`, "g");
    for (const m of source.matchAll(re)) {
      const openParen = m.index + m[0].length - 1;
      // Skip `useToastContext()` itself, which is matched by `useToastContext(`
      // when destructuredMethods does not contain "useToastContext" — guard
      // anyway by ensuring we are not at `useToastContext`.
      const before = source.slice(Math.max(0, m.index - 20), m.index);
      if (/useToastContext$/.test(before)) continue;
      const arg = extractFirstArg(source, openParen + 1);
      if (!arg) continue;
      callSites.push({
        offset: m.index,
        argText: arg.text,
        callExcerpt: source.slice(m.index, arg.end + 1).slice(0, 100),
      });
    }
  }

  // Re-bound dispatch: scan for `<receiver>.method(` calls. Each receiver
  // tracks its own method group (toast or analytics) so the dispatch
  // regex is source-aware.
  for (const [recv, methodGroup] of reboundReceivers) {
    const re = new RegExp(`\\b${recv}\\s*\\.\\s*${methodGroup}\\s*\\(`, "g");
    for (const m of source.matchAll(re)) {
      const openParen = m.index + m[0].length - 1;
      const arg = extractFirstArg(source, openParen + 1);
      if (!arg) continue;
      callSites.push({
        offset: m.index,
        argText: arg.text,
        callExcerpt: source.slice(m.index, arg.end + 1).slice(0, 100),
      });
    }
  }

  // Dedupe call sites by offset — the same dispatch can match both the
  // literal-receiver regex (e.g., `analytics.event(...)`) and the
  // rebound-receiver regex when a re-bind happens to use the literal
  // identifier name (`const analytics = useAnalytics()`).
  const seen = new Set();
  const dedupedSites = callSites.filter((site) => {
    if (seen.has(site.offset)) return false;
    seen.add(site.offset);
    return true;
  });

  for (const site of dedupedSites) {
    const result = checkArgument(site.argText);
    if (!result) continue;
    if (result.kind === "screaming-snake") {
      // Identifier MUST resolve to a top-level string-literal const.
      if (!stringConsts.has(result.identifier)) {
        violations.push({
          file,
          line: lineNumberFor(source, site.offset),
          rule: "R-PIIInterpolation",
          detail: `bare identifier ${result.identifier} does not resolve to a top-level \`const ${result.identifier} = "literal"\` declaration in this file (depth-1 lookup; chains are rejected)`,
          callExcerpt: site.callExcerpt,
        });
      }
      continue;
    }
    // Generic rejection: report the offending shape verbatim so the
    // contributor can fix without consulting the spec.
    violations.push({
      file,
      line: lineNumberFor(source, site.offset),
      rule: "R-PIIInterpolation",
      detail: `argument shape \`${result.text.slice(0, 80)}\` is not a bare string literal nor a top-level SCREAMING_SNAKE_CASE constant with literal RHS; remove interpolation or extract to a constant`,
      callExcerpt: site.callExcerpt,
    });
  }
}

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function isAllowlisted(file) {
  return ALLOWLIST.has(relForRule(file));
}

export function runCheck({ src } = {}) {
  // Tests can override the source root by passing `src`.
  const root = src ?? SPA_SRC;
  const violations = [];
  const files = src ? collectAll(src) : findFiles();
  for (const file of files) {
    if (isAllowlisted(file)) continue;
    checkFile(file, violations);
  }
  return violations.map((v) => ({
    ...v,
    file: relForRule(v.file),
  }));
}

function collectAll(root) {
  const out = [];
  walk(root, (f) => out.push(f));
  return out;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ No PII / secret leakage detected.");
    process.exit(0);
  }
  console.error("❌ PII / secret-leakage guard violations:");
  for (const v of found) {
    console.error(
      `  [${v.rule}] ${v.file}:${v.line}\n    call: ${v.callExcerpt}\n    ${v.detail}`
    );
  }
  process.exit(1);
}
