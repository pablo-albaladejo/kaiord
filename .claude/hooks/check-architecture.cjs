#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CORE_SRC_PREFIX = "packages/core/src/";

// `git diff --name-only` / `git ls-files` print paths relative to the repo
// root with no leading slash (e.g. "packages/core/src/domain/x.ts"), never
// "/packages/core/src/...". `file` here must already be in that form.
function isRelevantCoreFile(file) {
  return file.startsWith(CORE_SRC_PREFIX) && file.endsWith(".ts");
}

// Pure: inspect one file's already-read source for hexagonal-layer
// violations. `file` is the repo-root-relative path, used only to label
// the reported violation and to classify the file's layer.
function findViolations(file, content) {
  const violations = [];
  const isInDomain = file.includes("/domain/");
  const isInApplication = file.includes("/application/");

  if (isInDomain) {
    if (/from\s+['"]\.\.\/adapters/.test(content))
      violations.push(`${file}: Domain cannot import from adapters`);
    if (/from\s+['"]\.\.\/application/.test(content))
      violations.push(`${file}: Domain cannot import from application`);
    if (/from\s+['"]@garmin/.test(content))
      violations.push(`${file}: Domain cannot import @garmin`);
    if (/from\s+['"]fast-xml-parser/.test(content))
      violations.push(`${file}: Domain cannot import fast-xml-parser`);
  }

  if (isInApplication) {
    if (/from\s+['"]\.\.\/adapters/.test(content))
      violations.push(`${file}: Application cannot import from adapters`);
    if (/from\s+['"]@garmin/.test(content))
      violations.push(`${file}: Application cannot import @garmin`);
  }

  return violations;
}

module.exports = { CORE_SRC_PREFIX, findViolations, isRelevantCoreFile };

if (require.main === module) {
  const repoRoot = execSync("git rev-parse --show-toplevel", {
    encoding: "utf8",
  }).trim();

  const tracked = execSync("git diff --name-only HEAD", {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);

  // `git diff HEAD` only covers tracked files, so a file an agent just
  // created and never `git add`ed is invisible to it. `ls-files --others`
  // fills that gap so a new domain/application violation is caught on the
  // file that introduced it, not only after it is staged.
  const untracked = execSync("git ls-files --others --exclude-standard", {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);

  const files = [...new Set([...tracked, ...untracked])].filter(
    isRelevantCoreFile
  );

  const violations = [];
  for (const file of files) {
    const absPath = path.join(repoRoot, file);
    if (!fs.existsSync(absPath)) continue;
    const content = fs.readFileSync(absPath, "utf8");
    violations.push(...findViolations(file, content));
  }

  if (violations.length > 0) {
    console.error("HEXAGONAL VIOLATIONS:");
    violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(2);
  }
}
