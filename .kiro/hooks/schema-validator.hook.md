# Hook: Schema Validator

**Event**: on file save  
**Trigger**: `packages/core/schema/workout.json`, `packages/core/tests/fixtures/**/*.krd`, `**/*.krd`

## Steps

1. Validate `.krd` files with AJV against `packages/core/schema/workout.json`
2. Show readable errors with line numbers and field paths
3. Propose minimal fixes for common validation errors

## Commands

```bash
# Validate a single KRD file
pnpm --filter @kaiord/core exec ajv validate -s schema/workout.json -d path/to/file.krd

# Validate all fixtures
pnpm --filter @kaiord/core test -- --grep "schema validation"
```

## Success Criteria

- All `.krd` files pass AJV validation
- No schema errors in console output
