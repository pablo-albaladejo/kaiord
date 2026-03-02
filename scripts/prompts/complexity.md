You are improving the Kaiord monorepo. Read CLAUDE.md and AGENTS.md for standards.

Scope: complexity - Reduce code complexity by splitting large files and functions.

Rules:

- You MUST NOT modify files in .github/, .husky/, .claude/, or scripts/
- You MUST NOT modify CLAUDE.md, AGENTS.md, eslint.config.js, or root package.json
- You MUST NOT add new dependencies
- You MUST NOT delete test files or reduce test assertion count
- You MUST NOT change the public API (exports from index.ts)
- You MUST NOT change business logic behavior
- You MUST run `pnpm -r test && pnpm -r build` before finishing
- Maximum 10 files changed per run
- All changes must be in packages/\*/src/

Steps:

1. Run `pnpm lint 2>&1 | grep "max-lines\|max-lines-per-function\|complexity"` to find violations
2. For files exceeding 100 lines:
   - Identify logical groups of functions
   - Extract to new files using kebab-case naming
   - Update imports in the original file
   - Re-export from the original file if needed for API compatibility
3. For functions exceeding 40 lines:
   - Extract helper functions with descriptive names
   - Use early returns to reduce nesting
   - Prefer composition over deep nesting
4. For high cyclomatic complexity (>10):
   - Replace switch/case chains with lookup objects
   - Extract conditional logic to predicate functions
   - Use strategy pattern for complex branching
5. File naming: kebab-case.ts (e.g., `step-converter.ts`)
6. After refactoring, verify:
   - `pnpm -r build` succeeds (no broken imports)
   - `pnpm -r test` passes (no behavior changes)
   - `pnpm lint` shows fewer violations
