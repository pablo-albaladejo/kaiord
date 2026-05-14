<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/interval/

## Purpose

ZWO interval type mappers and extraction helpers. Handles conversion between ZWO interval structures (SteadyState, Warmup/Cooldown ramps, IntervalsT, FreeRide) and KRD WorkoutStep representation. Includes text event extraction, target restoration, and HR target recovery logic.

## Key Files

| File                             | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| `index.ts`                       | Re-exports all interval mappers and text event extraction     |
| `steady-state.mapper.ts`         | SteadyState interval → KRD WorkoutStep mapper                 |
| `ramp.mapper.ts`                 | Warmup/Cooldown/Ramp interval → KRD WorkoutStep mapper        |
| `intervals-t.mapper.ts`          | IntervalsT (structured intervals) → KRD WorkoutStep mapper    |
| `free-ride.mapper.ts`            | FreeRide (unstructured) → KRD WorkoutStep mapper              |
| `interval-type-detector.ts`      | Detects ZWO interval type and delegates to appropriate mapper |
| `intervals-t-helpers.ts`         | Helpers for IntervalsT repeat/step expansion                  |
| `ramp-helpers.ts`                | Helpers for ramp slope calculation and interpolation          |
| `steady-state-target.helpers.ts` | SteadyState target parsing (power, HR, pace, cadence)         |
| `target-restoration.ts`          | HR target recovery from step-level targets in IntervalsT      |
| `hr-target-restoration.ts`       | Heart rate target restoration logic                           |
| `interval-type-detector.test.ts` | Tests for interval type detection                             |
| `text-event-extraction.test.ts`  | Tests for text event handling                                 |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Interval types**: ZWO defines SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide. Each maps to KRD WorkoutStep.
- **Mapper pattern**: Each mapper is a simple transformation (`*.mapper.ts`, <20 LOC, no tests). Detecter delegates based on ZWO interval type.
- **Converter pattern**: Helpers (`*-helpers.ts`) do complex logic (repeat expansion, ramp interpolation, target restoration) with tests.
- **Target extraction**: Power, HR, pace, cadence targets extracted from ZWO attributes and mapped to KRD target types.
- **Text events**: ZWO textEvent elements (optional) are extracted and stored in KRD notes or extensions.

### Testing Requirements

- Vitest conventions: `it()` titles start with `"should "`, bodies have `// Arrange // Act // Assert` comments.
- Type detection tests verify interval classifier correctly routes SteadyState vs. Ramp vs. IntervalsT.
- Text event tests cover singular, plural, and missing event cases.
- Round-trip: Interval structures must survive KRD ↔ ZWO conversion with tolerance thresholds (±1 bpm HR, ±1 rpm cadence, ±1W power, ±1s time).

### Common Patterns

- **Mapper re-exports**: All mappers exported from `index.ts` for use by `zwift-to-krd.converter`.
- **Target extraction**: Targets extracted from `@_power`, `@_pace`, `@_cadence`, `@_hr` attributes and mapped to KRD target schema.
- **Repeat expansion**: IntervalsT `Repeat` blocks expanded into flat WorkoutStep arrays (with repeat count tracked in extensions).
- **HR restoration**: When HR targets missing from outer interval, inferred from IntervalsT step targets.

## Dependencies

### Internal

- `@kaiord/core` (WorkoutStep, Target, Sport, Logger)

### External

- `zod` (schema validation)

<!-- MANUAL: -->
