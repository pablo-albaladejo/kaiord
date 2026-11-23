## 1. Core

- [x] 1.1 `diffRoundTrip`, field patterns and target-aware tolerances, with tests
- [x] 1.2 `DECLARED_TOLERANCES` and the FIT, TCX, ZWO and GCN contracts, exported from `@kaiord/core`
- [x] 1.3 `buildRoundTripCases`, `buildUnsupportedCases`, `roundTripReport`, `unsupportedButCarried`, `unusedDeclarations` in `@kaiord/core/test-utils`, with tests

## 2. Adapters

- [x] 2.1 `round-trip-contract.test.ts` in fit, tcx, zwo and garmin, over generated cases and the workout fixtures
- [x] 2.2 FIT: exact manufacturer match, Garmin product name, `wktDescription`, the 254-byte FIT string limit
- [x] 2.3 TCX: workout `Notes`; GCN: workout `description`

## 3. CI and claims

- [x] 3.1 fit, tcx and zwo shards in the `round-trip` job, the required `round-trip` check unchanged
- [x] 3.2 `claims-round-trip.mjs` in `pnpm lint:claims`, with `scripts/lib/round-trip-formats.vocab.mjs`
- [x] 3.3 The converters page and the four format READMEs rewritten per format and registered
- [x] 3.4 Changesets for core, fit, tcx, zwo and garmin
