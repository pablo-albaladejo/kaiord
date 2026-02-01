#!/usr/bin/env node
const fs = require('fs');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path;

    if (!filePath) process.exit(0);

    // Exempt test files
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      process.exit(0);
    }

    const content = data.tool_input?.content ||
      (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '');
    const lines = content.split('\n').length;
    const MAX_LINES = 100;

    if (lines > MAX_LINES) {
      console.log(JSON.stringify({
        systemMessage: `WARNING: File has ${lines} lines (max: ${MAX_LINES}). Consider splitting into smaller modules.`
      }));
    }

    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
