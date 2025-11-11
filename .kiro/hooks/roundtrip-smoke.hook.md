# Hook: Roundtrip Smoke

**Event**: manual  
**Trigger**: `packages/core/tests/fixtures/**/*.{fit,tcx,pwx,krd}`

## Steps

1. Execute FIT/TCX/PWX ↔ KRD round-trip conversions
2. Compare original vs round-tripped data with tolerances
3. Print numeric deltas when exceeding thresholds

## Tolerances

- Time: ±1s
- Power: ±1W or ±1% FTP
- Heart rate: ±1bpm
- Cadence: ±1rpm

## Commands

```bash
# Run all round-trip tests
pnpm --filter @kaiord/core test -- --grep "round-trip"

# Test specific format
pnpm --filter @kaiord/core test -- --grep "FIT round-trip"

# Verbose output with deltas
pnpm --filter @kaiord/core test -- --grep "round-trip" --reporter=verbose
```

## Success Criteria

- All conversions complete without errors
- Numeric deltas stay within defined tolerances
- No data loss in round-trip conversions
