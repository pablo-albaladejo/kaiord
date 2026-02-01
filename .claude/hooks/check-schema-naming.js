#!/usr/bin/env node
const fs = require("fs");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path;

    if (!filePath) process.exit(0);

    const content =
      data.tool_input?.content ||
      (fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "");

    const isInDomainSchemas = filePath.includes("/domain/schemas/");
    const isInAdapterSchemas =
      filePath.includes("/adapters/") && filePath.includes("/schemas/");

    const enumMatches = [...content.matchAll(/z\.enum\(\[([^\]]+)\]\)/g)];
    const warnings = [];

    for (const match of enumMatches) {
      const values = match[1];
      if (
        isInDomainSchemas &&
        /[a-z][A-Z]/.test(values) &&
        !values.includes("_")
      ) {
        warnings.push(
          "Domain schemas should use snake_case (e.g., indoor_cycling)"
        );
      }
      if (isInAdapterSchemas && /_[a-z]/.test(values)) {
        warnings.push(
          "Adapter schemas should use camelCase (e.g., indoorCycling)"
        );
      }
    }

    if (warnings.length > 0) {
      console.log(
        JSON.stringify({
          systemMessage: `Schema naming warning:\n${warnings.join("\n")}`,
        })
      );
    }

    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
