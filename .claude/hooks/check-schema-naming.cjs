#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");

const files = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((f) => f.endsWith(".ts"));

const warnings = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  const isInDomainSchemas = file.includes("/domain/schemas/");
  const isInAdapterSchemas =
    file.includes("/adapters/") && file.includes("/schemas/");

  const enumMatches = [...content.matchAll(/z\.enum\(\[([^\]]+)\]\)/g)];

  for (const match of enumMatches) {
    const values = match[1];
    if (isInDomainSchemas && /[a-z][A-Z]/.test(values) && !values.includes("_"))
      warnings.push(`${file}: Domain schemas should use snake_case`);
    if (isInAdapterSchemas && /_[a-z]/.test(values))
      warnings.push(`${file}: Adapter schemas should use camelCase`);
  }
}

if (warnings.length > 0) {
  console.log(
    JSON.stringify({
      systemMessage: `Schema naming warnings:\n${warnings.join("\n")}`,
    })
  );
}
