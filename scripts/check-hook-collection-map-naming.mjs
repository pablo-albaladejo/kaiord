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
import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const SPA_SRC_GLOB =
  "packages/workout-spa-editor/src/**/*.{ts,tsx}";

const MAP_CALLBACK_RE =
  /\.map\s*\(\s*\(?\s*([A-Za-z_$][\w$]*)\s*\)?\s*=>\s*([\s\S]*?)\)\s*[,;\.\)]/g;

/**
 * Scan a single source string for violations.
 * Returns an array of `{ line, param }` entries.
 */
export function findViolations(source) {
  const violations = [];
  for (const match of source.matchAll(MAP_CALLBACK_RE)) {
    const [, param, body] = match;
    if (param.startsWith("use")) continue;
    const invokesAsFunction = new RegExp(
      `\\b${escapeRegex(param)}\\s*\\(`
    ).test(body);
    if (!invokesAsFunction) continue;
    const line = source.slice(0, match.index).split("\n").length;
    violations.push({ line, param });
  }
  return violations;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const files = await collectFiles();
  const all = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const violations = findViolations(source);
    for (const v of violations) {
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
    const rel = path.relative(REPO_ROOT, v.file);
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

async function collectFiles() {
  const out = [];
  for await (const entry of glob(SPA_SRC_GLOB, { cwd: REPO_ROOT })) {
    out.push(path.join(REPO_ROOT, entry));
  }
  return out.sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
