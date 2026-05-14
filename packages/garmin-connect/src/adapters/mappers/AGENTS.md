<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/mappers

Simple GCN → KRD model mappers: no logic, no tests (per convention).

**Files:**

- `workout-summary.mapper.ts` — Map Garmin API workout summary to WorkoutSummary type (id, name, date, duration, calories)

**Key patterns:**

- Pure transformation functions; no dependencies
- Unidirectional mapping (GCN input, KRD-compatible output)
- No tests required (mapper convention in CLAUDE.md)
- Used by `garmin-workout-service.ts` in list operation

**Typical mapper function:**

```typescript
export const mapToWorkoutSummary = (
  gcn: GarminWorkoutSummary
): WorkoutSummary => ({
  id: String(gcn.workoutId),
  name: gcn.workoutName,
  // ... field mappings
});
```

<!-- MANUAL: -->
