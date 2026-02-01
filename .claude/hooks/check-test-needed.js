#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path;

    if (filePath?.includes(".converter.ts") && !filePath.includes(".test.")) {
      const testPath = filePath.replace(".converter.ts", ".converter.test.ts");
      console.log(
        JSON.stringify({
          systemMessage: `REMINDER: Converters require tests!\nExpected test file: ${testPath}\nFollow AAA pattern. Coverage target: 90%`,
        })
      );
    }

    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
