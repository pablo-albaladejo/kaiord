---
"@kaiord/garmin": major
---

BREAKING CHANGE: Remove `workoutToGarmin`, `createWorkoutToGarmin`, and `WorkoutToGarminOptions` exports.

These convenience functions violated the hexagonal architecture by having an adapter orchestrate core use cases (`toText`, `createWorkoutKRD`). Adapters should only implement port interfaces.

Migration:

```typescript
// Before
import { workoutToGarmin } from "@kaiord/garmin";
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
