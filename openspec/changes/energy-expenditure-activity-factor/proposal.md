## Why

`resolveDayExpenditure`'s predicted path is `BMR + expectedActivityKcal`. On a
no-workout day the predicted expenditure collapses to the raw BMR (e.g. 1750
kcal for an 80 kg / 180 cm / 36 yo male), which understates real daily
maintenance — even a fully sedentary person burns ~20% over BMR through
Non-Exercise Activity Thermogenesis (NEAT): posture, daily movement, digestion,
occupational activity. Profiles already capture `activityLevel`
(`sedentary`…`very_active`), but it is never applied, so the predicted
expenditure and the goal maintenance baseline are systematically too low.

This is GitHub issue #804.

## What Changes

Apply an activity-level NEAT factor to the predicted basal:

- **New core API** `@kaiord/core` `activity-factor`: `ActivityLevel`,
  `NEAT_FACTOR` (`sedentary` 1.2, `light` 1.3, `moderate` 1.4, `active` 1.5,
  `very_active` 1.6), `DEFAULT_NEAT_FACTOR` (1.2), and
  `neatFactorForActivityLevel(level?)`. These are NEAT-only multipliers,
  deliberately lower than classic TDEE multipliers: scheduled-workout energy is
  added separately via `expectedActivityKcal`, so a full TDEE multiplier would
  double-count the workout kcal.
- **`resolveDayExpenditure`** gains an optional `basalActivityFactor` on
  `DayExpenditureInput`. The predicted basal becomes `bmrKcal × factor`
  (defaulting the factor to 1); `expectedActivityKcal` is still added on top. The
  factor must be finite and `> 0` (`RangeError` otherwise). The measured path is
  unchanged — it never reads the factor.
- **SPA wiring**: `toExpenditureInput` passes
  `basalActivityFactor: neatFactorForActivityLevel(profile.activityLevel)` on the
  predicted branch; `resolveGoalMaintenance` scales its modeled maintenance by the
  same factor so the goal target is measured against a realistic baseline. An
  unset `activityLevel` resolves to the conservative default (1.2).

## Impact

- **Affected specs**: `energy-expenditure` (MODIFIED "Daily expenditure
  resolution" requirement — the predicted basal is now `BMR × activity-level NEAT
factor`, with scheduled-workout kcal still added separately and never
  double-counted).
- **Affected code**:
  - `packages/core/src/application/energy/activity-factor.ts` (new) and its test.
  - `packages/core/src/application/energy/expenditure.ts` (optional
    `basalActivityFactor`, predicted-basal scaling, factor guard) and its test.
  - `packages/core/src/index.ts` (export the new symbols).
  - `packages/workout-spa-editor/src/application/energy/resolve-day-expenditure-inputs.ts`
    and `resolve-goal-maintenance.ts` (apply the factor).
- **Versioning**: `@kaiord/core` minor (additive public API).
