# Design Document

## Overview

This design addresses three critical issues with repetition block deletion:

1. **Index Bug**: Wrong block is deleted when it's not the first block
2. **Confirmation Modal**: Unnecessary modal shown despite undo being available
3. **Button Styling**: Delete button style inconsistent with other delete buttons

The root cause of the index bug is a mismatch between array indices (position in `workout.steps`) and logical block indices (count of blocks only). The solution involves using a unique identifier system instead of positional indices.

## Architecture

### Current Architecture (Problematic)

```
UI Layer (WorkoutListContent)
  ↓ passes array index
Store Actions (deleteRepetitionBlockAction)
  ↓ interprets as block index
  ↓ searches for nth block
  ↓ deletes wrong position
```

### Proposed Architecture (Fixed)

```
UI Layer (WorkoutListContent)
  ↓ passes unique block ID
Store Actions (deleteRepetitionBlockAction)
  ↓ finds block by ID
  ↓ deletes correct block
```

## Components and Interfaces

### 1. Block Identification System

**Current Problem:**

- Blocks are identified by their position in the array
- Position changes as items are added/removed
- No stable identifier across operations

**Solution:**

- Add `id` field to `RepetitionBlock` type
- Generate unique IDs when blocks are created
- Use IDs for all block operations (delete, edit, ungroup, etc.)

```typescript
// Updated RepetitionBlock type
type RepetitionBlock = {
  id: string; // NEW: Unique identifier
  repeatCount: number;
  steps: Array<WorkoutStep>;
};

// ID generation
const generateBlockId = (): string => {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
```

### 2. Updated Store Actions

**deleteRepetitionBlockAction:**

```typescript
// OLD: Uses positional index
export const deleteRepetitionBlockAction = (
  krd: KRD,
  blockIndex: number, // ❌ Ambiguous
  state: WorkoutState
): Partial<WorkoutState>

// NEW: Uses unique ID
export const deleteRepetitionBlockAction = (
  krd: KRD,
  blockId: string, // ✅ Unambiguous
  state: WorkoutState
): Partial<WorkoutState>
```

**Implementation:**

```typescript
const findBlockById = (
  workout: Workout,
  blockId: string
): { block: RepetitionBlock; position: number } | null => {
  for (let i = 0; i < workout.steps.length; i++) {
    const step = workout.steps[i];
    if (isRepetitionBlock(step) && step.id === blockId) {
      return { block: step, position: i };
    }
  }
  return null;
};

export const deleteRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;
  const blockInfo = findBlockById(workout, blockId);

  if (!blockInfo) {
    return {};
  }

  const { block, position } = blockInfo;

  // Remove block and reindex steps
  const newSteps = workout.steps.filter((_, index) => index !== position);
  let currentIndex = 0;
  const reindexedSteps = newSteps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    return step;
  });

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: { ...workout, steps: reindexedSteps },
    },
  };

  // Track deleted block for undo
  const deletedBlocks = state.deletedSteps || [];
  const newDeletedBlocks = [
    ...deletedBlocks,
    { step: block, index: position, timestamp: Date.now() },
  ];

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    selectedStepId: null,
    selectedStepIds: [],
    deletedSteps: newDeletedBlocks,
  };
};
```

### 3. UI Layer Updates

**WorkoutListContent:**

```typescript
// Pass block ID instead of array index
{workout.steps.map((item, arrayIndex) => {
  if (isRepetitionBlock(item)) {
    return (
      <RepetitionBlockCard
        key={item.id}
        block={item}
        onDelete={() => onDeleteRepetitionBlock(item.id)} // ✅ Use ID
      />
    );
  }
  // ...
})}
```

**Store Hook:**

```typescript
// Update store hook signature
const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // ...
  deleteRepetitionBlock: (blockId: string) => {
    const state = get();
    const krd = state.currentWorkout;
    if (!krd) return;

    const updates = deleteRepetitionBlockAction(krd, blockId, state);
    set(updates);
  },
}));
```

### 4. Remove Confirmation Modal

**Current Flow:**

```
User clicks delete
  ↓
Show confirmation modal
  ↓
User confirms
  ↓
Delete block
  ↓
Show toast with undo
```

**New Flow:**

```
User clicks delete
  ↓
Delete block immediately
  ↓
Show toast with undo
```

**Implementation:**

```typescript
// RepetitionBlockCard.tsx
const handleDelete = () => {
  // OLD: Show modal
  // showConfirmationModal({
  //   title: "Delete Block",
  //   message: "This action cannot be undone",
  //   onConfirm: () => onDelete?.()
  // });

  // NEW: Delete immediately
  onDelete?.();
};
```

### 5. Consistent Button Styling

**Current Issue:**

- Repetition block delete button has different styling
- Inconsistent with step delete buttons

**Solution:**

- Use the same `Button` component with `variant="ghost"` and `size="sm"`
- Use the same `Trash2` icon
- Use the same color classes (`text-red-600 hover:text-red-700`)

```typescript
// RepetitionBlockCard.tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleDelete}
  className="text-red-600 hover:text-red-700 hover:bg-red-50"
  aria-label="Delete repetition block"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

## Data Models

### Updated RepetitionBlock Type

```typescript
// Before
type RepetitionBlock = {
  repeatCount: number;
  steps: Array<WorkoutStep>;
};

// After
type RepetitionBlock = {
  id: string; // NEW: Unique identifier
  repeatCount: number;
  steps: Array<WorkoutStep>;
};
```

### Migration Strategy

**For Existing Workouts:**

- Add migration function to add IDs to blocks without them
- Run migration on workout load
- Preserve backward compatibility

```typescript
const migrateRepetitionBlocks = (workout: Workout): Workout => {
  return {
    ...workout,
    steps: workout.steps.map((step) => {
      if (isRepetitionBlock(step) && !step.id) {
        return {
          ...step,
          id: generateBlockId(),
        };
      }
      return step;
    }),
  };
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Correct block deletion by ID

_For any_ workout with multiple blocks, deleting a block by its ID should remove that specific block and no other blocks.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Block ID uniqueness

_For any_ workout, all repetition block IDs should be unique within that workout.

**Validates: Requirements 2.1, 2.2**

### Property 3: Block ID stability

_For any_ repetition block, its ID should remain constant across all operations (edit, reorder, etc.) until the block is deleted.

**Validates: Requirements 2.3**

### Property 4: Deletion without confirmation

_For any_ repetition block deletion, no confirmation modal should be shown to the user.

**Validates: Requirements 4.1, 4.2, 4.5**

### Property 5: Undo availability after deletion

_For any_ deleted repetition block, the undo functionality should be available via toast notification.

**Validates: Requirements 4.3, 4.4**

### Property 6: Undo restores correct block

_For any_ deleted repetition block, undoing the deletion should restore the exact block that was deleted, with the same ID and content.

**Validates: Requirements 3.1, 3.2**

### Property 7: Button styling consistency

_For any_ repetition block delete button, its visual styling should match the styling of step delete buttons.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 8: Step index recalculation

_For any_ workout after block deletion, all remaining step indices should be sequential starting from 0.

**Validates: Requirements 1.5**

### Property 9: Multiple deletion undo order

_For any_ sequence of block deletions, undoing should restore blocks in reverse order (LIFO).

**Validates: Requirements 3.3**

### Property 10: Redo after undo

_For any_ deleted and undone block, redoing should delete the same block again by ID.

**Validates: Requirements 3.4**

## Error Handling

### Invalid Block ID

```typescript
if (!blockInfo) {
  console.warn(`Block with ID ${blockId} not found`);
  return {}; // No-op, don't crash
}
```

### Missing Block ID (Migration)

```typescript
if (isRepetitionBlock(step) && !step.id) {
  // Auto-migrate: add ID
  return {
    ...step,
    id: generateBlockId(),
  };
}
```

### Undo Stack Corruption

```typescript
// Validate deleted block before undo
const lastDeleted = deletedSteps[deletedSteps.length - 1];
if (!lastDeleted || !lastDeleted.step.id) {
  console.error("Undo stack corrupted");
  return;
}
```

## Testing Strategy

### Unit Tests

**Block ID Generation:**

- Test ID uniqueness across multiple generations
- Test ID format consistency

**findBlockById:**

- Test finding first block
- Test finding middle block
- Test finding last block
- Test not finding non-existent ID

**deleteRepetitionBlockAction:**

- Test deleting first block by ID
- Test deleting middle block by ID
- Test deleting last block by ID
- Test deleting with mixed steps and blocks
- Test step index recalculation after deletion

**Migration:**

- Test migrating blocks without IDs
- Test preserving blocks with IDs
- Test mixed migration (some with, some without IDs)

### Property-Based Tests

**Property 1: Correct block deletion by ID**

```typescript
test("should delete correct block by ID", () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.string(),
          repeatCount: fc.integer({ min: 2, max: 10 }),
          steps: fc.array(buildWorkoutStep.build(), { minLength: 1 }),
        }),
        { minLength: 2, maxLength: 5 }
      ),
      (blocks) => {
        // Create workout with blocks
        const workout = { steps: blocks };

        // Pick random block to delete
        const targetBlock = blocks[Math.floor(Math.random() * blocks.length)];

        // Delete by ID
        const result = deleteRepetitionBlockAction(
          { extensions: { workout } },
          targetBlock.id,
          {}
        );

        // Verify correct block deleted
        const remainingBlocks =
          result.extensions.workout.steps.filter(isRepetitionBlock);
        expect(remainingBlocks).not.toContainEqual(targetBlock);
        expect(remainingBlocks.length).toBe(blocks.length - 1);
      }
    )
  );
});
```

**Property 2: Block ID uniqueness**

```typescript
test("should maintain unique block IDs", () => {
  fc.assert(
    fc.property(fc.integer({ min: 2, max: 20 }), (count) => {
      const ids = Array.from({ length: count }, () => generateBlockId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(count);
    })
  );
});
```

**Property 7: Button styling consistency**

```typescript
test("should have consistent delete button styling", () => {
  fc.assert(
    fc.property(
      buildRepetitionBlock.build(),
      (block) => {
        const { container } = render(<RepetitionBlockCard block={block} />);
        const deleteButton = container.querySelector('[aria-label*="Delete"]');

        // Should have same classes as step delete button
        expect(deleteButton).toHaveClass('text-red-600');
        expect(deleteButton).toHaveClass('hover:text-red-700');
        expect(deleteButton).toHaveClass('hover:bg-red-50');
      }
    )
  );
});
```

### E2E Tests

**Block Deletion Flow:**

```typescript
test("should delete correct block without confirmation", async ({ page }) => {
  // Arrange: Create workout with 3 blocks
  await page.goto("/");
  await createBlock(page, "Block 1");
  await createBlock(page, "Block 2");
  await createBlock(page, "Block 3");

  // Act: Delete middle block
  const block2 = page.locator('[data-testid="repetition-block"]').nth(1);
  await block2.locator('[aria-label="Delete repetition block"]').click();

  // Assert: No confirmation modal
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();

  // Assert: Block 2 is gone, Block 1 and 3 remain
  const blocks = page.locator('[data-testid="repetition-block"]');
  await expect(blocks).toHaveCount(2);
  await expect(blocks.nth(0)).toContainText("Block 1");
  await expect(blocks.nth(1)).toContainText("Block 3");

  // Assert: Toast with undo appears
  await expect(page.locator('[role="status"]')).toContainText("Block deleted");
  await expect(page.locator('button:has-text("Undo")')).toBeVisible();
});
```

**Undo Flow:**

```typescript
test("should undo block deletion correctly", async ({ page }) => {
  // Arrange: Create and delete block
  await page.goto("/");
  await createBlock(page, "Test Block");
  await page.locator('[aria-label="Delete repetition block"]').click();

  // Act: Click undo
  await page.locator('button:has-text("Undo")').click();

  // Assert: Block restored
  await expect(page.locator('[data-testid="repetition-block"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="repetition-block"]')).toContainText(
    "Test Block"
  );
});
```

**Button Styling:**

```typescript
test("should have consistent delete button styling", async ({ page }) => {
  // Arrange
  await page.goto("/");
  await createBlock(page, "Test Block");
  await addStep(page);

  // Act: Get both delete buttons
  const blockDeleteBtn = page.locator(
    '[data-testid="repetition-block"] [aria-label*="Delete"]'
  );
  const stepDeleteBtn = page.locator(
    '[data-testid="step-card"] [aria-label*="Delete"]'
  );

  // Assert: Same styling
  const blockClasses = await blockDeleteBtn.getAttribute("class");
  const stepClasses = await stepDeleteBtn.getAttribute("class");

  expect(blockClasses).toContain("text-red-600");
  expect(stepClasses).toContain("text-red-600");
  expect(blockClasses).toContain("hover:text-red-700");
  expect(stepClasses).toContain("hover:text-red-700");
});
```

## Performance Considerations

### ID Generation Performance

- Use `Date.now()` + random string for fast generation
- No need for UUID library (overkill for this use case)
- Generation time: < 1ms

### Block Lookup Performance

- Linear search through workout.steps
- Acceptable for typical workout sizes (< 100 items)
- If performance becomes an issue, add ID → position map

### Migration Performance

- One-time cost on workout load
- Only affects workouts without IDs (legacy data)
- Amortized over workout lifetime

## Migration Plan

### Phase 1: Add ID Field (Non-Breaking)

1. Update `RepetitionBlock` type to include optional `id`
2. Add migration function to add IDs on load
3. Update all block creation to generate IDs
4. Deploy and let users migrate naturally

### Phase 2: Update Deletion Logic (Breaking Fix)

1. Update `deleteRepetitionBlockAction` to use ID
2. Update UI to pass ID instead of index
3. Update all other block operations (edit, ungroup, etc.)
4. Deploy bug fix

### Phase 3: Remove Confirmation Modal

1. Remove modal call from delete handler
2. Ensure toast notification is working
3. Update E2E tests
4. Deploy UX improvement

### Phase 4: Fix Button Styling

1. Update RepetitionBlockCard button classes
2. Verify consistency with step buttons
3. Update visual regression tests
4. Deploy styling fix

## Backward Compatibility

### Loading Old Workouts

```typescript
// Workouts without block IDs will be auto-migrated
const loadWorkout = (krd: KRD): KRD => {
  if (!krd.extensions?.workout) return krd;

  const workout = krd.extensions.workout;
  const migratedWorkout = migrateRepetitionBlocks(workout);

  return {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: migratedWorkout,
    },
  };
};
```

### Saving Workouts

```typescript
// Always save with IDs (forward compatible)
const saveWorkout = (krd: KRD): void => {
  // Ensure all blocks have IDs before saving
  const workout = krd.extensions?.workout;
  if (workout) {
    const migratedWorkout = migrateRepetitionBlocks(workout);
    // Save migratedWorkout
  }
};
```

## Summary

This design fixes three critical issues:

1. **Index Bug**: Use unique IDs instead of positional indices
2. **Confirmation Modal**: Remove unnecessary modal, rely on undo
3. **Button Styling**: Standardize delete button appearance

The solution is backward compatible, performant, and thoroughly tested. The ID-based approach eliminates the entire class of index-related bugs and makes the codebase more maintainable.
