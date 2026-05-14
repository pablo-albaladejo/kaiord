<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 -->

# workout

## Purpose

TCX Workout ↔ KRD conversion. Maps TCX workout structure (exercises, steps with durations and targets) to/from KRD Workout. Entry point: `convertTcxWorkout()` (TCX → KRD) and `convertKRDToTcx()` (KRD → TCX).

## Key Files

| File                               | Description                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `krd.converter.ts`                 | Top-level TCX → KRD entry point. Extracts extensions, metadata, and workout; delegates step conversion. |
| `tcx.converter.ts`                 | Top-level KRD → TCX entry point. Converts KRD workout structure back to TCX format.                     |
| `workout.converter.ts`             | Converts individual TCX Workout to KRD Workout. Iterates steps, extracts metadata and extensions.       |
| `step.converter.ts`                | Converts individual TCX Step to KRD WorkoutStep. Maps duration, target, intensity, and extensions.      |
| `metadata-builder.ts`              | Extracts KRD metadata (name, description, sport) from TCX Workout.                                      |
| `step-helpers.ts`                  | Utility functions for step conversion: extract intensity, extensions, repeat count.                     |
| `target-with-extensions.helper.ts` | Maps TCX Target to KRD Target, preserving extensions (e.g., Garmin custom targets).                     |

## Subdirectories

None. All converters and helpers in flat structure.

## For AI Agents

### Working In This Directory

**Conversion Flow (TCX → KRD):**

1. `krd.converter.ts` entry: Extract TrainingCenterDatabase extensions, metadata, workout array.
2. `workout.converter.ts`: For each Workout, extract metadata, steps, extensions.
3. For each TCX Step:
   - `step.converter.ts` → `convertTcxStep()` calls:
     - `duration-walker.converter.ts` (in `duration/`) to map `Duration`.
     - `target.converter.ts` (in `target/`) to map `Target`.
     - `step-helpers.ts` to extract intensity and extensions.
4. Assemble KRD Workout with steps, metadata, extensions.

**Conversion Flow (KRD → TCX):**

1. `tcx.converter.ts` entry: Build TCX WorkoutName, metadata, exercises array.
2. For each KRD WorkoutStep:
   - `step-to-tcx.converter.ts` → maps KRD step structure to TCX Step XML.
   - Delegates duration encoding to `duration/krd-to-tcx.converter.ts`.
   - Delegates target encoding to `target/krd-to-tcx.converter.ts`.

**File Naming Conventions:**

- `*.converter.ts`: Complex domain logic. Must have unit tests.
- `*.mapper.ts`: Simple transformation (identity, enum mapping). No tests.
- `*-helpers.ts`: Utility functions extracted for reuse.

**Key Types:**

- `KRD`: Top-level Kaiord Record Document (from core).
- `Workout`: KRD Workout with steps, metadata, extensions.
- `WorkoutStep`: Individual step in KRD (duration, target, intensity).
- `TCX` intermediate: Plain object (no typing) from `fast-xml-parser`.

### Testing Requirements

**Coverage:** 80% (across all converters and helpers).

**Test Files (Unit):**

- `krd.converter.test.ts`: TCX → KRD top-level, extensions, metadata extraction.
- `tcx.converter.test.ts`: KRD → TCX top-level, step array, metadata.
- `workout.converter.test.ts`: Individual TCX Workout → KRD Workout.
- `step.converter.test.ts`: Individual TCX Step → KRD WorkoutStep.
- `metadata-builder.test.ts`: Metadata extraction (name, description, sport).
- `step-to-tcx.converter.test.ts`: KRD Step → TCX Step encoding.

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert` sections.

**Round-Trip Tests:**

- Covered in `../round-trip/round-trip.test.ts` (integration level).
- Verify TCX → KRD → TCX matches within tolerance (time ±1s, power ±1W, HR ±1bpm, cadence ±1rpm).

### Common Patterns

**Handling Arrays from XML:**

```typescript
const steps: unknown = tcxWorkout.Step;
const stepArray = Array.isArray(steps) ? steps : [steps];
for (const tcxStep of stepArray) {
  // Convert each step
}
```

**Extensions Preservation:**

- Extract TCX `Extensions` from step: `tcxStep.Extensions as Record<string, unknown> | undefined`.
- Store in KRD step as `{ ...step, extensions: { tcx: extensions } }`.
- During write, check `step.extensions?.tcx` and reconstruct in output.

**Metadata Extraction:**

- Name: `tcxWorkout.Name` (string).
- Description: `tcxWorkout.Description` (string or undefined).
- Sport: `tcxWorkout.Sport` (enum: "Running", "Biking", "Other") → map via `KRD_TO_TCX_SPORT`.

**Logger Usage:**

- All converters accept `Logger` parameter.
- Log step index, extracted metadata, extension presence.
- Use `logger.debug()` for detailed traversal.
- Throw errors after logging with context.

## Dependencies

### Internal

- `@kaiord/core`: KRD, Workout, WorkoutStep, Duration, Target, Intensity, Sport, Logger types.
- Sibling modules:
  - `../duration/duration-walker.converter.ts` (TCX → KRD duration).
  - `../duration/krd-to-tcx.converter.ts` (KRD → TCX duration).
  - `../target/target.converter.ts` (TCX → KRD target).
  - `../target/krd-to-tcx.converter.ts` (KRD → TCX target).
  - `../schemas/tcx-sport.ts` (sport enum mappings).

### External

None (type-only imports from core).
