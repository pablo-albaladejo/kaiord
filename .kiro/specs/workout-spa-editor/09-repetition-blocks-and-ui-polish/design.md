# Design Document

## Overview

This design addresses three main areas of improvement for the Workout SPA Editor:

1. **Repetition Block Usability**: Ensuring new repetition blocks are immediately useful by including a default step
2. **Block Deletion**: Adding the ability to delete entire repetition blocks with proper undo support
3. **UI Polish**: Improving button organization, styling, and replacing browser alerts with modal dialogs

These improvements enhance the user experience while maintaining backward compatibility with existing functionality.

## Architecture

### Component Structure

```
WorkoutEditor (Page)
├── WorkoutMetadata (Organism)
│   ├── MetadataForm (Molecule)
│   └── ActionButtons (Molecule) ← UPDATED: Better organization and styling
├── WorkoutStepList (Organism)
│   ├── RepetitionBlockCard (Molecule) ← UPDATED: Add delete button
│   │   ├── BlockHeader (Molecule) ← UPDATED: Include delete action
│   │   ├── StepCard (Molecule)
│   │   └── BlockFooter (Molecule)
│   └── StepCard (Molecule)
└── ConfirmationModal (Molecule) ← NEW: Replace browser alerts
```

### State Management (Zustand Store)

**New Actions**:

- `deleteRepetitionBlock(blockIndex: number)` - Delete entire block with undo support
- `showConfirmationModal(config: ModalConfig)` - Show confirmation modal
- `hideConfirmationModal()` - Dismiss modal

**Modified Actions**:

- `createEmptyRepetitionBlock(repeatCount: number)` - Now adds default step automatically

**New State**:

```typescript
type ModalConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant: "default" | "destructive";
};

type WorkoutState = {
  // ... existing state
  modalConfig: ModalConfig | null;
  isModalOpen: boolean;
};
```

## Components and Interfaces

### 1. RepetitionBlockCard Updates

**New Props**:

```typescript
type RepetitionBlockCardProps = {
  block: RepetitionBlock;
  blockIndex: number;
  onDelete: (blockIndex: number) => void; // NEW
  onEdit: (blockIndex: number, repeatCount: number) => void;
  onUngroup: (blockIndex: number) => void;
  // ... existing props
};
```

**Behavior**:

- Display delete button in block header
- Handle keyboard shortcuts (Delete/Backspace) when block is selected
- Show tooltip on delete button hover
- Call `onDelete` when delete is triggered

### 2. ConfirmationModal Component (NEW)

**Props**:

```typescript
type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant: "default" | "destructive";
};
```

**Features**:

- Focus trap (keyboard navigation stays within modal)
- Backdrop click to dismiss
- Escape key to dismiss
- Focus restoration after dismissal
- Accessible (ARIA labels, roles)
- Responsive (adapts to mobile screens)

### 3. ActionButtons Component Updates

**Improvements**:

- Consistent spacing (12px gap between buttons)
- Proper button variants (primary vs secondary)
- Title case labels ("Save Workout" not "save workout")
- Logical grouping (primary actions left, secondary right)
- Responsive layout (stack on mobile)

## Data Models

### Default Step Template

```typescript
const DEFAULT_STEP: Omit<WorkoutStep, "stepIndex"> = {
  durationType: "time",
  duration: {
    type: "time",
    seconds: 300, // 5 minutes
  },
  targetType: "open",
  target: {
    type: "open",
  },
  intensity: "active",
};
```

### Deletion History Entry

```typescript
type DeletionHistoryEntry = {
  type: "block-deletion";
  blockIndex: number;
  block: RepetitionBlock;
  timestamp: number;
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Empty blocks always contain default step

_For any_ newly created empty repetition block, the block should contain exactly one step with the default values (5 minutes duration, open target, active intensity)

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Blocks from selected steps preserve step count

_For any_ set of selected steps, creating a repetition block from those steps should result in a block containing exactly those steps with no additions or removals

**Validates: Requirements 1.6, 7.1**

### Property 3: Block deletion removes all contained steps

_For any_ workout containing repetition blocks, deleting a block should remove the block and all its steps from the workout, with no orphaned steps remaining

**Validates: Requirements 2.1**

### Property 4: Step indices remain sequential after deletion

_For any_ workout, after deleting any repetition block, all remaining steps should have sequential stepIndex values starting from 0 with no gaps

**Validates: Requirements 2.2**

### Property 5: Block deletion is undoable (round-trip)

_For any_ workout state, deleting a repetition block and then undoing should restore the exact original state including block position, step count, and all step properties

**Validates: Requirements 2.3, 2.4**

### Property 6: Deletion clears affected selections

_For any_ workout with selected steps, deleting a repetition block that contains any selected steps should clear those selections from the selection state

**Validates: Requirements 2.5**

### Property 7: Statistics consistency after deletion

_For any_ workout, after deleting any repetition block, the workout statistics (total duration, distance, etc.) should match the sum of all remaining steps

**Validates: Requirements 2.7**

### Property 8: UI delete triggers actual deletion

_For any_ repetition block, clicking the delete button should result in the block being removed from the workout

**Validates: Requirements 3.2**

### Property 9: Keyboard delete equivalence

_For any_ repetition block, deleting via Delete key, Backspace key, or UI button should produce identical results including undo capability

**Validates: Requirements 3.6, 4.1, 4.6**

### Property 10: Focus management after deletion

_For any_ workout with multiple blocks, after deleting a block via keyboard, focus should move to the next block if available, otherwise to the previous block or add button

**Validates: Requirements 4.4**

### Property 11: Button capitalization consistency

_For all_ button labels in the metadata section, the text should follow title case capitalization (first letter of each major word capitalized)

**Validates: Requirements 5.7**

### Property 12: Responsive button layout

_For any_ viewport width, buttons in the metadata section should either display horizontally with proper spacing (desktop) or stack vertically (mobile) without overflow

**Validates: Requirements 5.6**

### Property 13: No browser alerts for confirmations

_For any_ user action requiring confirmation, the system should display a modal dialog and should never call `window.alert()`, `window.confirm()`, or `window.prompt()`

**Validates: Requirements 6.1**

### Property 14: Modal focus trap

_For any_ open modal dialog, pressing Tab or Shift+Tab should cycle focus only among elements within the modal, never moving focus to background content

**Validates: Requirements 6.3**

### Property 15: Modal dismissal with Escape

_For any_ open modal dialog, pressing the Escape key should dismiss the modal and restore focus to the triggering element

**Validates: Requirements 6.5**

### Property 16: Modal blocks background interaction

_For any_ open modal dialog, attempting to click or interact with background content should have no effect until the modal is dismissed

**Validates: Requirements 6.6**

### Property 17: Focus restoration after modal

_For any_ modal dialog, after dismissal (via cancel, confirm, or Escape), focus should return to the element that originally triggered the modal

**Validates: Requirements 6.7**

### Property 18: Responsive modal layout

_For any_ viewport size, modal dialogs should be fully visible and usable, adapting their size and layout appropriately for mobile screens

**Validates: Requirements 6.9**

### Property 19: Ungroup operation preservation

_For any_ repetition block, the ungroup operation should convert the block into individual steps with the same properties and order as before

**Validates: Requirements 7.2**

### Property 20: Backward compatibility with existing KRD files

_For any_ valid KRD file (including those with empty repetition blocks), loading the file should succeed and display the workout correctly

**Validates: Requirements 7.4**

## Error Handling

### Validation Errors

**Empty Block Deletion**:

- No special handling needed - empty blocks can be deleted like any other block

**Invalid Block Index**:

- Validate blockIndex is within bounds before deletion
- Log error and show user-friendly message if index is invalid

**Undo Stack Overflow**:

- Maintain maximum undo history size (50 states)
- Remove oldest entries when limit is reached

### User Feedback

**Successful Operations**:

- Block deletion: Visual feedback (fade-out animation)
- Undo: Visual feedback (fade-in animation)
- Modal confirmation: Clear button states (loading, success)

**Error States**:

- Invalid operations: Show error message in modal
- Network errors (future): Retry mechanism with user notification

## Testing Strategy

### Unit Tests

**Store Actions**:

- `createEmptyRepetitionBlock` - Verify default step is added
- `deleteRepetitionBlock` - Verify block and steps are removed
- `undo` after block deletion - Verify block is restored
- Step index recalculation after deletion
- Selection clearing after deletion
- Statistics update after deletion

**Components**:

- `RepetitionBlockCard` - Verify delete button renders
- `ConfirmationModal` - Verify focus trap, Escape key, backdrop click
- `ActionButtons` - Verify button order, spacing, capitalization

### Property-Based Tests

**Test Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Tests**:

1. **Empty blocks contain default step** (Property 1)
   - Generate: Random repeat counts (1-10)
   - Action: Create empty block
   - Verify: Block has exactly 1 step with default values

2. **Blocks from steps preserve count** (Property 2)
   - Generate: Random step arrays (1-20 steps)
   - Action: Create block from steps
   - Verify: Block step count equals input step count

3. **Deletion removes all steps** (Property 3)
   - Generate: Random workouts with blocks
   - Action: Delete random block
   - Verify: No steps from deleted block remain

4. **Sequential indices after deletion** (Property 4)
   - Generate: Random workouts with blocks
   - Action: Delete random block
   - Verify: All stepIndex values are sequential (0, 1, 2, ...)

5. **Deletion round-trip** (Property 5)
   - Generate: Random workouts with blocks
   - Action: Delete block, then undo
   - Verify: Workout state equals original state

6. **Selection clearing** (Property 6)
   - Generate: Random workouts with selected steps in blocks
   - Action: Delete block containing selections
   - Verify: Selection state is empty

7. **Statistics consistency** (Property 7)
   - Generate: Random workouts with blocks
   - Action: Delete random block
   - Verify: Total duration equals sum of remaining steps

8. **Keyboard delete equivalence** (Property 9)
   - Generate: Random workouts with blocks
   - Action: Delete via Delete key vs UI button
   - Verify: Both produce identical workout states

9. **Button capitalization** (Property 11)
   - Generate: All button labels in metadata section
   - Verify: Each label matches title case pattern

10. **No browser alerts** (Property 13)
    - Generate: Random confirmation scenarios
    - Action: Trigger confirmations
    - Verify: No calls to window.alert/confirm/prompt

11. **Modal focus trap** (Property 14)
    - Generate: Random modal configurations
    - Action: Open modal, press Tab repeatedly
    - Verify: Focus never leaves modal

12. **Modal Escape dismissal** (Property 15)
    - Generate: Random modal configurations
    - Action: Open modal, press Escape
    - Verify: Modal closes, focus restored

13. **Backward compatibility** (Property 20)
    - Generate: Random KRD files (including empty blocks)
    - Action: Load file
    - Verify: No errors, workout displays correctly

### E2E Tests (Playwright)

**User Flows**:

1. Create empty repetition block → Verify default step appears
2. Delete repetition block → Verify block is removed
3. Delete block → Undo → Verify block is restored
4. Delete block with keyboard → Verify focus moves correctly
5. Trigger confirmation → Verify modal appears (not browser alert)
6. Open modal → Press Escape → Verify modal closes
7. Open modal → Click backdrop → Verify modal closes
8. Resize viewport → Verify buttons stack on mobile

**Accessibility Tests**:

- Keyboard navigation through blocks and delete buttons
- Screen reader announcements for block deletion
- Focus management in modals
- ARIA labels and roles

### Integration Tests

**Store Integration**:

- Create block → Delete block → Undo → Redo
- Multiple block deletions in sequence
- Delete block → Create new block → Verify indices are correct

**Component Integration**:

- RepetitionBlockCard with delete button → Store action
- ConfirmationModal → Store action → UI update

## Performance Considerations

### Optimization Strategies

**Step Index Recalculation**:

- Current: O(n) where n is number of steps
- Acceptable for typical workouts (< 100 steps)
- No optimization needed

**Undo History**:

- Store full workout snapshots (simple, reliable)
- Limit to 50 states (reasonable memory usage)
- Consider delta-based undo for very large workouts (future optimization)

**Modal Rendering**:

- Render modal component only when needed (conditional rendering)
- Use React.memo to prevent unnecessary re-renders
- Portal-based rendering for proper z-index stacking

### Performance Budgets

- Block deletion: < 100ms (including UI update)
- Undo operation: < 100ms
- Modal open/close: < 200ms (including animations)
- Button re-layout on resize: < 50ms

## Accessibility

### WCAG 2.1 AA Compliance

**Keyboard Navigation**:

- All interactive elements keyboard accessible
- Logical tab order (visual order matches DOM order)
- Focus indicators visible on all interactive elements
- Keyboard shortcuts documented

**Screen Reader Support**:

- ARIA labels for delete buttons ("Delete repetition block")
- ARIA live regions for deletion feedback
- Modal dialog role and aria-labelledby
- Focus trap announcements

**Visual Design**:

- Sufficient color contrast (4.5:1 for text)
- Focus indicators visible (2px outline)
- Button sizes meet minimum touch target (44x44px)
- Destructive actions use warning colors (red)

### Keyboard Shortcuts

| Action         | Shortcut            | Context                            |
| -------------- | ------------------- | ---------------------------------- |
| Delete block   | Delete or Backspace | Block selected                     |
| Dismiss modal  | Escape              | Modal open                         |
| Confirm action | Enter               | Modal open, confirm button focused |
| Cancel action  | Escape              | Modal open                         |

## Migration Strategy

### Backward Compatibility

**Existing KRD Files**:

- Files with empty repetition blocks will load correctly
- No migration needed for existing data
- New default step only applies to newly created blocks

**API Compatibility**:

- `createEmptyRepetitionBlock` signature unchanged
- New `deleteRepetitionBlock` action added (non-breaking)
- Existing `ungroupRepetitionBlock` unchanged

### Deployment

**Phase 1: Core Functionality**

- Implement default step in empty blocks
- Implement block deletion with undo
- Add unit and property tests

**Phase 2: UI Improvements**

- Add delete button to block header
- Implement keyboard shortcuts
- Improve button styling and organization

**Phase 3: Modal System**

- Implement ConfirmationModal component
- Replace all browser alerts with modals
- Add E2E tests for modal interactions

**Phase 4: Polish**

- Add animations and transitions
- Optimize performance
- Accessibility audit and fixes

## Future Enhancements

**Potential Improvements**:

- Bulk block operations (delete multiple blocks)
- Block templates (save/load common block patterns)
- Drag-and-drop block reordering
- Block duplication
- Nested repetition blocks (blocks within blocks)
- Confirmation preferences (remember "don't ask again")

**Technical Debt**:

- Consider delta-based undo for large workouts
- Evaluate virtualization for very long workout lists
- Consider state machine for modal management

## References

- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog) - Accessible modal implementation
- [WCAG 2.1 Focus Management](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html)
- [React Focus Trap](https://github.com/focus-trap/focus-trap-react)
- [fast-check Documentation](https://fast-check.dev/) - Property-based testing library
