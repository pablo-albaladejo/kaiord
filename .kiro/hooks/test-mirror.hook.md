# Hook: Test Mirror

**Event**: on file save  
**Trigger**: `packages/core/src/**/parsers/**`, `packages/core/src/**/writers/**`

## Steps

1. Check if mirrored test exists under `packages/core/tests/**`
2. If missing, scaffold a Vitest file with basic structure
3. Run targeted test for quick feedback

## Commands

```bash
# Run specific test file
pnpm --filter @kaiord/core test -- path/to/test.spec.ts

# Run tests matching a pattern
pnpm --filter @kaiord/core test -- -t "FitParser"

# Watch mode for active development
pnpm --filter @kaiord/core test -- --watch path/to/test.spec.ts
```

## Success Criteria

- Every parser/writer has a corresponding test file
- Test runs successfully with at least one passing test
