## 1. Core: activity-factor module

- [x] 1.1 Add `packages/core/src/application/energy/activity-factor.ts` with
      `ActivityLevel`, `NEAT_FACTOR`, `DEFAULT_NEAT_FACTOR`, and
      `neatFactorForActivityLevel`. Document the NEAT-vs-TDEE rationale.
- [x] 1.2 Add `activity-factor.test.ts` (each level → its factor; unset/null →
      default).

## 2. Core: expenditure scaling

- [x] 2.1 Add optional `basalActivityFactor` to `DayExpenditureInput`.
- [x] 2.2 Scale the predicted basal by the factor (default 1); guard the factor
      as finite and `> 0` (`RangeError`). Leave the measured path unchanged.
- [x] 2.3 Update `expenditure.test.ts`: factor scales the basal; absent factor
      keeps `bmr × 1`; invalid factor throws; measured path unaffected.

## 3. Core: exports

- [x] 3.1 Export the activity-factor symbols from `packages/core/src/index.ts`.

## 4. SPA wiring

- [x] 4.1 `resolve-day-expenditure-inputs.ts`: pass
      `basalActivityFactor: neatFactorForActivityLevel(profile.activityLevel)` on
      the predicted branch.
- [x] 4.2 `resolve-goal-maintenance.ts`: scale the modeled maintenance by the
      activity factor.
- [x] 4.3 Recompute any affected SPA test expectations (none required — all
      affected assertions are relative or measured-path).

## 5. Verify

- [x] 5.1 `pnpm --filter @kaiord/core run build`.
- [x] 5.2 Core energy tests green.
- [x] 5.3 `pnpm --filter @kaiord/workout-spa-editor run build` + affected SPA
      tests green.
- [x] 5.4 `pnpm lint:specs`, `pnpm test:scripts`, and
      `npx openspec validate energy-expenditure-activity-factor --strict` green.
