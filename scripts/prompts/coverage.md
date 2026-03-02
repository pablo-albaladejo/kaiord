You are improving the Kaiord monorepo. Read CLAUDE.md and AGENTS.md for standards.

Scope: coverage - Add meaningful tests to improve code coverage.

Rules:

- You MUST NOT modify files in .github/, .husky/, .claude/, or scripts/
- You MUST NOT modify CLAUDE.md, AGENTS.md, eslint.config.js, or root package.json
- You MUST NOT add new dependencies
- You MUST NOT delete existing tests
- You MUST run `pnpm -r test` before finishing to verify all pass
- Maximum 10 files changed per run
- All changes must be in packages/_/src/ or packages/_/tests/

Steps:

1. Run `pnpm --filter @kaiord/core test:coverage 2>&1 | tail -30` to see coverage summary
2. Identify packages below 80% coverage (70% for cli)
3. Find uncovered functions by reading coverage reports
4. Write meaningful tests that exercise real behavior:
   - Test edge cases and error paths
   - Test with realistic inputs, not trivial ones
   - Assert on specific output values, not just truthiness
   - DO NOT write `expect(x).toBeDefined()` or `expect(true).toBe(true)`
5. Follow AAA pattern with blank lines between Arrange, Act, Assert
6. Use existing test utilities from @kaiord/core/test-utils
7. For converters: test with sample data, verify specific field values
8. For validators: test both valid and invalid inputs
9. After adding tests, run coverage again to verify improvement
