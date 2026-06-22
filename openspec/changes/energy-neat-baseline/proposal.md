## Why

`resolveDayExpenditure` computes predicted daily expenditure as
`BMR + expectedActivityKcal`, where `expectedActivityKcal` only covers scheduled
workouts. On a rest day predicted expenditure collapses to raw BMR — a moderately
active 80 kg / 180 cm / male profile (BMR ~1750) shows **1750 kcal**, while real
maintenance is ~2300–2500. The basal path ignores non-exercise daily activity
(NEAT) even though the profile already captures `activityLevel`. Consequence:
rest-day net balance, deficit/surplus, and the goal **target** are all computed
against an under-estimated expenditure until adaptive TDEE accumulates enough
weight history to self-correct.

## What Changes

- Apply a **NEAT factor** to BMR for the predicted basal: `resolveDayExpenditure`
  gains an optional `neatFactor` (>= 1) and resolves the basal as
  `BMR · neatFactor`. Omitting it preserves the previous BMR-only behavior.
- Map `activityLevel` (`sedentary…very_active`) to a **NEAT-only** factor
  (1.15 / 1.30 / 1.40 / 1.50 / 1.60) in the SPA, where the `ActivityLevel` type
  lives. The factors sit below standard TDEE multipliers (which bake in exercise)
  so scheduled-workout kcal stay additive and are never double-counted.
- Wire the factor through `toExpenditureInput` (day expenditure) and
  `resolveGoalMaintenance` (goal target maintenance). An unset `activityLevel`
  falls back to 1.

## Impact

- Affected specs: `energy-expenditure` (MODIFIED: Daily expenditure resolution).
- Affected code: `@kaiord/core` `application/energy/expenditure.ts`;
  `@kaiord/workout-spa-editor` `application/energy/{neat-factor,
resolve-day-expenditure-inputs, resolve-goal-maintenance}.ts`.
- Behavior: rest-day expenditure and goal targets now reflect daily activity;
  the measured path and the `activityLevel`-unset path are unchanged.
