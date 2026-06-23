# Result summary — test-minimality-naming-hardening

Implemented on branch `chore/test-minimality-naming-hardening`
(base: `ed73b925` "Version Packages (#721)").

## Headline numbers

| Metric                                  | Before | After  | Delta                     |
| --------------------------------------- | ------ | ------ | ------------------------- |
| Written `it()` blocks (packages/\*/src) | 6,511  | 5,998  | −513                      |
| Test-file lines (packages/\*/src)       | —      | —      | −9,930 (−13,475 / +3,545) |
| Whole-tree runtime test cases           | —      | 6,706+ | all green                 |

The written-block delta understates the prune: hundreds of near-identical
blocks were additionally collapsed into `it.each` rows (which keep runtime
case counts high while removing duplicated code), and ~170 tests deleted in
tcx covered code that was itself deleted (the orphan converter chain).

## Coverage gate (design D2 — non-decreasing vs `coverage-baseline.md`)

Final state: every in-scope package at or above baseline on statements,
branches, and functions. Notable movements:

| Package | Branch coverage | Note                                                         |
| ------- | --------------- | ------------------------------------------------------------ |
| core    | 93.94 → 96.97   | real-checker tests replaced mock-driven duplicates           |
| garmin  | 88.89 → 91.96   | defensive null-fallback branches now asserted                |
| tcx     | 94.55 → 96.14   | wired-path cadence/pace decoding + round-trips               |
| zwo     | 88.36 → 88.61   | original-duration fallbacks, XSD-invalid path, encoder edges |

## Correctness fixes shipped (not just test hygiene)

1. **tcx (user-visible fix):** the wired reader decoded only `HeartRate_t`
   and silently degraded `Cadence_t`/`Speed_t` targets to `open`; the writer
   matched a non-canonical pace unit (`meters_per_second` vs `mps`). Cadence
   and pace targets now round-trip (running cadence SPM = 2 × RPM on both
   legs, sport-aware). The orphan converter chain that held the correct
   semantics but was wired to nothing is deleted.
2. **mcp:** `BINARY_FORMATS` derived from `FORMAT_REGISTRY` (dual source of
   truth removed); unsupported `output_format` rejected explicitly.
3. **cli:** the six vacuous `exitCode.toBeDefined()` config-integration
   tests replaced with observable-effect assertions.

## New mechanical guard

`scripts/check-no-barrel-test-suites.mjs` (R-NoBarrelTestSuite) — wired into
`pnpm test:scripts` and husky pre-commit (`--changed-files`). On first run it
caught five barrel-backed suites the audit had missed (core errors, garmin
target barrel, spa krd/validation/calendar-schemas); all were re-pointed to
their real source modules.

## Naming hardening

- garmin-connect auth core: `s`/`o1`/`o2`/`doRefresh`/`res`/`opts`/
  `handleNonOk` → `state`/`oauth1Token`/`oauth2Token`/`refreshTokens`/
  `response`/`options`/`throwHttpError`.
- zwo: logic-bearing mapper files became converters with co-located suites.
- garmin: target conversion moved from `mappers/` to honest converters;
  public API unchanged.
- spa-editor: four camelCase hook files (+2 satellites) kebab-cased;
  `idx` → `selectedStepIndex`.
- cli: `cfg` → `commandConfig`.

## Verification at close

- `pnpm -r test`: all 13 packages green.
- `pnpm -r build`: clean.
- `pnpm lint` (includes `lint:specs`, 39/39): clean.
- `pnpm test:scripts` (all mechanical guards incl. the new one): clean.
- Changeset: patch for tcx/zwo/garmin/garmin-connect/mcp/cli.
