# Store

This directory contains Zustand stores for global state management.

## Workout Store

The workout store (`workout-store.ts`) manages the current workout state, selection, and editing mode.

### State

- `currentWorkout: KRD | null` - The currently loaded workout
- `selectedStepId: string | null` - ID of the currently selected step
- `isEditing: boolean` - Whether the user is in editing mode

### Actions

- `loadWorkout(krd: KRD)` - Load a workout into the store (resets selection and editing state)
- `updateWorkout(krd: KRD)` - Update the current workout (preserves selection and editing state)
- `selectStep(id: string | null)` - Select a step by ID or deselect with null
- `setEditing(editing: boolean)` - Toggle editing mode
- `clearWorkout()` - Clear the current workout and reset all state

### Selector Hooks

Convenience hooks for accessing specific parts of the store:

- `useCurrentWorkout()` - Get the current workout
- `useSelectedStepId()` - Get the selected step ID
- `useIsEditing()` - Get the editing state
- `useWorkoutActions()` - Get all action functions

### Usage Example

```typescript
import { useWorkoutStore, useCurrentWorkout, useWorkoutActions } from "@/store";

function WorkoutEditor() {
  // Access state
  const workout = useCurrentWorkout();

  // Access actions
  const { loadWorkout, selectStep } = useWorkoutActions();

  // Or use the store directly
  const isEditing = useWorkoutStore((state) => state.isEditing);

  return (
    <div>
      {workout && <WorkoutDisplay workout={workout} />}
    </div>
  );
}
```

## Requirements Mapping

- **Requirement 1**: Display workout structure
  - `loadWorkout` loads KRD files for visualization
  - `currentWorkout` provides the workout data to display

- **Requirement 2**: Create new workouts
  - `updateWorkout` updates workout metadata and steps
  - `loadWorkout` initializes new workout structures

- **Requirement 3**: Edit existing steps
  - `selectStep` selects steps for editing
  - `isEditing` tracks editing mode
  - `updateWorkout` saves step modifications
