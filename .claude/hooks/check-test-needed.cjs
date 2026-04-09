#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");

const files = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((f) => f.endsWith(".converter.ts") && !f.includes(".test."));

const reminders = [];

for (const file of files) {
  const testPath = file.replace(".converter.ts", ".converter.test.ts");
  if (!fs.existsSync(testPath))
    reminders.push(`${file} -> missing test: ${testPath}`);
}

if (reminders.length > 0) {
  console.log(
    JSON.stringify({
      systemMessage: `Converters require tests!\n${reminders.join("\n")}\nFollow AAA pattern. Coverage target: 90%`,
    })
  );
}
