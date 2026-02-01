#!/usr/bin/env node
const fs = require('fs');

// Read JSON input from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path;

    if (!filePath || !filePath.includes('/packages/core/src/')) {
      process.exit(0);
    }

    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    const isInDomain = filePath.includes('/domain/');
    const isInApplication = filePath.includes('/application/');
    const violations = [];

    if (isInDomain) {
      if (/from\s+['"]\.\.\/adapters/.test(content))
        violations.push('Domain cannot import from adapters');
      if (/from\s+['"]\.\.\/application/.test(content))
        violations.push('Domain cannot import from application');
      if (/from\s+['"]@garmin/.test(content))
        violations.push('Domain cannot import @garmin');
      if (/from\s+['"]fast-xml-parser/.test(content))
        violations.push('Domain cannot import fast-xml-parser');
    }

    if (isInApplication) {
      if (/from\s+['"]\.\.\/adapters/.test(content))
        violations.push('Application cannot import from adapters');
      if (/from\s+['"]@garmin/.test(content))
        violations.push('Application cannot import @garmin');
    }

    if (violations.length > 0) {
      console.error(`HEXAGONAL VIOLATION in ${filePath}:`);
      violations.forEach(v => console.error(`  - ${v}`));
      process.exit(2);
    }

    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
