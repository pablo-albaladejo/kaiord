<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/store/actions/_helpers/`

## Purpose

Private low-level helpers used by the action files. Leading underscore signals "do not import from outside `actions/`."

## Key Files

- `build-krd-with-workout.ts` / `.test.ts` — wraps a `UIWorkout` back into a KRD envelope (round-trip helper).
- `extract-workout.ts` / `.test.ts` — pulls the `UIWorkout` out of a wrapped state shape.
- `replace-block-at-position.ts` / `.test.ts` — splice a `RepetitionBlock` at a known position (used by every block action).
- `index.ts` — module export surface.

## For AI Agents

### Working In This Directory

- Pure functions, no side effects, no `set`.
- Tests pin every helper's invariants so action authors can rely on them.

## Dependencies

### Internal

- `../../../types/ui-workout`.

<!-- MANUAL: -->
