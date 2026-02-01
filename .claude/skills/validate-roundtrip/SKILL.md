---
name: validate-roundtrip
description: Validate round-trip conversions with tolerances. Use after modifying converters
allowed-tools: mcp__vitest__run_tests, Bash, Read
---

Run round-trip tests for data integrity.

## Allowed Tolerances

| Field | Tolerance |
|-------|-----------|
| Time | ±1 second |
| Power | ±1 watt or ±1% FTP |
| Heart Rate | ±1 bpm |
| Cadence | ±1 rpm |
| Distance | ±1 meter |

## Run Tests

```bash
# All round-trip tests
pnpm --filter @kaiord/core test -- --grep "round-trip"

# Specific test
pnpm --filter @kaiord/core test src/tests/round-trip/
```

## Interpret Results

If tolerance violations occur:
1. Identify the failing field
2. Review the corresponding converter
3. Verify the mapper for that field
4. Adjust conversion logic

## Key Files

- `packages/core/src/tests/round-trip/` - Round-trip tests
- `packages/core/src/adapters/fit/` - FIT converters
- `packages/core/src/domain/validation/` - Tolerance validators
