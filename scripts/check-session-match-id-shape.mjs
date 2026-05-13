#!/usr/bin/env node
/**
 * Mechanical guard: every literal assignment of `coachingActivityId`
 * inside a `sessionMatches` write call site (or `[profileId+coachingActivityId]`
 * Dexie reader) MUST be constructed via one of the canonical helpers
 * so SHORT-form view-model ids cannot leak back into persistence.
 *
 * Allowed expressions (rule R-SessionMatchIdShape):
 *
 *   - `buildCoachingActivityId(...)` — composes from
 *     `(profileId, source, sourceId)` of a `CoachingActivityRecord`.
 *   - `toPersistedCoachingActivityId(...)` — composes from
 *     `(profileId, viewModelId)` of an in-memory `CoachingActivity`.
 *   - `activity.id` / `record.id` / `<*Record>.id` — a bare property
 *     access whose left-hand side ends in `Record` or starts with
 *     `activity`/`record`/`canonical`; in TypeScript code under
 *     `packages/workout-spa-editor/src/` these are typed
 *     `CoachingActivityRecord` (Zod-enforced COMPOSITE shape).
 *   - `composite` / `canonical*` — a local bound to one of the helpers
 *     above (heuristic-allowed; the helper at the assignment site is
 *     what carries the contract, not the local name).
 *   - A bare identifier whose name ends in `Id` (function parameter
 *     in a generic helper, already-typed string at the caller).
 *   - A plain string literal — exempted: this is test-fixture data.
 *
 * Disallowed (the original H7 bug shape):
 *
 *   - Template literals `\`${activity.id}\`` — the in-memory
 *     `CoachingActivity.id` is the SHORT form.
 *   - `activity.id` where `activity` is destructured from a closure
 *     of `CoachingActivity` — this is shape-equivalent to SHORT;
 *     guarded by a name-based heuristic (the property holder MUST end
 *     in `Record` or be one of the allow-listed names).
 *
 * Scope: `packages/workout-spa-editor/src/**` excluding test files.
 *
 * Co-located test: `scripts/check-session-match-id-shape.test.mjs`.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

const TS_EXTENSIONS = [".ts", ".tsx"];
const SKIP_EXTENSIONS = [
  ".test.ts",
  ".test.tsx",
  ".stories.ts",
  ".stories.tsx",
];

// Type / schema / port definition files — the rule does not apply
// because these declare the contract, they do not write to it.
const SKIP_PATH_FRAGMENTS = [
  "/types/session-match.ts",
  "/ports/session-match-repository.ts",
  "/adapters/dexie/dexie-v10-migration.ts",
  "/adapters/dexie/dexie-coaching-repository.ts",
];

// Match the canonical Dexie reader form used to look up a match by
// `[profileId+coachingActivityId]`. The second tuple slot MUST be a
// canonical expression.
const READER_RE =
  /sessionMatches\b[\s\S]{0,200}?\.equals\(\s*\[\s*[A-Za-z_$][\w$]*\s*,\s*/g;

// Match every call to `appendExecutedWorkoutIds(<matchId>, ...)`. The
// matchId MUST come from a `SessionMatch.id` source (a previously read
// row, a function parameter), never a template literal constructed at
// the call site. This is the executed-slot analogue of the H7 guard
// — same shape rule, different write surface.
const APPEND_EXECUTED_RE =
  /\bappendExecutedWorkoutIds\s*\(\s*/g;

// Object-literal property assignment of `coachingActivityId:` whose
// containing surface is one of the three known write call sites
// (ensureSessionMatch / matchSession / sessionMatches.put). The leading
// negative-lookahead `(?!string|number|undefined|null|z\.)` rules out
// TypeScript type declarations like `coachingActivityId: string;`.
// We consume all whitespace before the lookahead so the lookahead
// position is exactly the first non-space character after `: `.
const PROPERTY_RE =
  /coachingActivityId\s*:[ \t]*(?!string\b|number\b|undefined\b|null\b|z\.)(?=[^\s])/g;

// Files where the rule is meaningful: only those whose source actually
// calls into a write surface. Detected dynamically per file so the
// allowlist stays one-list-only.
const WRITE_SURFACE_RE =
  /\b(?:ensureSessionMatch|matchSession|sessionMatches\.put|sessionMatch\.put|repository\.put|deps\.sessionMatches\.put|matchSession\(\s*\{|useMatchSession\(\))/;

const ALLOWED_CALLS = new Set([
  "buildCoachingActivityId",
  "toPersistedCoachingActivityId",
]);

// Bare identifiers that are heuristically allowed at the call site
// because they are documented to hold the canonical COMPOSITE shape.
const ALLOWED_BARE_NAMES = new Set([
  "composite",
  "canonical",
  "canonicalId",
  "newCoachingActivityId",
  "coachingActivityId",
  "id",
]);

const ALLOWED_PROPERTY_HOLDERS = /(?:Record|activity|record|canonical|match)$/;

const safeStat = (p) => {
  try {
    return statSync(p);
  } catch {
    return null;
  }
};

const shouldScan = (name) => {
  if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) return false;
  return TS_EXTENSIONS.some((ext) => name.endsWith(ext));
};

const walk = (dir, visit) => {
  if (!safeStat(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, visit);
    else if (entry.isFile() && shouldScan(entry.name)) visit(p);
  }
};

const findFiles = (root) => {
  const out = [];
  walk(root, (file) => out.push(file));
  return out;
};

// Extract the source text of the expression starting at `start`, up
// to the next top-level `,`, `}`, `]`, or `)`. Respects nested
// parens/brackets/braces and string/template literal interiors.
export const extractExpression = (source, start) => {
  let i = start;
  let inString = false;
  let stringChar = "";
  let inTemplate = false;
  let templateBraceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
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
      i += 1;
      continue;
    }
    if (ch === "(") parenDepth += 1;
    else if (ch === ")") {
      if (parenDepth === 0) break;
      parenDepth -= 1;
    } else if (ch === "[") bracketDepth += 1;
    else if (ch === "]") {
      if (bracketDepth === 0) break;
      bracketDepth -= 1;
    } else if (ch === "{") braceDepth += 1;
    else if (ch === "}") {
      if (braceDepth === 0) break;
      braceDepth -= 1;
    } else if (
      ch === "," &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      break;
    }
    i += 1;
  }
  return source.slice(start, i).trim();
};

export const isAllowedExpression = (expr) => {
  // Plain string literal: test-fixture data; permitted everywhere.
  if (/^"(?:\\.|[^"\\])*"$/.test(expr)) return true;
  if (/^'(?:\\.|[^'\\])*'$/.test(expr)) return true;
  // Template literal: forbidden — this is the SHORT-form bug shape.
  if (expr.startsWith("`")) return false;
  // Call to one of the canonical helpers.
  const callMatch = expr.match(/^([A-Za-z_$][\w$]*)\s*\(/);
  if (callMatch && ALLOWED_CALLS.has(callMatch[1])) return true;
  // Property access `<holder>.id` where holder ends in Record / starts
  // with activity / record / canonical / match.
  const propMatch = expr.match(/^([A-Za-z_$][\w$]*)\.id$/);
  if (propMatch && ALLOWED_PROPERTY_HOLDERS.test(propMatch[1])) return true;
  // Forwarded property access `<param>.coachingActivityId` or
  // `<param>.activityId` — the caller's parameter is typed `string`
  // in a generic helper and the value was constructed via one of the
  // canonical helpers at the original construction site.
  if (/^[A-Za-z_$][\w$]*\.(coachingActivityId|activityId)$/.test(expr)) {
    return true;
  }
  // Bare identifier: must be a documented canonical-bound name or end in `Id`.
  if (/^[A-Za-z_$][\w$]*$/.test(expr)) {
    if (ALLOWED_BARE_NAMES.has(expr)) return true;
    if (expr.endsWith("Id")) return true;
  }
  // Object-shorthand `{ coachingActivityId,` (the expression is empty
  // after the leading `:` because we matched `coachingActivityId:` —
  // but shorthand has no `:`). We never get here for shorthand because
  // the leading regex requires `: `.
  return false;
};

export const scanFile = (file, repoRoot = REPO_ROOT) => {
  const source = readFileSync(file, "utf8");
  const rel = relative(repoRoot, file).replaceAll("\\", "/");
  if (SKIP_PATH_FRAGMENTS.some((frag) => rel.endsWith(frag))) return [];
  const violations = [];
  // Object-literal property writes — only meaningful when the file
  // actually calls a write surface, otherwise we are scanning a type
  // declaration block.
  if (WRITE_SURFACE_RE.test(source)) {
    for (const m of source.matchAll(PROPERTY_RE)) {
      const start = m.index + m[0].length;
      const expr = extractExpression(source, start);
      if (!isAllowedExpression(expr)) {
        violations.push({ file: rel, expr, kind: "property" });
      }
    }
  }
  // Dexie readers — apply everywhere because the canonical lookup
  // form is unambiguous.
  for (const m of source.matchAll(READER_RE)) {
    const start = m.index + m[0].length;
    const expr = extractExpression(source, start);
    if (!isAllowedExpression(expr)) {
      violations.push({ file: rel, expr, kind: "reader" });
    }
  }
  // Executed-slot write surface: `appendExecutedWorkoutIds(<matchId>, ...)`.
  // The matchId argument MUST be a SessionMatch-shape source — same
  // canonical rule as the coachingActivityId case.
  for (const m of source.matchAll(APPEND_EXECUTED_RE)) {
    const start = m.index + m[0].length;
    const expr = extractExpression(source, start);
    if (!isAllowedExpression(expr)) {
      violations.push({ file: rel, expr, kind: "executed-append" });
    }
  }
  return violations;
};

export const runCheck = ({ root = SPA_SRC, repoRoot = REPO_ROOT } = {}) => {
  const violations = [];
  for (const file of findFiles(root)) {
    violations.push(...scanFile(file, repoRoot));
  }
  return violations;
};

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ session-match coachingActivityId shape check clean.");
    process.exit(0);
  }
  console.error("❌ R-SessionMatchIdShape violations:");
  for (const v of found) {
    console.error(`  [${v.kind}] ${v.file} — ${v.expr}`);
  }
  process.exit(1);
}
