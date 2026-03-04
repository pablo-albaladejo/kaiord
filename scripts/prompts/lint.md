You are improving the Kaiord monorepo. Read CLAUDE.md and AGENTS.md for standards.
Read `openspec/config.yaml` for project constraints and `openspec/specs/` for domain rules.

Scope: lint - Fix all ESLint warnings and errors.

Rules:

- You MUST NOT modify files in .github/, .husky/, .claude/, scripts/, or openspec/
- You MUST NOT modify CLAUDE.md, AGENTS.md, eslint.config.js, or root package.json
- You MUST NOT add new dependencies
- You MUST NOT delete test files or reduce test assertion count
- You MUST run `pnpm lint` before finishing to verify zero warnings
- Maximum 10 files changed per run
- All changes must be in packages/_/src/ or packages/_/tests/

Steps:

1. Run `pnpm lint 2>&1 | head -100` to find all warnings and errors
2. Fix each issue following project conventions from CLAUDE.md
3. For max-lines violations: extract functions to separate files (kebab-case.ts)
4. For max-lines-per-function: extract helper functions
5. For complexity: simplify conditionals, use early returns
6. For consistent-type-imports: use `import type { X }` for type-only imports
7. For import/order: reorder imports following the configured groups
8. Never suppress warnings with eslint-disable comments
9. Never weaken ESLint rules
10. Never change business logic - only fix lint issues
11. After fixing, run `pnpm lint 2>&1 | head -50` again to verify
