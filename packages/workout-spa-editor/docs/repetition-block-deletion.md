# Repetition Block Deletion

This document describes the repetition block deletion feature, including the block ID system that ensures correct block deletion.

## Overview

Users can delete entire repetition blocks (including all contained steps) with a single action. The system uses unique block IDs to ensure the correct block is always deleted, even when blocks are reordered or modified.

### Key Features

- **Unique Block IDs**: Each block has a stable, unique identifier
- **ID-Based Deletion**: Blocks are deleted by ID, not array index
- **UI Delete Button**: Click the delete button in the block header
- **Keyboard Shortcuts**: Press `Delete` or `Backspace` when a block is focused
- **Undo Support**: Full undo/redo capability for deleted blocks
- **Focus Management**: Automatic focus handling after deletion
- **Migration Support**: Existing workouts are automatically migrated to use block IDs

## User Interface

### Delete Button

Each repetition block displays a delete button in its header:

- **Location**: Right side of the block header, next to the ungroup button
- **Icon**: Trash icon (from lucide-react)
- **Tooltip**: "Delete repetition block" on hover
- **Style**: Destructive variant (red color) to indicate permanent action
- **Accessibility**: Keyboard accessible with proper ARIA labels

### Visual Feedback

When a block is deleted:

1. **Fade-out animation**: The block smoothly fades out (200ms)
2. **Layout reflow**: Remaining blocks adjust position smoothly
3. **Focus indicator**: Focus moves to the next logical element
4. **Undo notification**: (Future enhancement) Toast notification with undo option

## Keyboard Shortcuts

### Delete Block

- **Keys**: `Delete` or `Backspace`
- **Context**: Block must be focused (click on block or tab to it)
- **Behavior**: Immediately deletes the block without confirmation
- **Undo**: Press `Ctrl+Z` / `Cmd+Z` to restore

### Focus Management

After deletion, focus moves in this order:

1. **Next block**: If there's a block after the deleted one
2. **Previous block**: If the deleted block was last
3. **Next step**: If no blocks remain, focus moves to the next step
4. **Add step button**: If no other elements exist

## Undo/Redo Support

### Undo Deletion

- **Shortcut**: `Ctrl+Z` / `Cmd+Z`
- **Behavior**: Restores the deleted block at its original position
- **State Restoration**: All block properties and steps are restored exactly
- **Focus**: Focus returns to the restored block

### Redo Deletion

- **Shortcut**: `Ctrl+Y` / `Cmd+Y` or `Ctrl+Shift+Z` / `Cmd+Shift+Z`
- **Behavior**: Re-deletes the block
- **Focus**: Focus moves to the next logical element (same as initial deletion)

## Block ID System

### Overview

Each repetition block has a unique `id` field that serves as its stable identifier. This ID:

- **Persists across operations**: Remains constant when blocks are reordered, edited, or moved
- **Enables correct deletion**: Ensures the right block is deleted even after UI reordering
- **Supports undo/redo**: Allows precise restoration of deleted blocks
- **Backward compatible**: Optional field that's added automatically to existing workouts

### ID Format

Block IDs follow the format: `block-{timestamp}-{random}`

```typescript
// Example: "block-1704123456789-x7k2m9p4q"
const id = generateBlockId();
```

**Components**:

- `timestamp`: Current time in milliseconds (Date.now())
- `random`: Random alphanumeric string (9 characters)

**Performance**: < 1ms per generation

### ID Generation

IDs are generated automatically when:

1. **Creating new blocks**: `createEmptyRepetitionBlockAction()` and `createRepetitionBlockAction()`
2. **Loading workouts**: `migrateRepetitionBlocks()` adds IDs to blocks without them
3. **Importing workouts**: Migration runs automatically on load

### Migration Strategy

Existing workouts without block IDs are automatically migrated:

```typescript
// Before migration
const workout = {
  sport: "running",
  steps: [
    { repeatCount: 3, steps: [...] } // No ID
  ]
};

// After migration
const migrated = migrateRepetitionBlocks(workout);
// migrated.steps[0].id => "block-1704123456789-x7k2m9p4q"
```

**Migration behavior**:

- ✅ Adds IDs to blocks without them
- ✅ Preserves existing IDs if present
- ✅ Returns new workout object (immutable)
- ✅ Runs automatically on workout load
- ✅ Zero user intervention required

### Type Definition

```typescript
// From @kaiord/core
type RepetitionBlock = {
  id?: string; // Optional for backward compatibility
  repeatCount: number;
  steps: Array<WorkoutStep>;
};
```

The `id` field is optional in the type definition to maintain backward compatibility with existing KRD files, but all blocks in the application will have IDs after migration.

## Technical Details

### Store Actions

**`deleteRepetitionBlockAction(blockId: string)`**

- **Input**: Block ID (string), not array index
- **Process**:
  1. Finds block by ID using `findBlockById()`
  2. Removes the block and all its steps from the workout
  3. Recalculates `stepIndex` for all remaining steps
  4. Clears any selections that referenced deleted steps
  5. Updates workout statistics (duration, distance, etc.)
  6. Adds deletion to undo history
- **Returns**: Updated state with modified workout

**`findBlockById(workout: Workout, blockId: string)`**

- **Purpose**: Locates a repetition block by its unique ID
- **Returns**: `{ block: RepetitionBlock, position: number } | null`
- **Performance**: O(n) where n is the number of steps in the workout
- **Usage**: Internal helper for ID-based block operations

### State Management

The deletion is stored in the undo history as a complete workout snapshot:

```typescript
type HistoryEntry = {
  workout: Workout;
  timestamp: number;
};
```

This ensures perfect restoration of the deleted block with all its properties, including its unique ID.

### Step Index Recalculation

After deletion, all remaining steps get sequential indices:

```typescript
// Before deletion: [0, 1, 2, 3, 4, 5]
// Delete block at index 2-3
// After deletion: [0, 1, 2, 3] (recalculated)
```

This maintains data integrity and prevents index gaps.

### Component Integration

**RepetitionBlockCard Component**

The component receives and uses the block ID:

```typescript
<RepetitionBlockCard
  block={block} // Contains block.id
  onDelete={() => deleteRepetitionBlock(block.id)} // Uses ID, not index
  // ... other props
/>
```

**Key points**:

- Component validates that `block.id` exists
- Delete handler receives block ID as parameter
- No array indices are passed to delete operations
- UI rendering uses block ID as React key for stability

## Accessibility

### WCAG 2.1 AA Compliance

- ✅ **Keyboard Navigation**: Full keyboard support for deletion
- ✅ **Focus Management**: Logical focus order after deletion
- ✅ **Screen Reader**: Proper ARIA labels and announcements
- ✅ **Visual Indicators**: Clear focus indicators on delete button
- ✅ **Touch Targets**: Minimum 44x44px touch target size

### Screen Reader Announcements

- **Delete button**: "Delete repetition block, button"
- **After deletion**: "Repetition block deleted. Press Ctrl+Z to undo."
- **After undo**: "Repetition block restored"

## Best Practices

### When to Delete vs Ungroup

- **Delete**: Remove the entire block and all its steps permanently
- **Ungroup**: Convert the block into individual steps (preserves steps)

### Preventing Accidental Deletion

While there's no confirmation modal for deletion (to maintain workflow speed), users can:

1. **Undo immediately**: Press `Ctrl+Z` / `Cmd+Z` right after deletion
2. **Review before deleting**: Check the block contents before clicking delete
3. **Use ungroup instead**: If you want to keep the steps, use ungroup first

## Examples

### Example 1: Delete Middle Block

**Initial State**:

```
Block 1: 3 steps
Block 2: 2 steps ← Delete this
Block 3: 4 steps
```

**After Deletion**:

```
Block 1: 3 steps
Block 2: 4 steps (was Block 3, index recalculated)
```

**Focus**: Moves to Block 2 (previously Block 3)

### Example 2: Delete Last Block

**Initial State**:

```
Block 1: 3 steps
Block 2: 2 steps ← Delete this
```

**After Deletion**:

```
Block 1: 3 steps
```

**Focus**: Moves to Block 1 (previous block)

### Example 3: Delete Only Block

**Initial State**:

```
Block 1: 2 steps ← Delete this
```

**After Deletion**:

```
(empty workout)
```

**Focus**: Moves to "Add Step" button

## Bug Fix: Correct Block Deletion

### Problem (Before Block IDs)

Previously, blocks were deleted by array index, which caused issues:

1. **Wrong block deleted**: When UI reordering occurred (drag-and-drop), the visual order didn't match the data order
2. **Race conditions**: Rapid operations could target the wrong block
3. **Undo issues**: Restoring blocks at incorrect positions

**Example of the bug**:

```
Visual order: [Block A, Block B, Block C]
Data order:   [Block C, Block A, Block B] (after drag-drop)

User clicks delete on Block B (visual index 1)
System deletes data[1] = Block A ❌ WRONG BLOCK
```

### Solution (With Block IDs)

Blocks are now deleted by unique ID:

1. **Stable identifiers**: Each block has a unique ID that never changes
2. **ID-based lookup**: `findBlockById()` locates the correct block regardless of position
3. **Correct deletion**: Always deletes the intended block, even after reordering

**Example with IDs**:

```
Visual order: [Block A (id: "block-123"), Block B (id: "block-456"), Block C (id: "block-789")]
Data order:   [Block C (id: "block-789"), Block A (id: "block-123"), Block B (id: "block-456")]

User clicks delete on Block B (id: "block-456")
System finds and deletes block with id "block-456" ✅ CORRECT BLOCK
```

### Implementation Details

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

## Testing

### Unit Tests

**Block ID System**:

- `src/types/schemas/repetition-block-id.test.ts` - Block ID schema validation
- `src/utils/id-generation.test.ts` - ID generation tests
- `src/utils/workout-migration.test.ts` - Migration tests

**Store Actions**:

- `src/store/actions/delete-repetition-block-action.test.ts` - ID-based deletion tests
- `src/store/actions/block-operations-integration.test.ts` - Integration tests
- `src/store/actions/block-id-stability.test.ts` - ID stability tests

**Component Tests**:

- `src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.test.tsx` - Component tests
- `src/components/molecules/delete-button-styling.test.tsx` - Button styling tests

### Property-Based Tests

**Core Properties**:

- Property 1: Correct block deletion by ID (validates Requirements 1.1-1.4)
- Property 2: Block ID uniqueness (validates Requirements 2.1-2.2)
- Property 3: Block ID stability (validates Requirement 2.3)
- Property 8: Step index recalculation (validates Requirement 1.5)

**Additional Tests**:

- Block deletion removes all contained steps
- Step indices remain sequential after deletion
- Block deletion is undoable (round-trip)
- Deletion clears affected selections
- Statistics consistency after deletion

### Integration Tests

- `src/store/workout-loading-integration.test.ts` - Workout loading with migration
- `src/store/actions/performance.test.ts` - Performance benchmarks

### E2E Tests

- `e2e/repetition-blocks.spec.ts` - Block deletion user flows
  - Test 15: Correct block deletion (verifies bug fix)
  - Test 16: Undo functionality after deletion
  - Test 17: Multiple block deletion
  - Test 18: Button styling consistency
- `e2e/accessibility.spec.ts` - Keyboard navigation and focus management

## Related Documentation

- [Keyboard Shortcuts](./keyboard-shortcuts.md) - Complete keyboard navigation guide
- [Modal System](./modal-system.md) - Confirmation modal documentation

## Requirements

This feature implements the following requirements from the specification:

- **Requirement 2**: Delete Repetition Block
- **Requirement 3**: UI for Block Deletion
- **Requirement 4**: Keyboard Accessibility for Block Operations

See `.kiro/specs/workout-spa-editor/09-repetition-blocks-and-ui-polish/requirements.md` for complete requirements.
