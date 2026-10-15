<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/utils/`

## Purpose

Cross-cutting utilities used by the UI tree. Format detection, import/export pipelines, workout statistics, zone math (calculation only), keyboard-handler builders, storage migrations, week/calendar helpers, file-format metadata, and similar leaf concerns.

## Key Files

### Import / export

- `import-workout.ts` / `.test.ts` (+ `.test-fixtures.ts`), `import-workout-formats.ts`, `import-workout-errors.ts` — multi-format workout import (FIT / TCX / ZWO / KRD / GCN).
- `export-workout.ts` / `.test.ts`, `export-workout-formats.ts` — multi-format export. Calls `stripIds` on the way out.
- `file-format-detector.ts` / `.test.ts`, `file-format-metadata.ts` — sniff input format by magic bytes / extension.
- `save-workout.ts` / `.test.ts` + `save-workout.helpers.ts` — write a workout to Dexie via `PersistencePort.workouts`, after `stripIds`.

### Workout statistics

- `workout-stats.ts` / `.test.ts` (+ `.test-fixtures.ts`), `workout-stats-helpers.ts` / `.test.ts` (+ `.test-fixtures.ts`), `workout-stats-types.ts`, `workout-stats-accumulator.ts`, `workout-stats-duration.ts` / `.test.ts` — duration / distance / TSS / load calculations.

### Zone math

- `calculate-hr-zones.ts` / `.test.ts`, `calculate-power-zones.ts` / `.test.ts`, `calculate-pace-zones.ts` / `.test.ts`, `calculate-zone-values.ts` / `.test.ts` — UI-side zone calculators (display only; canonical math lives in `lib/{hr,power,pace,zone}-methods.ts`).

### Keyboard handlers

- `build-keyboard-handlers.ts` / `.test.ts`, `build-clipboard-handlers.ts`, `build-step-handlers.ts`, `keyboard-handler-deps.ts` — factories that compose dispatchable shortcut handlers from store action surfaces.

### Validation

- `krd-validator.ts` / `.test.ts` + `krd-validator-helpers.ts` — KRD-level cross-field validation.
- `repetition-block-validation.ts` / `.test.ts` — block-specific validation.

### Storage + recovery

- `library-storage.ts` / `.test.ts` — Library template read/write (delegates to `TemplateRepository`).
- `backup-download.ts` / `.test.ts` — local-backup download flow.
- `error-recovery.ts` / `.test.ts` — `safeMode` + `lastBackup` recovery wiring.
- `workout-migration.ts` / `.test.ts` — workout-level migrations applied at load.

### Misc

- `id-generation.ts` / `.test.ts` — `ItemId` factory.
- `json-parser.ts` / `.test.ts` — typed JSON parser with structured errors.
- `logger.ts` — `console.*` wrapper with PII-safe defaults.
- `step-colors.ts` — step-intensity → Tailwind class mapping.
- `format-relative-time.ts` / `.test.ts`, `format-week-label.ts` / `.test.ts`, `week-utils.ts` / `.test.ts` — date/week formatting.
- `structured-workout.ts` — typed wrapper for KRD shape.
- `get-selected-step-index.ts`, `platform.ts` — small leaf helpers.
- `no-browser-alerts.test.ts` — regression test pinning "no `alert()` or `confirm()` in code" rule.

## For AI Agents

### Working In This Directory

1. **PII rule applies.** Files here are not under `src/{components,hooks,lib}/**`, so the mechanical guard doesn't enforce R-PIIInterpolation here, but please follow the same discipline for `logger.ts` callsites.
2. **`stripIds` chokepoint applies** in `save-workout.ts` and `export-workout.ts` — both go through `../store/strip-ids.ts`.
3. **No `alert()` / `confirm()`** — pinned by `no-browser-alerts.test.ts`. Use Radix Dialog instead.
4. **Calculation utils are display-only.** Canonical zone math is in `lib/*-methods.ts`; this directory contains UI presentations of those results.

### Testing Requirements

- Every non-trivial file has a co-located `.test.ts`.
- Round-trip tests for the import/export pipeline use `@kaiord/core/test-utils` fixtures.

### Common Patterns

- Factory exports, no classes.
- Helpers co-located as `<name>-helpers.ts`.

## Dependencies

### Internal

- `../store/strip-ids` (every export/save path).
- `../types/*`.
- `../lib/*` (zone math, hashing).
- `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`.

### External

- `zod`.

<!-- MANUAL: -->
