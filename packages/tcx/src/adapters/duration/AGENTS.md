<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 -->

# duration

## Purpose

TCX Duration ↔ KRD Duration conversion. Maps time-based durations (seconds) and distance-based durations (meters) between formats. Handles repeat/interval structures and resolves ambiguous duration types.

## Key Files

| File                             | Description                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `duration.converter.ts`          | Re-export dispatcher: `convertTcxDuration()` → KRD Duration from TCX structure.              |
| `krd-to-tcx.converter.ts`        | Re-export dispatcher: `convertKrdDurationToTcx()` → TCX Duration structure from KRD.         |
| `tcx-to-krd.converter.ts`        | Main TCX → KRD duration logic. Extracts time/distance, resolves duration type.               |
| `duration-walker.converter.ts`   | State machine walker for TCX Step/Repeat structure. Extracts durations and targets together. |
| `duration-standard-converter.ts` | Converts TCX standard duration (time/distance) to KRD Duration.                              |
| `extended-duration.converter.ts` | Converts TCX extended duration (repeat count, nested repeats) to KRD repeat structure.       |
| `duration-kaiord-restorer.ts`    | Restores KRD duration type when ambiguous (e.g., both time and distance present).            |
| `standard-duration.converter.ts` | KRD → TCX: standard duration (time/distance) structure.                                      |

## Subdirectories

None. All converters in flat structure.

## For AI Agents

### Working In This Directory

**Conversion Flow (TCX → KRD):**

1. `tcx-to-krd.converter.ts`: Entry point. Receives TCX Step duration element.
2. Check for repeat structure:
   - If `Repetitions` element: duration type is `time_repeat` or `distance_repeat`.
   - Delegate to `extended-duration.converter.ts` for repeat analysis.
3. Otherwise, standard duration:
   - Extract `TimeInSeconds` (if present) or `DistanceMeters` (if present).
   - Call `duration-standard-converter.ts` to map to KRD Duration type.
4. If ambiguous (both time and distance):
   - Use `duration-kaiord-restorer.ts` to infer intended type.
5. Return KRD Duration object with type, value, and repeat info.

**Conversion Flow (KRD → TCX):**

1. `krd-to-tcx.converter.ts`: Entry point. Receives KRD Duration.
2. Map KRD duration type to TCX structure:
   - `time` → `TimeInSeconds` element.
   - `distance` → `DistanceMeters` element.
   - `time_repeat`, `distance_repeat` → `Repetitions` element with repeat count.
3. Use `standard-duration.converter.ts` to build TCX element structure.
4. Return plain object (TCX Duration).

**Duration Types (KRD):**

- `time`: Fixed time duration (seconds). E.g., 300 (5 minutes).
- `distance`: Fixed distance duration (meters). E.g., 5000 (5 km).
- `time_repeat`: Time-based interval with repeat count. E.g., { type: "time_repeat", time: 300, repeat_count: 5 }.
- `distance_repeat`: Distance-based interval with repeat count.
- `open_ended`: Unspecified duration (user continues until done).

**TCX Duration Structure:**

```xml
<Step>
  <Duration>
    <TimeInSeconds>300</TimeInSeconds>
    <!-- or -->
    <DistanceMeters>5000</DistanceMeters>
    <!-- or -->
    <Repetitions>5</Repetitions>
  </Duration>
  <!-- Optional nested Repeat blocks for intervals -->
</Step>
```

**Repeat Handling:**

- TCX may have nested `Repeat` elements (intervals within intervals).
- KRD resolves to single repeat_count (number of times to repeat the step).
- Complex nested repeats reduced to linearized duration.

**File Naming:**

- `*.converter.ts`: Domain logic, tested.
- No mappers in this directory.
- `*-helper.ts`: Utility functions (if any).

### Testing Requirements

**Coverage:** 80% (all converters tested).

**Test Files:**

- `tcx-to-krd.converter.test.ts`: Standard TCX duration extraction.
- `duration-standard-converter.test.ts`: TCX standard → KRD Duration.
- `extended-duration.converter.test.ts`: TCX repeat structure → KRD repeat.
- `duration-walker.converter.test.ts`: TCX Step walking, duration extraction.
- `krd-to-tcx.converter.test.ts`: KRD Duration → TCX structure.
- `duration-kaiord-restorer.test.ts`: Ambiguity resolution (both time and distance present).

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert`.

**Round-Trip Tolerances:**

- Time: ±1s (seconds).
- Distance: ±10m (meters, 0.1% tolerance or absolute, whichever is larger).

### Common Patterns

**Extracting Standard Duration:**

```typescript
const duration = tcxStep.Duration;
let durationSeconds: number | undefined;
let durationMeters: number | undefined;

if (duration.TimeInSeconds !== undefined) {
  durationSeconds = parseFloat(duration.TimeInSeconds as string);
}
if (duration.DistanceMeters !== undefined) {
  durationMeters = parseFloat(duration.DistanceMeters as string);
}
```

**Detecting Repeat Structure:**

```typescript
const repetitions = duration.Repetitions;
if (repetitions !== undefined) {
  const repeatCount = parseInt(repetitions as string, 10);
  // This is a time_repeat or distance_repeat
}
```

**Ambiguity Resolution:**

- If both `TimeInSeconds` and `DistanceMeters` are present, use heuristics:
  - If `TimeInSeconds` looks like reasonable step time (60–3600s), prefer it.
  - If `DistanceMeters` looks unusual or zero, use time.
  - Delegate to `duration-kaiord-restorer.ts` for final decision.

**Logger Usage:**

- Log duration type resolved, time/distance values.
- Log repeat count extracted.
- Use `logger.debug()` for detailed extraction.
- Warn if ambiguous (both time and distance): `logger.warn("Ambiguous duration", { time, distance })`.

## Dependencies

### Internal

- `@kaiord/core`: Duration, DurationType, WorkoutStep, Logger types.
- Sibling modules:
  - `../target/target.converter.ts` (may walk TCX structure together with duration).
  - `../schemas/tcx-duration.ts` (duration type enums).

### External

None (type-only imports from core).
