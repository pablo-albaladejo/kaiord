# Tasks: Remove workoutToGarmin

## Adapters

- [x] Delete `packages/garmin/src/adapters/workout-to-garmin.ts`
- [x] Delete `packages/garmin/src/adapters/workout-to-garmin.test.ts`
- [x] Remove `workoutToGarmin`, `createWorkoutToGarmin`, `WorkoutToGarminOptions` exports from `packages/garmin/src/index.ts`

## Specs

- [x] Update `openspec/specs/adapter-contracts/spec.md` with "No Use-Case Orchestration in Adapters" requirement

## Verification

- [x] Run `pnpm -r build` — no build errors
- [x] Run `pnpm -r test` — all tests pass, coverage thresholds met (97%+)
- [x] Run `pnpm lint` — zero warnings/errors
- [x] Verify no remaining references to `workoutToGarmin` in source code

## Release

- [x] Add changeset: major bump for `@kaiord/garmin`
