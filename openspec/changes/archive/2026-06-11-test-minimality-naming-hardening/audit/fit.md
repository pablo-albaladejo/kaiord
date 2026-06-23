Confirmed: `daily-round-trip.test.ts` and `stress-round-trip.test.ts` are misnamed — they contain only FIT→KRD one-way assertions, no round trip. I now have everything I need to write the audit.

---

# FIT Test-Suite Subtle Audit (`packages/fit`)

## Findings

### CATEGORY: redundant

- [SEVERITY high] [redundant] `target/target.converter.test.ts:8-1027` — The dispatcher test re-tests every leaf converter's value logic. `convertFitTarget` is a 5-branch dispatcher (`target.converter.ts:13-35`) that delegates to `convertPowerTarget`/`convertHeartRateTarget`/`convertCadenceTarget`/`convertPaceTarget`/`convertStrokeTypeTarget`, each already exhaustively tested in its own `target-*.converter.test.ts`. Yet `target.converter.test.ts` has ~60 `it()`s asserting watts-offset decoding, zone values, range custom-vs-generic priority, percent_max, stroke values 0-5, etc. — all duplicating the leaf tests. — why: the dispatcher only needs to prove "type X routes to converter X" (one assertion per branch); the encoding correctness belongs to the leaf. — fix: reduce `target.converter.test.ts` to 6 routing assertions (mirror the well-built `krd-to-fit-target.converter.test.ts` pattern, which is exactly that) and delete the per-value duplicates. ~50 deletable `it()`s.

- [SEVERITY high] [redundant] `duration/duration.converter.test.ts` (FIT→KRD) — three-layer duplication for the decode path. The leaf converters (`duration-converters.ts`, `repeat-duration-converters.ts`) each have a single trivial `if (field !== undefined)` guard, but the dispatcher test exhaustively re-tests every one of 13 types plus "without value as open" for each (≈60 `it()`s). The "validation" describe (`:227-326`) re-tests `safeParse` rejection (Zod) for invalid/null/numeric durationType — re-testing the library, not our wiring. — why: most branches are the same equivalence class (`field present → mapped`, `field absent → open`); one representative each plus the dispatcher table suffices. — fix: collapse the per-type "convert X" + "X without value as open" pairs into two `it.each` tables (one for value-present, one for value-absent); drop the Zod-rejection trio. ~30 deletable.

- [SEVERITY high] [redundant] `duration/duration.converter.test.ts:746-866` ("boundary value edge cases") — negative time, negative distance, 86400, 100000, MAX_SAFE_INTEGER, Infinity, NaN are all the **same equivalence class** as the basic "convert time/distance" tests: the converter does `if (durationTime !== undefined) return { seconds: durationTime }` with zero arithmetic or clamping (`duration-converters.ts:5-13`). Every one of these 7 just asserts the input echoes through unchanged. — why: no branch exists between these values; they prove nothing the basic test doesn't. — fix: delete all 7 (or keep one `it.each` documenting "passes values through unmodified"). ~6 deletable.

- [SEVERITY high] [redundant] `krd-to-fit/krd-to-fit.converter.test.ts:1158-2044` ("advanced duration types" describes) — ≈30 `it()`s encode calories/power/repeat-conditional durations through the **top-level** `convertKRDToMessages`, asserting the exact same `message.durationType`/`durationCalories`/`durationPower`/`durationStep` fields already verified at the unit level in `duration-converters/{simple,conditional,repeat,repeat-hr-power}.test.ts` AND at the `convertDuration` dispatcher level (`krd-to-fit-duration.converter.test.ts`). The "dynamic field mapping" describe (`:1696-1841`) is a fourth copy. — why: once the leaf + dispatcher are unit-tested, the top-level converter only needs to prove it _calls_ duration conversion once, not re-prove every duration shape. — fix: keep 1-2 representative duration steps in the top-level test; delete the calorie/power/repeat exhaustive re-encodes. ~20 deletable.

- [SEVERITY high] [redundant/name] `round-trip/round-trip-duration.test.ts` (entire file, ~9 `it()`s) — Despite the name, this is **not a round-trip**: every test does `reader(fixture) → mutate KRD → convertKRDToMessages → assert message.duration* fields`. It never re-decodes FIT→KRD. It is a third/fourth copy of the KRD→FIT duration encoding already covered by the leaf converter tests and the `krd-to-fit.converter.test.ts` advanced-duration sections. The `±1W tolerance` tests (`:194,:377`) loop over watt values feeding the same `value.watts` passthrough — same equivalence class. — why: zero discrimination over the unit tests; the "round-trip" label is false (no decode leg). — fix: delete the file, or rename to `krd-to-fit-duration-encoding.test.ts` and keep only cases not covered by the unit layer (currently none). ~9 deletable.

- [SEVERITY med] [redundant] `garmin-fitsdk.test.ts:180-226,259-277,313-362` — mock-assertion-only logging tests. `should log debug message when parsing starts`, `should log info message when parsing succeeds`, `should log error message when parsing fails`, `should log info when preserving developer fields`, plus writer `should log debug message when encoding starts` / `when converting KRD to messages` / `should inject logger correctly` assert only `expect(spy).toHaveBeenCalledWith(...)` with no observable outcome. The `should log error message when parsing fails` only asserts `errorSpy` was called at all. — why: these pin log _strings_ (brittle, no behavior); `inject logger correctly` just asserts `debugSpy` was called — a tautology given the other log tests. — fix: delete the 4 reader log tests + 3 writer log tests, or consolidate to one "emits structured logs" smoke test. ~6 deletable.

- [SEVERITY med] [redundant] `krd-to-fit/krd-to-fit.converter.test.ts:2046-2085` ("logging" describe) — same mock-only pattern: `should log debug message when conversion starts` / `with message count` assert `debugSpy.toHaveBeenCalledWith("Converting KRD to FIT messages")`. No behavior. — fix: delete both. 2 deletable.

- [SEVERITY med] [redundant] `krd-to-fit/krd-to-fit-metadata.converter.test.ts:133-185` — `should handle empty string serialNumber` and `should handle undefined serialNumber` are the same equivalence class as `should not assign serialNumber when parsing results in NaN`: all three reach the same `Number.isNaN`/falsy guard and assert `result.serialNumber` is undefined. Three inputs, one branch. — why: `parseInt("")` and `undefined` both land in the identical "not assigned" path already covered. — fix: merge into one `it.each(["not-a-number", "", undefined])`. 2 deletable.

- [SEVERITY med] [redundant] Power-target value pairs — `target-power.converter.test.ts` AND `target.converter.test.ts` both test "zone 1 lower boundary" + "zone 7 upper boundary" + a mid zone. The branch is a single range check `zone >= 1 && zone <= 7` (`target-power.converter.ts:69`); zone 1, 7, and 4 are one equivalence class once the boundary check exists. Similarly HR `target.converter.test.ts` tests "zone 1" and "zone 5" plus a mid-zone (no per-zone branch). — why: no per-value branch between in-range zones. — fix: keep boundary pair, drop redundant mid-zone duplicates across both files. ~4 deletable.

- [SEVERITY low] [redundant] `target/*.converter.test.ts` "range using specific fields" vs "range using generic custom fields" vs "range priority" — pattern repeated identically across `target-power`, `target-cadence`, `target-pace`, `target-heart-rate` (4 files). Each pair is a near-identical block differing only in field name (`customTargetPowerLow` vs `customTargetCadenceLow`). These are legitimate (real priority branch exists) but should be `it.each`-parameterized within each file. — fix: convert the 3 range blocks per file to `it.each`. Cosmetic; not deletable.

### CATEGORY: name

- [SEVERITY high] [name] `garmin-fitsdk.test.ts:298` — `should throw FitParsingError when conversion not implemented` is **stale/false**. `convertKRDToMessages` _is_ implemented and called (`garmin-fitsdk.ts:55`); the throw actually comes from the encoder rejecting the produced messages, not "not implemented." Same misleading premise taints `:364 should handle valid KRD structure` and `:382 should propagate FitParsingError without wrapping` (all three just assert `rejects.toThrow(FitParsingError)` on a minimal KRD). — why: the title describes a non-existent code state; a future reader will think the writer is a stub. — fix: rename to reflect the real behavior (e.g. "should reject when the encoder cannot serialize the produced messages") and dedupe the three near-identical reject assertions.

- [SEVERITY high] [name] `health/daily/daily-round-trip.test.ts` and `health/stress/stress-round-trip.test.ts` — filenames and intent say "round-trip" but both contain **only FIT→KRD one-way** assertions (`should produce a valid daily_wellness KRD` / `should aggregate steps`; `should produce a valid stress_episode KRD` / `should report peak ≥ average`). No KRD→FIT→KRD leg exists (contrast `weight-round-trip.test.ts:50` and `body-composition-round-trip.test.ts`, which are genuine round-trips). — why: misleading file name; a reader expecting round-trip coverage gets none. — fix: rename to `daily-fit-to-krd.test.ts` / `stress-fit-to-krd.test.ts`, or add the missing return leg.

- [SEVERITY med] [name] `krd-to-fit/krd-to-fit-target.converter.test.ts:35,51,82,97` — titles `should dispatch power → convertPowerTarget`, `… → convertHeartRateTarget`, `… → convertPaceTarget`, `… → convertStrokeTarget` name the **internal function** rather than the behavior. (The file header even calls them "characterization tests… pin the dispatch table.") — why: the spec convention prefers domain behavior over implementation symbol names. — fix: rephrase to behavior, e.g. "should encode a power target as FIT targetType power". (The test bodies are good — this is the _right_ dispatcher pattern; only the titles leak internals.)

- [SEVERITY low] [name] `messages-mapper.dispatch.test.ts:42,65,85,103` — `should route sleepLevelMesgs to a sleep_record KRD…` names the SDK field key (`sleepLevelMesgs`) rather than the domain concept; acceptable but borderline. Low priority.

- [SEVERITY low] [name] `garmin-fitsdk.test.ts:116,136` — `should handle WorkoutRepeatGreaterThanStep correctly` / `should handle WorkoutCustomTargetValues correctly` name the **fixture file** and assert only `Array.isArray(workout.steps) === true` — a vacuous assertion that doesn't verify the repeat-greater-than or custom-target semantics the fixture name implies. — fix: either assert the actual decoded structure or delete (no discrimination). 2 weak/deletable.

### CATEGORY: gap

- [SEVERITY med] [gap] `duration/duration-converters.ts:39-50` — `convertHeartRateGreaterThan` requires **both** `repeatHr` and `durationStep` (`repeatUntilHrGreaterThan` type). `duration.converter.test.ts:729,746` covers "without durationStep" and "without repeatHr" individually, but the FIT→KRD path for `convertPowerGreaterThan`/`convertPowerLessThan` "without value as open" is only spot-checked for one of the pair. Minor — the encode side (`repeat-hr-power.ts`) is well covered. Low-impact gap.

- [SEVERITY med] [gap] `krd-to-fit-target-power.converter.ts:17-20` — the range branch sets `message.targetValue = 0` alongside `customTargetPowerLow/High`. Only `krd-to-fit-target-power.converter.test.ts:31` asserts this; the dispatcher/round-trip layers never assert the `targetValue: 0` sentinel survives, and there's no FIT→KRD test proving a `targetValue: 0` + custom-low/high decodes back to a range (the decode side reads custom fields, ignoring targetValue). Worth one explicit round-trip assertion. — fix: add one power-range KRD→FIT→KRD assertion (currently the genuine round-trips skip power range).

- [SEVERITY low] [gap] `garmin-fitsdk.ts:32-35` — the reader throws when `decoder.read()` returns `errors.length > 0` (distinct from the empty-buffer and corrupted-buffer paths). Tests cover empty + corrupted (both hit the catch via thrown exceptions), but not the "decoder succeeds yet returns a non-empty `errors` array" branch. Narrow branch; low priority.

- [SEVERITY low] [gap] `messages.validator.ts` non-strict mode — `messages.validator.test.ts` covers warn-instead-of-throw for fileId and workout missing, but not the combination (both missing in non-strict) nor multiple-workout warning in non-strict. Minor.

### CATEGORY: convention (mappers)

- [SEVERITY low] [name] No `*.mapper.ts`-named files have dedicated test files (the grep for `.mapper"` imports in tests resolves to `messages.mapper.ts`, `sport.mapper.ts`, all of which are dispatch/non-trivial despite the `.mapper` suffix). The convention violation risk is **inverted** here: several files named `*.converter.ts` (e.g. `health-stress.converter.ts`, `health-body-composition.converter.ts`, `health-daily.converter.ts`, `health-weight.converter.ts`, `health-hrv.converter.ts`) export functions named `mapFit…ToKrd` / `mapKrd…ToFit` that are genuine value transformations (scaling ÷100/×100, sentinel dropping, aggregation) — correctly named converters with tests, so compliant. `sport.mapper.ts` carries real bidirectional-map invariant logic (`round-trip-sport.test.ts:143` tests the lossless inversion) — arguably should be `sport.converter.ts` since it has non-trivial logic and tests. Cosmetic.

---

## Verdict

| Dimension    | Grade                                                                                                                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Redundancy   | **D** — the FIT→KRD and KRD→FIT duration/target logic is tested at 3-4 layers (leaf → dispatcher → top-level converter → "round-trip"). The dispatcher tests for `target.converter` and `duration.converter` duplicate the leaf converters almost entirely. |
| Completeness | **B** — branch coverage is actually strong (often over-covered); only a few narrow gaps (power-range round-trip sentinel, decoder-error branch, non-strict combos). The problem is excess, not absence.                                                     |
| Naming       | **C+** — mostly excellent domain-behavior titles, but with several high-impact liars: the "not implemented" writer test, two fake "round-trip" files, dispatcher titles naming internal functions, and vacuous "handle X correctly" fixture-named tests.    |

### Top 3 actions

1. **Collapse the dispatcher-vs-leaf duplication.** Reduce `target/target.converter.test.ts` and `duration/duration.converter.test.ts` to routing/dispatch-table proofs (≈6 and ≈15 `it()`s respectively), deferring value correctness to the already-exhaustive leaf tests. Adopt the `krd-to-fit-target.converter.test.ts` pattern as the template.
2. **Delete the fake round-trip + re-encode duplicate file** `round-trip/round-trip-duration.test.ts` and the `krd-to-fit.converter.test.ts` "advanced duration types" sections; rename `daily-round-trip`/`stress-round-trip` to `*-fit-to-krd` (they have no return leg).
3. **Fix the misleading names and drop mock-only tests:** rename the "conversion not implemented" writer test to its real behavior, delete the ~8 log-spy-only tests across `garmin-fitsdk.test.ts` and `krd-to-fit.converter.test.ts`, and delete the two vacuous `Array.isArray` fixture tests.

### Approx deletable tests

**~125-135 `it()` blocks** safely removable without coverage loss: target dispatcher (~50), duration FIT→KRD dispatcher + boundary (~36), duration KRD→FIT top-level + fake round-trip (~29), log-spy/mock-only (~8), metadata NaN equivalence (~2), vacuous fixture (~2), zone-boundary dupes (~4).

### Files deep-read (full impl + test) — 27

`target.converter.{ts,test.ts}`, `target-power.converter.{ts,test.ts}`, `target-cadence.converter.ts`, `power-helpers.ts`, `krd-to-fit-target.converter.test.ts`, `krd-to-fit-target-power.converter.{ts,test.ts}`, `krd-to-fit-target-stroke.converter.test.ts`, `duration.converter.{ts,test.ts}`, `duration-converters.ts`, `repeat-duration-converters.ts`, `duration.mapper.ts`, `krd-to-fit-duration.converter.{ts,test.ts}`, `duration-converters/{simple,repeat,conditional,repeat-hr-power}.{ts}`, `simple.test.ts`, `garmin-fitsdk.{ts,test.ts}`, `krd-to-fit-metadata.converter.test.ts`, `krd-to-fit-manufacturer.converter.ts`, `krd-to-fit.converter.test.ts` (sampled key sections), `round-trip-duration.test.ts` (sampled), `krd-to-fit-record.converter.test.ts`, `krd-to-fit-session.converter.test.ts`, `messages.validator.test.ts`, `message-numbers.test.ts`, `round-trip-sport.test.ts`, health: `health-body-composition.converter.test.ts` + `body-composition-round-trip.test.ts`, `health-stress.converter.test.ts`, `weight-round-trip.test.ts`, `daily-round-trip.test.ts`, `stress-round-trip.test.ts`.

### Title-scanned only (~41 remaining test files)

All `fit-to-krd-*.converter.test.ts` (event/lap/session/record), `krd-to-fit-event/lap.converter.test.ts`, `target-{pace,heart-rate,stroke}.converter.test.ts`, `krd-to-fit-target-{cadence,pace,heart-rate}.converter.test.ts`, `krd-to-fit-step/workout.converter.test.ts`, `duration-converters/{repeat,conditional,repeat-hr-power}.test.ts`, `file-type-{detection,routing}.test.ts`, `messages-mapper.dispatch.test.ts`, `coordinate.converter.test.ts`, `fit-writer-integration.test.ts`, `round-trip-{subsport,swimming,notes}.test.ts`, and the remaining health `fit-to-krd-*`/`krd-*-to-fit`/`health-*.converter`/`*-round-trip` files (sleep/hrv/daily/weight/body-composition). Their titles were assessed against the inventory; the dispatcher/round-trip/leaf duplication pattern flagged above recurs in the title-scanned target and krd-to-fit-target leaf files but at lower per-file volume.

===NEXT-BLOCK===

Audit complete. I reviewed the `packages/fit` test suite (68 test files) — reading the full `it()` title inventory across the package, then deep-reading 27 test files with their corresponding implementations, and title-scanning the remaining ~41.

## Key findings

**The dominant problem is redundancy, not gaps.** The FIT↔KRD duration and target logic is tested at 3-4 layers (leaf converter → dispatcher → top-level converter → "round-trip"), each re-proving the same value transformations.

**High-severity items:**

- `target/target.converter.test.ts` (~50 deletable its) — dispatcher re-tests every leaf converter's value logic already covered in `target-*.converter.test.ts`. The well-built `krd-to-fit-target.converter.test.ts` shows the correct dispatch-only pattern.
- `duration/duration.converter.test.ts` — per-type exhaustive tests + boundary-value tests that are all one equivalence class (the converter does pure passthrough with a single `!== undefined` guard); plus Zod-rejection tests that re-test the library.
- `krd-to-fit.converter.test.ts` "advanced duration types" + `round-trip/round-trip-duration.test.ts` — a 3rd/4th copy of the same KRD→FIT encoding. The "round-trip" file is **misnamed**: it has no decode leg.

**Misleading names (high):**

- `garmin-fitsdk.test.ts:298` — "should throw FitParsingError when conversion not implemented" is false; `convertKRDToMessages` is implemented and called.
- `daily-round-trip.test.ts` / `stress-round-trip.test.ts` — named "round-trip" but contain only one-way FIT→KRD assertions (contrast the genuine `weight-round-trip.test.ts` / `body-composition-round-trip.test.ts`).

**Grades:** Redundancy **D**, Completeness **B**, Naming **C+**. Approx **125-135 deletable `it()` blocks** without coverage loss.

Full per-finding evidence, the top-3 actions, and the deep-read vs title-scanned file lists are in the structured report above. Relevant absolute paths for the highest-value cleanups:

- `/Users/pablo/development/kaiord/packages/fit/src/adapters/target/target.converter.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/duration/duration.converter.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/round-trip/round-trip-duration.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/krd-to-fit/krd-to-fit.converter.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/garmin-fitsdk.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/health/daily/daily-round-trip.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/health/stress/stress-round-trip.test.ts`

===NEXT-BLOCK===

The audit is complete and the full report has been delivered above.

Summary of what was produced:

**Scope covered:** Full `it()` title inventory across all 68 test files in `packages/fit`, with 27 test files deep-read alongside their implementations, and ~41 title-scanned.

**Headline conclusion:** The suite's problem is over-testing, not under-testing. Duration and target conversion logic is duplicated across 3-4 test layers (leaf → dispatcher → top-level converter → "round-trip").

**Grades:** Redundancy D, Completeness B, Naming C+. ~125-135 deletable `it()` blocks.

**Highest-value cleanup targets (absolute paths):**

- `/Users/pablo/development/kaiord/packages/fit/src/adapters/target/target.converter.test.ts` — collapse dispatcher to routing-only (~50 deletable)
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/duration/duration.converter.test.ts` — collapse equivalence-class boundary tests + drop Zod re-tests (~36)
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/round-trip/round-trip-duration.test.ts` — delete (fake round-trip, duplicate encoding, ~9)
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/krd-to-fit/krd-to-fit.converter.test.ts` — trim "advanced duration types" + log-spy tests (~22)
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/garmin-fitsdk.test.ts` — fix the false "not implemented" name, drop log-only/vacuous tests (~8)
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/health/daily/daily-round-trip.test.ts` and `/Users/pablo/development/kaiord/packages/fit/src/adapters/health/stress/stress-round-trip.test.ts` — rename (no return leg)

No further action is needed from me unless you want me to draft the concrete test edits for any of these files.

===NEXT-BLOCK===

# FIT Test-Suite Subtle Audit — `packages/fit`

## Findings

### CATEGORY: redundant

- [SEVERITY high] [redundant] `target/target.converter.test.ts:8-1027` — The dispatcher test re-tests every leaf converter's value logic. `convertFitTarget` is a 5-branch dispatcher (`target/target.converter.ts:13-35`) delegating to `convertPowerTarget`/`convertHeartRateTarget`/`convertCadenceTarget`/`convertPaceTarget`/`convertStrokeTypeTarget`, each already exhaustively tested in its own `target-*.converter.test.ts`. Yet this file has ~60 `it()`s asserting watts-offset decoding, zone values, range custom-vs-generic priority, percent_max, stroke values 0-5, etc. — all duplicating the leaf tests. — why: a dispatcher only needs to prove "type X routes to converter X" (one assert per branch); encoding correctness belongs to the leaf. — fix: reduce to ~6 routing assertions (mirror the well-built `krd-to-fit/krd-to-fit-target.converter.test.ts`, which is exactly that pattern) and delete the per-value duplicates. ~50 deletable.

- [SEVERITY high] [redundant] `duration/duration.converter.test.ts` (FIT→KRD) — three-layer duplication for the decode path. The leaf converters (`duration/duration-converters.ts`, `duration/repeat-duration-converters.ts`) each have a single trivial `if (field !== undefined)` guard, but the dispatcher test exhaustively re-tests all 13 types plus a "without value as open" variant for each (~60 `it()`s). The "validation" describe (`:227-326`) re-tests `safeParse` rejection (invalid/null/numeric durationType) — re-testing Zod, not our wiring. — why: most branches are the same equivalence class (`field present → mapped`, `field absent → open`); one representative each plus the dispatcher table suffices. — fix: collapse the per-type "convert X" + "X without value as open" pairs into two `it.each` tables; drop the Zod-rejection trio. ~30 deletable.

- [SEVERITY high] [redundant] `duration/duration.converter.test.ts:746-866` ("boundary value edge cases") — negative time, negative distance, 86400, 100000, MAX_SAFE_INTEGER, Infinity, NaN are all the **same equivalence class** as the basic "convert time/distance" tests: the converter does `if (durationTime !== undefined) return { seconds: durationTime }` with zero arithmetic or clamping (`duration/duration-converters.ts:5-13`). Each just asserts the input echoes through unchanged. — why: no branch exists between these values. — fix: delete all 7 (or keep one `it.each` "passes values through unmodified"). ~6 deletable.

- [SEVERITY high] [redundant] `krd-to-fit/krd-to-fit.converter.test.ts:1158-2044` ("advanced duration types" describes) — ~30 `it()`s encode calories/power/repeat-conditional durations through the **top-level** `convertKRDToMessages`, asserting the same `durationType`/`durationCalories`/`durationPower`/`durationStep` fields already verified at the unit level in `krd-to-fit/duration-converters/{simple,conditional,repeat,repeat-hr-power}.test.ts` AND at the `convertDuration` dispatcher level (`krd-to-fit/krd-to-fit-duration.converter.test.ts`). The "dynamic field mapping" describe (`:1696-1841`) is a fourth copy. — why: once leaf + dispatcher are unit-tested, the top-level converter only needs to prove it _calls_ duration conversion once. — fix: keep 1-2 representative duration steps; delete the exhaustive re-encodes. ~20 deletable.

- [SEVERITY high] [redundant/name] `round-trip/round-trip-duration.test.ts` (entire file, ~9 `it()`s) — Despite the name it is **not a round-trip**: every test does `reader(fixture) → mutate KRD → convertKRDToMessages → assert message.duration* fields`, never re-decoding FIT→KRD. It is a third/fourth copy of the KRD→FIT duration encoding already covered by the leaf tests and `krd-to-fit.converter.test.ts`. The `±1W tolerance` tests (`:194,:377`) loop over watt values feeding the same `value.watts` passthrough — same equivalence class. — fix: delete the file (or rename to `krd-to-fit-duration-encoding.test.ts` and keep only cases not covered by the unit layer — currently none). ~9 deletable.

- [SEVERITY med] [redundant] `garmin-fitsdk.test.ts:180-226,259-277,313-362` — mock-assertion-only logging tests: `should log debug message when parsing starts`, `…info message when parsing succeeds`, `…error message when parsing fails`, `…info when preserving developer fields`, plus writer `…debug message when encoding starts` / `…when converting KRD to messages` / `should inject logger correctly` assert only `expect(spy).toHaveBeenCalledWith(...)` with no observable outcome. `inject logger correctly` just asserts `debugSpy` was called — a tautology given the other log tests. — fix: delete the ~7, or consolidate to one "emits structured logs" smoke test. ~6 deletable.

- [SEVERITY med] [redundant] `krd-to-fit/krd-to-fit.converter.test.ts:2046-2085` ("logging" describe) — same mock-only pattern: asserts `debugSpy.toHaveBeenCalledWith("Converting KRD to FIT messages")` / message count. No behavior. — fix: delete both. 2 deletable.

- [SEVERITY med] [redundant] `krd-to-fit/krd-to-fit-metadata.converter.test.ts:133-185` — `should handle empty string serialNumber` and `should handle undefined serialNumber` are the same equivalence class as `should not assign serialNumber when parsing results in NaN`: all three hit the same NaN/falsy guard and assert `result.serialNumber` undefined. Three inputs, one branch. — fix: merge into one `it.each(["not-a-number", "", undefined])`. 2 deletable.

- [SEVERITY med] [redundant] Power/HR zone-boundary dupes — `target/target-power.converter.test.ts` AND `target/target.converter.test.ts` both test "zone 1 lower boundary" + "zone 7 upper boundary" + a mid zone; the branch is a single `zone >= 1 && zone <= 7` check (`target/target-power.converter.ts:69`), so zones 1/7/4 are one equivalence class once the boundary check exists. Same for HR zones 1/5/mid in `target.converter.test.ts`. — fix: keep boundary pair, drop the mid-zone duplicate across both files. ~4 deletable.

- [SEVERITY low] [redundant] `target/{target-power,target-cadence,target-pace,target-heart-rate}.converter.test.ts` — "range using specific fields" / "range using generic custom fields" / "range priority" blocks are near-identical across all 4 files, differing only in field name (`customTargetPowerLow` vs `customTargetCadenceLow`). Legitimate branch, but should be `it.each`-parameterized within each file. Cosmetic; not deletable.

### CATEGORY: name

- [SEVERITY high] [name] `garmin-fitsdk.test.ts:298` — `should throw FitParsingError when conversion not implemented` is **stale/false**. `convertKRDToMessages` IS implemented and called (`garmin-fitsdk.ts:55`); the throw comes from the encoder rejecting produced messages, not "not implemented." Same false premise taints `:364 should handle valid KRD structure` and `:382 should propagate FitParsingError without wrapping` (all three just assert `rejects.toThrow(FitParsingError)` on a minimal KRD). — why: the title describes a non-existent code state; a future reader will think the writer is a stub. — fix: rename to the real behavior ("should reject when the encoder cannot serialize the produced messages") and dedupe the three near-identical reject asserts.

- [SEVERITY high] [name] `health/daily/daily-round-trip.test.ts` and `health/stress/stress-round-trip.test.ts` — filenames say "round-trip" but both contain **only FIT→KRD one-way** assertions (`should produce a valid daily_wellness KRD` / `should aggregate steps`; `should produce a valid stress_episode KRD` / `should report peak ≥ average`). No KRD→FIT→KRD leg (contrast the genuine `health/weight/weight-round-trip.test.ts:50` and `health/body-composition/body-composition-round-trip.test.ts`). — fix: rename to `*-fit-to-krd.test.ts`, or add the missing return leg.

- [SEVERITY med] [name] `krd-to-fit/krd-to-fit-target.converter.test.ts:35,51,82,97` — titles `should dispatch power → convertPowerTarget`, `… → convertHeartRateTarget`, `… → convertPaceTarget`, `… → convertStrokeTarget` name the **internal function** rather than the behavior (the header even calls them "characterization tests… pin the dispatch table"). — why: convention prefers domain behavior over implementation symbol names. — fix: rephrase, e.g. "should encode a power target as FIT targetType power". (Bodies are good — this is the _right_ dispatcher pattern; only the titles leak internals.)

- [SEVERITY low] [name] `garmin-fitsdk.test.ts:116,136` — `should handle WorkoutRepeatGreaterThanStep correctly` / `should handle WorkoutCustomTargetValues correctly` name the **fixture file** and assert only `Array.isArray(workout.steps) === true` — a vacuous assertion that never verifies the repeat-greater-than or custom-target semantics the fixture implies. — fix: assert actual decoded structure or delete. 2 weak/deletable.

- [SEVERITY low] [name] `messages/messages-mapper.dispatch.test.ts:42,65,85,103` — `should route sleepLevelMesgs to a sleep_record KRD…` names the SDK field key rather than the domain concept. Borderline; low priority.

### CATEGORY: gap

- [SEVERITY med] [gap] `krd-to-fit/krd-to-fit-target-power.converter.ts:17-20` — the range branch sets `message.targetValue = 0` alongside `customTargetPowerLow/High`. Only `krd-to-fit-target-power.converter.test.ts:31` asserts this; the dispatcher/round-trip layers never verify the `targetValue: 0` sentinel survives, and no FIT→KRD test proves `targetValue: 0` + custom-low/high decodes back to a range. — fix: add one power-range KRD→FIT→KRD assertion (the genuine round-trips currently skip power range).

- [SEVERITY low] [gap] `garmin-fitsdk.ts:32-35` — the reader throws when `decoder.read()` returns `errors.length > 0` (distinct from empty-buffer and corrupted-buffer paths). Tests cover empty + corrupted but not "decoder succeeds yet returns a non-empty `errors` array." Narrow branch.

- [SEVERITY low] [gap] `messages/messages.validator.ts` non-strict mode — `messages.validator.test.ts` covers warn-instead-of-throw for fileId-missing and workout-missing individually, but not both-missing in non-strict, nor multiple-workout warning in non-strict. Minor.

- [SEVERITY low] [gap] `duration/duration-converters.ts:39-50` — `convertHeartRateGreaterThan` requires both `repeatHr` and `durationStep`; the "without value as open" variants are spot-checked for some power/HR pairs but not uniformly. Low impact (encode side `repeat-hr-power.ts` is well covered).

### CATEGORY: convention (mappers)

- [SEVERITY low] [name] No `*.mapper.ts`-named file has a dedicated test (compliant — mappers per convention need none). The inverse risk: several `*.converter.ts` files export `mapFit…ToKrd`/`mapKrd…ToFit` functions (`health/stress/health-stress.converter.ts`, `health/body-composition/health-body-composition.converter.ts`, `health/daily/health-daily.converter.ts`, `health/weight/health-weight.converter.ts`, `health/hrv/health-hrv.converter.ts`) — but these carry real value logic (÷100/×100 scaling, sentinel dropping, aggregation), so being `.converter.ts` with tests is correct. `sport/sport.mapper.ts` carries non-trivial bidirectional-map invariant logic tested in `round-trip-sport.test.ts:143` — arguably mis-suffixed (should be `.converter.ts`). Cosmetic.

---

## Verdict

| Dimension    | Grade  | Rationale                                                                                                                                                                                                                                          |
| ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Redundancy   | **D**  | Duration and target logic tested at 3-4 layers (leaf → dispatcher → top-level converter → "round-trip"). Dispatcher tests for `target.converter` and `duration.converter` duplicate the leaf converters almost entirely.                           |
| Completeness | **B**  | Branch coverage is strong (often over-covered); only narrow gaps (power-range round-trip sentinel, decoder-error branch, non-strict combos). The problem is excess, not absence.                                                                   |
| Naming       | **C+** | Mostly excellent domain-behavior titles, undermined by a few high-impact liars: the "not implemented" writer test, two fake "round-trip" files, dispatcher titles naming internal functions, and vacuous "handle X correctly" fixture-named tests. |

### Top 3 actions

1. **Collapse the dispatcher-vs-leaf duplication.** Reduce `target/target.converter.test.ts` and `duration/duration.converter.test.ts` to routing/dispatch-table proofs (~6 and ~15 `it()`s), deferring value correctness to the already-exhaustive leaf tests. Use `krd-to-fit/krd-to-fit-target.converter.test.ts` as the template.
2. **Delete the fake round-trip + re-encode duplicates.** Remove `round-trip/round-trip-duration.test.ts` and the `krd-to-fit.converter.test.ts` "advanced duration types" sections; rename `health/daily/daily-round-trip.test.ts` and `health/stress/stress-round-trip.test.ts` to `*-fit-to-krd.test.ts` (no return leg exists).
3. **Fix misleading names and drop mock-only tests.** Rename the "conversion not implemented" writer test to its real behavior; delete the ~8 log-spy-only tests across `garmin-fitsdk.test.ts` and `krd-to-fit.converter.test.ts`; delete the two vacuous `Array.isArray` fixture tests.

### Approx deletable tests

**~125-135 `it()` blocks** removable without coverage loss: target dispatcher (~50), duration FIT→KRD dispatcher + boundary (~36), duration KRD→FIT top-level + fake round-trip (~29), log/mock-only (~8), metadata-NaN equivalence (~2), vacuous fixture (~2), zone-boundary dupes (~4).

### Files deep-read (full impl + test) — 27

`target/target.converter.{ts,test.ts}`, `target/target-power.converter.{ts,test.ts}`, `target/target-cadence.converter.ts`, `target/power-helpers.ts`, `krd-to-fit/krd-to-fit-target.converter.test.ts`, `krd-to-fit/krd-to-fit-target-power.converter.{ts,test.ts}`, `krd-to-fit/krd-to-fit-target-stroke.converter.test.ts`, `duration/duration.converter.{ts,test.ts}`, `duration/duration-converters.ts`, `duration/repeat-duration-converters.ts`, `duration/duration.mapper.ts`, `krd-to-fit/krd-to-fit-duration.converter.{ts,test.ts}`, `krd-to-fit/duration-converters/{simple,repeat,conditional,repeat-hr-power}.ts`, `krd-to-fit/duration-converters/simple.test.ts`, `garmin-fitsdk.{ts,test.ts}`, `krd-to-fit/krd-to-fit-metadata.converter.test.ts`, `krd-to-fit/krd-to-fit-manufacturer.converter.ts`, `krd-to-fit/krd-to-fit.converter.test.ts` (key sections sampled), `round-trip/round-trip-duration.test.ts` (sampled), `record/krd-to-fit-record.converter.test.ts`, `session/krd-to-fit-session.converter.test.ts`, `messages/messages.validator.test.ts`, `shared/message-numbers.test.ts`, `round-trip/round-trip-sport.test.ts`, `health/body-composition/health-body-composition.converter.test.ts` + `health/body-composition/body-composition-round-trip.test.ts`, `health/stress/health-stress.converter.test.ts`, `health/weight/weight-round-trip.test.ts`, `health/daily/daily-round-trip.test.ts`, `health/stress/stress-round-trip.test.ts`.

### Title-scanned only (~41 remaining test files)

All `fit-to-krd-*.converter.test.ts` (event/lap/session/record), `krd-to-fit-{event,lap}.converter.test.ts`, `target/target-{pace,heart-rate,stroke}.converter.test.ts`, `krd-to-fit/krd-to-fit-target-{cadence,pace,heart-rate}.converter.test.ts`, `krd-to-fit/krd-to-fit-{step,workout}.converter.test.ts`, `krd-to-fit/duration-converters/{repeat,conditional,repeat-hr-power}.test.ts`, `messages/file-type-{detection,routing}.test.ts`, `messages/messages-mapper.dispatch.test.ts`, `shared/coordinate.converter.test.ts`, `fit-writer-integration.test.ts`, `round-trip/round-trip-{subsport,swimming,notes}.test.ts`, and the remaining health `fit-to-krd-*` / `krd-*-to-fit` / `health-*.converter` / `*-round-trip` files (sleep/hrv/daily/weight/body-composition). Their titles were assessed against the full inventory; the dispatcher/round-trip/leaf duplication pattern flagged above recurs in the title-scanned target and krd-to-fit-target leaf files at lower per-file volume.

### Highest-value cleanup paths (absolute)

- `/Users/pablo/development/kaiord/packages/fit/src/adapters/target/target.converter.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/duration/duration.converter.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/round-trip/round-trip-duration.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/krd-to-fit/krd-to-fit.converter.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/garmin-fitsdk.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/krd-to-fit/krd-to-fit-metadata.converter.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/health/daily/daily-round-trip.test.ts`
- `/Users/pablo/development/kaiord/packages/fit/src/adapters/health/stress/stress-round-trip.test.ts`
