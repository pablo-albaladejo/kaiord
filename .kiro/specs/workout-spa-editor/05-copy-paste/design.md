# Design Document - Copy/Paste Step Functionality

## Overview

Implement copy/paste functionality using the Clipboard API for efficient step duplication.

## Clipboard Storage

```typescript
// Store step as JSON in clipboard
const copyStep = async (step: WorkoutStep | RepetitionBlock) => {
  const json = JSON.stringify(step);
  await navigator.clipboard.writeText(json);
  showNotification("Step copied to clipboard");
};

// Read step from clipboard
const pasteStep = async (): Promise<WorkoutStep | RepetitionBlock | null> => {
  try {
    const text = await navigator.clipboard.readText();
    const step = JSON.parse(text);

    // Validate step structure
    if (isValidStep(step)) {
      return step;
    }
    return null;
  } catch (error) {
    showNotification("No valid step in clipboard");
    return null;
  }
};
```

## Store Actions

```typescript
// store/actions/copy-step-action.ts
export const copyStep = (stepId: string) => {
  const step = getStepById(stepId);
  if (step) {
    navigator.clipboard.writeText(JSON.stringify(step));
    set({ clipboard: step });
  }
};

// store/actions/paste-step-action.ts
export const pasteStep = async (insertIndex: number) => {
  const text = await navigator.clipboard.readText();
  const step = JSON.parse(text);

  // Insert step and recalculate indices
  insertStepAt(insertIndex, step);
  recalculateStepIndices();
};
```

## Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedStepId) {
      e.preventDefault();
      copyStep(selectedStepId);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      e.preventDefault();
      pasteStep(currentIndex);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedStepId, currentIndex]);
```
