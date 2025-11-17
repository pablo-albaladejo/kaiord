# Design Document - Delete Confirmation with Undo

## Overview

Implement undo notifications for delete actions using the existing toast system.

## Toast with Undo Action

```typescript
const handleDelete = (stepId: string) => {
  const step = getStepById(stepId);
  const stepIndex = getStepIndex(stepId);

  // Delete step
  deleteStep(stepId);

  // Show undo notification
  showToast({
    message: `Step deleted`,
    action: {
      label: "Undo",
      onClick: () => {
        // Restore step at original position
        insertStepAt(stepIndex, step);
      },
    },
    duration: 5000, // Auto-dismiss after 5 seconds
  });
};
```

## Store Integration

```typescript
// store/workout-store.ts
interface DeletedStep {
  step: WorkoutStep | RepetitionBlock;
  index: number;
  timestamp: number;
}

interface WorkoutStore {
  deletedSteps: DeletedStep[];

  deleteStep: (stepId: string) => void;
  undoDelete: (timestamp: number) => void;
  clearDeletedSteps: () => void;
}
```

## Auto-cleanup

```typescript
// Clean up deleted steps after 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();
    const expired = deletedSteps.filter((d) => now - d.timestamp > 5000);

    if (expired.length > 0) {
      clearDeletedSteps(expired.map((d) => d.timestamp));
    }
  }, 1000);

  return () => clearInterval(interval);
}, [deletedSteps]);
```
