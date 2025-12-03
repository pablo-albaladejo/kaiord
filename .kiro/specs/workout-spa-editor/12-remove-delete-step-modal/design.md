# Design Document - Remove Delete Step Modal

## Overview

This design document outlines the removal of the obsolete `DeleteConfirmDialog` modal and its associated code. The current implementation uses a confirmation modal before deleting steps, which conflicts with the undo-based deletion workflow specified in spec 06-delete-undo. Steps should be deleted immediately with an undo toast notification instead.

## Architecture

### Current Architecture (To Be Removed)

```
WorkoutSection
  ├── useWorkoutSectionState
  │   └── useWorkoutSectionHandlers
  │       └── useDeleteHandlers (❌ TO REMOVE)
  │           ├── stepToDelete state
  │           ├── handleDeleteRequest
  │           ├── handleDeleteConfirm
  │           └── handleDeleteCancel
  └── DeleteConfirmDialog (❌ TO REMOVE)
      └── Renders when stepToDelete !== null
```

### Target Architecture (After Removal)

```
WorkoutSection
  ├── useWorkoutSectionState
  │   └── Direct deleteStep call
  └── Toast notification (already exists)
      └── Shows undo button after deletion
```

## Components and Interfaces

### Components to Remove

#### 1. DeleteConfirmDialog Component

**Location:** `packages/workout-spa-editor/src/components/molecules/DeleteConfirmDialog/`

**Files to delete:**

- `DeleteConfirmDialog.tsx`
- `DeleteConfirmDialog.test.tsx`
- `DeleteConfirmDialog.stories.tsx`
- `index.ts`

**Reason:** This modal is no longer needed as steps are deleted immediately with undo toast.

#### 2. useDeleteHandlers Hook

**Location:** `packages/workout-spa-editor/src/components/pages/WorkoutSection/useDeleteHandlers.tsx`

**File to delete:**

- `useDeleteHandlers.tsx`

**Reason:** This hook manages the modal state which is no longer needed.

### Components to Modify

#### 1. WorkoutSection Component

**Location:** `packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutSection.tsx`

**Changes:**

- Remove `DeleteConfirmDialog` import
- Remove `DeleteConfirmDialog` JSX element
- Pass `deleteStep` directly to `WorkoutStepsList` instead of `handleDeleteRequest`

**Before:**

```tsx
import { DeleteConfirmDialog } from "../../molecules/DeleteConfirmDialog/DeleteConfirmDialog";

// ...

<DeleteConfirmDialog
  stepIndex={state.stepToDelete}
  onConfirm={state.handleDeleteConfirm}
  onCancel={state.handleDeleteCancel}
/>;
```

**After:**

```tsx
// No DeleteConfirmDialog import
// No DeleteConfirmDialog JSX
```

#### 2. useWorkoutSectionState Hook

**Location:** `packages/workout-spa-editor/src/components/pages/WorkoutSection/useWorkoutSectionState.ts`

**Changes:**

- Remove `useDeleteHandlers` usage
- Add direct `useDeleteStep` import from store selectors
- Return `deleteStep` directly instead of delete handlers

**Before:**

```typescript
const handlers = useWorkoutSectionHandlers(workout, krd, onStepSelect);

return {
  // ...
  ...handlers, // includes stepToDelete, handleDeleteRequest, etc.
};
```

**After:**

```typescript
import { useDeleteStep } from "../../../store/workout-store-selectors";

const deleteStep = useDeleteStep();

return {
  // ...
  deleteStep, // Direct delete function
};
```

#### 3. useWorkoutSectionHandlers Hook

**Location:** `packages/workout-spa-editor/src/components/pages/WorkoutSection/useWorkoutSectionHandlers.ts`

**Changes:**

- Remove `useDeleteHandlers` import and usage
- Remove spreading of `deleteHandlers` in return statement

**Before:**

```typescript
import { useDeleteHandlers } from "./useDeleteHandlers";

const deleteHandlers = useDeleteHandlers();

return {
  handleStepSelect,
  handleSave,
  handleCancel,
  ...deleteHandlers,
};
```

**After:**

```typescript
// No useDeleteHandlers import

return {
  handleStepSelect,
  handleSave,
  handleCancel,
};
```

#### 4. WorkoutStepsList Component

**Location:** `packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutStepsList.tsx`

**Changes:**

- Change `onStepDelete` prop type from `(stepIndex: number) => void` to direct delete function
- Update prop name to be more descriptive (optional)

**Before:**

```typescript
type WorkoutStepsListProps = {
  onStepDelete: (stepIndex: number) => void; // Triggers modal
  // ...
};
```

**After:**

```typescript
type WorkoutStepsListProps = {
  onStepDelete: (stepIndex: number) => void; // Deletes immediately
  // ...
};
```

## Data Models

No data model changes required. The deletion logic already exists in the store and works correctly with undo functionality.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Immediate deletion without modal

_For any_ step in the workout, when the user clicks the delete button, the step should be deleted immediately without showing a confirmation modal.

**Validates: Requirements 1.1**

### Property 2: Undo toast appears after deletion

_For any_ deleted step, an undo toast notification should appear immediately after deletion with a 5-second duration.

**Validates: Requirements 1.2**

### Property 3: Undo restores step

_For any_ deleted step, when the user clicks the undo button in the toast, the step should be restored to its original position in the workout.

**Validates: Requirements 1.3**

### Property 4: No modal component in codebase

_For any_ search of the codebase, the `DeleteConfirmDialog` component should not exist in the source files.

**Validates: Requirements 2.1**

### Property 5: No modal hook in codebase

_For any_ search of the codebase, the `useDeleteHandlers` hook should not exist in the source files.

**Validates: Requirements 2.2**

### Property 6: Delete button works correctly

_For any_ step, when the user clicks the delete button, the step should be removed from the workout state and an undo toast should appear.

**Validates: Requirements 3.1, 3.2, 3.3**

## Error Handling

### Deletion Errors

**Scenario:** Delete operation fails in the store

**Handling:**

- The existing store error handling will catch any deletion errors
- No additional error handling needed for modal removal
- Undo functionality already has error handling in place

### Missing Step Errors

**Scenario:** Attempting to delete a step that doesn't exist

**Handling:**

- The store's `deleteStep` action already validates step existence
- No changes needed to error handling

## Testing Strategy

### Unit Tests

#### Tests to Remove

1. **DeleteConfirmDialog.test.tsx**
   - Remove entire test file
   - Component no longer exists

2. **DeleteConfirmDialog.stories.tsx**
   - Remove entire Storybook file
   - Component no longer exists

#### Tests to Update

1. **WorkoutSection.test.tsx**
   - Remove tests that verify modal appears on delete request
   - Add tests that verify immediate deletion
   - Add tests that verify undo toast appears

2. **useWorkoutSectionState.test.ts** (if exists)
   - Remove tests for `stepToDelete`, `handleDeleteRequest`, `handleDeleteConfirm`, `handleDeleteCancel`
   - Add tests for direct `deleteStep` usage

3. **useWorkoutSectionHandlers.test.ts** (if exists)
   - Remove tests for delete handlers
   - Verify handlers no longer include delete-related functions

#### New Tests to Add

1. **Immediate deletion test**

   ```typescript
   it("should delete step immediately without modal", () => {
     // Arrange
     const { result } = renderHook(() => useWorkoutSectionState(...));

     // Act
     act(() => {
       result.current.deleteStep(0);
     });

     // Assert
     expect(mockDeleteStep).toHaveBeenCalledWith(0);
     expect(screen.queryByText("Delete Step")).not.toBeInTheDocument();
   });
   ```

2. **Undo toast test**
   ```typescript
   it("should show undo toast after deletion", () => {
     // Arrange
     render(<WorkoutSection {...props} />);

     // Act
     fireEvent.click(screen.getByLabelText("Delete step"));

     // Assert
     expect(screen.getByText("Step deleted")).toBeInTheDocument();
     expect(screen.getByText("Undo")).toBeInTheDocument();
   });
   ```

### Integration Tests

1. **Delete and undo flow**
   - Delete a step
   - Verify step is removed from UI
   - Click undo button
   - Verify step is restored

2. **Delete in repetition block**
   - Delete a step inside a repetition block
   - Verify block updates correctly
   - Verify undo works for block steps

### E2E Tests

Update existing E2E tests that expect the modal:

1. **repetition-blocks.spec.ts**
   - Update tests that click delete and expect modal
   - Change to expect immediate deletion with undo toast

2. **workout-editing.spec.ts** (if exists)
   - Update delete step tests
   - Verify undo functionality

## Implementation Notes

### Order of Changes

1. **First:** Remove `DeleteConfirmDialog` component and its tests
2. **Second:** Remove `useDeleteHandlers` hook
3. **Third:** Update `useWorkoutSectionHandlers` to remove delete handlers
4. **Fourth:** Update `useWorkoutSectionState` to use direct `deleteStep`
5. **Fifth:** Update `WorkoutSection` to remove modal JSX
6. **Sixth:** Update tests to match new behavior
7. **Last:** Update E2E tests

### Backward Compatibility

No backward compatibility concerns. This is a UI change that improves the user experience by removing an unnecessary confirmation step.

### Performance Considerations

**Improvement:** Removing the modal reduces component tree complexity and eliminates unnecessary re-renders when `stepToDelete` state changes.

### Accessibility

**Improvement:** The undo toast approach is more accessible than a modal:

- No focus trap required
- No modal overlay blocking content
- Keyboard users can continue working while undo is available
- Screen readers announce the undo option naturally

## Migration Path

No migration needed. This is a code cleanup that removes unused functionality.

## References

- **Spec 06-delete-undo:** Defines the undo-based deletion workflow
- **Toast Context:** Already implemented and working correctly
- **Store deleteStep action:** Already implemented with undo support
