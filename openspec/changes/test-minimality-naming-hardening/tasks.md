# Tasks: test-minimality-naming-hardening

## 1. Evidence snapshot and preconditions

- [x] 1.1 Copy the seven audit reports from `/tmp/audit-*.md` into `openspec/changes/test-minimality-naming-hardening/audit/` as `core.md`, `fit.md`, `adapters.md`, `cli-mcp.md`, `spa.md`, `naming-core.md`, `naming-spa.md`
- [x] 1.2 Record baseline coverage per package (`pnpm -r test` with coverage) into `audit/coverage-baseline.md` for the non-decreasing-coverage gate (design D2)
- [x] 1.3 Verify via `packages/tcx/src/index.ts` and grep that none of the orphan tcx converter modules is re-exported from the package entry point; if any is, stop and re-scope per design D3

## 2. Fill the genuine gaps (before any deletion — design D2)

- [x] 2.1 core: add unit tests for `application/round-trip/check-field.ts` (undefined-skip branch) and `compare-laps.ts` (length mismatch + `maxHeartRate`) using a real `createToleranceChecker`, not a mock
- [x] 2.2 core: add a direct test for `domain/validation/validate-krd.ts` asserting the joined error-message shape and that the parsed (not input) object is returned
- [x] 2.3 spa-editor: extend `store/clipboard-store.test.ts` with overwrite, payload round-trip (write→read content equality), and rejected/throwing `navigator.clipboard` write cases
- [x] 2.4 mcp: add a `skipped === 1` invalid-file case to each of `kaiord-get-{hrv-history,recovery-status,sleep-history,weight-history}.test.ts` (shared `it.each` acceptable) and an unsupported-`output_format` rejection test to `convert-from-krd.test.ts`
- [x] 2.5 cli: add an invalid `--output-format` exit-code test and one TCX and one ZWO end-to-end conversion test asserting output-content markers to `convert-integration.test.ts`; replace the env-dependent `/root` permission test with a mocked EACCES rejection asserting the `Permission denied` message

## 3. TCX pipeline resolution (specs/adapter-contracts delta)

- [x] 3.1 Resolve the running-cadence semantics (doubling vs pass-through) from the TCX XSD and Garmin-exported fixtures; record the decision in `design.md` Open Questions (design D4)
- [x] 3.2 Port the confirmed cadence behavior and the canonical pace-unit handling to `workout/target-to-tcx.converter.ts`, ensuring writer/reader agreement
- [x] 3.3 Add round-trip tests on the wired path: running cadence ±1 rpm, cycling cadence ±1 rpm, pace target with consistent unit (the three positive delta scenarios)
- [x] 3.4 Delete the orphan chain — `target/{krd-to-tcx,pace,cadence,heart-rate}.converter.ts`, `duration/{tcx-to-krd,standard-duration,extended-duration}.converter.ts`, their barrels and test suites — after confirming every unique assertion is ported (delta scenario: orphaned chain rejected)
- [x] 3.5 tcx: delete the barrel-duplicate suites `duration/duration.converter.test.ts` and `target/target.converter.test.ts`; trim the duplicated helper-level suites subsumed by `duration-walker.converter.test.ts` per audit `adapters.md`

## 4. zwo and remaining adapter test cleanup

- [x] 4.1 zwo: delete the barrel-duplicate `target/target.converter.test.ts`; consolidate the three overlapping round-trip suites into `round-trip/zwift-round-trip.test.ts`; collapse the xsd-validator environment-detection block to two cases; dedupe well-formedness vs xsd validator malformed-input cases
- [x] 4.2 garmin-connect: move the auth/retry assertions from `http/garmin-http-client.test.ts` into `garmin-auth-fetch.test.ts` ownership, keeping only wrapper-specific concerns (Bearer header, POST body, DELETE, null-body)
- [x] 4.3 ai: drop the retry/correction and reindex duplicates in `text-to-workout.test.ts` that `execute-with-retry.test.ts` / `reindex-steps.test.ts` own, keeping orchestration-specific cases
- [x] 4.4 garmin: drop the 2–3 round-trip cases asserting only `steps.length`

## 5. fit test cleanup

- [x] 5.1 Reduce `target/target.converter.test.ts` to one routing assertion per dispatch branch, using `krd-to-fit/krd-to-fit-target.converter.test.ts` as the template (~50 its removed)
- [x] 5.2 Reduce `duration/duration.converter.test.ts` to dispatch-table proofs via two `it.each` tables (value-present / value-absent); delete the boundary-value passthrough block and the Zod-rejection trio (~36 its removed)
- [x] 5.3 Delete `round-trip/round-trip-duration.test.ts` (encode-only, fully subsumed) and trim the `krd-to-fit.converter.test.ts` "advanced duration types" + "dynamic field mapping" + "logging" sections to 1–2 representative steps (~30 its removed)
- [x] 5.4 Rename `health/daily/daily-round-trip.test.ts` → `daily-fit-to-krd.test.ts` and `health/stress/stress-round-trip.test.ts` → `stress-fit-to-krd.test.ts` (no decode leg exists)
- [x] 5.5 Fix the false title at `garmin-fitsdk.test.ts:298` ("conversion not implemented" → real encoder-rejection behavior), dedupe its two near-identical reject siblings, delete the ~8 log-spy-only tests and the two vacuous `Array.isArray` fixture tests, retitle the four `should dispatch X → convertY` titles to domain behavior
- [x] 5.6 Add the missing power-range KRD→FIT→KRD round-trip assertion (`targetValue: 0` sentinel with custom low/high)

## 6. core test cleanup

- [x] 6.1 Collapse infrastructure bloat: console-logger to one `it.each` over the four methods, noop-analytics to one no-side-effects test, delete `ports/logger.test.ts` (runtime test of a compile-time type)
- [x] 6.2 Reduce `test-utils/fixtures.test.ts` to one happy-path + throw test per loader (removing the literal duplicate at L179/L184) and delete `test-utils/index.test.ts`
- [x] 6.3 Parametrize `errors.test.ts` with one `it.each` over the parsing-error classes and one over the errors-array classes; delete the "Error catching patterns" describe
- [x] 6.4 Collapse tolerance-checker per-metric pairs into `it.each` (pace kept separate), schema-validator per-field cases into `it.each` keeping the path-join proof, and the six health "wrong major version" copies into one shared parametrized test
- [x] 6.5 Trim `validate-round-trip.test.ts` to one violation-detection test covering sessions/laps/records plus `it.each` error propagation; rename the function-named describes to behavior language

## 7. cli and mcp test cleanup

- [x] 7.1 cli: rewrite or delete `config-integration.test.ts` (6 vacuous `exitCode.toBeDefined()` tests) so every kept test asserts an observable config effect
- [x] 7.2 cli: delete the re-export duplicate describes in `file-handler.test.ts` (`validatePathSecurity`, `isNodeSystemError`) and `error-formatter.test.ts` (violation formatters + the exact-duplicate `it()` at L237/L265); `it.each` the per-format read/write/detect/validate fan-out
- [x] 7.3 mcp: drop the per-field registry re-assertions in `kaiord-list-formats.test.ts`, merge the `BINARY_FORMATS`/`isBinaryFormat` double-test, `it.each` the `detectFormatFromPath` cases, merge the twin `.krd` happy-path tests in `kaiord-inspect.test.ts` and `convert-to-krd.test.ts`
- [x] 7.4 mcp: derive `BINARY_FORMATS` from `FORMAT_REGISTRY` to remove the dual source of truth (design Open Question, default: derive)

## 8. spa-editor test cleanup (pattern-scoped — design D7)

- [x] 8.1 Collapse variant/size maps to `it.each`: `Badge.test.tsx`, `Button.test.tsx`, `Toast.test.tsx`
- [x] 8.2 Delete `molecules/delete-button-styling.test.tsx` and `store/test-delete-exists.test.ts`; fold `CardShell/shared-visual-contract.test.tsx` token assertions into `status-tokens.test.ts`
- [x] 8.3 Replace Tailwind-class assertions with role/text/testid assertions in the files touched by 8.1–8.2 and in `MainLayout.test.tsx` (keep landmark-role assertions, drop responsive-class checks); fold the five LayoutHeader entry-button tests into one `it.each`
- [x] 8.4 Reduce the Sortable family (`SortableStepCard`, `SortableRepetitionBlockCard`, `RepetitionBlockSteps`) to one mount-clean test each, retitled to rendered outcome; delete the dnd-kit prop-leak test
- [x] 8.5 Extract a shared controlled-select test helper for the five WorkoutLibrary filter suites and collapse the ZoneEditor rendering block to one test per zoneType (interaction/validation blocks untouched)

## 9. Naming hardening (design D6)

- [x] 9.1 garmin-connect: rename `s`→`state` (token-manager + helpers), `o1`/`o2`→`oauth1Token`/`oauth2Token`, `doRefresh`→`refreshTokens`, `res`→`response` (oauth-consumer), `opts`→`options` (retry, fixing the `withRetry` alias), `handleNonOk`→`throwHttpError`
- [x] 9.2 zwo: rename `duration.mapper.ts`→`duration.converter.ts` and `steady-state.mapper.ts`→`steady-state.converter.ts`; re-point the existing behavior tests as their co-located suites so `check-converter-has-tests` passes; rename the `orig`/`val`/`ext`/`item` locals flagged in `naming-core.md`
- [x] 9.3 garmin: move `mappers/target.converter.ts`→`converters/target.converter.ts` and rename `mapGarminTargetToKrd`/`mapKrdTargetToGarmin`→`convertGarminTargetToKrd`/`convertKrdTargetToGarmin`; rename `idx`/`s` locals in `flatten-segments.converter.ts`
- [x] 9.4 spa-editor: rename `useToast.ts`, `useAppHandlers.ts`, `useDeleteCleanup.ts`, `useKeyboardShortcuts.ts`, `useToast.helpers.ts`, `useToast.types.ts` to kebab-case and update all imports; rename `idx`→`selectedStepIndex` in `build-clipboard-handlers.ts`/`build-step-handlers.ts`
- [x] 9.5 cli: rename the `cfg` loop variable to `commandConfig` in `bin/register-commands.ts` and the `yargs-subcommands.ts` glue

## 10. Mechanical guard (specs/test-minimality)

- [x] 10.1 Write `scripts/check-no-barrel-test-suites.mjs` per the spec: subject-module resolution, pure-re-export detection, `R-NoBarrelTestSuite` stderr format, `--changed-files` mode, exit codes
- [x] 10.2 Write the co-located `scripts/check-no-barrel-test-suites.test.mjs` (node:test) covering the three spec scenarios plus a real-tree smoke test
- [x] 10.3 Wire the guard into `pnpm test:scripts` and document it in the CLAUDE.md mechanical-guards list and `scripts/README.md`

## 11. Verification and closure

- [ ] 11.1 Run `pnpm -r test && pnpm -r build && pnpm lint:fix` to green; confirm per-package coverage is non-decreasing vs `audit/coverage-baseline.md`
- [ ] 11.2 Run `pnpm lint:specs` over the new/delta specs
- [ ] 11.3 Add changesets: `fix(tcx)` if task 3.2 changed wired-path output, `patch` for other published packages with source changes, none for test-only packages
- [ ] 11.4 Record final deleted/collapsed test counts per package in `audit/result-summary.md` for the archive
