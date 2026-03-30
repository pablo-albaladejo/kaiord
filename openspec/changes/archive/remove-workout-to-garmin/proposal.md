> Completed: 2026-03-30

# Proposal: Remove workoutToGarmin convenience API

## Problem

`@kaiord/garmin` exports `workoutToGarmin()` and `createWorkoutToGarmin()`, which accept a raw `Workout` object and return a Garmin JSON string. Although the implementation wraps the workout in KRD internally, the public API hides this — violating the principle that **all public conversions must explicitly use KRD as input/output**.

An adapter is orchestrating core use cases (`toText`, `createWorkoutKRD`), which is the consumer's responsibility, not the adapter's.

## Solution

Remove from `@kaiord/garmin`:

- `workoutToGarmin` (pre-built instance)
- `createWorkoutToGarmin` (factory)
- `WorkoutToGarminOptions` (type)

Delete the implementation file and its tests. Consumers must use the standard flow:

```typescript
import { createWorkoutKRD, toText } from "@kaiord/core";
import { garminWriter } from "@kaiord/garmin";

const krd = createWorkoutKRD(workout);
const json = await toText(krd, garminWriter);
```

For consumers needing pace zones:

```typescript
import { createWorkoutKRD, toText } from "@kaiord/core";
import { createGarminWriter } from "@kaiord/garmin";

const krd = createWorkoutKRD(workout);
const writer = createGarminWriter({ paceZones });
const json = await toText(krd, writer);
```

## Affected Packages

| Package          | Change                            |
| ---------------- | --------------------------------- |
| `@kaiord/garmin` | Remove exports and implementation |

## Breaking Changes

**BREAKING**: Removes `workoutToGarmin`, `createWorkoutToGarmin`, and `WorkoutToGarminOptions`. Major bump cascades to all linked packages via changeset config.

## Constraints

- Architecture layer: **adapters** (removal only)
- Referenced specs: `openspec/specs/adapter-contracts/spec.md`
