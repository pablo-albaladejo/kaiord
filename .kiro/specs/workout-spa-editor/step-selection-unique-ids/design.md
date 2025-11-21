# Design Document

## Overview

This design addresses the step selection bug where clicking on a workout step incorrectly selects all steps with the same `stepIndex` value across the entire workout, including steps inside repetition blocks. The root cause is that the current ID generation strategy uses only the `stepIndex` property, which is not globally unique.

The solution introduces a hierarchical ID generation system that includes the step's location in the workout structure (main workout vs. specific repetition block), ensuring each step has a globally unique identifier.

## Architecture

### Current Architecture (Problematic)

```
Workout
├── Step 1 (stepIndex: 1) → ID: "step-1"
├── Step 2 (stepIndex: 2) → ID: "step-2"
├── Repetition Block A
│   ├── Step 1 (stepIndex: 1) → ID: "step-1" ❌ COLLISION
│   └── Step 2 (stepIndex: 2) → ID: "step-2" ❌ COLLISION
└── Repetition Block B
    ├── Step 1 (stepIndex: 1) → ID: "step-1" ❌ COLLISION
    └── Step 2 (stepIndex: 2) → ID: "step-2" ❌ COLLISION
```

### Proposed Architecture (Fixed)

```
Workout
├── Step 1 (stepIndex: 1) → ID: "step-1"
├── Step 2 (stepIndex: 2) → ID: "step-2"
├── Repetition Block A (index: 2)
│   ├── Step 1 (stepIndex: 1) → ID: "block-2-step-1" ✅ UNIQUE
│   └── Step 2 (stepIndex: 2) → ID: "block-2-step-2" ✅ UNIQUE
└── Repetition Block B (index: 3)
    ├── Step 1 (stepIndex: 1) → ID: "block-3-step-1" ✅ UNIQUE
    └── Step 2 (stepIndex: 2) → ID: "block-3-step-2" ✅ UNIQUE
```

## Components and Interfaces

### Modified Components

#### 1. `use-workout-list-dnd.ts`

**Current Implementation:**

```typescript
const generateStepId = (
  step: WorkoutStep | RepetitionBlock,
  index: number
): string => {
  if (isWorkoutStep(step)) {
    return `step-${step.stepIndex}`;
  }
  return `block-${index}`;
};
```

**Proposed Implementation:**

```typescript
/**
 * Generates a globally unique ID for a workout item
 * @param item - The workout step or repetition block
 * @param index - The item's position in the parent container
 * @param parentBlockIndex - Optional parent block index for nested steps
 * @returns A unique identifier string
 */
const generateStepId = (
  item: WorkoutStep | RepetitionBlock,
  index: number,
  parentBlockIndex?: number
): string => {
  if (isWorkoutStep(item)) {
    // Steps in main workout: "step-{stepIndex}"
    // Steps in blocks: "block-{blockIndex}-step-{stepIndex}"
    if (parentBlockIndex !== undefined) {
      return `block-${parentBlockIndex}-step-${item.stepIndex}`;
    }
    return `step-${item.stepIndex}`;
  }
  // Repetition blocks: "block-{index}"
  return `block-${index}`;
};
```

#### 2. `WorkoutListContent.tsx`

**Changes:**

- Pass `parentBlockIndex` parameter when rendering steps inside repetition blocks
- Update the `generateStepId` function signature to accept optional parent context

#### 3. `SortableRepetitionBlockCard.tsx`

**Changes:**

- Generate unique IDs for steps within the block using the block's index
- Update ID parsing logic to handle the new hierarchical format

#### 4. `render-workout-item.tsx`

**Changes:**

- Pass block index to step rendering when inside a repetition block
- Ensure ID generation includes parent context

### New Utility Functions

#### `parseStepId(id: string): StepIdParts`

Parses a step ID into its component parts for easier manipulation.

```typescript
type StepIdParts = {
  type: "step" | "block";
  blockIndex?: number;
  stepIndex?: number;
};

/**
 * Parses a step ID into its component parts
 * Examples:
 *   "step-1" → { type: 'step', stepIndex: 1 }
 *   "block-2-step-1" → { type: 'step', blockIndex: 2, stepIndex: 1 }
 *   "block-2" → { type: 'block', blockIndex: 2 }
 */
function parseStepId(id: string): StepIdParts {
  const parts = id.split("-");

  if (parts[0] === "block" && parts.length === 4) {
    // Format: "block-{blockIndex}-step-{stepIndex}"
    return {
      type: "step",
      blockIndex: Number.parseInt(parts[1], 10),
      stepIndex: Number.parseInt(parts[3], 10),
    };
  }

  if (parts[0] === "step" && parts.length === 2) {
    // Format: "step-{stepIndex}"
    return {
      type: "step",
      stepIndex: Number.parseInt(parts[1], 10),
    };
  }

  if (parts[0] === "block" && parts.length === 2) {
    // Format: "block-{blockIndex}"
    return {
      type: "block",
      blockIndex: Number.parseInt(parts[1], 10),
    };
  }

  throw new Error(`Invalid step ID format: ${id}`);
}
```

## Data Models

### Step ID Format

The ID format follows a hierarchical pattern that encodes the step's location:

| Context           | Format                                | Example          | Description                       |
| ----------------- | ------------------------------------- | ---------------- | --------------------------------- |
| Main workout step | `step-{stepIndex}`                    | `step-1`         | Step in the main workout sequence |
| Block step        | `block-{blockIndex}-step-{stepIndex}` | `block-2-step-1` | Step inside a repetition block    |
| Repetition block  | `block-{blockIndex}`                  | `block-2`        | The repetition block itself       |

### Selection State

The selection state in the store remains unchanged:

```typescript
type WorkoutStore = {
  selectedStepId: string | null; // Single selection
  selectedStepIds: Array<string>; // Multi-selection
  // ... other state
};
```

The IDs stored in these fields will now use the new hierarchical format, ensuring uniqueness.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: ID Uniqueness Across Workout

_For any_ workout with steps and repetition blocks, all generated step IDs must be unique across the entire workout structure.

**Validates: Requirements 1.3, 2.1, 2.2, 2.3**

**Test Strategy:**

- Generate a workout with multiple steps and repetition blocks
- Collect all generated IDs
- Verify no duplicates exist in the ID set

### Property 2: ID Parsing Round-Trip

_For any_ valid step ID, parsing and reconstructing the ID should produce an equivalent identifier.

**Validates: Requirements 2.4**

**Test Strategy:**

- Generate various step IDs (main workout, block steps, blocks)
- Parse each ID using `parseStepId`
- Reconstruct the ID from parsed parts
- Verify original ID equals reconstructed ID

### Property 3: Selection Isolation

_For any_ step selection operation, only the step with the exact matching ID should be selected, regardless of stepIndex values.

**Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.2, 3.3**

**Test Strategy:**

- Create a workout with steps having duplicate stepIndex values
- Select a step by its unique ID
- Verify only one step is marked as selected
- Verify the selected step's ID matches the selection

### Property 4: Multi-Selection Uniqueness

_For any_ multi-selection operation with modifier keys, each clicked step should be independently added to or removed from the selection set.

**Validates: Requirements 5.1, 5.2, 5.3**

**Test Strategy:**

- Create a workout with multiple blocks containing steps with same stepIndex
- Simulate Cmd/Ctrl+click on multiple steps
- Verify each step is independently selected
- Verify selection set contains only explicitly clicked step IDs

### Property 5: Block Context Preservation

_For any_ step inside a repetition block, the generated ID must include the parent block's index.

**Validates: Requirements 2.2, 3.1, 3.2**

**Test Strategy:**

- Create a workout with multiple repetition blocks
- Generate IDs for all steps in all blocks
- Parse each ID and verify block context is present
- Verify block index in ID matches actual parent block position

## Error Handling

### Invalid ID Format

When parsing step IDs, the system should handle malformed IDs gracefully:

```typescript
try {
  const parts = parseStepId(id);
  // Use parsed parts
} catch (error) {
  logger.warn("Invalid step ID format", { id, error });
  // Fallback: treat as unselected
  return false;
}
```

### Missing Parent Context

When generating IDs for steps in blocks, if parent context is missing:

```typescript
if (isWorkoutStep(item) && isInsideBlock && parentBlockIndex === undefined) {
  logger.error("Missing parent block index for step in block", {
    stepIndex: item.stepIndex,
  });
  // Fallback: generate ID without parent context (may cause collision)
  return `step-${item.stepIndex}`;
}
```

## Testing Strategy

### Unit Tests

**Test File:** `use-workout-list-dnd.test.ts`

1. **ID Generation Tests**
   - Test main workout step ID generation
   - Test repetition block ID generation
   - Test block step ID generation with parent context
   - Test ID uniqueness across complex workout structures

2. **ID Parsing Tests**
   - Test parsing main workout step IDs
   - Test parsing block step IDs
   - Test parsing block IDs
   - Test error handling for invalid formats

**Test File:** `render-step.test.tsx`

3. **Selection Tests**
   - Test single step selection with unique IDs
   - Test that steps with same stepIndex but different IDs are not both selected
   - Test multi-selection with modifier keys
   - Test selection state updates

### Integration Tests

**Test File:** `WorkoutList.integration.test.tsx`

1. **End-to-End Selection Flow**
   - Render workout with repetition blocks
   - Click on main workout step
   - Verify only that step is selected
   - Click on step inside block
   - Verify only that step is selected
   - Verify previous selection is cleared

2. **Multi-Selection Flow**
   - Render workout with multiple blocks
   - Cmd/Ctrl+click on multiple steps
   - Verify all clicked steps are selected
   - Verify steps with same stepIndex in different blocks are independently selectable

### E2E Tests

**Test File:** `e2e/step-selection.spec.ts`

1. **Visual Selection Verification**
   - Load workout with repetition blocks
   - Click on step in main workout
   - Verify visual selection indicator appears only on that step
   - Click on step in block
   - Verify visual selection indicator moves to new step

2. **Multi-Selection Visual Verification**
   - Load workout with multiple blocks
   - Cmd/Ctrl+click on multiple steps across blocks
   - Verify all clicked steps show selection indicator
   - Verify steps with same stepIndex in different blocks can be independently selected

## Migration Strategy

### Phase 1: Update ID Generation

1. Modify `generateStepId` function in `use-workout-list-dnd.ts`
2. Add `parentBlockIndex` parameter
3. Update ID format for block steps

### Phase 2: Update Component Props

1. Update `WorkoutListContent` to pass parent context
2. Update `SortableRepetitionBlockCard` to use new ID format
3. Update `render-workout-item` to handle parent context

### Phase 3: Update ID Parsing

1. Add `parseStepId` utility function
2. Update components that parse step IDs
3. Update selection logic to use parsed IDs

### Phase 4: Testing

1. Add unit tests for ID generation and parsing
2. Add integration tests for selection behavior
3. Add E2E tests for visual verification
4. Run full test suite to verify no regressions

### Backward Compatibility

The new ID format is backward compatible in the sense that:

- Old IDs (`step-1`) are still valid for main workout steps
- The system doesn't persist IDs (they're generated on render)
- No migration of stored data is required

However, any code that manually constructs or parses step IDs will need to be updated to handle the new format.

## Performance Considerations

### ID Generation Performance

The new ID generation adds minimal overhead:

- String concatenation: O(1)
- No additional data structures required
- Generated on-demand during render

### Selection Performance

Selection performance remains unchanged:

- ID lookup: O(1) with Set or Map
- No additional iterations required
- Same selection state structure

## Accessibility

The new ID format maintains accessibility:

- IDs are still valid HTML identifiers
- Screen readers can still navigate steps
- Keyboard navigation remains functional
- ARIA labels remain descriptive

## Security

No security implications:

- IDs are generated client-side
- No user input in ID generation
- No XSS risk (IDs are not rendered as HTML)

## Future Enhancements

### Nested Repetition Blocks

If the system later supports nested repetition blocks, the ID format can be extended:

```typescript
// Current: "block-2-step-1"
// Nested: "block-2-block-3-step-1"
```

The hierarchical format naturally supports arbitrary nesting depth.

### Persistent IDs

If steps need persistent IDs across sessions:

```typescript
type WorkoutStep = {
  stepIndex: number;
  uuid?: string; // Optional persistent ID
  // ... other fields
};

// Use UUID if available, otherwise generate hierarchical ID
const id = step.uuid || generateStepId(step, index, parentBlockIndex);
```

## References

- [React Keys Documentation](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- [dnd-kit Sortable Documentation](https://docs.dndkit.com/presets/sortable)
- [Zustand Store Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
