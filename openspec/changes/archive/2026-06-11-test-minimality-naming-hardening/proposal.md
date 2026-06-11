> Completed: 2026-06-11

# Proposal: test-minimality-naming-hardening

## Why

A seven-agent deep audit of all 11 packages (~830 test files, 4,346 `it()` cases in the SPA alone) found that **roughly 900–1,200 `it()` blocks (~15–20% of the suite) prove nothing beyond what a sibling test already proves**, while the redundancy actively conceals three real gaps: a dead-but-heavily-tested TCX converter pipeline whose live counterpart misses the running-cadence and pace-unit assertions (latent correctness risk), core round-trip comparison logic that is only ever exercised against a fully mocked tolerance checker, and six CLI integration tests whose only assertion (`exitCode.toBeDefined()`) is vacuously true. A smaller but parallel finding: identifier naming is strong on every public surface but has a concentrated cryptic cluster in the garmin-connect auth core and a handful of `*.mapper.ts` files that carry branching logic, violating the repo's own mapper-vs-converter convention.

## What Changes

- **Resolve the TCX dual/dead converter pipeline.** `packages/tcx/src/adapters/target/{krd-to-tcx,pace,cadence,heart-rate}.converter.ts` and the `tcx-to-krd`/`standard-duration`/`extended-duration` chain are imported by no production code (the live paths are `workout/target-to-tcx.converter.ts` and `duration/duration-walker.converter.ts`). Delete the orphan pipeline and its tests; port the running-cadence-doubling and pace-unit behavior to the live path with round-trip assertions.
- **Delete barrel-duplicate test suites.** `tcx/duration/duration.converter.test.ts` (808 lines), `tcx/target/target.converter.test.ts` (549), `zwo/target/target.converter.test.ts` (483) test pure re-export barrels already covered by source-level suites.
- **Fix or delete vacuous and false tests.** CLI `config-integration.test.ts` (6× `exitCode.toBeDefined()`); fit's false "should throw FitParsingError when conversion not implemented" title; fit `daily-round-trip.test.ts` / `stress-round-trip.test.ts` / `round-trip-duration.test.ts` named "round-trip" without a decode leg.
- **Add the missing real tests.** Core round-trip comparison helpers (`check-field`, `compare-laps`) with a real `ToleranceChecker`; a direct `validate-krd` test; SPA `clipboard-store` error/overwrite/round-trip cases; MCP health-history `skipped`/error cases; CLI invalid-format and TCX/ZWO end-to-end conversion tests.
- **Collapse redundant fan-out.** fit dispatcher tests reduced to routing-only (leaf tests own value logic); core infra test bloat (console-logger, noop-analytics, ports/logger runtime type test, test-utils, errors) deleted or parametrized via `it.each`; SPA per-variant Tailwind-class render tests collapsed to `it.each` and class-token assertions replaced with role/text assertions; CLI/MCP re-export and twin-test duplicates removed.
- **Naming hardening.** garmin-connect token core renames (`s`→`state`, `o1`/`o2`→`oauth1Token`/`oauth2Token`, `doRefresh`→`refreshTokens`, `res`→`response`, `opts`→`options`); zwo `duration.mapper.ts` and `steady-state.mapper.ts` renamed to `.converter.ts` (they carry branching logic); garmin `mappers/target.converter.ts` folder/suffix/function-prefix three-way disagreement resolved; SPA camelCase hook files (`useToast.ts`, `useAppHandlers.ts`, `useDeleteCleanup.ts`, `useKeyboardShortcuts.ts` + satellites) renamed to kebab-case.
- **New mechanical guard.** `scripts/check-no-barrel-test-suites.mjs` prevents regression of the barrel-duplicate pattern: a `*.test.ts` file whose subject module consists solely of `export ... from` re-exports is a violation.

No public API changes. All edits are tests, internal renames, and removal of dead (unexported-from-package) modules.

## Capabilities

### New Capabilities

- `test-minimality`: defines the minimal-and-semantic test-suite invariants the audit found violated — no test suites against pure re-export barrels (mechanically guarded), no vacuous assertions as a test's only proof, files named `*round-trip*` must exercise both conversion legs, dispatcher tests assert routing only, and test titles must describe domain behavior rather than internal symbols.

### Modified Capabilities

- `adapter-contracts`: adds a requirement that the TCX writer's live target-encoding path round-trips running cadence (rpm↔spm doubling) and pace units — behavior currently asserted only against the orphaned converter chain.

## Impact

- **Packages:** `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/ai`, `@kaiord/cli`, `@kaiord/mcp`, `@kaiord/workout-spa-editor`, `scripts/`.
- **Hexagonal layers:** adapters only (tests + adapter-internal renames + dead adapter-code removal). No domain, application, or port contract changes; no new ports.
- **Public API:** unchanged. The deleted tcx converters are not exported from the package entry point (verify during implementation before deletion).
- **CI:** one new mechanical guard wired into `pnpm test:scripts`; coverage thresholds must still pass after deletions (deleted tests cover deleted code or duplicate proofs, so net coverage should hold or improve).
- **Risk:** test deletions are evidence-backed by the audit reports (per-finding file:line in `/tmp/audit-*.md`, to be snapshotted into the change directory); the tcx pipeline decision requires confirming which encoder is canonical before deleting.
