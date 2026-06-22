# Tasks

## 1. Core expenditure

- [x] 1.1 Add optional `neatFactor` (>= 1) to `DayExpenditureInput` and validate it
- [x] 1.2 Resolve the predicted basal as `BMR · neatFactor` (BMR alone when unset)
- [x] 1.3 Unit tests: scaled basal, rest-day lift, unset fallback, guards

## 2. SPA activity-level mapping

- [x] 2.1 Add `neat-factor.ts` mapping `activityLevel` → NEAT factor (unset → 1)
- [x] 2.2 Unit tests: per-level, unset fallback, monotonicity, realistic moderate range

## 3. Wire through expenditure + goal maintenance

- [x] 3.1 `toExpenditureInput` passes `neatFactor` from the profile's `activityLevel`
- [x] 3.2 `resolveGoalMaintenance` scales BMR by the NEAT factor

## 4. Spec + release

- [x] 4.1 MODIFY the `energy-expenditure` "Daily expenditure resolution" requirement
- [x] 4.2 Add a changeset for `@kaiord/core`
