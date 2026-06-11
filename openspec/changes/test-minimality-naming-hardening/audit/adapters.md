This is the decisive evidence. Two parallel TCX→KRD pipelines and two KRD→TCX target pipelines exist:

**TCX→KRD (live wiring through `step.converter.ts`):**

- Duration: `duration-walker.converter.ts` (keyed on `@_xsi:type`) — LIVE
- Target: `tcx-target-walker.converter.ts` via `target.mapper.ts` (keyed on `@_xsi:type`) — LIVE

**DEAD/unused TCX→KRD pipeline (never called by reader, only the test imports it):**

- `tcx-to-krd.converter.ts` (duration, keyed on `durationType` string) + `standard-duration.converter.ts` + `extended-duration.converter.ts` + the barrel `duration.converter.ts`
- `tcx-to-krd.converter.ts` (target, keyed on `targetType` string) + `target.converter.ts` barrel

The KRD→TCX target path: `step-to-tcx.converter.ts` uses `target-to-tcx.converter.ts` (`convertTargetToTcx`) — LIVE. The other `krd-to-tcx.converter.ts` (`convertKrdTargetToTcx`) appears unused by the writer. Let me confirm and check usage of `pace.converter`/`cadence.converter`/`heart-rate.converter`.

===NEXT-BLOCK===

I've now read all test files across the five packages plus the key implementations. One overlap to verify in ai: `text-to-workout.test.ts` (retry tests at lines 123-145) vs `execute-with-retry.test.ts` — `createTextToWorkout` delegates retry to `executeWithRetry`, so there's some overlap. The `reindexSteps` logic is also tested both standalone and via `text-to-workout`. I have enough evidence for all findings. Let me compile the audit.

---

# Test Suite Audit — tcx, zwo, garmin, garmin-connect, ai

## Executive summary

The dominant problem is **duplicate test suites created by re-export barrel files** and **parallel/dead converter implementations**. `tcx` and `zwo` each maintain two copies of the same converter logic where a barrel module re-exports a real one, and a full test suite is written against _both_ the barrel and the source. A secondary theme is **thin-wrapper delegation tests** (garmin-connect http-client, ai text-to-workout) re-verifying logic already covered on the delegate. The `garmin` and `garmin-connect` token/auth core are the strongest suites. Estimated **~95–120 deletable `it()` blocks** across the five packages, almost entirely in tcx/zwo.

---

## packages/tcx

- [SEVERITY high] [CATEGORY redundant] `duration/duration.converter.test.ts:1-808` — `duration.converter.ts` is a pure barrel: `export { convertTcxDuration } from "./tcx-to-krd.converter"` and `export { convertKrdDurationToTcx } from "./krd-to-tcx.converter"` (see `duration.converter.ts:1-8`). This 808-line file re-tests the EXACT same two functions covered by `tcx-to-krd.converter.test.ts` (225 lines) and `krd-to-tcx.converter.test.ts` (165 lines) — same inputs, same assertions. — Pure duplication via a re-export. — Delete `duration.converter.test.ts` entirely (~45 it blocks); keep the two source-level suites.

- [SEVERITY high] [CATEGORY redundant] `target/target.converter.test.ts:1-549` — `target.converter.ts` is a pure barrel re-exporting `convertTcxTarget` from `tcx-to-krd.converter.ts` and `convertKrdTargetToTcx` from `krd-to-tcx.converter.ts` (`target.converter.ts:1-4`). The 549-line `target.converter.test.ts` tests `convertTcxTarget` with the SAME data shapes as `tcx-to-krd.converter.test.ts:1-213`. The `convertKrdTargetToTcx` half (`krd-to-tcx.converter.test.ts`) is also fully re-covered. — Duplicate suite through a barrel. — Delete `target.converter.test.ts` (~40 it blocks); the per-source suites already cover both directions.

- [SEVERITY high] [CATEGORY redundant] `duration/standard-duration.converter.test.ts` + `duration/extended-duration.converter.test.ts` — `tcx-to-krd.converter.ts` composes `convertStandardDuration` + `convertExtendedDuration`; the dispatcher test `tcx-to-krd.converter.test.ts` already exercises every branch of both helpers through the public function (Time/Distance/LapButton/HR/Calories + null fallbacks). The two helper suites (13 + 11 it blocks) re-test the identical equivalence classes one layer down with no extra discrimination. — Unit tests fully subsumed by the dispatcher test. — Collapse: keep only branches not reachable through the dispatcher (none observed); delete or merge ~20 it blocks.

- [SEVERITY high] [CATEGORY gap] `target/target-to-tcx.converter.test.ts` vs `target/pace.converter.ts` — The LIVE KRD→TCX writer path (`step-to-tcx.converter.ts:53` → `convertTargetToTcx` in `target-to-tcx.converter.ts`) is a SEPARATE implementation from `krd-to-tcx.converter.ts`/`pace.converter.ts`/`cadence.converter.ts`/`heart-rate.converter.ts`, which are imported by NO non-test file (grep confirms only test + barrel references). The two diverge: `target-to-tcx.converter.ts:41` matches unit `"meters_per_second"`, while `pace.converter.test.ts` and `krd-to-tcx` use `"mps"`; the live path also lacks the running-cadence doubling that `cadence.converter.ts` implements and `krd-to-tcx.converter.test.ts:230-253` asserts. — Heavily-tested orphan converter gives false confidence; the wired path's cadence-doubling and pace-unit handling are under-tested. — Confirm which encoder is canonical; delete the orphan + its tests (`pace.converter.test.ts`, `cadence.converter.test.ts`, `heart-rate.converter.test.ts`, `krd-to-tcx.converter.test.ts` for targets ≈ 4 files / ~45 it blocks) OR wire it in and delete `target-to-tcx`. Add a round-trip assertion for running cadence on the live path.

- [SEVERITY high] [CATEGORY redundant] `duration/duration-walker.converter.test.ts:24-161` vs `duration/duration-standard-converter.test.ts` + `duration/duration-kaiord-restorer.test.ts` — `duration-walker.converter.ts`'s `convertTcxDuration` composes `convertStandardTcxDuration` + `restoreKaiordDuration`. `duration-walker.converter.test.ts` already drives every branch of both helpers through the public function (Time_t/Distance_t/LapButton_t, kaiord restore for hr/power/calories, null fallbacks). The two helper suites (13 + 11 it blocks) duplicate those equivalence classes. — Helper-level unit tests subsumed by the walker dispatcher test. — Keep `duration-standard-converter.test.ts`'s string-vs-number guard (`Seconds: "300"`) and zero-value cases only if not reachable through the walker; otherwise delete/merge ~20 it blocks.

- [SEVERITY med] [CATEGORY redundant] `workout/duration-to-tcx-encoder.test.ts` vs `duration/duration-walker.converter.test.ts:164-232` — `mapTimeDurationToTcx`/`mapDistanceDurationToTcx`/`mapOpenDurationToTcx` are tested in `duration-walker.converter.test.ts`, and `duration-to-tcx-encoder.test.ts` re-asserts the same Time_t/Distance_t/LapButton_t + kaiord-attribute output. Overlap on the time/distance/open cases (3-4 it blocks). — Partial duplication of the encode-side mappers. — Keep `duration-to-tcx-encoder` (it owns the kaiord-attribute branches); drop the duplicated plain time/distance/open mapper assertions from one side.

- [SEVERITY med] [CATEGORY redundant] `fast-xml-parser.test.ts:54-64` and `692-760` — `should throw TcxParsingError on malformed XML` plus the four "inject logger / inject validator / log debug" tests (`692-760`) are mock-presence assertions (`expect(logger).toBeDefined()`, `expect(mockValidator).toBeDefined()`) inside `try/catch` that swallow errors — they assert nothing about behavior. — Mock-call-only / no-observable-outcome tests. — Delete the 3 "inject/log" no-op tests (~3 it blocks); the real reader/writer round-trips already prove logger+validator are wired.

- [SEVERITY med] [CATEGORY redundant] `fast-xml-parser.test.ts` writer section vs `round-trip/round-trip.test.ts` — The writer half (`should convert time-based duration steps`, `distance-based`, `heart rate zone targets`, `preserve step order`, extension restoration at all levels) re-asserts string-contains checks on emitted XML that the KRD→TCX→KRD round-trip already validates structurally with tolerance. — Unit string-contains tests largely subsumed by round-trip. — Keep one smoke writer test + the XSD-validation-failure test; consider trimming ~6 redundant string-contains writer cases.

- [SEVERITY low] [CATEGORY name] `xsd-validator.test.ts:114` — title `should accept XML missing required namespace (schema validation not enforced)` plus the describe block `schema violations` describe behavior the validator does NOT do (it's well-formedness only). Same pattern in `well-formedness-validator`/`xsd-validator` across tcx+zwo. — Title promises schema enforcement that isn't implemented; mildly misleading. — Rename to `should accept well-formed XML even without namespace`. (1-2 occurrences, low.)

- [SEVERITY low] [CATEGORY redundant] `target/cadence.converter.test.ts` / `heart-rate.converter.test.ts` / `pace.converter.test.ts` — Multiple near-identical `it()` blocks differing only by literal value (zone 1/3/5; bpm 150/200; pace 5.56/1.2/4.2) with no branch distinguishing them. — Should be `it.each`. — Convert ~15 value-only variants to `it.each` (cosmetic; lower priority than the orphan-converter decision above).

**tcx verdict:** redundancy **D**, completeness **B** (good branch coverage but split across dead+live duplicates), naming **B**. Approx deletable: **~110–130 it blocks** if the barrel duplicates (`duration.converter.test.ts`, `target.converter.test.ts`) and one of the two target/duration pipelines are removed; **~45 it blocks** as a conservative floor (barrel duplicates only).

---

## packages/zwo

- [SEVERITY high] [CATEGORY redundant] `target/target.converter.test.ts:1-483` — `target.converter.ts` is a pure re-export barrel (`target.converter.ts:6-18` re-exports from `power.converter.ts` and `pace-cadence.converter.ts`). This 483-line suite re-tests `convertZwiftPowerTarget/Range`, `convertZwiftPaceTarget`, `convertZwiftCadenceTarget`, `convertKrdPower/Pace/CadenceToZwift` — the SAME functions covered by `power.converter.test.ts` (311 lines) and `pace-cadence.converter.test.ts` (248 lines). — Full duplicate via barrel. — Delete `target.converter.test.ts` (~35 it blocks); keep the two source suites. (Note: `target.converter.test.ts` even omits `convertPowerZoneToPercentFtp`, so it's a strict subset.)

- [SEVERITY high] [CATEGORY redundant] Three overlapping round-trip suites: `round-trip/round-trip.test.ts`, `round-trip/zwift-round-trip.test.ts`, `zwift-round-trip.test.ts` — `round-trip/round-trip.test.ts` (SteadyState + IntervalsT via `createZwiftValidator`) and `round-trip/zwift-round-trip.test.ts` (same two fixtures via `createXsdZwiftValidator`, plus custom-targets/extensions/HR/power-zones) overlap on the WorkoutIndividualSteps + WorkoutRepeatSteps reader→writer→reader assertions. `zwift-round-trip.test.ts` (root) does the same trip manually via `XMLParser` + `convertZwiftToKRD`/`convertKRDToZwift`. Three files prove "individual steps survive round-trip" three times. — Triplicated round-trip coverage of identical fixtures. — Consolidate into one `round-trip/` suite; the root `zwift-round-trip.test.ts` and `round-trip/round-trip.test.ts` are largely subsumed by `round-trip/zwift-round-trip.test.ts` (~6-8 it blocks deletable).

- [SEVERITY high] [CATEGORY redundant] `interval/text-event-extraction.test.ts:1-293` — Tests `mapSteadyStateToKrd`, `mapRampToKrd`, `mapFreeRideToKrd`, `mapIntervalsTToKrd` — all `*.mapper.ts` files (`steady-state.mapper.ts`, `ramp.mapper.ts`, `free-ride.mapper.ts`, `intervals-t.mapper.ts`), which per CLAUDE.md convention "need NO tests." The text-event extraction behavior is also covered end-to-end by the round-trip "preserve text events" tests and by `krd-to-zwift/text-events-encoder.test.ts` (encode side). — Tests on mapper files against convention; behavior covered by round-trip. — Delete or justify; if the extraction logic is non-trivial enough to test, move it out of `*.mapper.ts` (the file naming claims "no logic"). ~10 it blocks.

- [SEVERITY med] [CATEGORY redundant] `fast-xml-parser.test.ts` writer `interval encoding` + `text event encoding` (lines 684-1364) vs `krd-to-zwift/intervals-t-encoder.test.ts` + `krd-to-zwift/text-events-encoder.test.ts` — The writer integration tests assert `Repeat="5"`, `OnPower="1.2"`, `message="..."`, `timeoffset="0"` etc. on emitted XML; the dedicated encoder unit tests assert the same attribute production on the same logic. Heavy overlap (single/multiple/distance text events; IntervalsT power/cadence/distance). — Integration string-contains tests largely duplicate the encoder unit suites. — Keep the encoder unit suites (they're more precise); trim ~8-10 writer string-contains cases to one smoke test per feature.

- [SEVERITY med] [CATEGORY redundant] `xsd-validator.test.ts:68-196` `property: environment detection reflects current state` — Five+ tests (`empty object`, `object with properties`, `with navigator`, `minimal window-like`, plus "consistently detect across 5 reloads" looping 5×) all assert the SAME outcome (`result.valid === true`) for the SAME valid XML; they only vary the shape of a truthy `global.window`. No branch distinguishes `{}` from `{document:{}}` — the code only checks `typeof window !== "undefined"`. — Same equivalence class tested ~8 times. — Collapse to two tests (window defined → browser validator; window undefined → XSD validator). ~6 it blocks deletable; the 30s-timeout reload-loop test is also a CI cost with no extra discrimination.

- [SEVERITY med] [CATEGORY redundant] `well-formedness-validator.test.ts` vs `xsd-validator.test.ts` (createXsdZwiftValidator) — Both assert identical valid/invalid/empty/non-XML cases with the same fixtures (well-formed bike workout, malformed, unclosed tags, empty string). In Node, `createXsdZwiftValidator` and the well-formedness validator overlap on every malformed-input case. — Copy-pasted validator suites. — Share fixtures + a helper that runs both validators over a common table; drop ~4 duplicated invalid-XML cases.

- [SEVERITY low] [CATEGORY redundant] `duration/duration.converter.test.ts` — `convertZwiftDuration` (dispatcher) is tested for time/distance/zero/negative, and `convertZwiftTimeDuration`/`convertZwiftDistanceDuration` (its two helpers) are tested for the identical zero/negative/decimal classes separately. Same for `convertKrdDurationToZwift` vs the two `convertKrd*DurationToZwift` helpers. — Dispatcher + helpers test the same equivalence classes. — Keep dispatcher tests; trim ~6 helper duplicates.

**zwo verdict:** redundancy **D+**, completeness **A−** (encoders and detectors are thoroughly and precisely covered), naming **B+**. Approx deletable: **~60–70 it blocks** (barrel `target.converter.test.ts` ~35, round-trip consolidation ~8, mapper tests ~10, env-detection ~6, validator/duration overlap ~10).

---

## packages/garmin

- [SEVERITY low] [CATEGORY redundant] `converters/garmin-to-krd.converter.test.ts` + `converters/krd-to-garmin.converter.test.ts` vs `round-trip/round-trip.test.ts` — The two directional suites assert per-field GCN→KRD and KRD→GCN mappings on the same five fixtures, and the round-trip suite then re-loads the same fixtures to assert preservation. There is real extra discrimination here (directional suites pin exact target shapes; round-trip pins tolerance-bounded equality), so this is acceptable, not a defect — flagging only that the swimming/strength/edge round-trip cases (`round-trip.test.ts:61-107`) mostly re-assert `steps.length` already covered directionally. — Mild step-count overlap. — Optional: drop the 2-3 round-trip cases that only check `steps.length`.

- [SEVERITY low] [CATEGORY name] `converters/executable-step.converter.test.ts` & `mappers/target.converter.test.ts` — These test `mapExecutableStep` and `mapKrdTargetToGarmin`/`mapGarminTargetToKrd`. Both functions carry the `map*` prefix (convention reserves "no-logic, no-tests" for `*.mapper.ts` _files_), but they live in `*.converter.ts` files and contain genuine branching (duration/intensity/target/secondary-target/stroke/equipment/notes; pace-zone resolution; range normalization). Correctly tested — flagging only the naming tension that a `map*` function in a `.converter.ts` blurs the mapper/converter line. — Naming inconsistency, not a redundancy. — No action required; optionally rename functions to `convert*`.

**garmin verdict:** redundancy **A−**, completeness **A** (every branch of `mapExecutableStep`, pace-zone edge cases, `isSessionTransitionEnabled` propagation, nested-repeat flattening all covered; error paths for invalid JSON / non-object / missing extension present), naming **A−**. Approx deletable: **~2-3 it blocks** (round-trip step-count-only cases). This is the model package.

---

## packages/garmin-connect

- [SEVERITY high] [CATEGORY redundant] `http/garmin-http-client.test.ts:35-50, 113-204` vs `http/garmin-auth-fetch.test.ts` — `garmin-http-client.ts` is a thin wrapper: `const fetch = (url, init) => authFetch(url, init, tokenReader, fetchFn)` (`garmin-http-client.ts:14-15`); all auth/retry logic lives in `authFetch`. The http-client tests `should throw when not authenticated`, `should refresh when token is expired`, `should retry on 401 with refreshed token`, `should throw when retry after 401 refresh also fails`, `should throw on non-ok responses` re-verify behaviors already owned by `garmin-auth-fetch.test.ts` (`should refresh before request when not authenticated`, `should refresh and retry on 401`, `should throw after retry fails`, `should throw on non-401 error responses`, `should throw when not authenticated`). — Wrapper re-tests the delegate's logic. — Keep in http-client only the wrapper-specific concerns: Bearer-header injection, POST JSON body, DELETE method-override, null-body→undefined (~4 it blocks). Delete the ~5 auth/retry it blocks; they belong to `authFetch`.

- [SEVERITY low] [CATEGORY redundant] `client/garmin-workout-service.test.ts:175-185` `should pull a workout` — Asserts `krd.type === "structured_workout"` from a mocked GCN payload; the actual GCN→KRD conversion correctness is owned by `@kaiord/garmin`'s `garmin-to-krd.converter.test.ts`. Here it only proves the service calls `get(WORKOUT_URL/workout/42)` and returns _a_ KRD. The URL+delegation assertion is the value; the conversion re-check is incidental. — Minor: re-touches conversion already covered upstream. — Acceptable as a wiring test; no change needed (flagged for completeness).

- [SEVERITY low] [CATEGORY gap] `http/garmin-sso.test.ts` — Covers the happy 5-step flow + CSRF-missing + ticket-missing + account-locked, but there's no test for the `Update Phone Number` page-title rejection at the SSO-flow level (only at the `sso-validators.test.ts` unit level) and no test for OAuth1/OAuth2 sub-step failure surfacing through `garminSso`. Low risk since sub-functions are unit-tested. — Minor branch-at-integration gap. — Optionally add one `garminSso` case asserting a sub-step error propagates.

- [SEVERITY low] [CATEGORY name] `http/garmin-http-client.test.ts:131` `should refresh when token is expired` — The test sets `isAuthenticated: () => false` and `getAccessToken: () => "refreshed-bearer"`, then asserts `reader.refresh` was called — but this exercises `authFetch`'s pre-request refresh, not http-client logic. Title attributes delegate behavior to the wrapper. — Title describes behavior owned by another unit. — Fold into auth-fetch (see high finding).

**garmin-connect verdict:** redundancy **B**, completeness **A** (token-manager concurrency/subscriber/stale-guard/PII-no-log coverage at `token-manager.test.ts:193-444` is exemplary; retry jitter formula, refresh-fn consumer cache invalidation all covered), naming **A−**. Approx deletable: **~5-6 it blocks** (http-client auth/retry duplicates). Strongest package alongside garmin.

---

## packages/ai

- [SEVERITY med] [CATEGORY redundant] `adapters/text-to-workout.test.ts:123-157` vs `adapters/execute-with-retry.test.ts` — `createTextToWorkout` delegates retry/correction to `executeWithRetry`. `text-to-workout.test.ts` re-tests `should retry on first failure and succeeds on second attempt`, `should include error feedback in retry prompt`, `should throw AiParsingError after max retries exhausted`, `should handle non-Error thrown values` — all retry/correction behaviors already pinned precisely in `execute-with-retry.test.ts` (`should retry retryable APICallError`, `should retry on schema validation failure with prompt-correction injection`, `should retry plain non-APICallError then throw AiParsingError`). — Retry behavior tested at both the orchestrator and the delegate. — In `text-to-workout.test.ts` keep only orchestration-specific cases (input validation short-circuit, sport-hint, name override, reindex, output-null, logging); drop the ~3 retry/correction duplicates that `execute-with-retry` owns.

- [SEVERITY low] [CATEGORY redundant] `adapters/text-to-workout.test.ts:184-216` `should reindex non-sequential stepIndex values` vs `adapters/reindex-steps.test.ts` — `reindexSteps` correctness is fully owned by `reindex-steps.test.ts` (top-level, nested, empty, skip-blocks, no-mutate). The text-to-workout case re-proves reindexing end-to-end. — Re-tests a unit already exhaustively covered. — Keep as a thin "pipeline applies reindex" smoke (1 assertion) or drop; ~1 it block.

- [SEVERITY low] [CATEGORY gap] `adapters/execute-with-retry.test.ts` — Good coverage of retryable/non-retryable `APICallError` and schema-correction, but no test asserts the `maxOutputTokens`/`temperature`/`abortSignal` args are threaded into `generateText` (that's only checked in `text-to-workout.test.ts:292`). Minor. — Optional config-threading test at the `executeWithRetry` level.

- [SEVERITY low] [CATEGORY name] `evals/assertions.test.ts:204` `zone checks` describe — Titles like `should fail when target min is below expected minValue with 5% tolerance` encode the literal tolerance constant in the name; if the tolerance changes the title silently lies. Minor. — Prefer `should fail when target min is below expected within tolerance`. (1-2 occurrences.)

**ai verdict:** redundancy **B+**, completeness **A** (validate-input boundary cases, error fields, eval assertions incl. repeat-block step counting and zone tolerance, reporter grouping all covered; non-Error throw path and null-output path present), naming **A−**. Approx deletable: **~4 it blocks** (retry + reindex duplicates).

---

## Top 3 actions overall

1. **Delete barrel-duplicate test suites.** `tcx/duration/duration.converter.test.ts` (808 lines), `tcx/target/target.converter.test.ts` (549 lines), and `zwo/target/target.converter.test.ts` (483 lines) test functions re-exported verbatim from already-tested source modules. Removing them eliminates ~120 redundant `it()` blocks with zero coverage loss (the barrels are import-only and proven live by round-trips).

2. **Resolve the tcx dual/dead converter pipelines.** Decide whether the KRD→TCX target encoder is `target-to-tcx.converter.ts` (LIVE, wired in `step-to-tcx.converter.ts`) or `target/krd-to-tcx.converter.ts` + helpers (orphaned), and likewise for the TCX→KRD duration/target walkers vs the `tcx-to-krd`/`standard`/`extended` chain. Delete the dead path and its ~65 tests, then add a round-trip assertion for the live path's running-cadence doubling (currently only the dead path asserts it — a real correctness gap).

3. **Stop re-testing delegated logic in thin wrappers.** Move the auth/retry assertions out of `garmin-connect/http/garmin-http-client.test.ts` into `garmin-auth-fetch.test.ts`, and trim `ai/text-to-workout.test.ts` retry/reindex cases that `execute-with-retry.test.ts`/`reindex-steps.test.ts` already own. Then consolidate the three zwo round-trip files and collapse the zwo env-detection `it.each`-style window-shape tests into two cases.

### Approx deletable test count per package

- **tcx:** ~45 (barrel duplicates, floor) to ~130 (incl. dead-pipeline removal)
- **zwo:** ~60–70
- **garmin:** ~2–3
- **garmin-connect:** ~5–6
- **ai:** ~4

Relevant implementation files proving the redundancies (absolute paths):

- `/Users/pablo/development/kaiord/packages/tcx/src/adapters/duration/duration.converter.ts` (barrel)
- `/Users/pablo/development/kaiord/packages/tcx/src/adapters/target/target.converter.ts` (barrel)
- `/Users/pablo/development/kaiord/packages/tcx/src/adapters/workout/target-to-tcx.converter.ts` (live encoder) vs `/Users/pablo/development/kaiord/packages/tcx/src/adapters/target/krd-to-tcx.converter.ts` (orphan)
- `/Users/pablo/development/kaiord/packages/zwo/src/adapters/target/target.converter.ts` (barrel)
- `/Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/http/garmin-http-client.ts` (thin wrapper over `garmin-auth-fetch.ts`)

===NEXT-BLOCK===

The audit is complete. I've read all 83 test files across the five packages plus the key implementation files they cover, and produced a grouped per-package findings list with severities, a per-package A–F verdict (redundancy/completeness/naming), top 3 actions, and per-package deletable test counts.

Key load-bearing discoveries:

- **tcx**: `duration/duration.converter.ts` and `target/target.converter.ts` are pure re-export barrels, so `duration.converter.test.ts` (808 lines) and `target.converter.test.ts` (549 lines) duplicate the source-level suites verbatim. There are also two parallel converter pipelines (live `target-to-tcx.converter.ts`/`duration-walker.converter.ts` vs orphaned `krd-to-tcx.converter.ts`/`tcx-to-krd.converter.ts` chains), creating a real correctness gap: the live KRD→TCX path's running-cadence doubling is only asserted on the dead path.

- **zwo**: `target/target.converter.ts` is also a barrel (duplicate suite), three overlapping round-trip files re-prove the same fixtures, `text-event-extraction.test.ts` tests `*.mapper.ts` files against convention, and the xsd-validator env-detection block tests one equivalence class ~8 times.

- **garmin-connect**: `garmin-http-client.ts` is a thin wrapper that delegates all auth/retry to `authFetch`, so 5 of its tests duplicate `garmin-auth-fetch.test.ts`.

- **ai**: retry/correction and reindex behaviors are tested both at the orchestrator (`text-to-workout`) and the delegates (`execute-with-retry`, `reindex-steps`).

- **garmin** and **garmin-connect** token/auth cores are the strongest suites (grade A), used as the reference standard.

Approx deletable: tcx ~45 (floor) to ~130 (with dead-pipeline removal), zwo ~60–70, garmin ~2–3, garmin-connect ~5–6, ai ~4. All findings, the per-package grades, and the top-3 actions are in the report above.

===NEXT-BLOCK===

The audit is complete and delivered in full above. No further action is required from me — the findings, per-package verdicts, top-3 actions, and deletable counts are all in the report.

Summary of what was produced:

**Coverage**: All 83 test files across `tcx`, `zwo`, `garmin`, `garmin-connect`, and `ai`, plus the implementation files they cover (barrels, converters, http-client/auth-fetch, retry logic).

**Highest-value findings**:

1. **Barrel-duplicate suites** — `tcx/duration/duration.converter.test.ts`, `tcx/target/target.converter.test.ts`, and `zwo/target/target.converter.test.ts` test functions re-exported verbatim from already-tested source modules (~120 redundant `it()` blocks, zero coverage loss to delete).
2. **tcx dual/dead converter pipelines** — orphaned `krd-to-tcx`/`pace`/`cadence`/`heart-rate` converters are heavily tested but unused; the live `target-to-tcx.converter.ts` path lacks the running-cadence-doubling assertion the dead path carries (a genuine correctness gap, not just redundancy).
3. **Thin-wrapper delegation tests** — `garmin-connect/http/garmin-http-client.test.ts` and `ai/text-to-workout.test.ts` re-verify logic owned by `garmin-auth-fetch` / `execute-with-retry` / `reindex-steps`.

**Grades**: garmin **A**, garmin-connect **A−/B**, ai **B+/A**, zwo **D+/A−** (redundancy/completeness), tcx **D/B**.

**Deletable estimate**: tcx ~45–130, zwo ~60–70, garmin ~2–3, garmin-connect ~5–6, ai ~4.

Relevant absolute paths flagged for action are listed at the end of the report. If you'd like, I can next propose the concrete deletions/merges as a task list or draft the consolidation for any single package.

===NEXT-BLOCK===

The audit is complete and fully delivered. No further work is pending.

Final deliverables (all in the report above):

- Per-package findings in the requested format: `[SEVERITY] [CATEGORY] file:line — evidence — why — fix`
- Per-package verdicts with A–F grades for redundancy / completeness / naming
- Top 3 actions overall
- Approximate deletable test count per package

Headline results:

- **Root cause**: re-export barrel files (`tcx/duration/duration.converter.ts`, `tcx/target/target.converter.ts`, `zwo/target/target.converter.ts`) each have a full duplicate test suite written against both the barrel and the source (~120 deletable `it()` blocks).
- **Correctness gap surfaced**: tcx maintains live and dead/orphaned converter pipelines; the live KRD→TCX path's running-cadence doubling is only asserted on the unused path.
- **Delegation duplicates**: garmin-connect http-client and ai text-to-workout re-test logic owned by their delegates.
- **Reference standard**: `garmin` and `garmin-connect` token/auth suites (grade A).

If you want a follow-up, I can turn the top-3 actions into a concrete, ordered deletion/merge task list or draft the consolidation for one package. Otherwise, this task is closed.

===NEXT-BLOCK===

# Test Suite Audit — tcx, zwo, garmin, garmin-connect, ai

## Executive summary

The dominant problem is **duplicate test suites created by re-export barrel files** and **parallel/dead converter implementations**. `tcx` and `zwo` each maintain two copies of the same converter logic where a barrel module re-exports a real one, and a full test suite is written against _both_ the barrel and the source. A secondary theme is **thin-wrapper delegation tests** (garmin-connect http-client, ai text-to-workout) re-verifying logic already covered on the delegate. The `garmin` and `garmin-connect` token/auth core are the strongest suites. Estimated **~95–120 deletable `it()` blocks** across the five packages, almost entirely in tcx/zwo.

---

## packages/tcx

- [SEVERITY high] [CATEGORY redundant] `duration/duration.converter.test.ts:1-808` — `duration.converter.ts` is a pure barrel: `export { convertTcxDuration } from "./tcx-to-krd.converter"` and `export { convertKrdDurationToTcx } from "./krd-to-tcx.converter"` (see `duration.converter.ts:1-8`). This 808-line file re-tests the EXACT same two functions covered by `tcx-to-krd.converter.test.ts` (225 lines) and `krd-to-tcx.converter.test.ts` (165 lines) — same inputs, same assertions. — Pure duplication via a re-export. — Delete `duration.converter.test.ts` entirely (~45 it blocks); keep the two source-level suites.

- [SEVERITY high] [CATEGORY redundant] `target/target.converter.test.ts:1-549` — `target.converter.ts` is a pure barrel re-exporting `convertTcxTarget` from `tcx-to-krd.converter.ts` and `convertKrdTargetToTcx` from `krd-to-tcx.converter.ts` (`target.converter.ts:1-4`). The 549-line `target.converter.test.ts` tests `convertTcxTarget` with the SAME data shapes as `tcx-to-krd.converter.test.ts:1-213`. The `convertKrdTargetToTcx` half (`krd-to-tcx.converter.test.ts`) is also fully re-covered. — Duplicate suite through a barrel. — Delete `target.converter.test.ts` (~40 it blocks); the per-source suites already cover both directions.

- [SEVERITY high] [CATEGORY redundant] `duration/standard-duration.converter.test.ts` + `duration/extended-duration.converter.test.ts` — `tcx-to-krd.converter.ts` composes `convertStandardDuration` + `convertExtendedDuration`; the dispatcher test `tcx-to-krd.converter.test.ts` already exercises every branch of both helpers through the public function (Time/Distance/LapButton/HR/Calories + null fallbacks). The two helper suites (13 + 11 it blocks) re-test the identical equivalence classes one layer down with no extra discrimination. — Unit tests fully subsumed by the dispatcher test. — Collapse: keep only branches not reachable through the dispatcher (none observed); delete or merge ~20 it blocks.

- [SEVERITY high] [CATEGORY gap] `target/target-to-tcx.converter.test.ts` vs `target/pace.converter.ts` — The LIVE KRD→TCX writer path (`step-to-tcx.converter.ts:53` → `convertTargetToTcx` in `target-to-tcx.converter.ts`) is a SEPARATE implementation from `krd-to-tcx.converter.ts`/`pace.converter.ts`/`cadence.converter.ts`/`heart-rate.converter.ts`, which are imported by NO non-test file (grep confirms only test + barrel references). The two diverge: `target-to-tcx.converter.ts:41` matches unit `"meters_per_second"`, while `pace.converter.test.ts` and `krd-to-tcx` use `"mps"`; the live path also lacks the running-cadence doubling that `cadence.converter.ts` implements and `krd-to-tcx.converter.test.ts:230-253` asserts. — Heavily-tested orphan converter gives false confidence; the wired path's cadence-doubling and pace-unit handling are under-tested. — Confirm which encoder is canonical; delete the orphan + its tests (`pace.converter.test.ts`, `cadence.converter.test.ts`, `heart-rate.converter.test.ts`, `krd-to-tcx.converter.test.ts` for targets ≈ 4 files / ~45 it blocks) OR wire it in and delete `target-to-tcx`. Add a round-trip assertion for running cadence on the live path.

- [SEVERITY high] [CATEGORY redundant] `duration/duration-walker.converter.test.ts:24-161` vs `duration/duration-standard-converter.test.ts` + `duration/duration-kaiord-restorer.test.ts` — `duration-walker.converter.ts`'s `convertTcxDuration` composes `convertStandardTcxDuration` + `restoreKaiordDuration`. `duration-walker.converter.test.ts` already drives every branch of both helpers through the public function (Time_t/Distance_t/LapButton_t, kaiord restore for hr/power/calories, null fallbacks). The two helper suites (13 + 11 it blocks) duplicate those equivalence classes. — Helper-level unit tests subsumed by the walker dispatcher test. — Keep `duration-standard-converter.test.ts`'s string-vs-number guard (`Seconds: "300"`) and zero-value cases only if not reachable through the walker; otherwise delete/merge ~20 it blocks.

- [SEVERITY med] [CATEGORY redundant] `workout/duration-to-tcx-encoder.test.ts` vs `duration/duration-walker.converter.test.ts:164-232` — `mapTimeDurationToTcx`/`mapDistanceDurationToTcx`/`mapOpenDurationToTcx` are tested in `duration-walker.converter.test.ts`, and `duration-to-tcx-encoder.test.ts` re-asserts the same Time_t/Distance_t/LapButton_t + kaiord-attribute output. Overlap on the time/distance/open cases (3-4 it blocks). — Partial duplication of the encode-side mappers. — Keep `duration-to-tcx-encoder` (it owns the kaiord-attribute branches); drop the duplicated plain time/distance/open mapper assertions from one side.

- [SEVERITY med] [CATEGORY redundant] `fast-xml-parser.test.ts:54-64` and `692-760` — `should throw TcxParsingError on malformed XML` plus the four "inject logger / inject validator / log debug" tests (`692-760`) are mock-presence assertions (`expect(logger).toBeDefined()`, `expect(mockValidator).toBeDefined()`) inside `try/catch` that swallow errors — they assert nothing about behavior. — Mock-call-only / no-observable-outcome tests. — Delete the 3 "inject/log" no-op tests (~3 it blocks); the real reader/writer round-trips already prove logger+validator are wired.

- [SEVERITY med] [CATEGORY redundant] `fast-xml-parser.test.ts` writer section vs `round-trip/round-trip.test.ts` — The writer half (`should convert time-based duration steps`, `distance-based`, `heart rate zone targets`, `preserve step order`, extension restoration at all levels) re-asserts string-contains checks on emitted XML that the KRD→TCX→KRD round-trip already validates structurally with tolerance. — Unit string-contains tests largely subsumed by round-trip. — Keep one smoke writer test + the XSD-validation-failure test; consider trimming ~6 redundant string-contains writer cases.

- [SEVERITY low] [CATEGORY name] `xsd-validator.test.ts:114` — title `should accept XML missing required namespace (schema validation not enforced)` plus the describe block `schema violations` describe behavior the validator does NOT do (it's well-formedness only). Same pattern in `well-formedness-validator`/`xsd-validator` across tcx+zwo. — Title promises schema enforcement that isn't implemented; mildly misleading. — Rename to `should accept well-formed XML even without namespace`. (1-2 occurrences, low.)

- [SEVERITY low] [CATEGORY redundant] `target/cadence.converter.test.ts` / `heart-rate.converter.test.ts` / `pace.converter.test.ts` — Multiple near-identical `it()` blocks differing only by literal value (zone 1/3/5; bpm 150/200; pace 5.56/1.2/4.2) with no branch distinguishing them. — Should be `it.each`. — Convert ~15 value-only variants to `it.each` (cosmetic; lower priority than the orphan-converter decision above).

**tcx verdict:** redundancy **D**, completeness **B** (good branch coverage but split across dead+live duplicates), naming **B**. Approx deletable: **~110–130 it blocks** if the barrel duplicates (`duration.converter.test.ts`, `target.converter.test.ts`) and one of the two target/duration pipelines are removed; **~45 it blocks** as a conservative floor (barrel duplicates only).

---

## packages/zwo

- [SEVERITY high] [CATEGORY redundant] `target/target.converter.test.ts:1-483` — `target.converter.ts` is a pure re-export barrel (`target.converter.ts:6-18` re-exports from `power.converter.ts` and `pace-cadence.converter.ts`). This 483-line suite re-tests `convertZwiftPowerTarget/Range`, `convertZwiftPaceTarget`, `convertZwiftCadenceTarget`, `convertKrdPower/Pace/CadenceToZwift` — the SAME functions covered by `power.converter.test.ts` (311 lines) and `pace-cadence.converter.test.ts` (248 lines). — Full duplicate via barrel. — Delete `target.converter.test.ts` (~35 it blocks); keep the two source suites. (Note: `target.converter.test.ts` even omits `convertPowerZoneToPercentFtp`, so it's a strict subset.)

- [SEVERITY high] [CATEGORY redundant] Three overlapping round-trip suites: `round-trip/round-trip.test.ts`, `round-trip/zwift-round-trip.test.ts`, `zwift-round-trip.test.ts` — `round-trip/round-trip.test.ts` (SteadyState + IntervalsT via `createZwiftValidator`) and `round-trip/zwift-round-trip.test.ts` (same two fixtures via `createXsdZwiftValidator`, plus custom-targets/extensions/HR/power-zones) overlap on the WorkoutIndividualSteps + WorkoutRepeatSteps reader→writer→reader assertions. `zwift-round-trip.test.ts` (root) does the same trip manually via `XMLParser` + `convertZwiftToKRD`/`convertKRDToZwift`. Three files prove "individual steps survive round-trip" three times. — Triplicated round-trip coverage of identical fixtures. — Consolidate into one `round-trip/` suite; the root `zwift-round-trip.test.ts` and `round-trip/round-trip.test.ts` are largely subsumed by `round-trip/zwift-round-trip.test.ts` (~6-8 it blocks deletable).

- [SEVERITY high] [CATEGORY redundant] `interval/text-event-extraction.test.ts:1-293` — Tests `mapSteadyStateToKrd`, `mapRampToKrd`, `mapFreeRideToKrd`, `mapIntervalsTToKrd` — all `*.mapper.ts` files (`steady-state.mapper.ts`, `ramp.mapper.ts`, `free-ride.mapper.ts`, `intervals-t.mapper.ts`), which per CLAUDE.md convention "need NO tests." The text-event extraction behavior is also covered end-to-end by the round-trip "preserve text events" tests and by `krd-to-zwift/text-events-encoder.test.ts` (encode side). — Tests on mapper files against convention; behavior covered by round-trip. — Delete or justify; if the extraction logic is non-trivial enough to test, move it out of `*.mapper.ts` (the file naming claims "no logic"). ~10 it blocks.

- [SEVERITY med] [CATEGORY redundant] `fast-xml-parser.test.ts` writer `interval encoding` + `text event encoding` (lines 684-1364) vs `krd-to-zwift/intervals-t-encoder.test.ts` + `krd-to-zwift/text-events-encoder.test.ts` — The writer integration tests assert `Repeat="5"`, `OnPower="1.2"`, `message="..."`, `timeoffset="0"` etc. on emitted XML; the dedicated encoder unit tests assert the same attribute production on the same logic. Heavy overlap (single/multiple/distance text events; IntervalsT power/cadence/distance). — Integration string-contains tests largely duplicate the encoder unit suites. — Keep the encoder unit suites (they're more precise); trim ~8-10 writer string-contains cases to one smoke test per feature.

- [SEVERITY med] [CATEGORY redundant] `xsd-validator.test.ts:68-196` `property: environment detection reflects current state` — Five+ tests (`empty object`, `object with properties`, `with navigator`, `minimal window-like`, plus "consistently detect across 5 reloads" looping 5×) all assert the SAME outcome (`result.valid === true`) for the SAME valid XML; they only vary the shape of a truthy `global.window`. No branch distinguishes `{}` from `{document:{}}` — the code only checks `typeof window !== "undefined"`. — Same equivalence class tested ~8 times. — Collapse to two tests (window defined → browser validator; window undefined → XSD validator). ~6 it blocks deletable; the 30s-timeout reload-loop test is also a CI cost with no extra discrimination.

- [SEVERITY med] [CATEGORY redundant] `well-formedness-validator.test.ts` vs `xsd-validator.test.ts` (createXsdZwiftValidator) — Both assert identical valid/invalid/empty/non-XML cases with the same fixtures (well-formed bike workout, malformed, unclosed tags, empty string). In Node, `createXsdZwiftValidator` and the well-formedness validator overlap on every malformed-input case. — Copy-pasted validator suites. — Share fixtures + a helper that runs both validators over a common table; drop ~4 duplicated invalid-XML cases.

- [SEVERITY low] [CATEGORY redundant] `duration/duration.converter.test.ts` — `convertZwiftDuration` (dispatcher) is tested for time/distance/zero/negative, and `convertZwiftTimeDuration`/`convertZwiftDistanceDuration` (its two helpers) are tested for the identical zero/negative/decimal classes separately. Same for `convertKrdDurationToZwift` vs the two `convertKrd*DurationToZwift` helpers. — Dispatcher + helpers test the same equivalence classes. — Keep dispatcher tests; trim ~6 helper duplicates.

**zwo verdict:** redundancy **D+**, completeness **A−** (encoders and detectors are thoroughly and precisely covered), naming **B+**. Approx deletable: **~60–70 it blocks** (barrel `target.converter.test.ts` ~35, round-trip consolidation ~8, mapper tests ~10, env-detection ~6, validator/duration overlap ~10).

---

## packages/garmin

- [SEVERITY low] [CATEGORY redundant] `converters/garmin-to-krd.converter.test.ts` + `converters/krd-to-garmin.converter.test.ts` vs `round-trip/round-trip.test.ts` — The two directional suites assert per-field GCN→KRD and KRD→GCN mappings on the same five fixtures, and the round-trip suite then re-loads the same fixtures to assert preservation. There is real extra discrimination here (directional suites pin exact target shapes; round-trip pins tolerance-bounded equality), so this is acceptable, not a defect — flagging only that the swimming/strength/edge round-trip cases (`round-trip.test.ts:61-107`) mostly re-assert `steps.length` already covered directionally. — Mild step-count overlap. — Optional: drop the 2-3 round-trip cases that only check `steps.length`.

- [SEVERITY low] [CATEGORY name] `converters/executable-step.converter.test.ts` & `mappers/target.converter.test.ts` — These test `mapExecutableStep` and `mapKrdTargetToGarmin`/`mapGarminTargetToKrd`. Both functions carry the `map*` prefix (convention reserves "no-logic, no-tests" for `*.mapper.ts` _files_), but they live in `*.converter.ts` files and contain genuine branching (duration/intensity/target/secondary-target/stroke/equipment/notes; pace-zone resolution; range normalization). Correctly tested — flagging only the naming tension that a `map*` function in a `.converter.ts` blurs the mapper/converter line. — Naming inconsistency, not a redundancy. — No action required; optionally rename functions to `convert*`.

**garmin verdict:** redundancy **A−**, completeness **A** (every branch of `mapExecutableStep`, pace-zone edge cases, `isSessionTransitionEnabled` propagation, nested-repeat flattening all covered; error paths for invalid JSON / non-object / missing extension present), naming **A−**. Approx deletable: **~2-3 it blocks** (round-trip step-count-only cases). This is the model package.

---

## packages/garmin-connect

- [SEVERITY high] [CATEGORY redundant] `http/garmin-http-client.test.ts:35-50, 113-204` vs `http/garmin-auth-fetch.test.ts` — `garmin-http-client.ts` is a thin wrapper: `const fetch = (url, init) => authFetch(url, init, tokenReader, fetchFn)` (`garmin-http-client.ts:14-15`); all auth/retry logic lives in `authFetch`. The http-client tests `should throw when not authenticated`, `should refresh when token is expired`, `should retry on 401 with refreshed token`, `should throw when retry after 401 refresh also fails`, `should throw on non-ok responses` re-verify behaviors already owned by `garmin-auth-fetch.test.ts` (`should refresh before request when not authenticated`, `should refresh and retry on 401`, `should throw after retry fails`, `should throw on non-401 error responses`, `should throw when not authenticated`). — Wrapper re-tests the delegate's logic. — Keep in http-client only the wrapper-specific concerns: Bearer-header injection, POST JSON body, DELETE method-override, null-body→undefined (~4 it blocks). Delete the ~5 auth/retry it blocks; they belong to `authFetch`.

- [SEVERITY low] [CATEGORY redundant] `client/garmin-workout-service.test.ts:175-185` `should pull a workout` — Asserts `krd.type === "structured_workout"` from a mocked GCN payload; the actual GCN→KRD conversion correctness is owned by `@kaiord/garmin`'s `garmin-to-krd.converter.test.ts`. Here it only proves the service calls `get(WORKOUT_URL/workout/42)` and returns _a_ KRD. The URL+delegation assertion is the value; the conversion re-check is incidental. — Minor: re-touches conversion already covered upstream. — Acceptable as a wiring test; no change needed (flagged for completeness).

- [SEVERITY low] [CATEGORY gap] `http/garmin-sso.test.ts` — Covers the happy 5-step flow + CSRF-missing + ticket-missing + account-locked, but there's no test for the `Update Phone Number` page-title rejection at the SSO-flow level (only at the `sso-validators.test.ts` unit level) and no test for OAuth1/OAuth2 sub-step failure surfacing through `garminSso`. Low risk since sub-functions are unit-tested. — Minor branch-at-integration gap. — Optionally add one `garminSso` case asserting a sub-step error propagates.

- [SEVERITY low] [CATEGORY name] `http/garmin-http-client.test.ts:131` `should refresh when token is expired` — The test sets `isAuthenticated: () => false` and `getAccessToken: () => "refreshed-bearer"`, then asserts `reader.refresh` was called — but this exercises `authFetch`'s pre-request refresh, not http-client logic. Title attributes delegate behavior to the wrapper. — Title describes behavior owned by another unit. — Fold into auth-fetch (see high finding).

**garmin-connect verdict:** redundancy **B**, completeness **A** (token-manager concurrency/subscriber/stale-guard/PII-no-log coverage at `token-manager.test.ts:193-444` is exemplary; retry jitter formula, refresh-fn consumer cache invalidation all covered), naming **A−**. Approx deletable: **~5-6 it blocks** (http-client auth/retry duplicates). Strongest package alongside garmin.

---

## packages/ai

- [SEVERITY med] [CATEGORY redundant] `adapters/text-to-workout.test.ts:123-157` vs `adapters/execute-with-retry.test.ts` — `createTextToWorkout` delegates retry/correction to `executeWithRetry`. `text-to-workout.test.ts` re-tests `should retry on first failure and succeeds on second attempt`, `should include error feedback in retry prompt`, `should throw AiParsingError after max retries exhausted`, `should handle non-Error thrown values` — all retry/correction behaviors already pinned precisely in `execute-with-retry.test.ts` (`should retry retryable APICallError`, `should retry on schema validation failure with prompt-correction injection`, `should retry plain non-APICallError then throw AiParsingError`). — Retry behavior tested at both the orchestrator and the delegate. — In `text-to-workout.test.ts` keep only orchestration-specific cases (input validation short-circuit, sport-hint, name override, reindex, output-null, logging); drop the ~3 retry/correction duplicates that `execute-with-retry` owns.

- [SEVERITY low] [CATEGORY redundant] `adapters/text-to-workout.test.ts:184-216` `should reindex non-sequential stepIndex values` vs `adapters/reindex-steps.test.ts` — `reindexSteps` correctness is fully owned by `reindex-steps.test.ts` (top-level, nested, empty, skip-blocks, no-mutate). The text-to-workout case re-proves reindexing end-to-end. — Re-tests a unit already exhaustively covered. — Keep as a thin "pipeline applies reindex" smoke (1 assertion) or drop; ~1 it block.

- [SEVERITY low] [CATEGORY gap] `adapters/execute-with-retry.test.ts` — Good coverage of retryable/non-retryable `APICallError` and schema-correction, but no test asserts the `maxOutputTokens`/`temperature`/`abortSignal` args are threaded into `generateText` (that's only checked in `text-to-workout.test.ts:292`). Minor. — Optional config-threading test at the `executeWithRetry` level.

- [SEVERITY low] [CATEGORY name] `evals/assertions.test.ts:204` `zone checks` describe — Titles like `should fail when target min is below expected minValue with 5% tolerance` encode the literal tolerance constant in the name; if the tolerance changes the title silently lies. Minor. — Prefer `should fail when target min is below expected within tolerance`. (1-2 occurrences.)

**ai verdict:** redundancy **B+**, completeness **A** (validate-input boundary cases, error fields, eval assertions incl. repeat-block step counting and zone tolerance, reporter grouping all covered; non-Error throw path and null-output path present), naming **A−**. Approx deletable: **~4 it blocks** (retry + reindex duplicates).

---

## Top 3 actions overall

1. **Delete barrel-duplicate test suites.** `tcx/duration/duration.converter.test.ts` (808 lines), `tcx/target/target.converter.test.ts` (549 lines), and `zwo/target/target.converter.test.ts` (483 lines) test functions re-exported verbatim from already-tested source modules. Removing them eliminates ~120 redundant `it()` blocks with zero coverage loss (the barrels are import-only and proven live by round-trips).

2. **Resolve the tcx dual/dead converter pipelines.** Decide whether the KRD→TCX target encoder is `target-to-tcx.converter.ts` (LIVE, wired in `step-to-tcx.converter.ts`) or `target/krd-to-tcx.converter.ts` + helpers (orphaned), and likewise for the TCX→KRD duration/target walkers vs the `tcx-to-krd`/`standard`/`extended` chain. Delete the dead path and its ~65 tests, then add a round-trip assertion for the live path's running-cadence doubling (currently only the dead path asserts it — a real correctness gap).

3. **Stop re-testing delegated logic in thin wrappers.** Move the auth/retry assertions out of `garmin-connect/http/garmin-http-client.test.ts` into `garmin-auth-fetch.test.ts`, and trim `ai/text-to-workout.test.ts` retry/reindex cases that `execute-with-retry.test.ts`/`reindex-steps.test.ts` already own. Then consolidate the three zwo round-trip files and collapse the zwo env-detection window-shape tests into two cases.

## Approx deletable test count per package

- **tcx:** ~45 (barrel duplicates, floor) to ~130 (incl. dead-pipeline removal)
- **zwo:** ~60–70
- **garmin:** ~2–3
- **garmin-connect:** ~5–6
- **ai:** ~4

## Relevant files (absolute paths)

- `/Users/pablo/development/kaiord/packages/tcx/src/adapters/duration/duration.converter.ts` (barrel — backs deletable `duration.converter.test.ts`)
- `/Users/pablo/development/kaiord/packages/tcx/src/adapters/target/target.converter.ts` (barrel — backs deletable `target.converter.test.ts`)
- `/Users/pablo/development/kaiord/packages/tcx/src/adapters/workout/target-to-tcx.converter.ts` (LIVE encoder) vs `/Users/pablo/development/kaiord/packages/tcx/src/adapters/target/krd-to-tcx.converter.ts` (orphan, with `pace.converter.ts`/`cadence.converter.ts`/`heart-rate.converter.ts`)
- `/Users/pablo/development/kaiord/packages/tcx/src/adapters/workout/step.converter.ts` (wires `duration-walker.converter.ts` — proves which duration pipeline is live)
- `/Users/pablo/development/kaiord/packages/zwo/src/adapters/target/target.converter.ts` (barrel — backs deletable `target.converter.test.ts`)
- `/Users/pablo/development/kaiord/packages/zwo/src/adapters/interval/steady-state.mapper.ts`, `ramp.mapper.ts`, `free-ride.mapper.ts`, `intervals-t.mapper.ts` (mapper files tested against convention by `text-event-extraction.test.ts`)
- `/Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/http/garmin-http-client.ts` (thin wrapper over `garmin-auth-fetch.ts` — backs deletable auth/retry duplicates)
