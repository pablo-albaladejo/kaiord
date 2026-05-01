#!/usr/bin/env node
/**
 * Mechanical guard: any `Array.prototype.map` whose callback parameter
 * is invoked as a function inside the body MUST name that parameter
 * with a `use*` prefix.
 *
 * Why: `eslint-plugin-react-hooks` detects hook calls by the `use*`
 * identifier prefix. A parameter named `f` or `factory` is silently
 * accepted by the plugin even when it points to a real React hook,
 * letting Rules-of-Hooks violations slip past static analysis. This
 * guard closes the gap at the upstream side (parameter naming) so the
 * plugin can do its job at the call site.
 *
 * Single trigger pattern:
 *   - Callback body invokes the parameter as a function: `<param>(...)`
 *     appears syntactically inside the body, AND
 *   - The parameter name does NOT start with the literal `use` prefix.
 *
 * Receiver identity (`factories`, `useCoachingSourceFactories()`, or
 * anything else) is intentionally NOT part of the rule. Any callable
 * callback parameter is a potential hook call site.
 *
 * Scope: the full SPA `src/**` tree (broader than the PII guard's
 * `{components,hooks,lib}/**` scope) because Rules-of-Hooks applies
 * everywhere.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");
const TS_EXTENSIONS = new Set([".ts", ".tsx"]);

// Match the start of every `.map(<param>` shape; the body length is
// determined by a balanced-paren scan so multi-line / nested-brace
// callback bodies are captured correctly. Arrow-function opener
// variants only (function-keyword callbacks are NOT covered):
//   1. .map((<param>) => ...
//   2. .map(<param> => ...
//
// TypeScript type annotations on the callback parameter (e.g.,
// `(f: Type) => f(...)`) and return-type annotations (e.g.,
// `(f): ReturnType => f(...)`) are also NOT covered. In practice
// these forms are uncommon in hook-collection .map() calls; if they
// emerge, extend MAP_OPENER_RE or add an explicit test fixture.
const MAP_OPENER_RE =
  /\.map\s*\(\s*(?:\(\s*([A-Za-z_$][\w$]*)\s*\)|([A-Za-z_$][\w$]*))\s*=>/g;

function findCallEndIndex(source, openerEndIndex) {
  // openerEndIndex is the position right after `=>`. Scan from there
  // until the matching close-paren of the outer `.map(...)`. Respects
  // string / template / paren / brace nesting.
  let i = openerEndIndex;
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
      templateBraceDepth = 0;
      i += 1;
      continue;
    }
    if (ch === "(") parenDepth += 1;
    else if (ch === "[") bracketDepth += 1;
    else if (ch === "{") braceDepth += 1;
    else if (ch === "]") bracketDepth -= 1;
    else if (ch === "}") braceDepth -= 1;
    else if (ch === ")") {
      if (parenDepth === 0) return i;
      parenDepth -= 1;
    }
    i += 1;
  }
  return -1;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scan a single source string for violations.
 * Returns an array of `{ line, param }` entries.
 */
export function findViolations(source) {
  const violations = [];
  for (const m of source.matchAll(MAP_OPENER_RE)) {
    const param = m[1] ?? m[2];
    // Mirror eslint-plugin-react-hooks isHookName: /^use[A-Z0-9]/.
    // `user` and `usefactory` (lowercase after `use`) are NOT treated
    // as hooks by the plugin, so this guard must reject them too —
    // otherwise it gives a false sense of safety.
    if (!param || /^use[A-Z0-9]/.test(param)) continue;
    const openerEnd = m.index + m[0].length;
    const callEnd = findCallEndIndex(source, openerEnd);
    if (callEnd === -1) continue;
    const body = source.slice(openerEnd, callEnd);
    // Match standalone identifier invocations only — `helper.f()` and
    // `obj.f()` (where the callback param is `f`) MUST NOT count as
    // an invocation of the callback parameter, otherwise compliant
    // bodies like `.map((f) => helper.f())` would falsely fail.
    const invokesAsFunction = new RegExp(
      `(?<![\\w$.])${escapeRegex(param)}\\s*\\(`
    ).test(body);
    if (!invokesAsFunction) continue;
    const line = source.slice(0, m.index).split("\n").length;
    violations.push({ line, param });
  }
  return violations;
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (
      entry.isFile() &&
      TS_EXTENSIONS.has(extOf(entry.name)) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

function extOf(name) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

async function main() {
  if (!safeStat(SPA_SRC)) {
    console.log(
      `[check-hook-collection-map-naming] SPA src not found at ${SPA_SRC}; skipping.`
    );
    return;
  }
  const files = walk(SPA_SRC).sort();
  const all = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const v of findViolations(source)) {
      all.push({ file, ...v });
    }
  }
  if (all.length === 0) {
    console.log(
      `[check-hook-collection-map-naming] OK (scanned ${files.length} files)`
    );
    return;
  }
  for (const v of all) {
    const rel = relative(REPO_ROOT, v.file);
    console.error(
      `${rel}:${v.line} — \`.map((${v.param}) => ${v.param}(...))\` ` +
        `parameter \`${v.param}\` must start with \`use\` (rule R-HookMapNaming)`
    );
  }
  console.error(
    `\n${all.length} violation(s). See ` +
      `openspec/specs/spa-quality-gates/spec.md "Hook-collection map ` +
      `parameter naming guard".`
  );
  process.exit(1);
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
