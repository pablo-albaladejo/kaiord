#!/usr/bin/env node
/**
 * Mechanical guard: tests MUST NOT be unconditionally skipped.
 *
 * Rule R-NoUnconditionalSkip: rejects Vitest-style unconditional skips
 * across `it`, `test`, `describe` for `.skip`, `.only`, `.todo` methods,
 * and rejects literal-only `*.skipIf(<expr>)` calls.
 *
 * The signature determines the verdict:
 *
 *   it.skip("name", fn)   ← Vitest unconditional         REJECT
 *   it.only("name", fn)   ← Vitest single-test focus     REJECT
 *   it.todo("name")       ← Vitest unimplemented         REJECT
 *
 *   test.skip(cond, reason) ← Playwright runtime         ALLOW
 *   test.skip()             ← Playwright mid-body skip   ALLOW
 *   test.skip(true, "...")  ← Playwright unconditional   ALLOW (separate code smell, not this rule)
 *
 *   it.skipIf(process.env.X)("name", fn)  ← runtime cond ALLOW
 *   it.skipIf(true)("name", fn)           ← literal-only REJECT
 *
 * The first-argument shape decides:
 *   - String literal as first arg              → Vitest unconditional → REJECT
 *   - Anything else (expression, no args, ...) → Playwright/runtime   → ALLOW
 *
 * Four dispatch shapes covered:
 *   1. Member dispatch         it.skip("...", fn)
 *   2. Computed-member         it["skip"]("...", fn)
 *
 * Destructured (`const { skip } = it; skip("...", fn)`) and re-bound
 * (`const my = it; my.skip("...", fn)`) dispatch are documented as
 * residual risk — not covered by this rule's regex implementation. They
 * are vanishingly rare in practice. If a contributor finds a case in the
 * wild, file an issue and tighten the rule.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print human-readable report; exit non-zero.
 */

import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findPackageFiles } from "./lib/find-package-files.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_ROOT = resolve(REPO_ROOT, "packages");

const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|mjs)$/;

// Strip block + line comments before scanning so commentary mentioning
// `it.skip(` does not trigger.
const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_RE = /(^|[^:])\/\/[^\n]*/g;

// Vitest unconditional pattern: <it|test|describe>.<skip|only|todo>("...
const MEMBER_VITEST_RE =
  /\b(it|test|describe)\.(skip|only|todo)\s*\(\s*(['"`])/g;

// Computed-member equivalent: <it|test|describe>["skip"|"only"|"todo"]("...
const COMPUTED_VITEST_RE =
  /\b(it|test|describe)\s*\[\s*['"](skip|only|todo)['"]\s*\]\s*\(\s*(['"`])/g;

// skipIf pattern: <it|test|describe>.skipIf(<expr>)
const MEMBER_SKIPIF_RE = /\b(it|test|describe)\.skipIf\s*\(/g;
const COMPUTED_SKIPIF_RE =
  /\b(it|test|describe)\s*\[\s*['"]skipIf['"]\s*\]\s*\(/g;

// Pure-literal expressions for skipIf-arg rejection. We accept a node only
// if it contains at least one Identifier, MemberExpression, CallExpression,
// or NewExpression. Approximation (regex, not AST):
//
//   - The argument string after stripping whitespace + parens consists
//     ENTIRELY of literal-shape tokens: bool/null/undefined keywords,
//     numeric literals, string literals (any quote style), and operators
//     `! && || + - * / ( ) , `, possibly with surrounding whitespace.
//
// If a non-literal token (any letter sequence not in the literal-keyword
// set, any backtick template with `${...}`) is present, the call is
// runtime-evaluated → ALLOW.
const LITERAL_KEYWORDS = new Set(["true", "false", "null", "undefined"]);

// R-NoUnconditionalSkip: drained in PR4 of guidelines-compliance-harden.
export const ALLOWLIST = new Set([]);

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function stripComments(src) {
  // Preserve line numbers by replacing comments with whitespace of equal
  // length and preserving any newlines they contained.
  let out = src.replace(BLOCK_COMMENT_RE, (m) => m.replace(/[^\n]/g, " "));
  out = out.replace(
    LINE_COMMENT_RE,
    (m, prefix) => prefix + " ".repeat(m.length - prefix.length)
  );
  return out;
}

function lineOf(src, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < src.length; i++) {
    if (src[i] === "\n") line++;
  }
  return line;
}

// Scan forward from `(` to find balanced `)`; return the inner argument
// string (without the parens). Quotes are honored at a basic level.
function captureBalanced(src, openParenIdx) {
  let depth = 0;
  let i = openParenIdx;
  let out = "";
  let quote = null;
  let templateDepth = 0; // ${...} inside backticks
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      out += c;
      if (c === "\\") {
        // Skip next char
        if (i + 1 < src.length) {
          out += src[i + 1];
          i++;
        }
        continue;
      }
      if (c === quote && templateDepth === 0) {
        quote = null;
      } else if (quote === "`" && c === "$" && src[i + 1] === "{") {
        out += src[i + 1];
        i++;
        templateDepth++;
      } else if (quote === "`" && c === "}" && templateDepth > 0) {
        templateDepth--;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      continue;
    }
    if (c === "(") {
      depth++;
      if (depth > 1) out += c;
      continue;
    }
    if (c === ")") {
      depth--;
      if (depth === 0) {
        return { inner: out, end: i };
      }
      out += c;
      continue;
    }
    if (depth >= 1) out += c;
  }
  return { inner: out, end: i };
}

function looksLiteralOnly(arg) {
  // Strip strings (replaced with whitespace, NOT identifier-shaped chars)
  // and backtick templates without ${...} (whitespace). If any backtick
  // template contains ${...}, the call is runtime-evaluated → return false.
  let s = arg;

  // Replace "..." and '...' string literals with spaces of equal length.
  s = s.replace(/"([^"\\]|\\.)*"/g, (m) => " ".repeat(m.length));
  s = s.replace(/'([^'\\]|\\.)*'/g, (m) => " ".repeat(m.length));

  // Walk backtick templates manually so we can detect ${...}.
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "`") {
      let j = i + 1;
      let hasInterp = false;
      while (j < s.length) {
        if (s[j] === "\\") {
          j += 2;
          continue;
        }
        if (s[j] === "`") break;
        if (s[j] === "$" && s[j + 1] === "{") {
          hasInterp = true;
          let depth = 1;
          j += 2;
          while (j < s.length && depth > 0) {
            if (s[j] === "{") depth++;
            else if (s[j] === "}") depth--;
            j++;
          }
          continue;
        }
        j++;
      }
      if (hasInterp) {
        // Template literal with substitution → runtime
        return false;
      }
      // Replace the entire `...` block with spaces of equal length.
      out += " ".repeat(j - i + 1);
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  s = out;

  // Any letter sequence not in LITERAL_KEYWORDS implies an identifier
  // reference / call → runtime. (After stripping string + template
  // literals to whitespace, only structural identifiers remain.)
  const idTokens = s.match(/[A-Za-z_$][\w$]*/g) ?? [];
  for (const tok of idTokens) {
    if (!LITERAL_KEYWORDS.has(tok)) return false;
  }
  return true;
}

function checkFile(file, source) {
  const violations = [];
  const cleaned = stripComments(source);
  const rel = relForRule(file);

  // 1. Vitest unconditional pattern (member dispatch)
  for (const m of cleaned.matchAll(MEMBER_VITEST_RE)) {
    const line = lineOf(cleaned, m.index);
    violations.push({
      rule: "R-NoUnconditionalSkip",
      file: rel,
      line,
      detail: `${m[1]}.${m[2]}(<string>, fn) is an unconditional Vitest skip. Convert to ${m[1]}.skipIf(<runtime-expr>) or fix the underlying issue.`,
    });
  }

  // 2. Vitest unconditional pattern (computed-member dispatch)
  for (const m of cleaned.matchAll(COMPUTED_VITEST_RE)) {
    const line = lineOf(cleaned, m.index);
    violations.push({
      rule: "R-NoUnconditionalSkip",
      file: rel,
      line,
      detail: `${m[1]}["${m[2]}"](<string>, fn) is an unconditional Vitest skip via computed-member dispatch.`,
    });
  }

  // 3. skipIf with literal-only argument (member dispatch)
  for (const m of cleaned.matchAll(MEMBER_SKIPIF_RE)) {
    const openParen = m.index + m[0].length - 1; // position of `(`
    const { inner } = captureBalanced(cleaned, openParen);
    if (looksLiteralOnly(inner)) {
      const line = lineOf(cleaned, m.index);
      violations.push({
        rule: "R-NoUnconditionalSkip",
        file: rel,
        line,
        detail: `${m[1]}.skipIf(${inner.trim()}) — argument must contain at least one Identifier, MemberExpression, CallExpression, or NewExpression (runtime-evaluated). Literal-only is functionally equivalent to an unconditional skip.`,
      });
    }
  }

  // 4. skipIf computed-member
  for (const m of cleaned.matchAll(COMPUTED_SKIPIF_RE)) {
    const openParen = m.index + m[0].length - 1;
    const { inner } = captureBalanced(cleaned, openParen);
    if (looksLiteralOnly(inner)) {
      const line = lineOf(cleaned, m.index);
      violations.push({
        rule: "R-NoUnconditionalSkip",
        file: rel,
        line,
        detail: `${m[1]}["skipIf"](${inner.trim()}) — argument must contain at least one runtime-evaluated node.`,
      });
    }
  }

  return violations;
}

export function runCheck({ packagesRoot } = {}) {
  const root = packagesRoot ?? PACKAGES_ROOT;
  const files = findPackageFiles(root, (file) => TEST_FILE_RE.test(file));
  const violations = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const v of checkFile(file, source)) {
      const allowKey = `${v.file}:${v.line}`;
      if (root === PACKAGES_ROOT && ALLOWLIST.has(allowKey)) continue;
      violations.push(v);
    }
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const dryRun = process.argv.includes("--dry-run");
  const violations = runCheck();
  if (dryRun) {
    process.stdout.write(JSON.stringify(violations, null, 2) + "\n");
    process.exit(0);
  }
  if (violations.length === 0) {
    console.log("✅ No unconditional skipped tests detected.");
    process.exit(0);
  }
  console.error("❌ R-NoUnconditionalSkip violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
