# Testing

- Vitest; coverage ≥ 80% (mappers/converters ≥ 90%)
- **Co-located tests**: `file.ts` → `file.test.ts` (same directory)
- **All fixtures**: `src/tests/fixtures/` directory (faker + rosie factories, binary files)
- **Test helpers**: `src/tests/helpers/` directory (mock utilities, test utils)
- **Unit** (pure mappers/validators)
- **Golden** (KRD snapshots, normalized TCX/PWX fragments)
- **Round‑trip** (FIT/TCX/PWX ↔ KRD) with tolerances (±1s, ±1W, ±1bpm, ±1rpm)
- **CLI smoke** (tiny anonymized fixtures < 20KB)
