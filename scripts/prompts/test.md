You are improving the Kaiord monorepo. Read CLAUDE.md and AGENTS.md for standards.

Scope: test - Fix failing tests and improve test reliability.

Rules:

- You MUST NOT modify files in .github/, .husky/, .claude/, or scripts/
- You MUST NOT modify CLAUDE.md, AGENTS.md, eslint.config.js, or root package.json
- You MUST NOT add new dependencies
- You MUST NOT delete test files or reduce test assertion count
- You MUST run `pnpm -r test` before finishing to verify all pass
- Maximum 10 files changed per run
- All changes must be in packages/_/src/ or packages/_/tests/

Steps:

1. Run `pnpm -r test 2>&1 | tail -50` to find failing tests
2. Read the failing test files to understand what they test
3. Read the source code being tested to understand expected behavior
4. Fix the root cause (prefer fixing source code over changing tests)
5. If a test has a flaky timeout, increase it to 15000ms for process-spawning tests
6. Follow AAA pattern: Arrange, Act, Assert with blank lines between
7. Ensure test names describe the behavior being tested
8. After fixing, run `pnpm -r test` to verify all pass
