You are improving the Kaiord monorepo. Read CLAUDE.md and AGENTS.md for standards.

Scope: bundles - Reduce bundle sizes by removing dead code and optimizing imports.

Rules:

- You MUST NOT modify files in .github/, .husky/, .claude/, or scripts/
- You MUST NOT modify CLAUDE.md, AGENTS.md, eslint.config.js, or root package.json
- You MUST NOT add new dependencies
- You MUST NOT delete test files
- You MUST NOT remove functionality that is used
- You MUST run `pnpm -r test && pnpm -r build` before finishing
- Maximum 10 files changed per run
- All changes must be in packages/\*/src/

Steps:

1. Check for unused exports: `pnpm dead-code 2>&1 | head -50`
2. Check for unused imports in source files
3. Ensure type-only imports use `import type { X }` syntax
4. Remove dead code (unused functions, unreachable branches)
5. Remove unused re-exports from index.ts files
6. Check for large inline objects that could be extracted
7. Verify no runtime behavior changes with `pnpm -r test`
8. Verify builds succeed with `pnpm -r build`
