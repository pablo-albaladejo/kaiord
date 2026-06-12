# Tasks: code-semantics-hardening

## 1. CLI failure contract (failure-semantics spec — critical)

- [x] 1.1 Confirm `ENVIRONMENT_ERROR`/`SERVICE_ERROR` numeric values against the existing `EXIT_CODES` table (design open question) and add them with doc comments
- [x] 1.2 Introduce typed errors for paths that currently throw raw `Error` with magic strings (`UnsupportedFormatError`, `DirectoryCreateError`, `EnvironmentError`); have `directory-handler.ts` and the schema/dependency-resolution failure paths throw them
- [x] 1.3 Build the single `mapErrorToExitCode` (instanceof/name-based) covering all existing codes plus the two new categories; route `bin/kaiord.ts` and every command handler through it
- [x] 1.4 Delete `commands/convert/error-exit-code.ts`, the name-table in `utils/error-exit-code.ts`, and the substring matching in `commands/{validate,inspect,extract-workout}/handle-error.ts` (the validate "only supports" matcher becomes a typed error)
- [x] 1.5 Add exit-code scenario tests: identical failure across convert/validate/inspect yields one code; reworded message keeps its code; unwritable output dir exits `DIRECTORY_CREATE_ERROR`; simulated missing schema exits `ENVIRONMENT_ERROR` with reinstall hint; simulated Garmin 503 exits `SERVICE_ERROR`
- [x] 1.6 Create the CLI `format-registry.ts` and feed the zod enum, yargs `choices`, converter dispatch, extension detection, and "Supported formats" strings from it; grep gate: format codes as string literals only inside the registry and tests

## 2. Lossy-conversion honesty (conversion-loss-honesty spec)

- [x] 2.1 zwo: add the `Lossy conversion:` warning to the steady-state watts→%FTP branch in `power-encoder.ts`; hoist `ASSUMED_FTP_WATTS = 250` (single commented constant, both branches) and `UNSUPPORTED_DURATION_FALLBACK_SECONDS = 300` in `duration-encoder.ts`
- [x] 2.2 zwo: change `original-duration.converter.ts` restore coercions — attribute present-but-unparseable warns and restores open instead of `|| 0`; add tests for the corrupted-attribute scenario
- [x] 2.3 zwo: comment the `1000 / x` sec-per-km pace factor and the deliberate min↔max swap in `target-encoder.ts`; extract `normalizeAttributeNames` XML mechanics out of `intervals-processor.ts`
- [x] 2.4 garmin: name `GARMIN_STEP_NOTES_MAX`/`GARMIN_NAME_MAX` (resolving 255 vs 256 against Garmin's real limits), warn on truncation; warn on unknown condition/intensity/stroke defaults; warn-and-open for the `REPS` end-condition per the adapter-contracts delta; comment the `im↔mixed` value-5 collapse and the faster-first ordering convention on `mapRangeOrValue`/`resolvePaceZone`; comment the pool `unitId`/`factor` wire constants
- [x] 2.5 garmin: route `mapToWorkoutSummary.sport` through `mapGarminSportToKrd` (changeset `fix(garmin)`); test that listed summaries carry KRD sport vocabulary
- [ ] 2.6 tcx + zwo: handle the full 7-value intensity enum per the adapter-contracts delta — extend `extractIntensity`/intensity encoders to map representable members and emit `Lossy conversion:` warnings for the rest; round-trip tests for `rest` (representable) and `recovery` (lossy) per format
- [ ] 2.7 tcx/zwo: add the `kaiord:` namespace purpose header to writer and reader extension modules (target-restoration, hr-target-restoration, ramp-helpers, duration-kaiord-restorer, metadata-encoder)

## 3. Shared named constants for duplicated rules

- [x] 3.1 fit: extract `hr-helpers.ts` (mirror of `power-helpers.ts`) owning the bpm `+100` offset for encode and decode; both converters import it; name the zone-validity bounds (`POWER_ZONE_MAX = 7`, `HR_ZONE_MAX = 5`, `PACE_ZONE_MAX = 5`) with the overload rule stated once
- [x] 3.2 fit: add a shared `fitTimestampToIso` helper replacing the seven duplicated `* 1000` + `Date|number|string` branches across health converters and `event.mapper.ts`
- [x] 3.3 core: export the health version gate once (named pattern or shared field schema) and import it in all six health schemas
- [x] 3.4 garmin-connect: name the retry-policy constants (`HTTP_TOO_MANY_REQUESTS`, server-error range, default retries/backoff) in `retry.ts`; add `nowEpochSeconds()` used by `sso-oauth.ts` and `token-manager.helpers.ts`; move the workout web URL from `garmin-workout-service.ts` into `urls.ts`

## 4. Core modeling and mcp

- [x] 4.1 core: add JSDoc unit annotations to every bare physiological number in `record.ts`, `session.ts`, `lap.ts` (watts, m/s, bpm, rpm, meters, seconds, mm, ms)
- [x] 4.2 core: rename `validate-round-trip` methods to match the port-level abstraction (`validateBinaryRoundTrip`/`validateKrdRoundTrip`) with deprecated aliases for the published API; align the type/docs wording
- [x] 4.3 core: rephrase the `extract-workout` error to lead with the domain statement ("KRD does not contain a structured workout"), keeping the field path in the structured error data; name the FNV constants in `profile-snapshot.ts`; widen or document `poolLengthUnit` vs the length-unit converter's two-unit vocabulary
- [x] 4.4 mcp: add machine-readable error classification (`type`, optional `suggestion`) to `formatError` per design D7 (resolve `structuredContent` vs fenced JSON against the installed SDK); update tool tests to assert the type for at least unsupported-format, auth, and file-not-found failures
- [x] 4.5 mcp: include `skipped` in the `kaiord_get_recovery_status` payload; test for health-family parity

## 5. SPA logic-layer polish

- [ ] 5.1 Extract `UNDO_DELETE_WINDOW_MS = 5000` and `CLEANUP_TICK_MS = 1000` into a shared store constants module; import from `clear-expired-deletes-action.ts`, both delete-with-toast call sites, and `use-delete-cleanup.ts`
- [ ] 5.2 Route all step/block actions through `extractStructuredWorkout`; grep gate: `structured_workout as Workout` appears only in the helper
- [ ] 5.3 Brand `create-step-action`'s new id as `ItemId` (or type `defaultIdProvider` to return it) so all four create/mutate actions share the id vocabulary
- [ ] 5.4 Fix the auto-match doc/code divergence per design D8: keep the 0.6 threshold, correct the comment to "score ≥ 0.6 (≈ ±40% duration variance)", and name the threshold constant where it is consumed
- [ ] 5.5 Define the `MatchedSessionsReadModel` port (application layer) and its Dexie adapter; migrate `use-activity-match-state` and `use-matched-sessions-hydrate` to it; record `{source, outcome}` results in `use-coaching-auto-sync`'s loop for observability

## 6. ai and misc renames

- [x] 6.1 ai: remove the dead `minPercent`/`maxPercent` fields from `evals/types.ts` (or implement them — decide from eval usage); name `ZONE_TOLERANCE = 0.05` in `assertions.ts`
- [ ] 6.2 tcx: rename `tcx-target-walker.converter.ts` → `tcx-target-decoder.converter.ts` and `duration-walker.converter.ts` → `duration-decoder.converter.ts` (they own rule sets, not traversal); move co-located tests with them

## 7. Verification and closure

- [ ] 7.1 `pnpm -r test && pnpm -r build && pnpm lint` green; per-package coverage non-decreasing (new warning branches covered)
- [ ] 7.2 `pnpm lint:specs` over the two new capabilities and the delta; `pnpm specs:inventory` regenerated
- [ ] 7.3 Changesets: `feat(cli)` additive exit codes, `fix(garmin)` sport mapping, patch for other published packages with source changes
- [ ] 7.4 Record before/after grades summary in `audit/result-summary.md`
