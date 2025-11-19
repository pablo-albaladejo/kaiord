# Design Document - Repetition Block UI

## Overview

This design completes the repetition block functionality by adding UI controls for creating, editing, and managing repetition blocks. It builds on existing components (RepetitionBlockCard) and store actions (createRepetitionBlockAction) to provide a complete user experience.

## Architecture

### Component Hierarchy

```
WorkoutSection
├── WorkoutStepsList
│   ├── WorkoutList
│   │   ├── StepCard (with multi-select)
│   │   └── RepetitionBlockCard (existing)
│   ├── CreateRepetitionBlockButton (new)
│   └── AddStepButton (existing)
└── CreateRepetitionBlockDialog (new)
```

### State Management

```typescript
// Extend WorkoutState
type WorkoutState = {
  // ... existing state
  selectedStepIndices: Array<number>; // NEW: Multi-select support
  isCreatingBlock: boolean; // NEW: Dialog state
};
```

## Components and Interfaces

### 1. Multi-Select State Hook

```typescript
// hooks/useMultiSelect.ts
type UseMultiSelectReturn = {
  selectedIndices: Array<number>;
  isSelected: (index: number) => boolean;
  toggleSelect: (index: number, event: React.MouseEvent) => void;
  selectRange: (startIndex: number, endIndex: number) => void;
  clearSelection: () => void;
  selectAll: (maxIndex: number) => void;
};

export const useMultiSelect = (): UseMultiSelectReturn => {
  const [selectedIndices, setSelectedIndices] = useState<Array<number>>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );

  const toggleSelect = (index: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+Click: Toggle individual selection
      setSelectedIndices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
      setLastSelectedIndex(index);
    } else if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click: Select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const range = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
      setSelectedIndices(range);
    } else {
      // Regular click: Select single
      setSelectedIndices([index]);
      setLastSelectedIndex(index);
    }
  };

  // ... other methods
};
```

### 2. CreateRepetitionBlockButton Component

```typescript
// components/molecules/CreateRepetitionBlockButton/CreateRepetitionBlockButton.tsx
type CreateRepetitionBlockButtonProps = {
  selectedCount: number;
  onCreateBlock: () => void;
  disabled?: boolean;
};

export const CreateRepetitionBlockButton = ({
  selectedCount,
  onCreateBlock,
  disabled,
}: CreateRepetitionBlockButtonProps) => {
  if (selectedCount < 2) {
    return null; // Only show when 2+ steps selected
  }

  return (
    <Button
      variant="primary"
      onClick={onCreateBlock}
      disabled={disabled}
      data-testid="create-repetition-block-button"
    >
      Create Repetition Block ({selectedCount} steps)
    </Button>
  );
};
```

### 3. CreateRepetitionBlockDialog Component

```typescript
// components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.tsx
type CreateRepetitionBlockDialogProps = {
  isOpen: boolean;
  selectedStepCount: number;
  onConfirm: (repeatCount: number) => void;
  onCancel: () => void;
};

export const CreateRepetitionBlockDialog = ({
  isOpen,
  selectedStepCount,
  onConfirm,
  onCancel,
}: CreateRepetitionBlockDialogProps) => {
  const [repeatCount, setRepeatCount] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (repeatCount < 2) {
      setError("Repeat count must be at least 2");
      return;
    }
    onConfirm(repeatCount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Repetition Block</DialogTitle>
          <DialogDescription>
            Group {selectedStepCount} steps into a repetition block
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="repeat-count">Repeat Count</label>
            <Input
              id="repeat-count"
              type="number"
              min="2"
              value={repeatCount}
              onChange={(e) => {
                setRepeatCount(parseInt(e.target.value, 10));
                setError(null);
              }}
              data-testid="repeat-count-input"
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          <div className="text-sm text-gray-600">
            The selected steps will be repeated {repeatCount} times
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Create Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### 4. Enhanced StepCard with Multi-Select

```typescript
// Update StepCard to support multi-select
type StepCardProps = {
  // ... existing props
  isMultiSelected?: boolean; // NEW
  onMultiSelect?: (event: React.MouseEvent) => void; // NEW
};

export const StepCard = ({
  step,
  isSelected,
  isMultiSelected,
  onSelect,
  onMultiSelect,
  // ... other props
}: StepCardProps) => {
  const handleClick = (event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      onMultiSelect?.(event);
    } else {
      onSelect?.();
    }
  };

  const cardClasses = cn(
    "step-card",
    isSelected && "ring-2 ring-primary-500",
    isMultiSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
  );

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* ... existing content */}
    </div>
  );
};
```

### 5. RepetitionBlock Context Menu

```typescript
// components/molecules/RepetitionBlockCard/RepetitionBlockContextMenu.tsx
type RepetitionBlockContextMenuProps = {
  onEditCount: () => void;
  onAddStep: () => void;
  onUngroup: () => void;
  onDelete: () => void;
};

export const RepetitionBlockContextMenu = ({
  onEditCount,
  onAddStep,
  onUngroup,
  onDelete,
}: RepetitionBlockContextMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onEditCount}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Repeat Count
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddStep}>
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onUngroup}>
          <Ungroup className="mr-2 h-4 w-4" />
          Ungroup Block
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-red-600">
          <Trash className="mr-2 h-4 w-4" />
          Delete Block
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

## Store Actions

### 1. Ungroup Repetition Block Action

```typescript
// store/actions/ungroup-repetition-block-action.ts
export const ungroupRepetitionBlockAction = (
  krd: KRD,
  blockIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;
  const block = workout.steps[blockIndex];

  if (!isRepetitionBlock(block)) {
    return {};
  }

  // Extract steps from block
  const extractedSteps = block.steps;

  // Remove block and insert steps
  const newSteps = [
    ...workout.steps.slice(0, blockIndex),
    ...extractedSteps,
    ...workout.steps.slice(blockIndex + 1),
  ];

  // Recalculate step indices
  let currentIndex = 0;
  const reindexedSteps = newSteps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    return step;
  });

  const updatedWorkout = {
    ...workout,
    steps: reindexedSteps,
  };

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: updatedWorkout,
    },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
```

## Keyboard Shortcuts

```typescript
// hooks/useRepetitionBlockShortcuts.ts
export const useRepetitionBlockShortcuts = (
  selectedIndices: Array<number>,
  onCreateBlock: () => void,
  onUngroupBlock: () => void,
  onSelectAll: () => void,
  onClearSelection: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;

      // Ctrl/Cmd+G: Create block
      if (isMod && event.key === "g" && !event.shiftKey) {
        event.preventDefault();
        if (selectedIndices.length >= 2) {
          onCreateBlock();
        }
      }

      // Ctrl/Cmd+Shift+G: Ungroup block
      if (isMod && event.key === "G" && event.shiftKey) {
        event.preventDefault();
        onUngroupBlock();
      }

      // Ctrl/Cmd+A: Select all
      if (isMod && event.key === "a") {
        event.preventDefault();
        onSelectAll();
      }

      // Escape: Clear selection
      if (event.key === "Escape") {
        event.preventDefault();
        onClearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedIndices,
    onCreateBlock,
    onUngroupBlock,
    onSelectAll,
    onClearSelection,
  ]);
};
```

## Error Handling

### Validation Errors

```typescript
// utils/repetition-block-validation.ts
export type RepetitionBlockValidationError = {
  type: "MIN_STEPS" | "MIN_REPEAT_COUNT" | "INVALID_SELECTION";
  message: string;
};

export const validateRepetitionBlockCreation = (
  selectedIndices: Array<number>,
  repeatCount: number
): RepetitionBlockValidationError | null => {
  if (selectedIndices.length < 2) {
    return {
      type: "MIN_STEPS",
      message: "Select at least 2 steps to create a repetition block",
    };
  }

  if (repeatCount < 2) {
    return {
      type: "MIN_REPEAT_COUNT",
      message: "Repeat count must be at least 2",
    };
  }

  return null;
};
```

## Testing Strategy

### Unit Tests

1. **useMultiSelect hook**
   - Test Ctrl/Cmd+Click toggles selection
   - Test Shift+Click selects range
   - Test regular click selects single
   - Test clearSelection clears all

2. **Validation functions**
   - Test validateRepetitionBlockCreation with valid/invalid inputs
   - Test edge cases (empty selection, repeat count = 1)

3. **Store actions**
   - Test ungroupRepetitionBlockAction extracts steps correctly
   - Test step index recalculation after ungroup

### Component Tests

1. **CreateRepetitionBlockButton**
   - Test button only shows when 2+ steps selected
   - Test button displays correct count
   - Test onClick handler called

2. **CreateRepetitionBlockDialog**
   - Test dialog opens/closes
   - Test repeat count validation
   - Test confirm/cancel actions

3. **RepetitionBlockContextMenu**
   - Test all menu items render
   - Test menu item click handlers

### Integration Tests

1. **Multi-select workflow**
   - Select multiple steps with Ctrl+Click
   - Create repetition block
   - Verify block created with correct steps

2. **Ungroup workflow**
   - Create repetition block
   - Ungroup block
   - Verify steps extracted correctly

### E2E Tests

1. **Create repetition block**
   - Select 3 steps with Ctrl+Click
   - Click "Create Repetition Block"
   - Set repeat count to 4
   - Verify block created and stats updated

2. **Edit repetition block**
   - Click on block to expand
   - Edit repeat count
   - Verify stats recalculated

3. **Ungroup repetition block**
   - Right-click on block
   - Select "Ungroup"
   - Verify steps extracted

4. **Keyboard shortcuts**
   - Select steps and press Ctrl+G
   - Verify block created
   - Press Ctrl+Shift+G on block
   - Verify block ungrouped

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Multi-select consistency

_For any_ sequence of selection operations (Ctrl+Click, Shift+Click, regular click), the selected indices should always be a valid subset of available step indices
**Validates: Requirements 7.2.1, 7.2.2, 7.2.3**

### Property 2: Block creation preserves steps

_For any_ set of selected steps, creating a repetition block should preserve all step data and only change the structure
**Validates: Requirements 7.1.3**

### Property 3: Ungroup is inverse of group

_For any_ repetition block, ungrouping should extract exactly the steps that were originally grouped
**Validates: Requirements 7.4.2, 7.4.3**

### Property 4: Step indices remain unique

_For any_ operation (create block, ungroup block, add step), all WorkoutStep indices should remain unique and sequential
**Validates: Requirements 7.1.4, 7.4.4**

### Property 5: Minimum repeat count enforced

_For any_ repetition block creation or edit, the repeat count should always be >= 2
**Validates: Requirements 7.1.5, 7.3.3**

### Property 6: Selection cleared after block creation

_For any_ successful block creation, the selection should be cleared
**Validates: Requirements 7.1.4**

### Property 7: Keyboard shortcuts match UI actions

_For any_ keyboard shortcut (Ctrl+G, Ctrl+Shift+G), the result should be identical to using the corresponding UI button
**Validates: Requirements 7.6.1, 7.6.2**
