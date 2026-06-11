#!/usr/bin/env node
/**
 * Mechanical guard: a *.test.{ts,tsx} file MUST NOT target a subject
 * module that is a pure re-export barrel.
 *
 * Rule R-NoBarrelTestSuite (spec: test-minimality): the subject module
 * of a test file (its path minus the `.test` segment) consisting solely
 * of `export ... from` / `export type ... from` statements is a barrel;
 * a suite against it duplicates the source-level suites verbatim and
 * adds no discrimination. Test the source modules instead.
 *
 * Scope mirrors R-ItTitleShould: *.test.{ts,tsx} under packages/**,
 * excluding test-utils/, e2e/, *.stories.*, and test-setup.ts.
 *
 * Modes:
 *   --changed-files  Restrict inspection to the staged file set
 *                    (`git diff --cached --name-only --diff-filter=ACMR`).
 *                    Exits 0 silently when no in-scope test file is staged.
 *   --dry-run        Emit violations as JSON on stdout; exit 0.
 *   (default)        Whole-tree check; exit non-zero on any violation.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findPackageFiles } from "./lib/find-package-files.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_ROOT = resolve(REPO_ROOT, "packages");

const TEST_FILE_RE = /\.test\.(ts|tsx)$/;
const EXCLUDED_FRAGMENTS = ["/test-utils/", "/e2e/"];
const EXCLUDED_BASENAMES = new Set(["test-setup.ts"]);

const EXPORT_FROM_STATEMENT_RE =
  /^export\s+(type\s+)?(\{[^}]*\}|\*(\s+as\s+\w+)?)\s+from\s+["'][^"']+["']$/;

export function isInScope(filePath) {
  const posix = filePath.replaceAll("\\", "/");
  if (!TEST_FILE_RE.test(posix)) return false;
  if (EXCLUDED_FRAGMENTS.some((fragment) => posix.includes(fragment)))
    return false;
  if (posix.includes(".stories.")) return false;
  if (EXCLUDED_BASENAMES.has(basename(posix))) return false;
  return true;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

export function isPureReexportBarrel(source) {
  const statements = stripComments(source)
    .split(";")
    .map((statement) => statement.replace(/\s+/g, " ").trim())
    .filter((statement) => statement.length > 0);
  if (statements.length === 0) return false;
  return statements.every((statement) =>
    EXPORT_FROM_STATEMENT_RE.test(statement)
  );
}

function subjectModuleOf(testPath) {
  const candidates = [
    testPath.replace(TEST_FILE_RE, ".$1"),
    testPath.replace(TEST_FILE_RE, ".ts"),
    testPath.replace(TEST_FILE_RE, ".tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function checkTestFile(testPath, root) {
  const subjectPath = subjectModuleOf(testPath);
  if (!subjectPath) return null;
  const source = readFileSync(subjectPath, "utf8");
  if (!isPureReexportBarrel(source)) return null;
  const relTest = relative(root, testPath).replaceAll("\\", "/");
  const relSubject = relative(root, subjectPath).replaceAll("\\", "/");
  return {
    rule: "R-NoBarrelTestSuite",
    file: relTest,
    detail:
      `R-NoBarrelTestSuite: ${relTest} — subject module ${relSubject} ` +
      "is a pure re-export barrel; test the source modules instead.",
  };
}

export function runCheck({ packagesRoot } = {}) {
  const root = packagesRoot ?? PACKAGES_ROOT;
  const reportRoot = packagesRoot ? packagesRoot : REPO_ROOT;
  const testFiles = findPackageFiles(root, (file) => isInScope(file));
  const violations = [];
  for (const testFile of testFiles) {
    const violation = checkTestFile(testFile, reportRoot);
    if (violation) violations.push(violation);
  }
  return violations;
}

function stagedTestFiles(gitRoot) {
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { cwd: gitRoot, encoding: "utf8" }
  );
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("packages/") && isInScope(line))
    .map((line) => resolve(gitRoot, line))
    .filter((file) => existsSync(file));
}

export function runChangedFilesCheck({ gitRoot = process.cwd() } = {}) {
  const violations = [];
  for (const testFile of stagedTestFiles(gitRoot)) {
    const violation = checkTestFile(testFile, gitRoot);
    if (violation) violations.push(violation);
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const changedFilesMode = process.argv.includes("--changed-files");
  const dryRun = process.argv.includes("--dry-run");
  const violations = changedFilesMode ? runChangedFilesCheck() : runCheck();
  if (dryRun) {
    process.stdout.write(JSON.stringify(violations, null, 2) + "\n");
    process.exit(0);
  }
  if (violations.length === 0) {
    if (!changedFilesMode) {
      console.log("✅ No test suite targets a pure re-export barrel.");
    }
    process.exit(0);
  }
  console.error("❌ R-NoBarrelTestSuite violations:");
  for (const violation of violations) {
    console.error(violation.detail);
  }
  process.exit(1);
}
