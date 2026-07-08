#!/usr/bin/env node
/**
 * Mechanical guard: `@ai-sdk/*` containment (R-AiSdkContainment).
 *
 * Provider SDK instantiation lives in `@kaiord/ai` (see
 * `openspec/specs/ai-providers/spec.md`). Any other package that imports an
 * `@ai-sdk/*` module directly would re-introduce the scattered provider
 * plumbing this centralization removed. This guard inspects every TS/TSX
 * source file under `packages/<X>/src/` (excluding test/spec/stories/dist/
 * node_modules) and rejects `@ai-sdk/*` import declarations outside
 * `packages/ai`.
 *
 * Build-configuration references (package manifests, bundler alias strings in
 * `vite.config.ts`) are out of scope — this checks import declarations only.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const EXEMPT_PACKAGE = "ai";
const SKIP_DIRS = new Set(["dist", "node_modules", "coverage", ".turbo"]);
const SKIP_FILE = /\.(test|spec|stories)\.(ts|tsx)$/;
const SOURCE_FILE = /\.(ts|tsx)$/;

/** Matches `from "@ai-sdk/x"`, `import("@ai-sdk/x")`, `require("@ai-sdk/x")`. */
const AI_SDK_IMPORT =
  /(?:from|import|require)\s*\(?\s*["']@ai-sdk\/[^"']+["']/;

const walk = (dir, acc) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(abs, acc);
    } else if (SOURCE_FILE.test(entry.name) && !SKIP_FILE.test(entry.name)) {
      acc.push(abs);
    }
  }
  return acc;
};

/**
 * @param {{ packagesRoot: string }} opts
 * @returns {{ file: string, line: number, text: string }[]}
 */
export const runCheck = ({ packagesRoot }) => {
  const violations = [];
  let packages;
  try {
    packages = readdirSync(packagesRoot, { withFileTypes: true });
  } catch {
    return violations;
  }
  for (const pkg of packages) {
    if (!pkg.isDirectory() || pkg.name === EXEMPT_PACKAGE) continue;
    const srcDir = join(packagesRoot, pkg.name, "src");
    let isDir = false;
    try {
      isDir = statSync(srcDir).isDirectory();
    } catch {
      isDir = false;
    }
    if (!isDir) continue;
    for (const file of walk(srcDir, [])) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((text, i) => {
        if (AI_SDK_IMPORT.test(text)) {
          violations.push({
            file: relative(packagesRoot, file).split(sep).join("/"),
            line: i + 1,
            text: text.trim(),
          });
        }
      });
    }
  }
  return violations;
};

const main = () => {
  const dryRun = process.argv.includes("--dry-run");
  const violations = runCheck({ packagesRoot: join(REPO_ROOT, "packages") });
  if (dryRun) {
    process.stdout.write(JSON.stringify(violations, null, 2) + "\n");
    return;
  }
  if (violations.length === 0) {
    console.log("check-ai-sdk-containment: OK (no @ai-sdk imports outside packages/ai)");
    return;
  }
  console.error("check-ai-sdk-containment: R-AiSdkContainment violations:");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  console.error(
    "\nProvider SDKs must be reached through @kaiord/ai/providers, not imported directly."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
