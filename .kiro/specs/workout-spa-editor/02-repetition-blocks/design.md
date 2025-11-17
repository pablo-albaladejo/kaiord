# Design Document - Repetition Blocks Support

## Overview

Repetition blocks allow users to group multiple workout steps and repeat them a specified number of times. This is a core feature for interval training and structured workouts.

## Data Model

```typescript
interface RepetitionBlock {
  repeatCount: number; // minimum 2
  steps: WorkoutStep[];
}

type WorkoutStepOrBlock = WorkoutStep | RepetitionBlock;

interface Workout {
  name?: string;
  sport: string;
  steps: WorkoutStepOrBlock[];
}
```

## Type Guards

```typescript
export const isRepetitionBlock = (
  step: WorkoutStep | RepetitionBlock
): step is RepetitionBlock => {
  return "repeatCount" in step && "steps" in step;
};

export const isWorkoutStep = (
  step: WorkoutStep | RepetitionBlock
): step is WorkoutStep => {
  return "stepIndex" in step;
};
```

## Component Design

### RepetitionBlockCard Component

```typescript
interface RepetitionBlockCardProps {
  block: RepetitionBlock;
  onEditRepeatCount: (count: number) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onEditStep: (index: number, step: WorkoutStep) => void;
}
```

Visual design:

- Collapsible container with repeat count badge
- Nested step cards with indentation
- Edit repeat count inline
- Add/remove steps within block

## Statistics Calculation

```typescript
export const calculateTotalDuration = (workout: Workout): number => {
  return workout.steps.reduce((total, step) => {
    if (isRepetitionBlock(step)) {
      const blockDuration = step.steps.reduce(
        (sum, s) => sum + getDuration(s),
        0
      );
      return total + blockDuration * step.repeatCount;
    }
    return total + getDuration(step);
  }, 0);
};
```

## Testing Strategy

- Unit tests for type guards and statistics calculation
- Component tests for RepetitionBlockCard
- Integration tests for creating and editing blocks
- E2E tests for complete repetition block workflows
