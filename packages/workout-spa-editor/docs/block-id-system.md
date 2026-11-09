# Block ID System

This document describes the block ID system that ensures correct identification and manipulation of repetition blocks throughout the application.

## Overview

Each repetition block has a unique `id` field that serves as its stable identifier across all operations. This system was introduced to fix a critical bug where the wrong block could be deleted when blocks were reordered via drag-and-drop.

## Problem Statement

### The Bug (Before Block IDs)

Previously, blocks were identified and manipulated using array indices. This caused several issues:

1. **Wrong Block Deletion**: When blocks were reordered via drag-and-drop, the visual order didn't match the data order, causing the wrong block to be deleted
2. **Race Conditions**: Rapid operations could target the wrong block
3. **Undo Issues**: Restoring blocks at incorrect positions after undo

**Example of the bug**:

```
Visual order: [Block A, Block B, Block C]
Data order:   [Block C, Block A, Block B] (after drag-drop)

User clicks delete on Block B (visual index 1)
System deletes data[1] = Block A ❌ WRONG BLOCK
```

### The Solution (With Block IDs)

Each block now has a unique ID that:

- **Persists across operations**: Never changes, even when blocks are reordered
- **Enables correct lookup**: `findBlockById()` locates the correct block regardless of position
- **Supports undo/redo**: Allows precise restoration of deleted blocks
- **Backward compatible**: Optional field that's added automatically to existing workouts

**Example with IDs**:

```
Visual order: [Block A (id: "block-123"), Block B (id: "block-456"), Block C (id: "block-789")]
Data order:   [Block C (id: "block-789"), Block A (id: "block-123"), Block B (id: "block-456")]

User clicks delete on Block B (id: "block-456")
System finds and deletes block with id "block-456" ✅ CORRECT BLOCK
```

## ID Format

Block IDs follow a consistent format: `block-{timestamp}-{random}`

### Components

- **Prefix**: `block-` (identifies this as a block ID)
- **Timestamp**: Current time in milliseconds from `Date.now()`
- **Random**: Random alphanumeric string (9 characters from base-36)

### Example

```typescript
const id = generateBlockId();
// => "block-1704123456789-x7k2m9p4q"
```

### Properties

- **Uniqueness**: Combination of timestamp + random ensures uniqueness
- **Sortability**: Timestamp prefix allows chronological sorting
- **Readability**: Human-readable format for debugging
- **Performance**: < 1ms generation time

## ID Generation

### When IDs Are Generated

IDs are automatically generated in these scenarios:

1. **Creating new blocks**:
   - `createEmptyRepetitionBlockAction()` - Creates a new empty block
   - `createRepetitionBlockAction()` - Creates a block from selected steps

2. **Loading or importing workouts**:
   - `hydrateUIWorkout()` gives every step and block a fresh `ItemId`
   - Runs whenever a KRD enters the store, so stored ids are not reused

### Generation Function

```typescript
/**
 * Generates a unique identifier for repetition blocks.
 *
 * Format: `block-{timestamp}-{random}`
 * - timestamp: Current time in milliseconds (Date.now())
 * - random: Random alphanumeric string for uniqueness
 *
 * Performance: < 1ms per generation
 *
 * @returns A unique block ID string
 *
 * @example
 * const id = generateBlockId();
 * // => "block-1704123456789-x7k2m9p4q"
 */
export const generateBlockId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `block-${timestamp}-${random}`;
};
```

**Location**: `src/utils/id-generation.ts`

## IDs on Load

There is no separate migration pass. `hydrateUIWorkout()` in
`src/store/hydrate-ui-workout.ts` runs whenever a KRD is loaded into the
store, and by default it regenerates the `ItemId` of every step and block
(`preserveExistingIds: false`). Stable ids are an in-memory UI concern, so a
workout saved without block ids, or with ids from another source, gets a
complete set on load. `preserveExistingIds: true` is an opt-in for
deterministic tests.

```typescript
const workout = hydrateUIWorkout(krd);
// every step and block in workout now carries an ItemId
```

## Type Definition

### Schema

```typescript
// From @kaiord/core
type RepetitionBlock = {
  id?: string; // Optional for backward compatibility
  repeatCount: number;
  steps: Array<WorkoutStep>;
};
```

### Why Optional?

The `id` field is optional in the type definition to maintain backward compatibility with:

- Existing KRD files that don't have block IDs
- External systems that generate KRD files
- Test fixtures that may not include IDs

However, **all blocks in the application will have IDs** once `hydrateUIWorkout()` has run on load.

### Validation

The application validates that blocks have IDs before performing operations:

```typescript
// In component
if (!block.id) {
  console.error("Block missing ID");
  return;
}

// In store action
const blockInfo = findBlockById(workout, blockId);
if (!blockInfo) {
  console.error(`Block not found: ${blockId}`);
  return {};
}
```

## ID-Based Operations

### Block Deletion

**Before (Index-based)**:

```typescript
// ❌ Fragile - depends on array position
deleteRepetitionBlock(blockIndex: number)
```

**After (ID-based)**:

```typescript
// ✅ Robust - uses stable identifier
deleteRepetitionBlock(blockId: string)
```

### Block Editing

**Before (Index-based)**:

```typescript
// ❌ Fragile
editRepetitionBlock(blockIndex: number, repeatCount: number)
```

**After (ID-based)**:

```typescript
// ✅ Robust
editRepetitionBlock(blockId: string, repeatCount: number)
```

### Block Ungrouping

**Before (Index-based)**:

```typescript
// ❌ Fragile
ungroupRepetitionBlock(blockIndex: number)
```

**After (ID-based)**:

```typescript
// ✅ Robust
ungroupRepetitionBlock(blockId: string)
```

## Finding Blocks by ID

### findBlockById Function

```typescript
/**
 * Finds a repetition block by its unique ID.
 *
 * @param workout - The workout to search
 * @param blockId - The unique ID of the block to find
 * @returns Object with block and position, or null if not found
 */
export const findBlockById = (
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
```

**Location**: `src/store/actions/delete-repetition-block-action.ts`

### Performance

- **Time complexity**: O(n) where n is the number of steps in the workout
- **Typical workouts**: < 50 steps, so performance is excellent
- **Early return**: Stops searching when block is found
- **Benchmark**: < 1ms for typical workouts

### Usage

```typescript
// Find a block
const result = findBlockById(workout, "block-1704123456789-x7k2m9p4q");

if (result) {
  console.log(`Found block at position ${result.position}`);
  console.log(`Block has ${result.block.steps.length} steps`);
  console.log(`Repeat count: ${result.block.repeatCount}`);
} else {
  console.error("Block not found");
}
```

## Component Integration

### RepetitionBlockCard

The component receives and uses the block ID:

```typescript
<RepetitionBlockCard
  block={block} // Contains block.id
  onDelete={() => deleteRepetitionBlock(block.id)} // Uses ID, not index
  onEditRepeatCount={(count) => editBlock(block.id, count)}
  onUngroup={() => ungroupBlock(block.id)}
  // ... other props
/>
```

### Key Points

- Component validates that `block.id` exists
- Delete handler receives block ID as parameter
- No array indices are passed to delete operations
- UI rendering uses block ID as React key for stability

### React Keys

Block IDs are used as React keys for optimal rendering:

```typescript
{workout.steps.map((step) => {
  if (isRepetitionBlock(step)) {
    return (
      <RepetitionBlockCard
        key={step.id} // Stable key for React reconciliation
        block={step}
        // ... props
      />
    );
  }
  // ... handle WorkoutStep
})}
```

## Store Integration

### Store Actions

All block operations now use IDs:

```typescript
// Store hook
const {
  deleteRepetitionBlock, // (blockId: string) => void
  editRepetitionBlock, // (blockId: string, count: number) => void
  ungroupRepetitionBlock, // (blockId: string) => void
  addStepToRepetitionBlock, // (blockId: string, step: WorkoutStep) => void
} = useWorkoutStore();

// Usage
deleteRepetitionBlock(block.id);
editRepetitionBlock(block.id, 5);
ungroupRepetitionBlock(block.id);
```

### Type Signatures

```typescript
// Before (Index-based)
deleteRepetitionBlock: (blockIndex: number) => void;

// After (ID-based)
deleteRepetitionBlock: (blockId: string) => void;
```

## Testing

### Unit Tests

**Block ID System**:

- `src/types/schemas/repetition-block-id.test.ts` - Schema validation
- `src/utils/id-generation.test.ts` - ID generation tests
- `src/store/hydrate-ui-workout.test.ts` - ID assignment on load

**Store Actions**:

- `src/store/actions/delete-repetition-block-action.test.ts` - ID-based deletion
- `src/store/actions/block-operations-integration.test.ts` - Integration tests
- `src/store/actions/block-id-stability.test.ts` - ID stability tests

### Property-Based Tests

**Core Properties**:

- Property 1: Correct block deletion by ID
- Property 2: Block ID uniqueness
- Property 3: Block ID stability
- Property 8: Step index recalculation

### Integration Tests

- `src/store/workout-loading-integration.test.ts` - Workout loading
- `src/store/actions/performance.test.ts` - Performance benchmarks

### E2E Tests

- `e2e/repetition-blocks.spec.ts` - Block deletion user flows
  - Test 15: Correct block deletion (verifies bug fix)
  - Test 16: Undo functionality
  - Test 17: Multiple block deletion
  - Test 18: Button styling consistency

## Performance

### Benchmarks

- **ID generation**: < 1ms per ID
- **Block lookup**: < 1ms for typical workouts (< 50 steps)
- **Memory overhead**: ~50 bytes per block (negligible)

### Optimization

The system is optimized for:

- **Fast generation**: Simple timestamp + random string
- **Fast lookup**: Linear search with early return
- **Minimal memory**: IDs are small strings (~30 characters)
- **No external dependencies**: Pure JavaScript implementation

## Best Practices

### DO

✅ **Always use block IDs for operations**: Never use array indices
✅ **Validate IDs exist**: Check `block.id` before operations
✅ **Use findBlockById**: Don't manually search for blocks
✅ **Preserve IDs in undo/redo**: Include IDs in history snapshots
✅ **Use IDs as React keys**: Ensures stable component identity

### DON'T

❌ **Don't use array indices**: They change when blocks are reordered
❌ **Don't mutate IDs**: IDs should never change after creation
❌ **Don't assume ID format**: Use the ID as an opaque string
❌ **Don't bypass hydration**: Load workouts through the store so `hydrateUIWorkout()` assigns ids
❌ **Don't hardcode IDs**: Always generate them dynamically

## Troubleshooting

### Block Not Found

**Symptom**: `findBlockById()` returns `null`

**Possible causes**:

1. Block was already deleted
2. ID is incorrect (typo or wrong variable)
3. The workout skipped `hydrateUIWorkout()` (block has no ID)

**Solution**:

```typescript
const result = findBlockById(workout, blockId);
if (!result) {
  console.error(`Block not found: ${blockId}`);
  console.log(
    "Available blocks:",
    workout.steps.filter(isRepetitionBlock).map((b) => b.id)
  );
  return;
}
```

### Missing IDs

**Symptom**: Blocks don't have IDs

**Possible causes**:

1. The workout was not loaded through the store, so `hydrateUIWorkout()` did not run
2. External KRD file without IDs, read directly

**Solution**:

```typescript
// Assign ids the same way the store does on load
const hydrated = hydrateUIWorkout(krd);
```

### Wrong Block Deleted

**Symptom**: Different block is deleted than expected

**Possible causes**:

1. Using array index instead of ID
2. ID is incorrect
3. Block was already deleted

**Solution**:

```typescript
// Always use IDs, not indices
deleteRepetitionBlock(block.id); // ✅ Correct
deleteRepetitionBlock(blockIndex); // ❌ Wrong
```

## Related Documentation

- [Repetition Block Deletion](./repetition-block-deletion.md) - Complete deletion documentation
- [Keyboard Shortcuts](./keyboard-shortcuts.md) - Keyboard navigation guide
- [Performance Optimization](./performance-optimization.md) - Performance best practices

## Requirements

This system implements the following requirements:

- **Requirement 1.1-1.4**: Correct block deletion by ID
- **Requirement 2.1-2.2**: Block ID uniqueness
- **Requirement 2.3**: Block ID stability and migration
- **Requirement 2.4-2.5**: ID-based operations
