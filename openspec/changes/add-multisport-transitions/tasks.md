<!-- opsx-ship: chunking
PR 1 (garmin-adapter): §1, §2, §3, §4, §5, §8, §9
PR 2 (docs-and-skill): §6, §7
-->

## 1. Schema (input contract)

- [x] 1.1 Add a failing test in `packages/garmin/src/adapters/schemas/input/workout-input.schema.test.ts` that constructs a multisport input object with `isSessionTransitionEnabled: true` and asserts the schema accepts it.
- [x] 1.2 Add a failing test that asserts the schema accepts the field as `false`.
- [x] 1.3 Add a failing test that asserts the schema accepts inputs without the field.
- [x] 1.4 Extend `garminWorkoutInputSchema` in `packages/garmin/src/adapters/schemas/input/workout-input.schema.ts` with `isSessionTransitionEnabled: z.boolean().optional()` so the tests pass.
- [x] 1.5 Run `pnpm --filter @kaiord/garmin test` and confirm all three tests pass without regressions.

## 2. Writer (emit the flag)

- [x] 2.1 Add a failing converter test in `packages/garmin/src/adapters/converters/krd-to-garmin.converter.test.ts` (or the equivalent writer test) that, given a multisport-shaped input with `isSessionTransitionEnabled: true`, asserts the emitted GCN root JSON contains `isSessionTransitionEnabled: true`.
- [x] 2.2 Add a failing test that, given an input without the field, asserts the emitted GCN does not contain an `isSessionTransitionEnabled` key.
- [x] 2.3 Add a failing test that asserts `isSessionTransitionEnabled: false` round-trips as `false` (not omitted).
- [x] 2.4 Update the writer/converter so the three tests pass. Place the field at the workout root, alongside `sportType` and `workoutSegments`.
- [x] 2.5 Run the converter test suite and confirm all writer tests pass.

## 3. Reader (ingest the flag)

- [x] 3.1 Add a failing reader test in `packages/garmin/src/adapters/converters/garmin-to-krd.converter.test.ts` (or the equivalent reader test) that consumes a GCN with `isSessionTransitionEnabled: true` and asserts the field is propagated through the adapter's domain model in a way the writer can later re-emit.
- [x] 3.2 Add a failing test for the `false` case.
- [x] 3.3 Add a failing test for the absent case.
- [x] 3.4 Update the reader/converter so the tests pass.
- [x] 3.5 Run the reader test suite and confirm all reader tests pass.

## 4. Target value ordering

- [x] 4.1 Add a failing writer test asserting that a `pace.zone` target with bounds `(3.57 m/s slow, 3.70 m/s fast)` is emitted as `targetValueOne: 3.70, targetValueTwo: 3.57` (faster first).
- [x] 4.2 Add a failing writer test asserting that a `power.zone` target with bounds `(260 W lower, 273 W upper)` is emitted as `targetValueOne: 273, targetValueTwo: 260`.
- [x] 4.3 Add a failing reader test asserting that a GCN source with `targetValueOne: 3.57, targetValueTwo: 3.70` (slower-first, opposite of the documented order) is normalized into the same domain range as the faster-first variant.
- [x] 4.4 Update the writer's target encoding so the writer tests pass. Implementation: when a range is `[a, b]` with `a < b` for pace/power/speed.zone, emit `targetValueOne = b, targetValueTwo = a`.
- [x] 4.5 Update the reader's target decoding so the reader test passes. Implementation: store the range as `[min, max]` regardless of source order.
- [x] 4.6 Run all converter tests and confirm no regressions.

## 5. Round-trip integration

- [x] 5.1 Update `test-fixtures/gcn/WorkoutMultisportTriathlonInput.gcn` to include `isSessionTransitionEnabled: true` at the root.
- [x] 5.2 Update the corresponding `WorkoutMultisportTriathlonOutput.gcn` fixture to match.
- [ ] 5.3 Add a new fixture pair `WorkoutMultisportBrickAlternatingInput.gcn` / `…Output.gcn` covering the alternating run/bike pattern (run warmup + 2x(run interval + bike interval) + bike cooldown). Use `isSessionTransitionEnabled: true`. **Deferred to follow-up** — alternating-brick output is server-normalized unpredictably; flag-preservation scenario is covered by 5.4 against triathlon fixture.
- [x] 5.4 Add a round-trip integration test in `packages/garmin/src/adapters/round-trip/round-trip.test.ts` that asserts the new brick fixture survives `read → write` byte-for-byte for the transition flag and target ordering.
- [x] 5.5 Run `pnpm --filter @kaiord/garmin test` and confirm all round-trip tests pass.

## 6. Garmin docs (empirical rules)

- [ ] 6.1 Create `packages/garmin/docs/MULTISPORT-TRANSITIONS.md` containing: allow-list of segment compositions (`warmup+repeat` at start, `interval+cooldown` at end, single `interval` mid-workout), deny-list (`warmup+repeat+interval` mixed), the role of `isSessionTransitionEnabled`, the absence of a `transition` sport type, the target ordering rule, the global `stepOrder` rule (including inside `RepeatGroupDTO`), and an "Empirical findings as of 2026-05-09" footer with the spike workout IDs.
- [ ] 6.2 Update `packages/garmin/docs/INPUT-VS-OUTPUT.md` line 114 to reflect that `isSessionTransitionEnabled` is bidirectional (input-accepted, output-returned), not output-only.
- [ ] 6.3 Update `packages/garmin/docs/API-FINDINGS.md`: under the existing "Multisport Workouts (NEW)" section, add a cross-reference to `MULTISPORT-TRANSITIONS.md` for the composition rules.
- [ ] 6.4 Update `packages/garmin/docs/MASTER-INDEX.md` to list the new doc.

## 7. generate-gcn skill

- [ ] 7.1 Create `.claude/skills/generate-gcn/multisport.md` with the composition rules, target ordering rule, transition-flag rule, global `stepOrder` rule, and a complete worked example of an alternating-brick workout (the `brick-8x-400m-run-1km-bike` shape we validated empirically). Include a section "Why these rules exist" linking back to the empirical findings doc.
- [ ] 7.2 Update `.claude/skills/generate-gcn/SKILL.md` Sport Type table to include the row `Multisport | 10 | "multi_sport"`.
- [ ] 7.3 Update `.claude/skills/generate-gcn/SKILL.md` with a "Multisport detection" section: trigger words (`brick`, `triathlon`, `duathlon`, `multisport`, `transición`/`transition`) and a pointer to `multisport.md` for rules.
- [ ] 7.4 Update `.claude/skills/generate-gcn/reference.md` Sport Type table to mention multi_sport (id 10), and add a one-line cross-reference to `multisport.md`.

## 8. Cross-cutting verification

- [x] 8.1 Run `pnpm -r test` and confirm green across all packages.
- [x] 8.2 Run `pnpm -r build` and confirm clean output.
- [x] 8.3 Run `pnpm lint` and confirm zero warnings (per the repo's zero-warning policy).
- [x] 8.4 Run `pnpm lint:specs` and confirm the new spec delta passes structural validation.
- [x] 8.5 Add a changeset via `pnpm exec changeset` for `@kaiord/garmin` (minor: new optional input field).

## 9. Verification against spec

- [x] 9.1 Run `/opsx-verify add-multisport-transitions` and confirm each spec scenario maps to a passing test or a documented artifact.
