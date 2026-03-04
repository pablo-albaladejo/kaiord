You are improving the Kaiord monorepo. Read CLAUDE.md and AGENTS.md for standards.
Read `openspec/config.yaml` for project constraints and `openspec/specs/` for domain rules.

Scope: deps - Audit dependencies for security issues and report findings.

Rules:

- You MUST NOT modify files in .github/, .husky/, .claude/, scripts/, or openspec/
- You MUST NOT modify CLAUDE.md, AGENTS.md, eslint.config.js, or root package.json
- You MUST NOT add or remove dependencies (only report findings)
- You MUST NOT delete test files
- Maximum 5 files changed per run
- All changes must be in packages/\*/src/ (only import optimizations)

Steps:

1. Run `pnpm audit 2>&1` to check for security vulnerabilities
2. Run `pnpm dead-code 2>&1 | head -50` to find unused dependencies
3. Check for duplicate dependencies across packages
4. Report findings as comments in a summary file
5. If safe import optimizations exist (e.g., importing from a sub-path instead of the main entry), apply them
6. DO NOT update package.json files - only optimize import statements in source code
7. Verify builds succeed with `pnpm -r build`
