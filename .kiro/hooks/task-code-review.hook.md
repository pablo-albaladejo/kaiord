# Hook: Task Code Review

**Event**: on file save  
**Trigger**: `.kiro/specs/**/tasks.md`

## Purpose

Perform a staff engineer-level code review when a task is marked as complete. Focus on code quality, maintainability, and architectural soundness. Provide actionable feedback on issues that materially impact the codebase—skip nitpicks and style preferences that don't affect functionality or long-term maintenance.

## Steps

1. **Identify completed task**: Detect which task was just marked as complete
2. **Find related files**: Identify all files modified for this task (implementation + tests)
3. **Run diagnostics**: Check for TypeScript errors, linting issues
4. **Execute tests**: Run all tests to ensure nothing is broken
5. **Review code quality**: Check against project steering rules:
   - Architecture compliance (hexagonal, ports/adapters)
   - Zod schema patterns (schema-first approach)
   - TDD patterns (fixtures, AAA pattern)
   - Error handling patterns
   - Code style (no `any`, functions < 40 LOC, files ≤ 100 lines)
6. **Present review findings**: Provide feedback on:
   - ✅ What's good
   - ⚠️ What needs attention
   - 🔴 What must be fixed
7. **Propose action plan**: If issues found, create a plan to fix them
8. **Ask for approval**: Wait for user confirmation before proceeding with fixes

## Commands

```bash
# Run TypeScript diagnostics
pnpm --filter @kaiord/core tsc --noEmit

# Run all tests
pnpm --filter @kaiord/core test

# Run linter
pnpm --filter @kaiord/core lint

# Check test coverage
pnpm --filter @kaiord/core test -- --coverage
```

## Review Checklist

### Architecture

- [ ] Follows hexagonal architecture (domain/application/ports/adapters)
- [ ] No external dependencies in domain layer
- [ ] Proper dependency injection used
- [ ] Adapters implement port interfaces

### Zod Patterns

- [ ] Schemas defined first, types inferred with `z.infer`
- [ ] No manual type definitions (use Zod schemas)
- [ ] Enums use `z.enum()` or `z.discriminatedUnion()`
- [ ] Constants used instead of magic strings

### Testing (TDD)

- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Fixtures used instead of manual object creation
- [ ] No tests for type definitions (TypeScript validates)
- [ ] No tests for fixtures themselves
- [ ] Coverage ≥ 80% (mappers/converters ≥ 90%)
- [ ] Co-located tests (file.ts → file.test.ts)

### Error Handling

- [ ] Custom error types defined in domain
- [ ] Errors bubble up (not swallowed)
- [ ] Errors handled at entry points (CLI/API)
- [ ] Logger injected (no console.log in library code)

### Code Style

- [ ] No `any` types (implicit or explicit)
- [ ] Functions < 40 lines of code
- [ ] Files ≤ 100 lines (excluding tests)
- [ ] Type inference used (avoid redundant annotations)
- [ ] `type` used instead of `interface`
- [ ] Factory functions instead of classes
- [ ] Minimal comments (only for complex logic)

### Documentation

- [ ] Public API documented
- [ ] Complex algorithms explained
- [ ] Non-obvious decisions commented

## Success Criteria

- All TypeScript diagnostics pass (no errors)
- All tests pass (127/127 or more)
- Test coverage meets targets (≥ 80%)
- No architectural violations
- Code follows all steering rules
- Review report generated with actionable feedback

## Workflow

After completing a task:

1. Mark task as complete in `tasks.md`: `- [x] 8.5 Implement target conversion`
2. Trigger this hook manually or via IDE
3. **Review findings** presented in chat:
   - ✅ What's good (positive feedback)
   - ⚠️ What needs attention (warnings, suggestions)
   - 🔴 What must be fixed (critical issues)
4. **Review action plan** if issues found:
   - Specific steps to fix each issue
   - Estimated effort
   - Priority order
5. **Approve or reject** the proposed fixes
6. If approved, Kiro will implement the fixes automatically
7. Re-run review to verify all issues resolved

## Example Interaction

```
Kiro: "Code review complete for task 8.5. Found 2 issues that must be fixed:

🔴 What must be fixed:
1. garmin-fitsdk.ts: Missing error handling tests (lines 41-43, 78-79)
2. metadata.mapper.ts: Low branch coverage (37.5%, target: 80%)

Proposed action plan:
1. Add error scenario tests for garmin-fitsdk.ts (5 tests)
2. Add edge case tests for metadata.mapper.ts (3 tests)

Estimated time: 15 minutes

Proceed with fixes? (yes/no)"

User: "yes"

Kiro: [Implements fixes and re-runs review]
```

## Review Philosophy

**Staff Engineer Perspective**: Reviews prioritize:

- **Maintainability**: Can future developers understand and modify this code?
- **Architectural integrity**: Does it follow established patterns and boundaries?
- **Test quality**: Are tests meaningful and will they catch real bugs?
- **Impact over style**: Focus on issues that affect functionality, not formatting preferences

**What to flag**:

- Architectural violations (breaking hexagonal boundaries, tight coupling)
- Missing or inadequate tests for critical paths
- Type safety issues (`any` types, missing validations)
- Error handling gaps that could cause production issues
- Code that's hard to understand or maintain

**What to skip**:

- Subjective style preferences already handled by linters
- Minor naming variations that don't affect clarity
- Trivial optimizations with no measurable impact
- Personal coding preferences that don't violate project standards

## Notes

- Run **after** completing a task but **before** committing
- Quality gate to maintain high standards without bikeshedding
- Automated review complements (doesn't replace) human code review
- **No files created** - all feedback presented in chat
- User must approve proposed fixes before implementation
