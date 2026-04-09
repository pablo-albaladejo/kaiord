#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");

const files = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(
    (f) =>
      f.endsWith(".ts") &&
      !f.includes(".test.") &&
      !f.includes(".spec.") &&
      !f.endsWith(".md") &&
      !f.endsWith(".yaml") &&
      !f.endsWith(".yml")
  );

const MAX_LINES = 100;
const warnings = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n").length;
  if (lines > MAX_LINES)
    warnings.push(`${file}: ${lines} lines (max: ${MAX_LINES})`);
}

if (warnings.length > 0) {
  console.log(
    JSON.stringify({
      systemMessage: `File size warnings:\n${warnings.join("\n")}\nConsider splitting into smaller modules.`,
    })
  );
}
