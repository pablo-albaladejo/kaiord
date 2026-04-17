# Design: Remove workoutToGarmin

## Decision: Delete rather than deprecate

**Layer:** Adapters

Remove immediately. No deprecation phase. The function violates the principle that adapters should not orchestrate core use cases. The linked changeset config means a major bump cascades to all 9 packages — accepted as the cost of enforcing architectural purity.

**Alternative considered:** Deprecate with `@deprecated` JSDoc + runtime warning, remove later. Rejected — the user prefers immediate removal.

## Decision: No replacement API

**Layer:** Adapters

The standard two-step flow (`createWorkoutKRD` + `toText`) is the canonical approach. No convenience wrapper needed.

## Decision: Update adapter-contracts spec

**Layer:** Specs

Add "No Use-Case Orchestration in Adapters" requirement to prevent recurrence. Adapters implement port interfaces — they do not compose core use cases.

## Migration

```typescript
// Before
const json = await workoutToGarmin(workout);

// After
import { createWorkoutKRD, toText } from "@kaiord/core";
import { garminWriter } from "@kaiord/garmin";
const krd = createWorkoutKRD(workout);
const json = await toText(krd, garminWriter);

// With paceZones
import { createGarminWriter } from "@kaiord/garmin";
const writer = createGarminWriter({ paceZones });
const json = await toText(krd, writer);
```
