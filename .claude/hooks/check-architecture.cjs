#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");

const files = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((f) => f.includes("/packages/core/src/") && f.endsWith(".ts"));

const violations = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, "utf8");
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
}

if (violations.length > 0) {
  console.error("HEXAGONAL VIOLATIONS:");
  violations.forEach((v) => console.error(`  - ${v}`));
  process.exit(2);
}
