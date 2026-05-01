#!/usr/bin/env node
/**
 * Mechanical guard: tests MUST NOT be unconditionally skipped.
 *
 * Rule R-NoUnconditionalSkip: rejects Vitest-style unconditional skips
 * across `it`, `test`, `describe` for `.skip`, `.only`, `.todo` methods,
 * and rejects literal-only `*.skipIf(<expr>)` calls. Covers four dispatch
 * shapes (member, computed-member, destructured, re-bound). Allows
 * `*.todo` only when an immediately-preceding `// TODO(YYYY-MM-DD): reason`
 * comment carries a non-expired deadline.
 *
 * The signature determines the verdict:
 *
 *   it.skip("name", fn)   ← Vitest unconditional         REJECT
 *   it.only("name", fn)   ← Vitest single-test focus     REJECT
 *   it.todo("name")       ← Vitest unimplemented         REJECT (unless deadline comment)
 *
 *   test.skip(cond, reason) ← Playwright runtime         ALLOW
 *   test.skip()             ← Playwright mid-body skip   ALLOW
 *   test.skip(true, "...")  ← Playwright unconditional   ALLOW (separate code smell)
 *
 *   it.skipIf(process.env.X)("name", fn)  ← runtime cond ALLOW
 *   it.skipIf(true)("name", fn)           ← literal-only REJECT
 *
 *   // TODO(2026-08-01): finish auth flow                ← deadline allowance
 *   it.todo("auth flow", () => {});                      ALLOW (non-expired)
 *
 *   // TODO(2024-01-01): finish auth flow                ← expired
 *   it.todo("auth flow", () => {});                      REJECT (deadline past)
 *
 * Four dispatch shapes covered:
 *   1. Member dispatch        it.skip("...", fn)
 *   2. Computed-member        it["skip"]("...", fn)
 *   3. Destructured           const { skip } = it; skip("...", fn)
 *   4. Re-bound               const my = it; my.skip("...", fn)
 *
 * Aliases are resolved depth-1 (direct destructure or re-bind from
 * `it|test|describe`). Chains (e.g., `const my = it; const { skip } = my;`)
 * remain documented residual risk; vanishingly rare in practice.
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

const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_RE = /(^|[^:])\/\/[^\n]*/g;

const MEMBER_VITEST_RE =
  /\b(it|test|describe)\.(skip|only|todo)\s*\(\s*(['"`])/g;
const COMPUTED_VITEST_RE =
  /\b(it|test|describe)\s*\[\s*['"](skip|only|todo)['"]\s*\]\s*\(\s*(['"`])/g;
const MEMBER_SKIPIF_RE = /\b(it|test|describe)\.skipIf\s*\(/g;
const COMPUTED_SKIPIF_RE =
  /\b(it|test|describe)\s*\[\s*['"]skipIf['"]\s*\]\s*\(/g;

// `const { skip, only: myOnly } = it;` — destructure from it/test/describe
const DESTRUCTURE_RE =
  /\bconst\s*\{\s*([^}]+)\s*\}\s*=\s*(it|test|describe)\b/g;

// `const my = it;` — re-bind it/test/describe to a new identifier
const REBIND_RE =
  /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(it|test|describe)\b\s*;?\s*(?:\/\/|$|[\r\n])/gm;

// `// TODO(YYYY-MM-DD): reason` — deadline allowance for .todo
const DEADLINE_COMMENT_RE =
  /^\s*\/\/\s*TODO\s*\(\s*(\d{4}-\d{2}-\d{2})\s*\)\s*:?/;

const LITERAL_KEYWORDS = new Set(["true", "false", "null", "undefined"]);

// R-NoUnconditionalSkip: must remain empty. Re-seeding requires an OpenSpec amendment.
export const ALLOWLIST = new Set([]);

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function stripComments(src) {
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

function captureBalanced(src, openParenIdx) {
  let depth = 0;
  let i = openParenIdx;
  let out = "";
  let quote = null;
  let templateDepth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      out += c;
      if (c === "\\") {
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
  let s = arg;
  s = s.replace(/"([^"\\]|\\.)*"/g, (m) => " ".repeat(m.length));
  s = s.replace(/'([^'\\]|\\.)*'/g, (m) => " ".repeat(m.length));

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
      if (hasInterp) return false;
      out += " ".repeat(j - i + 1);
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  s = out;

  const idTokens = s.match(/[A-Za-z_$][\w$]*/g) ?? [];
  for (const tok of idTokens) {
    if (!LITERAL_KEYWORDS.has(tok)) return false;
  }
  return true;
}

// Resolve aliases declared via destructure or re-bind in this file.
// Returns:
//   destructuredAliases: Map<localName, { origin: "skip"|"only"|"todo"|"skipIf", root: "it"|"test"|"describe" }>
//   reboundAliases: Map<localName, "it"|"test"|"describe">
function findAliases(cleaned) {
  const destructured = new Map();
  const rebound = new Map();

  for (const m of cleaned.matchAll(DESTRUCTURE_RE)) {
    const bindings = m[1];
    const root = m[2];
    for (const part of bindings.split(",")) {
      const trimmed = part.trim();
      const match = trimmed.match(
        /^(skip|only|todo|skipIf)\s*(?::\s*([A-Za-z_$][\w$]*))?\s*$/
      );
      if (!match) continue;
      const origin = match[1];
      const local = match[2] ?? match[1];
      destructured.set(local, { origin, root });
    }
  }

  for (const m of cleaned.matchAll(REBIND_RE)) {
    const local = m[1];
    const root = m[2];
    if (local === root) continue; // const it = it (no-op)
    if (destructured.has(local) || ["it", "test", "describe"].includes(local)) {
      continue;
    }
    rebound.set(local, root);
  }

  return { destructured, rebound };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Find a `// TODO(YYYY-MM-DD)` deadline comment immediately preceding the
// given source position. "Immediately preceding" = the last non-empty line
// before the call's line. Returns the parsed Date, or null if no comment
// found / malformed / line too far away.
function findDeadlineComment(originalSource, callIdx) {
  // Walk back to find the start of the call's line.
  let lineStart = callIdx;
  while (lineStart > 0 && originalSource[lineStart - 1] !== "\n") lineStart--;

  // Walk back further to find the end of the previous non-empty line.
  let prevLineEnd = lineStart - 1; // points at \n of previous line
  while (prevLineEnd >= 0 && originalSource[prevLineEnd] === "\n") {
    prevLineEnd--;
  }
  if (prevLineEnd < 0) return null;

  // Walk back to the start of that previous line.
  let prevLineStart = prevLineEnd;
  while (prevLineStart > 0 && originalSource[prevLineStart - 1] !== "\n") {
    prevLineStart--;
  }
  const prevLine = originalSource.slice(prevLineStart, prevLineEnd + 1);

  // Adjacency: only the line immediately above counts. If there were blank
  // lines between, prevLineEnd would have skipped past them — so the comment
  // must be on the line directly above (no blanks). Reject if the call's
  // line and the previous line are not contiguous (blank lines between).
  // Detect by checking that lineStart - 1 is the newline at prevLineEnd.
  if (lineStart - 1 !== prevLineEnd + 1 && lineStart - 1 !== prevLineEnd) {
    return null;
  }

  const m = prevLine.match(DEADLINE_COMMENT_RE);
  if (!m) return null;
  const dateStr = m[1];
  const parsed = new Date(`${dateStr}T23:59:59Z`);
  if (Number.isNaN(parsed.valueOf())) return null;
  return { date: parsed, dateStr };
}

function isTodoDeadlineNonExpired(originalSource, callIdx) {
  const found = findDeadlineComment(originalSource, callIdx);
  if (!found) return { ok: false, reason: "no deadline comment" };
  const now = new Date();
  if (found.date.valueOf() < now.valueOf()) {
    return {
      ok: false,
      reason: `deadline ${found.dateStr} has expired (today is ${now.toISOString().slice(0, 10)})`,
    };
  }
  return { ok: true, dateStr: found.dateStr };
}

function checkFile(file, source) {
  const violations = [];
  const cleaned = stripComments(source);
  const rel = relForRule(file);

  // 1. Member dispatch: it.skip("...", fn) etc.
  for (const m of cleaned.matchAll(MEMBER_VITEST_RE)) {
    const method = m[2];
    if (method === "todo") {
      const verdict = isTodoDeadlineNonExpired(source, m.index);
      if (verdict.ok) continue;
      const line = lineOf(cleaned, m.index);
      violations.push({
        rule: "R-NoUnconditionalSkip",
        file: rel,
        line,
        detail: `${m[1]}.todo(<string>) — ${verdict.reason}. Add an immediately-preceding "// TODO(YYYY-MM-DD): reason" comment with a non-expired deadline, or remove the .todo.`,
      });
      continue;
    }
    const line = lineOf(cleaned, m.index);
    violations.push({
      rule: "R-NoUnconditionalSkip",
      file: rel,
      line,
      detail: `${m[1]}.${method}(<string>, fn) is an unconditional Vitest skip. Convert to ${m[1]}.skipIf(<runtime-expr>) or fix the underlying issue.`,
    });
  }

  // 2. Computed-member dispatch: it["skip"]("...", fn) etc.
  for (const m of cleaned.matchAll(COMPUTED_VITEST_RE)) {
    const method = m[2];
    if (method === "todo") {
      const verdict = isTodoDeadlineNonExpired(source, m.index);
      if (verdict.ok) continue;
      const line = lineOf(cleaned, m.index);
      violations.push({
        rule: "R-NoUnconditionalSkip",
        file: rel,
        line,
        detail: `${m[1]}["todo"](<string>) — ${verdict.reason}. Add an immediately-preceding "// TODO(YYYY-MM-DD): reason" comment, or remove the .todo.`,
      });
      continue;
    }
    const line = lineOf(cleaned, m.index);
    violations.push({
      rule: "R-NoUnconditionalSkip",
      file: rel,
      line,
      detail: `${m[1]}["${method}"](<string>, fn) is an unconditional Vitest skip via computed-member dispatch.`,
    });
  }

  // 3. skipIf with literal-only argument (member dispatch)
  for (const m of cleaned.matchAll(MEMBER_SKIPIF_RE)) {
    const openParen = m.index + m[0].length - 1;
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

  // 5. Destructured + re-bound dispatch shapes
  const { destructured, rebound } = findAliases(cleaned);

  // 5a. Destructured: `const { skip } = it; skip("...", fn);`
  for (const [localName, { origin, root }] of destructured.entries()) {
    const callRe = new RegExp(`(?<![.\\w$])${escapeRe(localName)}\\s*\\(`, "g");
    for (const m of cleaned.matchAll(callRe)) {
      const openParen = m.index + m[0].length - 1;
      const { inner } = captureBalanced(cleaned, openParen);
      const line = lineOf(cleaned, m.index);
      if (origin === "skipIf") {
        if (looksLiteralOnly(inner)) {
          violations.push({
            rule: "R-NoUnconditionalSkip",
            file: rel,
            line,
            detail: `${localName}(${inner.trim()}) — destructured from \`${root}.skipIf\`; argument must be runtime-evaluated, literal-only is rejected.`,
          });
        }
        continue;
      }
      // skip / only / todo via destructured alias
      const firstArgChar = inner.trim().charAt(0);
      const isStringLiteralFirstArg =
        firstArgChar === '"' || firstArgChar === "'" || firstArgChar === "`";
      if (!isStringLiteralFirstArg) continue;
      if (origin === "todo") {
        const verdict = isTodoDeadlineNonExpired(source, m.index);
        if (verdict.ok) continue;
        violations.push({
          rule: "R-NoUnconditionalSkip",
          file: rel,
          line,
          detail: `${localName}(<string>) — destructured from \`${root}.todo\`; ${verdict.reason}. Add a "// TODO(YYYY-MM-DD): reason" comment or remove the call.`,
        });
        continue;
      }
      violations.push({
        rule: "R-NoUnconditionalSkip",
        file: rel,
        line,
        detail: `${localName}(<string>, fn) — destructured from \`${root}.${origin}\`; unconditional Vitest skip via destructured dispatch.`,
      });
    }
  }

  // 5b. Re-bound: `const my = it; my.skip("...", fn);`
  for (const [localName, root] of rebound.entries()) {
    // Match `<local>.<skip|only|todo>(<string>` (member dispatch via re-bind)
    const memberRe = new RegExp(
      `(?<![.\\w$])${escapeRe(localName)}\\.(skip|only|todo)\\s*\\(\\s*(['"\`])`,
      "g"
    );
    for (const m of cleaned.matchAll(memberRe)) {
      const method = m[1];
      const line = lineOf(cleaned, m.index);
      if (method === "todo") {
        const verdict = isTodoDeadlineNonExpired(source, m.index);
        if (verdict.ok) continue;
        violations.push({
          rule: "R-NoUnconditionalSkip",
          file: rel,
          line,
          detail: `${localName}.todo(<string>) — re-bound from \`${root}\`; ${verdict.reason}.`,
        });
        continue;
      }
      violations.push({
        rule: "R-NoUnconditionalSkip",
        file: rel,
        line,
        detail: `${localName}.${method}(<string>, fn) — re-bound from \`${root}\`; unconditional Vitest skip via re-bound dispatch.`,
      });
    }
    // Match `<local>.skipIf(<expr>)` (re-bound skipIf)
    const skipIfRe = new RegExp(
      `(?<![.\\w$])${escapeRe(localName)}\\.skipIf\\s*\\(`,
      "g"
    );
    for (const m of cleaned.matchAll(skipIfRe)) {
      const openParen = m.index + m[0].length - 1;
      const { inner } = captureBalanced(cleaned, openParen);
      if (looksLiteralOnly(inner)) {
        const line = lineOf(cleaned, m.index);
        violations.push({
          rule: "R-NoUnconditionalSkip",
          file: rel,
          line,
          detail: `${localName}.skipIf(${inner.trim()}) — re-bound from \`${root}.skipIf\`; literal-only argument is rejected.`,
        });
      }
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
